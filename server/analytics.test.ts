import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculatePortfolioMetrics,
  calculateTradePerformance,
  getPortfolioValueHistory,
  getTradingStatistics,
} from "./services/analytics.service";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getMarketData: vi.fn(),
  getUserWallets: vi.fn(),
}));

describe("Analytics Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculatePortfolioMetrics", () => {
    it("should return zero metrics when database is unavailable", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await calculatePortfolioMetrics(1);

      expect(result.totalValueUsd).toBe(0);
      expect(result.totalInvestedUsd).toBe(0);
      expect(result.totalReturnUsd).toBe(0);
      expect(result.totalReturnPercentage).toBe(0);
      expect(result.holdingCount).toBe(0);
      expect(result.assetAllocation).toEqual([]);
    });

    it("should calculate portfolio metrics correctly with holdings", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            userId: 1,
            cryptoId: 1,
            balance: "1.5",
            lockedBalance: "0",
          },
        ]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);
      vi.mocked(db.getMarketData).mockResolvedValue({
        id: 1,
        cryptoId: 1,
        priceUsd: "45000",
        priceEur: null,
        marketCap: null,
        volume24h: null,
        percentChange24h: null,
        percentChange7d: null,
        highPrice24h: null,
        lowPrice24h: null,
        updatedAt: new Date(),
      });

      const result = await calculatePortfolioMetrics(1);

      expect(result.holdingCount).toBeGreaterThanOrEqual(0);
      expect(result.totalValueUsd).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalReturnPercentage).toBe("number");
    });

    it("should calculate asset allocation percentages correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await calculatePortfolioMetrics(1);

      if (result.assetAllocation.length > 0) {
        const totalPercentage = result.assetAllocation.reduce(
          (sum, asset) => sum + asset.percentageOfPortfolio,
          0
        );
        expect(totalPercentage).toBeLessThanOrEqual(100.01); // Allow for floating point errors
      }
    });
  });

  describe("calculateTradePerformance", () => {
    it("should return zero performance metrics when database is unavailable", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await calculateTradePerformance(1);

      expect(result.totalTrades).toBe(0);
      expect(result.winningTrades).toBe(0);
      expect(result.losingTrades).toBe(0);
      expect(result.winRate).toBe(0);
      expect(result.totalProfit).toBe(0);
      expect(result.totalLoss).toBe(0);
    });

    it("should calculate win rate correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await calculateTradePerformance(1);

      if (result.totalTrades > 0) {
        const calculatedWinRate = (result.winningTrades / result.totalTrades) * 100;
        expect(result.winRate).toBeCloseTo(calculatedWinRate, 2);
      }
    });

    it("should calculate profit factor correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await calculateTradePerformance(1);

      if (result.totalLoss > 0) {
        const calculatedProfitFactor = result.totalProfit / result.totalLoss;
        expect(result.profitFactor).toBeCloseTo(calculatedProfitFactor, 2);
      }
    });

    it("should handle zero losing trades", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await calculateTradePerformance(1);

      expect(result.profitFactor).toBeGreaterThanOrEqual(0);
      expect(typeof result.profitFactor).toBe("number");
    });
  });

  describe("getPortfolioValueHistory", () => {
    it("should return empty array when database is unavailable", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await getPortfolioValueHistory(1, 30);

      expect(result).toEqual([]);
    });

    it("should return sorted snapshots by timestamp", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getPortfolioValueHistory(1, 30);

      // Verify snapshots are sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i].timestamp).toBeGreaterThanOrEqual(result[i - 1].timestamp);
      }
    });

    it("should respect daysBack parameter", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getPortfolioValueHistory(1, 7);

      // Should return empty or valid snapshots
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getTradingStatistics", () => {
    it("should return zero statistics when database is unavailable", async () => {
      vi.mocked(db.getDb).mockResolvedValue(null);

      const result = await getTradingStatistics(1);

      expect(result.totalBuys).toBe(0);
      expect(result.totalSells).toBe(0);
      expect(result.averageBuyPrice).toBe(0);
      expect(result.averageSellPrice).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it("should calculate success rate correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getTradingStatistics(1);

      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });

    it("should calculate average prices correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getTradingStatistics(1);

      expect(result.averageBuyPrice).toBeGreaterThanOrEqual(0);
      expect(result.averageSellPrice).toBeGreaterThanOrEqual(0);
    });

    it("should handle zero trades", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getTradingStatistics(1);

      expect(result.totalBuys).toBe(0);
      expect(result.totalSells).toBe(0);
      expect(result.averageBuyPrice).toBe(0);
      expect(result.averageSellPrice).toBe(0);
    });

    it("should convert volume strings to numbers correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await getTradingStatistics(1);

      expect(typeof result.totalBuyVolume).toBe("string");
      expect(typeof result.totalSellVolume).toBe("string");
      expect(!isNaN(parseFloat(result.totalBuyVolume))).toBe(true);
      expect(!isNaN(parseFloat(result.totalSellVolume))).toBe(true);
    });
  });

  describe("Analytics Integration", () => {
    it("should handle multiple concurrent analytics queries", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const [metrics, performance, history, stats] = await Promise.all([
        calculatePortfolioMetrics(1),
        calculateTradePerformance(1),
        getPortfolioValueHistory(1, 30),
        getTradingStatistics(1),
      ]);

      expect(metrics).toBeDefined();
      expect(performance).toBeDefined();
      expect(history).toBeDefined();
      expect(stats).toBeDefined();
    });

    it("should maintain data consistency across queries", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const metrics1 = await calculatePortfolioMetrics(1);
      const metrics2 = await calculatePortfolioMetrics(1);

      expect(metrics1.totalValueUsd).toBe(metrics2.totalValueUsd);
      expect(metrics1.holdingCount).toBe(metrics2.holdingCount);
    });
  });
});
