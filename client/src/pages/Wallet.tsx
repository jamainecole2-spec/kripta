import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Copy, Check, Wallet as WalletIcon } from "lucide-react";
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
    return (
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground text-lg">Deposit, withdraw, and manage your cryptocurrency assets</p>
      </div>

      {/* Main Content - Centered */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Deposit/Withdraw Card - Centered and larger */}
        <div className="lg:col-span-2">
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Deposit & Withdraw</CardTitle>
              <CardDescription>Manage your cryptocurrency funds</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="deposit" className="gap-2">
                    <ArrowDownLeft className="w-4 h-4" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                {/* Deposit Tab */}
                <TabsContent value="deposit" className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Cryptocurrency</Label>
                    <select
                      value={selectedCryptoId || ""}
                      onChange={(e) => setSelectedCryptoId(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border rounded-lg bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {wallets?.map((wallet) => (
                        <option key={wallet.id} value={wallet.cryptoId}>
                          Crypto ID: {wallet.cryptoId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="deposit-amount" className="text-base font-semibold">Amount</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      step="0.00000001"
                      className="text-base py-3"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">Deposit Address</p>
                    <div className="flex items-center gap-2 bg-background p-3 rounded">
                      <code className="text-sm font-mono flex-1 overflow-auto">
                        1A1z7agoat2LWSS34CM78vRzoa5XPLAoS
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("1A1z7agoat2LWSS34CM78vRzoa5XPLAoS")}
                        className="shrink-0"
                      >
                        {copiedAddress ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Send funds to this address to deposit</p>
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={isSubmitting || !selectedCryptoId || !depositAmount}
                    size="lg"
                    className="w-full"
                  >
                    {isSubmitting ? "Processing..." : "Confirm Deposit"}
                  </Button>
                </TabsContent>

                {/* Withdraw Tab */}
                <TabsContent value="withdraw" className="space-y-6 mt-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Cryptocurrency</Label>
                    <select
                      value={selectedCryptoId || ""}
                      onChange={(e) => setSelectedCryptoId(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border rounded-lg bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Choose a cryptocurrency...</option>
                      {wallets?.map((wallet) => (
                        <option key={wallet.id} value={wallet.cryptoId}>
                          Crypto ID: {wallet.cryptoId} - Balance: {formatCryptoAmount(wallet.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="withdraw-amount" className="text-base font-semibold">Amount</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      step="0.00000001"
                      className="text-base py-3"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="withdraw-address" className="text-base font-semibold">Recipient Address</Label>
                    <Input
                      id="withdraw-address"
                      placeholder="Enter recipient wallet address"
                      type="text"
                      className="text-base py-3"
                    />
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={isSubmitting || !selectedCryptoId || !withdrawAmount}
                    size="lg"
                    className="w-full"
                  >
                    {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Summary - Sidebar */}
        <div>
          <Card className="border-2 shadow-lg h-full">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5" />
                Wallet Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {wallets && wallets.length > 0 ? (
                <div className="space-y-4">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Crypto ID: {wallet.cryptoId}</p>
                      <p className="text-xl font-bold">{formatCryptoAmount(wallet.balance)}</p>
                      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                        <p>Locked: {formatCryptoAmount(wallet.lockedBalance)}</p>
                        <p>Available: {formatCryptoAmount((parseFloat(wallet.balance) - parseFloat(wallet.lockedBalance)).toString())}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <WalletIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-sm text-muted-foreground">No wallets yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first wallet by depositing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl">Transaction History</CardTitle>
          <CardDescription>Your recent cryptocurrency transactions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingTransactions ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 15).map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {tx.transactionType === "deposit" ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-semibold capitalize">{tx.transactionType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold">{formatCryptoAmount(tx.amount)}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === "completed" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : tx.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
