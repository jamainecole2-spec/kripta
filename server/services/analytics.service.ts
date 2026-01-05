import { getDb } from "../db";
import { orders, transactions, wallets, cryptocurrencies } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getMarketData } from "../db";

export interface PortfolioMetrics {
  totalValueUsd: number;
  totalInvestedUsd: number;
  totalReturnUsd: number;
  totalReturnPercentage: number;
  holdingCount: number;
  assetAllocation: Array<{
    symbol: string;
    name: string;
    balance: string;
    valueUsd: number;
    percentageOfPortfolio: number;
  }>;
}

export interface TradePerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValueUsd: number;
  holdingCount: number;
}

export interface TradingStatistics {
  totalBuys: number;
  totalSells: number;
  totalBuyVolume: string;
  totalSellVolume: string;
  averageBuyPrice: number;
  averageSellPrice: number;
  successRate: number;
}

/**
 * Calculate portfolio metrics for a user
 */
export async function calculatePortfolioMetrics(
  userId: number
): Promise<PortfolioMetrics> {
  const db = await getDb();
  if (!db) {
    return {
      totalValueUsd: 0,
      totalInvestedUsd: 0,
      totalReturnUsd: 0,
      totalReturnPercentage: 0,
      holdingCount: 0,
      assetAllocation: [],
    };
  }

  // Get all user wallets
  const userWallets = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, userId));

  let totalValueUsd = 0;
  let totalInvestedUsd = 0;
  const assetAllocation: PortfolioMetrics["assetAllocation"] = [];

  // Calculate value for each holding
  for (const wallet of userWallets) {
    const market = await getMarketData(wallet.cryptoId);
    if (market) {
      const price = parseFloat(market.priceUsd || "0");
      const balance = parseFloat(wallet.balance || "0");
      const value = price * balance;
      totalValueUsd += value;

      // Get invested amount from transactions
      const deposits = await db
        .select()
        .from(transactions)
        .where((t) => eq(t.userId, userId));

      const investedAmount = deposits.reduce((sum, tx) => {
        return sum + parseFloat(tx.amount || "0") * price;
      }, 0);
      totalInvestedUsd += investedAmount;

      // Get crypto info
      const crypto = await db
        .select()
        .from(cryptocurrencies)
        .where((c) => eq(c.id, wallet.cryptoId))
        .limit(1);

      const cryptoInfo = crypto[0];

      assetAllocation.push({
        symbol: cryptoInfo?.symbol || "UNKNOWN",
        name: cryptoInfo?.name || "Unknown",
        balance: wallet.balance,
        valueUsd: value,
        percentageOfPortfolio: 0, // Will be calculated below
      });
    }
  }

  // Calculate percentages
  assetAllocation.forEach((asset) => {
    asset.percentageOfPortfolio =
      totalValueUsd > 0 ? (asset.valueUsd / totalValueUsd) * 100 : 0;
  });

  const totalReturnUsd = totalValueUsd - totalInvestedUsd;
  const totalReturnPercentage =
    totalInvestedUsd > 0 ? (totalReturnUsd / totalInvestedUsd) * 100 : 0;

  return {
    totalValueUsd,
    totalInvestedUsd,
    totalReturnUsd,
    totalReturnPercentage,
    holdingCount: userWallets.length,
    assetAllocation,
  };
}

/**
 * Calculate trade performance metrics
 */
export async function calculateTradePerformance(
  userId: number
): Promise<TradePerformance> {
  const db = await getDb();
  if (!db) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
    };
  }

  // Get all user orders
  const userOrders = await db
    .select()
    .from(orders)
    .where((o) => eq(o.userId, userId));

  let totalProfit = 0;
  let totalLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;

  // Calculate profit/loss for each trade
  for (const order of userOrders) {
    if (order.status === "filled") {
      const quantity = parseFloat(order.quantity || "0");
      const entryPrice = parseFloat(order.pricePerUnit || "0");
      const totalValue = parseFloat(order.totalPrice || "0");

      // For simplicity, we'll calculate based on order type
      // In a real system, you'd match buy/sell orders
      if (order.orderType === "buy") {
        // Assume profit if current price > entry price
        const market = await getMarketData(order.cryptoId);
        if (market) {
          const currentPrice = parseFloat(market.priceUsd || "0");
          const profitLoss = (currentPrice - entryPrice) * quantity;

          if (profitLoss > 0) {
            totalProfit += profitLoss;
            winningTrades++;
          } else {
            totalLoss += Math.abs(profitLoss);
            losingTrades++;
          }
        }
      }
    }
  }

  const totalTrades = winningTrades + losingTrades;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalProfit,
    totalLoss,
    averageWin,
    averageLoss,
    profitFactor,
  };
}

/**
 * Get portfolio value history
 */
export async function getPortfolioValueHistory(
  userId: number,
  daysBack: number = 30
): Promise<PortfolioSnapshot[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Get all transactions for the user
  const userTransactions = await db
    .select()
    .from(transactions)
    .where((t) => eq(t.userId, userId));

  const snapshots: PortfolioSnapshot[] = [];
  const dailySnapshots = new Map<string, PortfolioSnapshot>();

  // Group transactions by day
  for (const tx of userTransactions) {
    if (tx.createdAt && tx.createdAt.getTime() >= cutoffDate.getTime()) {
      const dateKey = tx.createdAt.toISOString().split("T")[0];

      if (!dailySnapshots.has(dateKey)) {
        dailySnapshots.set(dateKey, {
          timestamp: tx.createdAt.getTime(),
          totalValueUsd: 0,
          holdingCount: 0,
        });
      }
    }
  }

  // Convert to array and sort by date
  snapshots.push(...Array.from(dailySnapshots.values()));
  snapshots.sort((a, b) => a.timestamp - b.timestamp);

  return snapshots;
}

/**
 * Get trading statistics
 */
export async function getTradingStatistics(
  userId: number
): Promise<TradingStatistics> {
  const db = await getDb();
  if (!db) {
    return {
      totalBuys: 0,
      totalSells: 0,
      totalBuyVolume: "0",
      totalSellVolume: "0",
      averageBuyPrice: 0,
      averageSellPrice: 0,
      successRate: 0,
    };
  }

  // Get all user orders
  const userOrders = await db
    .select()
    .from(orders)
    .where((o) => eq(o.userId, userId));

  let totalBuys = 0;
  let totalSells = 0;
  let totalBuyVolume = 0;
  let totalSellVolume = 0;
  let totalBuyPrice = 0;
  let totalSellPrice = 0;
  let successfulOrders = 0;

  for (const order of userOrders) {
    const quantity = parseFloat(order.quantity || "0");
    const price = parseFloat(order.pricePerUnit || "0");

    if (order.orderType === "buy") {
      totalBuys++;
      totalBuyVolume += quantity;
      totalBuyPrice += price;
      if (order.status === "filled") successfulOrders++;
    } else {
      totalSells++;
      totalSellVolume += quantity;
      totalSellPrice += price;
      if (order.status === "filled") successfulOrders++;
    }
  }

  const averageBuyPrice =
    totalBuys > 0 ? totalBuyPrice / totalBuys : 0;
  const averageSellPrice =
    totalSells > 0 ? totalSellPrice / totalSells : 0;
  const successRate =
    userOrders.length > 0 ? (successfulOrders / userOrders.length) * 100 : 0;

  return {
    totalBuys,
    totalSells,
    totalBuyVolume: totalBuyVolume.toString(),
    totalSellVolume: totalSellVolume.toString(),
    averageBuyPrice,
    averageSellPrice,
    successRate,
  };
}
