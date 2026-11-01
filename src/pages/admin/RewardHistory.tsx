import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Trophy, Users } from "lucide-react";
import { api } from "@/lib/api";

type RewardRow = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  username: string;
  level: number;
  milestone: string;
  amount: number;
  rewardedAt: string;
  referenceId: string;
  status: string;
};

type MilestoneSummary = {
  level: number;
  milestone: string;
  count: number;
  totalAmount: number;
};

type Summary = {
  totalRewardsDistributed: number;
  totalTransactions: number;
  byMilestone: MilestoneSummary[];
  topUsers: { userId: number; email: string; username: string; totalAmount: number; count: number }[];
};

const RewardHistory = () => {
  const [rows, setRows] = useState<RewardRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (levelFilter !== "all") params.set("level", levelFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    Promise.all([
      api(`/api/rewards/admin/history/?${params.toString()}`),
      api("/api/rewards/admin/summary/"),
    ])
      .then(([historyData, summaryData]) => {
        setRows(Array.isArray(historyData) ? historyData : []);
        setSummary(summaryData);
      })
      .catch(() => {
        setRows([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const levelOptions = useMemo(
    () => (summary?.byMilestone || []).map((row) => ({ value: String(row.level), label: `Level ${row.level} - ${row.milestone}` })),
    [summary]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Reward History</h1>
          <p className="text-sm text-muted-foreground">
            Per-user records of every automatic milestone reward, separate from regular binary/ads earnings.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Rewards Distributed</p>
                <p className="font-display text-xl font-extrabold text-foreground">
                  PKR {Number(summary?.totalRewardsDistributed || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Transactions</p>
                <p className="font-display text-xl font-extrabold text-foreground">
                  {Number(summary?.totalTransactions || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Users Rewarded</p>
                <p className="font-display text-xl font-extrabold text-foreground">
                  {Number(summary?.topUsers?.length || 0).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {summary && summary.byMilestone.length > 0 && (
          <Card className="nexo-card-glow border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Reward Distribution by Milestone</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Times Awarded</TableHead>
                    <TableHead>Total Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byMilestone.map((row) => (
                    <TableRow key={row.level}>
                      <TableCell>{row.level}</TableCell>
                      <TableCell>{row.milestone}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell className="font-mono">PKR {Number(row.totalAmount).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Individual Reward Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleFilter} className="flex flex-wrap gap-2">
              <Input
                placeholder="Search by name, username or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[260px]"
              />
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Filter
              </button>
            </form>

            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Loading reward history...
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No reward records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{row.userName || row.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.userEmail} · ID {row.userId}
                          </p>
                        </TableCell>
                        <TableCell>
                          Level {row.level} - {row.milestone}
                        </TableCell>
                        <TableCell className="font-mono">
                          {row.amount > 0 ? `PKR ${Number(row.amount).toLocaleString()}` : "Non-cash"}
                        </TableCell>
                        <TableCell>{row.rewardedAt}</TableCell>
                        <TableCell className="font-mono text-xs">{row.referenceId}</TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-primary/20">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RewardHistory;
