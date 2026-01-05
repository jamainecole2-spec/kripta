import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const [daysBack, setDaysBack] = useState(30);

  // Fetch analytics data
  const { data: portfolioMetrics, isLoading: metricsLoading } =
    trpc.analytics.getPortfolioMetrics.useQuery();
  const { data: tradePerformance, isLoading: performanceLoading } =
    trpc.analytics.getTradePerformance.useQuery();
  const { data: portfolioHistory, isLoading: historyLoading } =
    trpc.analytics.getPortfolioValueHistory.useQuery({ daysBack });
  const { data: tradingStats, isLoading: statsLoading } =
    trpc.analytics.getTradingStatistics.useQuery();

  const isLoading =
    metricsLoading || performanceLoading || historyLoading || statsLoading;

  // Prepare chart data
  const portfolioChartData = useMemo(() => {
    if (!portfolioHistory) return [];
    return portfolioHistory.map((snapshot) => ({
      timestamp: new Date(snapshot.timestamp).toLocaleDateString(),
      value: snapshot.totalValueUsd.toFixed(2),
    }));
  }, [portfolioHistory]);

  const assetAllocationData = useMemo(() => {
    if (!portfolioMetrics?.assetAllocation) return [];
    return portfolioMetrics.assetAllocation.map((asset) => ({
      name: asset.symbol,
      value: parseFloat(asset.valueUsd.toFixed(2)),
    }));
  }, [portfolioMetrics?.assetAllocation]);

  const tradePerformanceData = useMemo(() => {
    if (!tradePerformance) return [];
    return [
      { name: "Winning Trades", value: tradePerformance.winningTrades },
      { name: "Losing Trades", value: tradePerformance.losingTrades },
    ];
  }, [tradePerformance]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioMetrics?.totalValueUsd.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioMetrics?.holdingCount || 0} holdings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (portfolioMetrics?.totalReturnUsd || 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ${portfolioMetrics?.totalReturnUsd.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolioMetrics?.totalReturnPercentage.toFixed(2) || "0.00"}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradePerformance?.winRate.toFixed(1) || "0.0"}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tradePerformance?.winningTrades || 0} / {tradePerformance?.totalTrades || 0} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradePerformance?.profitFactor.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Profit/Loss ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio Value</TabsTrigger>
          <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
          <TabsTrigger value="performance">Trade Performance</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Portfolio Value Chart */}
        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Value History</CardTitle>
              <CardDescription>
                Your portfolio value over the last {daysBack} days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDaysBack(days)}
                    className={`px-3 py-1 rounded text-sm ${
                      daysBack === days
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
              {portfolioChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={portfolioChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`}
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      dot={false}
                      name="Portfolio Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asset Allocation Chart */}
        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>
                Distribution of your portfolio across cryptocurrencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assetAllocationData.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetAllocationData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`}
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {assetAllocationData.map((asset, index) => (
                      <div key={asset.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm">{asset.name}</span>
                        <span className="text-sm font-medium ml-auto">
                          ${asset.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No holdings yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Performance Chart */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Trade Performance</CardTitle>
              <CardDescription>
                Comparison of winning and losing trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tradePerformanceData.length > 0 &&
              tradePerformance &&
              tradePerformance.totalTrades > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tradePerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-green-50 dark:bg-green-950">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${tradePerformance.totalProfit.toFixed(2)}
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Total Profit
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Avg: ${tradePerformance.averageWin.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-50 dark:bg-red-950">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          ${tradePerformance.totalLoss.toFixed(2)}
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Total Loss
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Avg: ${tradePerformance.averageLoss.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No trades yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Buys</p>
                  <p className="text-2xl font-bold">{tradingStats?.totalBuys || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sells</p>
                  <p className="text-2xl font-bold">{tradingStats?.totalSells || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {tradingStats?.successRate.toFixed(1) || "0.0"}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Buy Price</p>
                  <p className="text-2xl font-bold">
                    ${tradingStats?.averageBuyPrice.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Sell Price</p>
                  <p className="text-2xl font-bold">
                    ${tradingStats?.averageSellPrice.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Buy Volume</p>
                  <p className="text-lg font-bold">
                    {parseFloat(tradingStats?.totalBuyVolume || "0").toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
