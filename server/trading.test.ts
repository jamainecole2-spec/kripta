import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Trading Router - Core Functionality", () => {
  describe("market.getCryptocurrencies", () => {
    it("should return list of active cryptocurrencies", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.market.getCryptocurrencies();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("trading.executeTrade", () => {
    it("should execute a buy order and return success", async () => {
      const ctx = createAuthContext(200);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trading.executeTrade({
        cryptoId: 1,
        orderType: "buy",
        quantity: "1.5",
        pricePerUnit: "50000",
      });

      expect(result.success).toBe(true);
      expect(result.totalPrice).toBe(75000);
    });

    it("should execute a sell order after buy", async () => {
      const ctx = createAuthContext(201);
      const caller = appRouter.createCaller(ctx);

      // Buy first
      await caller.trading.executeTrade({
        cryptoId: 1,
        orderType: "buy",
        quantity: "2",
        pricePerUnit: "50000",
      });

      // Sell
      const result = await caller.trading.executeTrade({
        cryptoId: 1,
        orderType: "sell",
        quantity: "1",
        pricePerUnit: "55000",
      });

      expect(result.success).toBe(true);
      expect(result.totalPrice).toBe(55000);
    });
  });

  describe("wallet.deposit", () => {
    it("should deposit cryptocurrency successfully", async () => {
      const ctx = createAuthContext(202);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wallet.deposit({
        cryptoId: 1,
        amount: "5.5",
      });

      expect(result.success).toBe(true);
      expect(result.wallet).toBeDefined();
      expect(result.wallet?.balance).toBe("5.5");
    });

    it("should add to existing wallet balance", async () => {
      const ctx = createAuthContext(203);
      const caller = appRouter.createCaller(ctx);

      // First deposit
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "2.5",
      });

      // Second deposit
      const result = await caller.wallet.deposit({
        cryptoId: 1,
        amount: "3.5",
      });

      expect(result.success).toBe(true);
      expect(result.wallet?.balance).toBe("6");
    });
  });

  describe("wallet.withdraw", () => {
    it("should withdraw cryptocurrency successfully", async () => {
      const ctx = createAuthContext(204);
      const caller = appRouter.createCaller(ctx);

      // First deposit
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "10",
      });

      // Then withdraw
      const result = await caller.wallet.withdraw({
        cryptoId: 1,
        amount: "3",
      });

      expect(result.success).toBe(true);
      expect(result.wallet?.balance).toBe("7");
    });

    it("should fail when withdrawing more than balance", async () => {
      const ctx = createAuthContext(205);
      const caller = appRouter.createCaller(ctx);

      // First deposit
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "5",
      });

      // Try to withdraw more
      try {
        await caller.wallet.withdraw({
          cryptoId: 1,
          amount: "10",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Insufficient balance");
      }
    });
  });

  describe("wallet.getPortfolioSummary", () => {
    it("should return portfolio summary with holdings", async () => {
      const ctx = createAuthContext(206);
      const caller = appRouter.createCaller(ctx);

      // Add some holdings
      await caller.trading.executeTrade({
        cryptoId: 1,
        orderType: "buy",
        quantity: "1",
        pricePerUnit: "50000",
      });

      const result = await caller.wallet.getPortfolioSummary();

      expect(result).toBeDefined();
      expect(typeof result?.totalValueUsd).toBe("number");
      expect(Array.isArray(result?.holdings)).toBe(true);
    });
  });

  describe("trading.placeOrder", () => {
    it("should place a buy order successfully", async () => {
      const ctx = createAuthContext(207);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.trading.placeOrder({
        cryptoId: 1,
        orderType: "buy",
        quantity: "1.5",
        pricePerUnit: "50000",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Order placed successfully");
    });

    it("should place a sell order", async () => {
      const ctx = createAuthContext(208);
      const caller = appRouter.createCaller(ctx);

      // First, create a wallet with balance
      await caller.trading.executeTrade({
        cryptoId: 1,
        orderType: "buy",
        quantity: "5",
        pricePerUnit: "50000",
      });

      // Place sell order
      const result = await caller.trading.placeOrder({
        cryptoId: 1,
        orderType: "sell",
        quantity: "2",
        pricePerUnit: "55000",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("trading.getOrders", () => {
    it("should retrieve user orders", async () => {
      const ctx = createAuthContext(209);
      const caller = appRouter.createCaller(ctx);

      // Place an order
      await caller.trading.placeOrder({
        cryptoId: 1,
        orderType: "buy",
        quantity: "1",
        pricePerUnit: "50000",
      });

      const result = await caller.trading.getOrders();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("trading.cancelOrder", () => {
    it("should cancel a pending order", async () => {
      const ctx = createAuthContext(210);
      const caller = appRouter.createCaller(ctx);

      // Place an order
      await caller.trading.placeOrder({
        cryptoId: 1,
        orderType: "buy",
        quantity: "1",
        pricePerUnit: "50000",
      });

      // Get orders to find the order ID
      const orders = await caller.trading.getOrders();
      const orderId = orders[0]?.id;

      if (orderId) {
        const result = await caller.trading.cancelOrder({ orderId });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("transactions.getHistory", () => {
    it("should retrieve transaction history", async () => {
      const ctx = createAuthContext(211);
      const caller = appRouter.createCaller(ctx);

      // Create a transaction
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "5",
      });

      const result = await caller.transactions.getHistory();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should show transaction types", async () => {
      const ctx = createAuthContext(212);
      const caller = appRouter.createCaller(ctx);

      // Create multiple transactions
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "10",
      });

      await caller.wallet.withdraw({
        cryptoId: 1,
        amount: "2",
      });

      const result = await caller.transactions.getHistory();

      expect(result.length).toBeGreaterThan(0);
      const hasDeposit = result.some(tx => tx.transactionType === "deposit");
      const hasWithdrawal = result.some(tx => tx.transactionType === "withdrawal");
      expect(hasDeposit || hasWithdrawal).toBe(true);
    });
  });

  describe("wallet.getWallets", () => {
    it("should retrieve user wallets", async () => {
      const ctx = createAuthContext(213);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.wallet.getWallets();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should show wallet with balance after deposit", async () => {
      const ctx = createAuthContext(214);
      const caller = appRouter.createCaller(ctx);

      // Create a wallet
      await caller.wallet.deposit({
        cryptoId: 1,
        amount: "10.5",
      });

      const result = await caller.wallet.getWallets();

      expect(result.length).toBeGreaterThan(0);
      const wallet = result.find(w => w.cryptoId === 1);
      expect(wallet).toBeDefined();
      expect(parseFloat(wallet?.balance || "0")).toBeGreaterThan(0);
    });
  });

  describe("auth.me", () => {
    it("should return current user info", async () => {
      const ctx = createAuthContext(215);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeDefined();
      expect(result?.id).toBe(215);
      expect(result?.openId).toBe("user-215");
    });
  });
});
