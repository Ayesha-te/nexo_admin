import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Check } from "lucide-react";
import { api } from "@/lib/api";

type WithdrawalRow = {
  id: number;
  userName: string;
  paymentMethod: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  requestedAmount: number;
  tax: number;
  taxType: string;
  netAmount: number;
  leftTeamTotal: number;
  rightTeamTotal: number;
  matchedPairs: number;
  systemAddedEarnings: number;
  adminAdjustment: number;
  adminNote: string;
  finalAmount: number;
  date: string;
  status: "pending" | "processed";
};

const ManageWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = async () => {
    const data = await api("/api/withdrawals/admin/");
    setWithdrawals(data);
    setAdjustments((prev) => {
      const next = { ...prev };
      data.forEach((row: WithdrawalRow) => {
        const key = String(row.id);
        if (next[key] === undefined) next[key] = String(row.adminAdjustment || 0);
      });
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      data.forEach((row: WithdrawalRow) => {
        const key = String(row.id);
        if (next[key] === undefined) next[key] = row.adminNote || "";
      });
      return next;
    });
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
      case "bank_account":
        return "Bank Account";
      default:
        return method;
    }
  };

  const getAdjustmentValue = (id: number) => Number(adjustments[String(id)] || 0);

  const processWithdrawal = async (id: number) => {
    const key = String(id);
    setProcessingId(key);
    try {
      await api(`/api/withdrawals/admin/${id}/approve/`, {
        method: "POST",
        body: JSON.stringify({
          adminAdjustment: getAdjustmentValue(id),
          adminNote: notes[key] || "",
        }),
      });
      toast({
        title: "Withdrawal Approved",
        description: "The withdrawal was approved with the current admin adjustment.",
      });
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

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const processedWithdrawals = withdrawals.filter((w) => w.status === "processed");

  const WithdrawalCards = ({ data }: { data: WithdrawalRow[] }) => (
    <div className="space-y-3 md:hidden">
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No records found</p>
      ) : (
        data.map((w) => {
          const key = String(w.id);
          const currentAdjustment = w.status === "pending" ? getAdjustmentValue(w.id) : Number(w.adminAdjustment || 0);
          const finalAmount = Math.max((w.requestedAmount || w.amount) + currentAdjustment, 0);
          return (
            <Card key={w.id} className="border-border/50">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{w.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPaymentMethod(w.paymentMethod)}
                      {w.bankName ? ` (${w.bankName})` : ""}
                    </p>
                    <p className="font-mono text-sm font-semibold text-secondary">{w.accountNumber}</p>
                  </div>
                  <Badge className={`shrink-0 ${w.status === "processed" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/10 text-secondary border-secondary/20"}`}>
                    {w.status === "processed" ? "paid" : "pending"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">L / R Team</p>
                    <p className="font-medium text-foreground">{w.leftTeamTotal.toLocaleString()} / {w.rightTeamTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Matched Sets</p>
                    <p className="font-medium text-foreground">{w.matchedPairs.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">System Earnings</p>
                    <p className="font-medium text-foreground">PKR {w.systemAddedEarnings.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Requested</p>
                    <p className="font-medium text-foreground">PKR {(w.requestedAmount || w.amount).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">{w.date}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Admin Adjustment</Label>
                  {w.status === "pending" ? (
                    <Input
                      type="number"
                      value={adjustments[key] ?? String(w.adminAdjustment || 0)}
                      onChange={(event) => setAdjustments((prev) => ({ ...prev, [key]: event.target.value }))}
                      placeholder="0"
                    />
                  ) : (
                    <p className={`text-sm font-medium ${w.adminAdjustment >= 0 ? "text-primary" : "text-destructive"}`}>
                      PKR {Number(w.adminAdjustment || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Admin Note</Label>
                  {w.status === "pending" ? (
                    <Textarea
                      value={notes[key] ?? w.adminNote ?? ""}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [key]: event.target.value }))}
                      placeholder="Optional admin note"
                      className="min-h-[64px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{w.adminNote || "No note"}</p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <span className="text-sm font-medium text-muted-foreground">Final Payout</span>
                  <span className="font-bold text-primary">PKR {finalAmount.toLocaleString()}</span>
                </div>

                {w.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-primary"
                    onClick={() => processWithdrawal(w.id)}
                    disabled={processingId === key}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {processingId === key ? "Approving..." : "Approve"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  const WithdrawalTable = ({ data }: { data: WithdrawalRow[] }) => (
    <div className="hidden overflow-x-auto md:block">
      <Table className="min-w-[1500px]">
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>L Team</TableHead>
            <TableHead>R Team</TableHead>
            <TableHead>Sets</TableHead>
            <TableHead>System Earnings</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Admin Adjustment</TableHead>
            <TableHead>Final Payout</TableHead>
            <TableHead>Admin Note</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((w) => {
              const key = String(w.id);
              const currentAdjustment = w.status === "pending" ? getAdjustmentValue(w.id) : Number(w.adminAdjustment || 0);
              const finalAmount = Math.max((w.requestedAmount || w.amount) + currentAdjustment, 0);
              return (
                <TableRow key={w.id}>
                  <TableCell className="font-medium whitespace-nowrap">{w.userName}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatPaymentMethod(w.paymentMethod)}
                    {w.bankName ? <span className="ml-1 text-muted-foreground">({w.bankName})</span> : null}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-secondary whitespace-nowrap">{w.accountNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">{w.leftTeamTotal.toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">{w.rightTeamTotal.toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">{w.matchedPairs.toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">PKR {w.systemAddedEarnings.toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">PKR {(w.requestedAmount || w.amount).toLocaleString()}</TableCell>
                  <TableCell className="min-w-[160px]">
                    {w.status === "pending" ? (
                      <Input
                        type="number"
                        value={adjustments[key] ?? String(w.adminAdjustment || 0)}
                        onChange={(event) => setAdjustments((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder="0"
                      />
                    ) : (
                      <span className={w.adminAdjustment >= 0 ? "text-primary" : "text-destructive"}>
                        PKR {Number(w.adminAdjustment || 0).toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-primary whitespace-nowrap">PKR {finalAmount.toLocaleString()}</TableCell>
                  <TableCell className="min-w-[220px]">
                    {w.status === "pending" ? (
                      <Textarea
                        value={notes[key] ?? w.adminNote ?? ""}
                        onChange={(event) => setNotes((prev) => ({ ...prev, [key]: event.target.value }))}
                        placeholder="Optional admin note"
                        className="min-h-[72px]"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{w.adminNote || "No note"}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{w.date}</TableCell>
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
                        disabled={processingId === key}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {processingId === key ? "Approving..." : "Approve"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
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

        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="pt-6 space-y-2 text-sm">
            <p className="text-foreground">System earnings follow the binary set plan: first matched set PKR 400, sets 2 to 99 PKR 200, set 100 onward PKR 100.</p>
            <p className="text-foreground">Requested amount is the system-generated withdrawal amount.</p>
            <p className="text-foreground">Left and right teams are used to count matched binary sets for each account.</p>
            <p className="text-foreground">Admin adjustment lets you add or deduct the final payout without changing the system wallet logic.</p>
          </CardContent>
        </Card>

        <Card className="nexo-card-glow border-secondary/30 bg-secondary/5">
          <CardContent className="pt-6 pb-6 md:pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-secondary flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                Pending Withdrawals ({pendingWithdrawals.length})
              </h2>
            </div>
            <WithdrawalCards data={pendingWithdrawals} />
            <WithdrawalTable data={pendingWithdrawals} />
          </CardContent>
        </Card>

        <Card className="nexo-card-glow border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6 md:pb-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                Paid Withdrawals ({processedWithdrawals.length})
              </h2>
            </div>
            <WithdrawalCards data={processedWithdrawals} />
            <WithdrawalTable data={processedWithdrawals} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageWithdrawals;
