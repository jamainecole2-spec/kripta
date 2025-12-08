import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

export default function Trading() {
  const { data: cryptos, isLoading: loadingCryptos } = trpc.market.getCryptocurrencies.useQuery();
  const executeTrade = trpc.trading.executeTrade.useMutation();
  
  const [selectedCrypto, setSelectedCrypto] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrade = async () => {
    if (!selectedCrypto || !quantity || !pricePerUnit) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await executeTrade.mutateAsync({
        cryptoId: selectedCrypto,
        orderType,
        quantity,
        pricePerUnit,
      });
      toast.success(`${orderType === "buy" ? "Buy" : "Sell"} order executed successfully!`);
      setQuantity("");
      setPricePerUnit("");
    } catch (error) {
      toast.error(`Failed to execute trade: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCryptos) {
    return <Skeleton className="h-96 w-full" />;
  }

  const totalPrice = (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trading</h1>
        <p className="text-muted-foreground">Buy and sell cryptocurrencies</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trading Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>Execute a buy or sell order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="buy" onValueChange={(v) => setOrderType(v as "buy" | "sell")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    <select
                      value={selectedCrypto || ""}
                      onChange={(e) => setSelectedCrypto(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {cryptos?.map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0.00"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        step="0.00000001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Unit (USD)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        step="0.01"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    <select
                      value={selectedCrypto || ""}
                      onChange={(e) => setSelectedCrypto(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {cryptos?.map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sell-quantity">Quantity</Label>
                      <Input
                        id="sell-quantity"
                        type="number"
                        placeholder="0.00"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        step="0.00000001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sell-price">Price per Unit (USD)</Label>
                      <Input
                        id="sell-price"
                        type="number"
                        placeholder="0.00"
                        value={pricePerUnit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        step="0.01"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleTrade}
                disabled={isSubmitting || !selectedCrypto || !quantity || !pricePerUnit}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Processing..." : `${orderType === "buy" ? "Buy" : "Sell"} Now`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <p className="text-lg font-semibold capitalize">{orderType}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Quantity</p>
                <p className="text-lg font-semibold">{quantity || "0"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Price per Unit</p>
                <p className="text-lg font-semibold">${pricePerUnit || "0.00"}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Fee (0.1%)</p>
                <p className="text-lg font-semibold">${(totalPrice * 0.001).toFixed(2)}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Final Amount</p>
                <p className="text-2xl font-bold">
                  ${(totalPrice + (totalPrice * 0.001)).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
