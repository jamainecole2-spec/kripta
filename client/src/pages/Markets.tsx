import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatCryptoAmount } from "@/lib/utils";
import { useState } from "react";

export default function Markets() {
  const { data: cryptos, isLoading: loadingCryptos } = trpc.market.getCryptocurrencies.useQuery();
  const { data: marketDataList, isLoading: loadingMarket } = trpc.market.getAllMarketData.useQuery();
  const [selectedCrypto, setSelectedCrypto] = useState<number | null>(null);

  const isLoading = loadingCryptos || loadingMarket;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground">Real-time cryptocurrency prices and market data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrencies</CardTitle>
          <CardDescription>Browse available cryptocurrencies on Kripta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {marketDataList && marketDataList.length > 0 ? (
              marketDataList.map((item) => {
                const priceChange = item.market?.percentChange24h ? parseFloat(item.market.percentChange24h) : 0;
                const isPositive = priceChange >= 0;

                return (
                  <div
                    key={item.crypto?.id}
                    onClick={() => setSelectedCrypto(item.crypto?.id || null)}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedCrypto === item.crypto?.id ? 'bg-accent border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {item.crypto?.symbol?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.crypto?.name}</p>
                        <p className="text-sm text-muted-foreground">{item.crypto?.symbol}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">${formatCurrency(parseFloat(item.market?.priceUsd || '0'))}</p>
                      <div className="flex items-center justify-end gap-1 text-sm">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">24h Volume</p>
                      <p className="font-semibold">${formatCurrency(parseFloat(item.market?.volume24h || '0') / 1000000)}M</p>
                    </div>

                    <Button variant="outline" size="sm" className="ml-4">
                      Trade
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No cryptocurrencies available yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Market Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Market Cap</p>
              <p className="text-2xl font-bold">$1.2T</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-2xl font-bold">$45B</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BTC Dominance</p>
              <p className="text-2xl font-bold">42.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
