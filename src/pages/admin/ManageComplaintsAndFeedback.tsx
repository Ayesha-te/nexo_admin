import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Check, Eye } from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ManageComplaintsAndFeedback = () => {
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setFeedbackList(await api("/api/complaints/admin/"));
  };

  useEffect(() => {
    load().catch(() => setFeedbackList([]));
  }, []);

  const handleStatusChange = async (id: string, newStatus: "new" | "reviewed" | "resolved") => {
    await api(`/api/complaints/admin/${id}/`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    await load();
    toast({ title: "Status Updated!", description: `Feedback status has been changed to ${newStatus}.` });
  };

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDialog(true);
  };

  const getTypeBadge = (type: string) => {
    if (type === "complaint") {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-primary/10 text-primary border-primary/20";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return "bg-secondary/10 text-secondary border-secondary/20";
      case "reviewed": return "bg-primary/10 text-primary border-primary/20";
      case "resolved": return "bg-nexo-green/10 text-nexo-green border-nexo-green/20";
      default: return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Complaints & Feedback
        </h1>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackList.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">{feedback.name}</TableCell>
                    <TableCell>{feedback.email}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(feedback.type)}>
                        {feedback.type === "complaint" ? "🔴 Complaint" : "💬 Feedback"}
                      </Badge>
                    </TableCell>
                    <TableCell>{feedback.submittedAt}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(feedback.status)}>
                        {feedback.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => handleViewDetails(feedback)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        {feedback.status !== "resolved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-nexo-green border-nexo-green/30 hover:bg-nexo-green/10"
                            onClick={() => handleStatusChange(feedback.id, "resolved")}
                          >
                            <Check className="w-3 h-3 mr-1" /> Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-foreground">{selectedFeedback.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-foreground">{selectedFeedback.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <Badge className={getTypeBadge(selectedFeedback.type)}>
                  {selectedFeedback.type === "complaint" ? "🔴 Complaint" : "💬 Feedback"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-foreground">{selectedFeedback.message}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-foreground">{selectedFeedback.submittedAt}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusBadge(selectedFeedback.status)}>
                  {selectedFeedback.status}
                </Badge>
              </div>
              {selectedFeedback.status !== "resolved" && (
                <Button
                  className="w-full nexo-gradient text-primary-foreground"
                  onClick={() => {
                    handleStatusChange(selectedFeedback.id, "resolved");
                    setShowDialog(false);
                  }}
                >
                  Mark as Resolved
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ManageComplaintsAndFeedback;
