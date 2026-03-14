import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Ticket, Wallet, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

const AdminDashboard = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    api("/api/accounts/admin/dashboard/").then(setStatsData).catch(() => setStatsData(null));
    api("/api/accounts/admin/system-status/").then(setSystemStatus).catch(() => setSystemStatus(null));
    api("/api/pins/admin/requests/").then((rows) => setRecentRequests(rows.filter((r: any) => r.status === "pending"))).catch(() => setRecentRequests([]));
  }, []);

  const adminStats = [
    { title: "Total Users", value: String(statsData?.totalUsers || 0), icon: Users, gradient: "from-primary to-nexo-green-light" },
    { title: "Active Users", value: String(statsData?.activeUsers || 0), icon: TrendingUp, gradient: "from-nexo-green-light to-primary" },
    { title: "Pending Pin Requests", value: String(statsData?.pendingPinRequests || 0), icon: Ticket, gradient: "from-secondary to-nexo-gold-light" },
    { title: "Total Current Income", value: `PKR ${Number(statsData?.totalCurrentIncome || 0).toLocaleString()}`, icon: Wallet, gradient: "from-primary to-secondary" },
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
