import { useEffect, useMemo, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarCheck, Search, Users } from "lucide-react";
import { api } from "@/lib/api";

type AttendanceRow = {
  userId: number;
  userName: string;
  email: string;
  phone: string;
  markedAt: string;
};

type UserHistoryRecord = {
  id: number;
  userId: number;
  date: string;
  markedAt: string;
};

type UserHistory = {
  userName: string;
  email: string;
  phone: string;
  records: UserHistoryRecord[];
  totalDays: number;
  currentStreak: number;
  summary: {
    month: string;
    presentDays: number;
    category: "27+" | "25-26" | "20-24" | null;
  };
};

const REFRESH_INTERVAL_MS = 45000;

const TodaysAttendance = () => {
  const [date, setDate] = useState("");
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<UserHistory | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api("/api/attendance/admin/today/");
      setDate(data.date || "");
      setTotal(data.total || 0);
      setRows(data.rows || []);
      setLastUpdated(new Date());
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.userName, row.email, row.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const openHistory = async (userId: number) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistory(null);
    try {
      const data = await api(`/api/attendance/admin/user/${userId}/`);
      setHistory(data);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-primary" />
              Today's Attendance
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {date ? `Date: ${date}` : ""}
              {lastUpdated ? ` · Last Updated: ${lastUpdated.toLocaleTimeString()}` : ""}
            </p>
          </div>
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or number..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Today's Total Attendance</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">{total} Users</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-nexo-green-light flex items-center justify-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile card list */}
        <div className="space-y-3 md:hidden">
          {filteredRows.length === 0 ? (
            <Card className="nexo-card-glow border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                No attendance marked yet today.
              </CardContent>
            </Card>
          ) : (
            filteredRows.map((row) => (
              <Card key={row.userId} className="nexo-card-glow border-border/50">
                <CardContent className="space-y-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{row.userName}</p>
                    <p className="truncate text-sm text-muted-foreground">{row.email}</p>
                    <p className="text-sm text-muted-foreground">{row.phone || "-"}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance Time</p>
                      <p className="font-semibold text-foreground">
                        {new Date(row.markedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openHistory(row.userId)}>
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop table */}
        <Card className="nexo-card-glow border-border/50 hidden md:block">
          <CardContent className="pt-6">
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Attendance Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No attendance marked yet today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.userId}>
                        <TableCell className="font-medium">{row.userName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone || "-"}</TableCell>
                        <TableCell>{new Date(row.markedAt).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openHistory(row.userId)}>
                            View History
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl">
            <DialogHeader>
              <DialogTitle>{history ? `${history.userName}'s Attendance History` : "Attendance History"}</DialogTitle>
            </DialogHeader>
            {historyLoading ? (
              <p className="py-8 text-center text-muted-foreground">Loading...</p>
            ) : !history ? (
              <p className="py-8 text-center text-muted-foreground">Failed to load history.</p>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="font-semibold text-foreground">{history.userName}</p>
                  <p className="text-muted-foreground">{history.email}</p>
                  <p className="text-muted-foreground">{history.phone || "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Days</p>
                    <p className="font-display text-lg font-bold text-foreground">{history.totalDays}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Current Streak</p>
                    <p className="font-display text-lg font-bold text-foreground">{history.currentStreak}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">{history.summary?.month || "This Month"}</p>
                    <p className="font-display text-lg font-bold text-foreground">{history.summary?.presentDays ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-display text-lg font-bold text-foreground">{history.summary?.category || "-"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Records</p>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.records.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                              No records found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          history.records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.date}</TableCell>
                              <TableCell>{new Date(record.markedAt).toLocaleTimeString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TodaysAttendance;
