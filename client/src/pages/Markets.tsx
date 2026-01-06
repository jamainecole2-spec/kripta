import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatCurrency, formatCryptoAmount } from "@/lib/utils";
import { useState } from "react";

export default function Markets() {
  const { data: cryptos, isLoading: loadingCryptos } = trpc.market.getCryptocurrencies.useQuery();
  const { data: marketDataList, isLoading: loadingMarket } = trpc.market.getAllMarketData.useQuery();
  const [selectedCrypto, setSelectedCrypto] = useState<number | null>(null);

  const isLoading = loadingCryptos || loadingMarket;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold">Cryptocurrency Markets</h1>
        <p className="text-muted-foreground text-lg">Real-time prices and market data</p>
      </div>

      {/* Market Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Total Market Cap</p>
              <p className="text-3xl font-bold">$1.2T</p>
              <p className="text-xs text-green-600 font-semibold">↑ 2.4% (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">24h Volume</p>
              <p className="text-3xl font-bold">$45B</p>
              <p className="text-xs text-green-600 font-semibold">↑ 5.1% (24h)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">BTC Dominance</p>
              <p className="text-3xl font-bold">42.5%</p>
              <p className="text-xs text-red-600 font-semibold">↓ 0.3% (24h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cryptocurrencies Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Available Cryptocurrencies</h2>
        </div>

        {marketDataList && marketDataList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketDataList.map((item) => {
              const priceChange = item.market?.percentChange24h ? parseFloat(item.market.percentChange24h) : 0;
              const isPositive = priceChange >= 0;
              const volume24h = parseFloat(item.market?.volume24h || '0');

              return (
                <Card
                  key={item.crypto?.id}
                  onClick={() => setSelectedCrypto(item.crypto?.id || null)}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary ${
                    selectedCrypto === item.crypto?.id ? 'border-2 border-primary shadow-lg' : 'border-2'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header with Icon and Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                          {item.crypto?.symbol?.[0] || 'C'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{item.crypto?.name || 'Cryptocurrency'}</p>
                          <p className="text-sm text-muted-foreground">{item.crypto?.symbol || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="space-y-1 border-t pt-4">
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-2xl font-bold">${formatCurrency(parseFloat(item.market?.priceUsd || '0'))}</p>
                      </div>

                      {/* 24h Change */}
                      <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                        {isPositive ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">24h Change</p>
                          <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {/* Volume */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">24h Volume</p>
                        <p className="font-semibold">${formatCurrency(volume24h / 1000000)}M</p>
                      </div>

                      {/* Trade Button */}
                      <Button className="w-full mt-2" size="lg">
                        Trade {item.crypto?.symbol || 'Crypto'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground text-lg">No cryptocurrencies available yet</p>
              <p className="text-muted-foreground text-sm mt-1">Check back soon for market data</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Market Insights */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Market Insights</CardTitle>
          <CardDescription>Key metrics and trends</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Market Trends</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between">
                  <span>Top Gainer (24h)</span>
                  <span className="text-green-600 font-semibold">+15.3%</span>
                </li>
                <li className="flex justify-between">
                  <span>Top Loser (24h)</span>
                  <span className="text-red-600 font-semibold">-8.7%</span>
                </li>
                <li className="flex justify-between">
                  <span>Most Traded</span>
                  <span className="font-semibold text-foreground">Bitcoin</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Exchange Info</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between">
                  <span>Listed Cryptocurrencies</span>
                  <span className="font-semibold text-foreground">{marketDataList?.length || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span>Trading Pairs</span>
                  <span className="font-semibold text-foreground">{(marketDataList?.length || 0) * 2}</span>
                </li>
                <li className="flex justify-between">
                  <span>24h Transactions</span>
                  <span className="font-semibold text-foreground">1.2M+</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
