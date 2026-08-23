import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Edit, Power, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

const PAYMENT_METHOD_OPTIONS = [
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "EasyPaisa" },
  { value: "bank_account", label: "Bank Account" },
];

const formatPaymentMethod = (method: string) => {
  if (method === "bank_account") return "Bank Account";
  if (method === "jazzcash") return "JazzCash";
  if (method === "easypaisa") return "EasyPaisa";
  return method || "-";
};

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("jazzcash");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setUsers(await api("/api/accounts/admin/users/"));
  };

  useEffect(() => {
    load().catch(() => setUsers([]));
  }, []);

  const toggleActive = async (id: string, nextState: boolean) => {
    await api(`/api/accounts/admin/users/${id}/`, { method: "PATCH", body: JSON.stringify({ is_active: nextState }) });
    await load();
    toast({ title: "User Updated", description: "User status has been changed." });
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditPaymentMethod(user.paymentMethod || "jazzcash");
    setEditAccountNumber(user.accountNumber || "");
    setEditBankName(user.bankName || "");
    setEditErrors({});
    setDialogOpen(true);
  };

  const validateEdit = () => {
    const errors: Record<string, string> = {};
    if (!editEmail.trim()) errors.email = "Email is required.";
    if (!editPhone.trim()) errors.phone = "Phone number is required.";
    if (!editAccountNumber.trim()) errors.accountNumber = "Payment number is required.";
    if (editPaymentMethod === "bank_account" && !editBankName.trim()) errors.bankName = "Bank name is required for a bank account.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveEdit = async () => {
    if (!editUser) return;
    if (!validateEdit()) return;

    setSaving(true);
    try {
      await api(`/api/accounts/admin/users/${editUser.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          email: editEmail.trim(),
          phone: editPhone.trim(),
          paymentMethod: editPaymentMethod,
          accountNumber: editAccountNumber.trim(),
          bankName: editPaymentMethod === "bank_account" ? editBankName.trim() : "",
        }),
      });
      await load();
      toast({ title: "User Updated", description: `${editUser.firstName}'s info has been updated.` });
      setDialogOpen(false);
      setEditUser(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update user.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: any) => {
    const confirmed = window.confirm(
      `Delete ${user.firstName} ${user.lastName} and all users under this account in the binary tree? This will remove their records from the database.`
    );
    if (!confirmed) return;

    setDeletingId(String(user.id));
    try {
      const result = await api(`/api/accounts/admin/users/${user.id}/`, { method: "DELETE" });
      await load();
      toast({
        title: "User Deleted",
        description: result.deletedCount > 1
          ? `${result.deletedCount} users were removed from the database.`
          : "User was removed from the database.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const editDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit User: {editUser?.firstName} {editUser?.lastName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            {editErrors.email && <p className="text-xs text-destructive">{editErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            {editErrors.phone && <p className="text-xs text-destructive">{editErrors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {editPaymentMethod === "bank_account" && (
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                placeholder="HBL, UBL, Meezan, Allied Bank..."
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
              />
              {editErrors.bankName && <p className="text-xs text-destructive">{editErrors.bankName}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label>Payment Number</Label>
            <Input
              placeholder="Account / wallet number"
              value={editAccountNumber}
              onChange={(e) => setEditAccountNumber(e.target.value)}
            />
            {editErrors.accountNumber && <p className="text-xs text-destructive">{editErrors.accountNumber}</p>}
          </div>
          <Button onClick={saveEdit} disabled={saving} className="w-full nexo-gradient text-primary-foreground">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Manage Users
        </h1>

        {/* Mobile card list */}
        <div className="space-y-3 md:hidden">
          {users.length === 0 ? (
            <Card className="nexo-card-glow border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">No users found.</CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="nexo-card-glow border-border/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge className={user.isActive ? "shrink-0 bg-primary/10 text-primary border-primary/20" : "shrink-0 bg-destructive/10 text-destructive border-destructive/20"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment</p>
                      <p className="font-semibold text-foreground">
                        {formatPaymentMethod(user.paymentMethod)}
                        {user.bankName ? <span className="ml-1 text-muted-foreground">({user.bankName})</span> : null}
                      </p>
                      <p className="font-mono text-xs font-semibold text-primary">{user.accountNumber || user.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Team (L/R)</p>
                      <p className="font-semibold text-foreground">{user.leftTeam}/{user.rightTeam}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Current Income</p>
                      <p className="font-mono font-semibold text-foreground">PKR {Number(user.currentIncome || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" onClick={() => openEdit(user)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 min-w-[100px] ${user.isActive ? "text-destructive" : "text-primary"}`}
                      onClick={() => toggleActive(user.id, !user.isActive)}
                    >
                      <Power className="w-3 h-3 mr-1" /> {user.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 min-w-[100px]"
                      onClick={() => deleteUser(user)}
                      disabled={deletingId === String(user.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deletingId === String(user.id) ? "Deleting..." : "Delete"}
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
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead>Team (L/R)</TableHead>
                    <TableHead>Current Income</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {formatPaymentMethod(user.paymentMethod)}
                            {user.bankName ? <span className="ml-1 text-muted-foreground">({user.bankName})</span> : null}
                          </p>
                          <p className="font-mono text-sm font-semibold text-primary">{user.accountNumber || user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.leftTeam}/{user.rightTeam}</TableCell>
                      <TableCell className="font-mono text-sm">PKR {Number(user.currentIncome || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={user.isActive ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(user)}>
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toggleActive(user.id, !user.isActive)} className={user.isActive ? "text-destructive" : "text-primary"}>
                            <Power className="w-3 h-3 mr-1" /> {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user)}
                            disabled={deletingId === String(user.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {deletingId === String(user.id) ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {editDialog}
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
