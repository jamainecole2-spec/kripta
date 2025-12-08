import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Copy, Check } from "lucide-react";
import { formatCryptoAmount, formatCurrency } from "@/lib/utils";

export default function Wallet() {
  const { data: wallets, isLoading: loadingWallets } = trpc.wallet.getWallets.useQuery();
  const { data: transactions, isLoading: loadingTransactions } = trpc.transactions.getHistory.useQuery();
  const deposit = trpc.wallet.deposit.useMutation();
  const withdraw = trpc.wallet.withdraw.useMutation();

  const [selectedCryptoId, setSelectedCryptoId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleDeposit = async () => {
    if (!selectedCryptoId || !depositAmount) {
      toast.error("Please select a cryptocurrency and enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await deposit.mutateAsync({
        cryptoId: selectedCryptoId,
        amount: depositAmount,
      });
      toast.success("Deposit successful!");
      setDepositAmount("");
    } catch (error) {
      toast.error(`Deposit failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedCryptoId || !withdrawAmount) {
      toast.error("Please select a cryptocurrency and enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await withdraw.mutateAsync({
        cryptoId: selectedCryptoId,
        amount: withdrawAmount,
      });
      toast.success("Withdrawal successful!");
      setWithdrawAmount("");
    } catch (error) {
      toast.error(`Withdrawal failed: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (loadingWallets) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your cryptocurrency assets</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deposit/Withdraw */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deposit & Withdraw</CardTitle>
              <CardDescription>Add or remove cryptocurrency from your wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    <select
                      value={selectedCryptoId || ""}
                      onChange={(e) => setSelectedCryptoId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {wallets?.map((wallet) => (
                        <option key={wallet.id} value={wallet.cryptoId}>
                          Crypto ID: {wallet.cryptoId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      step="0.00000001"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Deposit Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background p-2 rounded flex-1 overflow-auto">
                        1A1z7agoat2LWSS34CM78vRzoa5XPLAoS
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("1A1z7agoat2LWSS34CM78vRzoa5XPLAoS")}
                      >
                        {copiedAddress ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isSubmitting || !selectedCryptoId || !depositAmount}
                    className="w-full"
                  >
                    {isSubmitting ? "Processing..." : "Deposit"}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    <select
                      value={selectedCryptoId || ""}
                      onChange={(e) => setSelectedCryptoId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {wallets?.map((wallet) => (
                        <option key={wallet.id} value={wallet.cryptoId}>
                          Crypto ID: {wallet.cryptoId} - Balance: {formatCryptoAmount(wallet.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      step="0.00000001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdraw-address">Recipient Address</Label>
                    <Input
                      id="withdraw-address"
                      placeholder="Enter recipient address"
                      type="text"
                    />
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={isSubmitting || !selectedCryptoId || !withdrawAmount}
                    className="w-full"
                  >
                    {isSubmitting ? "Processing..." : "Withdraw"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Wallet Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wallets && wallets.length > 0 ? (
                wallets.map((wallet) => (
                  <div key={wallet.id} className="border-b pb-4 last:border-b-0">
                    <p className="text-sm text-muted-foreground">Crypto ID: {wallet.cryptoId}</p>
                    <p className="text-lg font-semibold">{formatCryptoAmount(wallet.balance)}</p>
                    <p className="text-xs text-muted-foreground">
                      Locked: {formatCryptoAmount(wallet.lockedBalance)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No wallets yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <Skeleton className="h-32 w-full" />
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {tx.transactionType === "deposit" ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold capitalize">{tx.transactionType}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCryptoAmount(tx.amount)}</p>
                    <p className={`text-xs ${tx.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
