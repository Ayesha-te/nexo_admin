import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { KeyRound } from "lucide-react";
import { api } from "@/lib/api";

type PinBalanceRow = {
  userId: number;
  userName: string;
  email: string;
  phone: string;
  accountNumber: string;
  paymentMethod: string;
  bankName: string;
  totalPins: number;
  availablePins: number;
  usedPins: number;
};

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case "easypaisa":
      return "EasyPaisa";
    case "jazzcash":
      return "JazzCash";
    case "bank_account":
      return "Bank Account";
    default:
      return method || "-";
  }
};

const PinBalances = () => {
  const [rows, setRows] = useState<PinBalanceRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/pins/admin/balances/").then(setRows).catch(() => setRows([]));
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.userName, row.email, row.phone, row.accountNumber, row.paymentMethod, row.bankName]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [rows, search]);

  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.totalPins,
      available: acc.available + row.availablePins,
      used: acc.used + row.usedPins,
    }),
    { total: 0, available: 0, used: 0 },
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-primary" />
            PIN Balances
          </h1>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user, email, account..."
            className="sm:max-w-xs"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total PINs in System</p>
              <p className="mt-1 font-display text-2xl font-bold text-foreground">{totals.total.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="nexo-card-glow border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Available / Unused</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">{totals.available.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="nexo-card-glow border-secondary/30 bg-secondary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="mt-1 font-display text-2xl font-bold text-secondary">{totals.used.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Details</TableHead>
                    <TableHead>Total PINs</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No users with PINs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row) => (
                      <TableRow key={row.userId}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{row.userName || "-"}</p>
                            <p className="text-xs text-muted-foreground">ID: {row.userId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{row.email}</p>
                            <p className="text-xs text-muted-foreground">{row.phone || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">
                              {formatPaymentMethod(row.paymentMethod)}
                              {row.bankName ? <span className="ml-1 text-muted-foreground">({row.bankName})</span> : null}
                            </p>
                            <p className="font-mono text-sm text-primary">{row.accountNumber || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{row.totalPins.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {row.availablePins.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                            {row.usedPins.toLocaleString()}
                          </Badge>
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

export default PinBalances;
