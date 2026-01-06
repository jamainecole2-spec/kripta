import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, Send, Download } from "lucide-react";
import { formatCurrency, formatCryptoAmount } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio, isLoading } = trpc.wallet.getPortfolioSummary.useQuery();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const totalValue = portfolio?.totalValueUsd || 0;
  const holdings = portfolio?.holdings || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section - Portfolio Overview */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold">Portfolio Overview</h1>
        <p className="text-muted-foreground text-lg">Welcome back, {user?.name || "Trader"}</p>
      </div>

      {/* Main Portfolio Card - Centered */}
      <Card className="border-2 shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-2">Total Portfolio Value</p>
              <div className="text-5xl font-bold text-primary">${formatCurrency(totalValue)}</div>
              <p className="text-muted-foreground mt-2">USD</p>
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Assets Held</p>
                <p className="text-2xl font-bold">{holdings.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">24h Change</p>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">+2.4%</p>
                </div>
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <p className="text-muted-foreground text-sm">Status</p>
                <p className="text-2xl font-bold text-blue-500">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Centered */}
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button size="lg" className="md:w-48 gap-2" variant="default">
          <ArrowDownLeft className="w-5 h-5" />
          Deposit
        </Button>
        <Button size="lg" className="md:w-48 gap-2" variant="outline">
          <ArrowUpRight className="w-5 h-5" />
          Withdraw
        </Button>
        <Button size="lg" className="md:w-48 gap-2" variant="outline">
          <Send className="w-5 h-5" />
          Trade
        </Button>
      </div>

      {/* Holdings Section */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Your Holdings</h2>
          <p className="text-muted-foreground">Cryptocurrency assets in your portfolio</p>
        </div>

        {holdings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg">No holdings yet</p>
              <p className="text-muted-foreground text-sm">Start by depositing or trading cryptocurrencies</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {holdings.map((holding) => {
              const cryptoSymbol = `CRYPTO${holding.market?.cryptoId || 'N/A'}`;
              const percentChange = parseFloat(holding.percentChange24h || "0");
              
              return (
                <Card key={holding.wallet.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header with icon and symbol */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {cryptoSymbol[0]}
                        </div>
                      <div>
                        <p className="font-semibold">{cryptoSymbol}</p>
                        <p className="text-xs text-muted-foreground">Cryptocurrency Asset</p>
                      </div>
                      </div>

                      {/* Amount */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-lg font-semibold">{formatCryptoAmount(holding.wallet.balance)} {cryptoSymbol}</p>
                      </div>

                      {/* Value and Change */}
                      <div className="pt-3 border-t space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Value</span>
                          <span className="font-semibold">${formatCurrency(holding.value)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">24h Change</span>
                          <span className={`font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Link */}
      <div className="text-center pt-4">
        <a href="/analytics" className="text-primary hover:underline font-medium">
          View detailed analytics and performance charts →
        </a>
      </div>
    </div>
  );
}
