import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Banknote, Gift, LayoutDashboard, PiggyBank, ReceiptText, Ticket, TrendingUp, Users, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [usdRatePkr, setUsdRatePkr] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api("/api/accounts/admin/dashboard/").then(setStatsData).catch(() => setStatsData(null));
    api("/api/accounts/admin/system-status/").then(setSystemStatus).catch(() => setSystemStatus(null));
    api("/api/accounts/admin/settings/").then((settings) => setUsdRatePkr(String(settings.usdRatePkr || ""))).catch(() => setUsdRatePkr(""));
    api("/api/pins/admin/requests/").then((rows) => setRecentRequests(rows.filter((r: any) => r.status === "pending"))).catch(() => setRecentRequests([]));
  }, []);

  const saveUsdRate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingRate(true);
    try {
      const settings = await api("/api/accounts/admin/settings/", {
        method: "POST",
        body: JSON.stringify({ usdRatePkr: Number(usdRatePkr) }),
      });
      setUsdRatePkr(String(settings.usdRatePkr || ""));
      toast({ title: "USD Rate Saved", description: "User dashboard dollar display rate was updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save USD rate.", variant: "destructive" });
    } finally {
      setSavingRate(false);
    }
  };

  const adminStats = [
    { title: "Total Users", value: String(statsData?.totalUsers || 0), icon: Users, gradient: "from-primary to-nexo-green-light" },
    { title: "Active Users", value: String(statsData?.activeUsers || 0), icon: TrendingUp, gradient: "from-nexo-green-light to-primary" },
    { title: "Pending Pin Requests", value: String(statsData?.pendingPinRequests || 0), icon: Ticket, gradient: "from-secondary to-nexo-gold-light" },
    { title: "Total Current Income", value: `PKR ${Number(statsData?.totalCurrentIncome || 0).toLocaleString()}`, icon: Wallet, gradient: "from-primary to-secondary" },
  ];
  const financialReports = [
    {
      title: "Total Deposit",
      value: `PKR ${Number(statsData?.totalDeposit || 0).toLocaleString()}`,
      description: "Approved PIN/Token request amount only.",
      icon: Banknote,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Total Withdrawal",
      value: `PKR ${Number(statsData?.totalWithdrawal || 0).toLocaleString()}`,
      description: "Processed final payable amount after withdrawal rules.",
      icon: ReceiptText,
      gradient: "from-sky-500 to-cyan-500",
    },
    {
      title: "Total Rewards Paid",
      value: `PKR ${Number(statsData?.totalRewardsPaid || 0).toLocaleString()}`,
      description: "Full unlocked reward amount, separate from withdrawals.",
      icon: Gift,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Net System Profit",
      value: `PKR ${Number(statsData?.netSystemProfit || 0).toLocaleString()}`,
      description: "Deposits minus final withdrawals and rewards.",
      icon: PiggyBank,
      gradient: Number(statsData?.netSystemProfit || 0) >= 0 ? "from-primary to-nexo-green-light" : "from-destructive to-orange-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminStats.map((stat) => (
            <Card key={stat.title} className="nexo-card-glow border-border/50 hover:scale-[1.02] transition-transform">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold font-display mt-1 text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Financial Reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard earnings stay full binary earnings. These reports count only real deposits, final payable withdrawals, and full rewards separately.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {financialReports.map((report) => (
              <Card key={report.title} className="nexo-card-glow border-border/50 hover:scale-[1.02] transition-transform">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{report.title}</p>
                      <p className="mt-1 font-display text-2xl font-bold text-foreground">{report.value}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{report.description}</p>
                    </div>
                    <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${report.gradient} flex items-center justify-center`}>
                      <report.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={saveUsdRate} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
              <div>
                <h3 className="font-display font-semibold text-foreground">Dollar Display Rate</h3>
                <p className="mt-1 text-sm text-muted-foreground">Set the current PKR value of 1 USD. This is display-only for user earnings; withdrawals stay in PKR.</p>
              </div>
              <div className="space-y-2">
                <Label>1 USD = PKR</Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={usdRatePkr}
                  onChange={(event) => setUsdRatePkr(event.target.value)}
                  placeholder="280"
                />
              </div>
              <Button type="submit" disabled={savingRate}>
                {savingRate ? "Saving..." : "Save Rate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Pending Requests */}
        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-display font-semibold mb-4 text-foreground">Recent Pending Requests</h3>
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div>
                    <p className="font-medium text-foreground">{req.userName}</p>
                    <p className="text-sm text-muted-foreground">TRX: {req.trxId} | PKR {Number(req.amount).toLocaleString()}</p>
                  </div>
                  <span className="text-xs text-secondary font-semibold">{req.requestedAt}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-display font-semibold mb-4 text-foreground">Automation Status</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                <p className="text-muted-foreground">Last Run</p>
                <p className="font-semibold text-foreground">{systemStatus?.lastAutomationRun || "Not yet"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                <p className="text-muted-foreground">Ran Today</p>
                <p className="font-semibold text-foreground">{systemStatus?.ranToday ? "Yes" : "No"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                <p className="text-muted-foreground">Pending Backfill</p>
                <p className="font-semibold text-foreground">{systemStatus?.pendingBackfillDays ?? 0} day(s)</p>
              </div>
              <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
                <p className="text-muted-foreground">Today</p>
                <p className="font-semibold text-foreground">{systemStatus?.today || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
