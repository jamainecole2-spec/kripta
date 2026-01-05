import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  getActiveCryptocurrencies, 
  getUserWallets, 
  getMarketData,
  getUserWallet
} from "./db";
import { cryptocurrencies, wallets, orders, transactions, InsertWallet, InsertOrder, InsertTransaction } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import emailService from "./services/emailService";
import {
  calculatePortfolioMetrics,
  calculateTradePerformance,
  getPortfolioValueHistory,
  getTradingStatistics,
} from "./services/analytics.service";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  market: router({
    getCryptocurrencies: publicProcedure.query(async () => {
      return await getActiveCryptocurrencies();
    }),

    getMarketData: publicProcedure
      .input(z.object({ cryptoId: z.number() }))
      .query(async ({ input }) => {
        return await getMarketData(input.cryptoId);
      }),

    getAllMarketData: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const cryptos = await getActiveCryptocurrencies();
      const result = await Promise.all(
        cryptos.map(async (crypto) => {
          const market = await getMarketData(crypto.id);
          return { crypto, market };
        })
      );

      return result;
    }),
  }),

  wallet: router({
    getWallets: protectedProcedure.query(async ({ ctx }) => {
      const userWallets = await getUserWallets(ctx.user.id);
      
      const db = await getDb();
      if (!db) return userWallets;

      const enriched = await Promise.all(
        userWallets.map(async (wallet) => {
          const crypto = await db
            .select()
            .from(cryptocurrencies)
            .where(eq(cryptocurrencies.id, wallet.cryptoId))
            .limit(1);

          const market = await getMarketData(wallet.cryptoId);

          return {
            ...wallet,
            crypto: crypto[0],
            market,
          };
        })
      );

      return enriched;
    }),

    getPortfolioSummary: protectedProcedure.query(async ({ ctx }) => {
      const userWallets = await getUserWallets(ctx.user.id);
      
      let totalValueUsd = 0;
      const holdings = [];

      for (const wallet of userWallets) {
        const market = await getMarketData(wallet.cryptoId);
        if (market) {
          const price = parseFloat(market.priceUsd || "0");
          const balance = parseFloat(wallet.balance || "0");
          const value = price * balance;
          totalValueUsd += value;

          holdings.push({
            wallet,
            market,
            value,
            percentChange24h: market.percentChange24h,
          });
        }
      }

      return {
        totalValueUsd,
        holdings,
        holdingCount: holdings.length,
      };
    }),

    deposit: protectedProcedure
      .input(z.object({
        cryptoId: z.number(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        let wallet = await getUserWallet(ctx.user.id, input.cryptoId);
        
        if (!wallet) {
          const newWallet: InsertWallet = {
            userId: ctx.user.id,
            cryptoId: input.cryptoId,
            balance: input.amount,
            lockedBalance: "0",
          };
          
          await db.insert(wallets).values(newWallet);
          wallet = await getUserWallet(ctx.user.id, input.cryptoId);
        } else {
          const currentBalance = parseFloat(wallet.balance || "0");
          const depositAmount = parseFloat(input.amount);
          const newBalance = (currentBalance + depositAmount).toString();

          await db
            .update(wallets)
            .set({ balance: newBalance })
            .where(eq(wallets.id, wallet.id));
        }

        const transaction: InsertTransaction = {
          userId: ctx.user.id,
          toCryptoId: input.cryptoId,
          transactionType: "deposit",
          amount: input.amount,
          fee: "0",
          status: "completed",
        };

        await db.insert(transactions).values(transaction);

        const updatedWallet = await getUserWallet(ctx.user.id, input.cryptoId);
        return { success: true, wallet: updatedWallet };
      }),

    withdraw: protectedProcedure
      .input(z.object({
        cryptoId: z.number(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const wallet = await getUserWallet(ctx.user.id, input.cryptoId);
        if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });

        const currentBalance = parseFloat(wallet.balance || "0");
        const withdrawAmount = parseFloat(input.amount);

        if (withdrawAmount > currentBalance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
        }

        const newBalance = (currentBalance - withdrawAmount).toString();

        await db
          .update(wallets)
          .set({ balance: newBalance })
          .where(eq(wallets.id, wallet.id));

        const transaction: InsertTransaction = {
          userId: ctx.user.id,
          fromCryptoId: input.cryptoId,
          transactionType: "withdrawal",
          amount: input.amount,
          fee: "0",
          status: "completed",
        };

        await db.insert(transactions).values(transaction);

        const updatedWallet = await getUserWallet(ctx.user.id, input.cryptoId);
        return { success: true, wallet: updatedWallet };
      }),
  }),

  trading: router({
    placeOrder: protectedProcedure
      .input(z.object({
        cryptoId: z.number(),
        orderType: z.enum(["buy", "sell"]),
        quantity: z.string(),
        pricePerUnit: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const quantity = parseFloat(input.quantity);
        const pricePerUnit = parseFloat(input.pricePerUnit);
        const totalPrice = (quantity * pricePerUnit).toString();

        if (input.orderType === "sell") {
          const wallet = await getUserWallet(ctx.user.id, input.cryptoId);
          if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });

          const balance = parseFloat(wallet.balance || "0");
          if (quantity > balance) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

          const newLockedBalance = (parseFloat(wallet.lockedBalance || "0") + quantity).toString();
          await db
            .update(wallets)
            .set({ lockedBalance: newLockedBalance })
            .where(eq(wallets.id, wallet.id));
        }

        const newOrder: InsertOrder = {
          userId: ctx.user.id,
          cryptoId: input.cryptoId,
          orderType: input.orderType,
          quantity: input.quantity,
          pricePerUnit: input.pricePerUnit,
          totalPrice,
          status: "pending",
          filledQuantity: "0",
        };

        await db.insert(orders).values(newOrder);

        return { success: true, message: "Order placed successfully" };
      }),

    getOrders: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(orders)
        .where(eq(orders.userId, ctx.user.id))
        .orderBy(desc(orders.createdAt))
        .limit(50);
    }),

    cancelOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const order = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order || order.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        if (order[0].userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });

        await db
          .update(orders)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(eq(orders.id, input.orderId));

        if (order[0].orderType === "sell" && order[0].quantity) {
          const wallet = await getUserWallet(ctx.user.id, order[0].cryptoId);
          if (wallet) {
            const quantity = parseFloat(order[0].quantity);
            const newLockedBalance = Math.max(
              0,
              parseFloat(wallet.lockedBalance || "0") - quantity
            ).toString();

            await db
              .update(wallets)
              .set({ lockedBalance: newLockedBalance })
              .where(eq(wallets.id, wallet.id));
          }
        }

        return { success: true };
      }),

    executeTrade: protectedProcedure
      .input(z.object({
        cryptoId: z.number(),
        orderType: z.enum(["buy", "sell"]),
        quantity: z.string(),
        pricePerUnit: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        const quantity = parseFloat(input.quantity);
        const pricePerUnit = parseFloat(input.pricePerUnit);
        const totalPrice = quantity * pricePerUnit;

        if (input.orderType === "buy") {
          let wallet = await getUserWallet(ctx.user.id, input.cryptoId);
          
          if (!wallet) {
            const newWallet: InsertWallet = {
              userId: ctx.user.id,
              cryptoId: input.cryptoId,
              balance: input.quantity,
              lockedBalance: "0",
            };
            
            await db.insert(wallets).values(newWallet);
          } else {
            const currentBalance = parseFloat(wallet.balance || "0");
            const newBalance = (currentBalance + quantity).toString();

            await db
              .update(wallets)
              .set({ balance: newBalance })
              .where(eq(wallets.id, wallet.id));
          }
        } else {
          const wallet = await getUserWallet(ctx.user.id, input.cryptoId);
          if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });

          const balance = parseFloat(wallet.balance || "0");
          if (quantity > balance) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

          const newBalance = (balance - quantity).toString();
          await db
            .update(wallets)
            .set({ balance: newBalance })
            .where(eq(wallets.id, wallet.id));
        }

        const transaction: InsertTransaction = {
          userId: ctx.user.id,
          fromCryptoId: input.orderType === "sell" ? input.cryptoId : undefined,
          toCryptoId: input.orderType === "buy" ? input.cryptoId : undefined,
          transactionType: "trade",
          amount: input.quantity,
          fee: (totalPrice * 0.001).toString(),
          status: "completed",
        };

        await db.insert(transactions).values(transaction);

        return { success: true, totalPrice };
      }),
  }),

  transactions: router({
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .orderBy(desc(transactions.createdAt))
        .limit(100);
    }),
  }),

  notifications: router({
    sendOrderConfirmation: protectedProcedure
      .input(z.object({
        orderType: z.enum(["buy", "sell"]),
        cryptocurrency: z.string(),
        amount: z.number(),
        price: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found" });
        }

        const total = input.amount * input.price;
        const success = await emailService.sendOrderConfirmation(ctx.user.email, {
          userName: ctx.user.name || "User",
          orderType: input.orderType,
          cryptocurrency: input.cryptocurrency,
          amount: input.amount,
          price: input.price,
          total,
          orderId: `ORD-${Date.now()}`,
          timestamp: new Date(),
        });

        return { success, message: success ? "Email sent successfully" : "Failed to send email" };
      }),

    sendDepositConfirmation: protectedProcedure
      .input(z.object({
        cryptocurrency: z.string(),
        amount: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found" });
        }

        const success = await emailService.sendDepositConfirmation(ctx.user.email, {
          userName: ctx.user.name || "User",
          cryptocurrency: input.cryptocurrency,
          amount: input.amount,
          transactionId: `DEP-${Date.now()}`,
          timestamp: new Date(),
        });

        return { success, message: success ? "Confirmation email sent" : "Failed to send email" };
      }),

    sendWithdrawalConfirmation: protectedProcedure
      .input(z.object({
        cryptocurrency: z.string(),
        amount: z.number(),
        address: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found" });
        }

        const success = await emailService.sendWithdrawalConfirmation(ctx.user.email, {
          userName: ctx.user.name || "User",
          cryptocurrency: input.cryptocurrency,
          amount: input.amount,
          address: input.address,
          transactionId: `WTH-${Date.now()}`,
          timestamp: new Date(),
        });

        return { success, message: success ? "Withdrawal confirmation email sent" : "Failed to send email" };
      }),

    sendPriceAlert: protectedProcedure
      .input(z.object({
        cryptocurrency: z.string(),
        currentPrice: z.number(),
        alertPrice: z.number(),
        direction: z.enum(["above", "below"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found" });
        }

        const success = await emailService.sendPriceAlert(ctx.user.email, {
          userName: ctx.user.name || "User",
          cryptocurrency: input.cryptocurrency,
          currentPrice: input.currentPrice,
          alertPrice: input.alertPrice,
          direction: input.direction,
        });

        return { success, message: success ? "Price alert email sent" : "Failed to send email" };
      }),

    sendSecurityAlert: protectedProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "User email not found" });
        }

        const success = await emailService.sendSecurityAlert(ctx.user.email, input.message);
        return { success, message: success ? "Security alert sent" : "Failed to send email" };
      }),
  }),

  analytics: router({
    getPortfolioMetrics: protectedProcedure.query(async ({ ctx }) => {
      return await calculatePortfolioMetrics(ctx.user.id);
    }),

    getTradePerformance: protectedProcedure.query(async ({ ctx }) => {
      return await calculateTradePerformance(ctx.user.id);
    }),

    getPortfolioValueHistory: protectedProcedure
      .input(z.object({ daysBack: z.number().default(30) }))
      .query(async ({ ctx, input }) => {
        return await getPortfolioValueHistory(ctx.user.id, input.daysBack);
      }),

    getTradingStatistics: protectedProcedure.query(async ({ ctx }) => {
      return await getTradingStatistics(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
