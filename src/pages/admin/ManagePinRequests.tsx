import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Check, X } from "lucide-react";
import { api } from "@/lib/api";

type PinRequestRow = {
  id: number;
  userName: string;
  accountNumber: string;
  trxId: string;
  amount: number;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt: string | null;
  generatedPins: string[];
};

const ManagePinRequests = () => {
  const [requests, setRequests] = useState<PinRequestRow[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const rows = await api("/api/pins/admin/requests/");
    setRequests(rows);
  };

  useEffect(() => {
    load().catch(() => setRequests([]));
  }, []);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    try {
      await api(`/api/pins/admin/requests/${id}/`, { method: "POST", body: JSON.stringify({ action }) });
      await load();
      toast({ title: `Request ${action}`, description: `Pin request has been ${action}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update request", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: PinRequestRow["status"]) => {
    if (status === "approved") return "bg-primary/10 text-primary border-primary/20";
    if (status === "rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-secondary/10 text-secondary border-secondary/20";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <Ticket className="h-6 w-6 text-primary" />
          Manage Pin Requests
        </h1>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Account #</TableHead>
                  <TableHead>TRX ID</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated Codes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.userName}</TableCell>
                    <TableCell>{req.accountNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{req.trxId}</TableCell>
                    <TableCell>{req.quantity}</TableCell>
                    <TableCell>PKR {req.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{req.requestedAt}</p>
                        {req.processedAt ? <p className="text-muted-foreground">Processed: {req.processedAt}</p> : null}
                      </div>
                    </TableCell>
                    <TableCell><Badge className={getStatusBadge(req.status)}>{req.status}</Badge></TableCell>
                    <TableCell className="max-w-[220px]">
                      {req.generatedPins.length > 0 ? (
                        <div className="space-y-1 text-xs font-mono">
                          {req.generatedPins.map((pin) => (
                            <p key={pin} className="break-all">{pin}</p>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleAction(req.id, "approved")}>
                            <Check className="mr-1 h-3 w-3" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleAction(req.id, "rejected")}>
                            <X className="mr-1 h-3 w-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagePinRequests;
