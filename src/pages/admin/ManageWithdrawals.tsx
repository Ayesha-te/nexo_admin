import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Check } from "lucide-react";
import { api } from "@/lib/api";

const ManageWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setWithdrawals(await api("/api/withdrawals/admin/"));
  };

  useEffect(() => {
    load().catch(() => setWithdrawals([]));
  }, []);

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "easypaisa":
        return "EasyPaisa";
      case "jazzcash":
        return "JazzCash";
      default:
        return method;
    }
  };

  const processWithdrawal = async (id: string) => {
    setProcessingId(id);
    try {
      await api(`/api/withdrawals/admin/${id}/approve/`, { method: "POST" });
      toast({ title: "Withdrawal Approved", description: "The withdrawal has been moved to paid withdrawals." });
      await load();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error?.message || "This withdrawal could not be approved.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const processedWithdrawals = withdrawals.filter(w => w.status === "processed");

  const WithdrawalTable = ({ data }: { data: any[] }) => (
    <div className="overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">User</TableHead>
            <TableHead className="whitespace-nowrap">Payment Method</TableHead>
            <TableHead className="whitespace-nowrap">Account Number</TableHead>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Amount</TableHead>
            <TableHead className="whitespace-nowrap">Tax</TableHead>
            <TableHead className="whitespace-nowrap">Net</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium whitespace-nowrap">{w.userName}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPaymentMethod(w.paymentMethod)}</TableCell>
                <TableCell className="font-mono font-semibold text-secondary whitespace-nowrap">{w.accountNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{w.date}</TableCell>
                <TableCell className="whitespace-nowrap">PKR {w.amount.toLocaleString()}</TableCell>
                <TableCell className="whitespace-nowrap">PKR {w.tax.toLocaleString()}</TableCell>
                <TableCell className="font-bold text-primary whitespace-nowrap">PKR {w.netAmount.toLocaleString()}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge className={w.status === "processed" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/10 text-secondary border-secondary/20"}>
                    {w.status === "processed" ? "paid" : "pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {w.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary"
                      onClick={() => processWithdrawal(w.id)}
                      disabled={processingId === w.id}
                    >
                      <Check className="w-3 h-3 mr-1" /> {processingId === w.id ? "Approving..." : "Approve"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" />
          Manage Withdrawals
        </h1>

        {/* Pending Withdrawals */}
        <Card className="nexo-card-glow border-secondary/30 bg-secondary/5">
          <CardContent className="pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-secondary flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                Pending Withdrawals ({pendingWithdrawals.length})
              </h2>
            </div>
            <WithdrawalTable data={pendingWithdrawals} />
          </CardContent>
        </Card>

        {/* Paid/Processed Withdrawals */}
        <Card className="nexo-card-glow border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Paid Withdrawals ({processedWithdrawals.length})
              </h2>
            </div>
            <WithdrawalTable data={processedWithdrawals} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageWithdrawals;
