import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from "lucide-react";
import { formatCurrency, formatCryptoAmount } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: portfolio, isLoading } = trpc.wallet.getPortfolioSummary.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalValue = portfolio?.totalValueUsd || 0;
  const holdings = portfolio?.holdings || [];

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assets Held</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{holdings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Different cryptocurrencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span>+2.4%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>Cryptocurrency assets in your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No holdings yet. Start by depositing or trading cryptocurrencies.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {holdings.map((holding) => {
                const cryptoSymbol = holding.market?.cryptoId ? 'CRYPTO' : 'N/A';
                return (
                  <div key={holding.wallet.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {cryptoSymbol[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Cryptocurrency</p>
                        <p className="text-sm text-muted-foreground">{formatCryptoAmount(holding.wallet.balance)} {cryptoSymbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${formatCurrency(holding.value)}</p>
                      <p className={`text-sm ${holding.percentChange24h && parseFloat(holding.percentChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.percentChange24h}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors">
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
              <span>Deposit</span>
            </button>
            <button className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors">
              <ArrowUpRight className="w-5 h-5 text-red-600" />
              <span>Withdraw</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
