import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, ExternalLink, Save, Ticket, X } from "lucide-react";
import { api } from "@/lib/api";

type PinRequestRow = {
  id: string;
  userId: string;
  userName: string;
  accountNumber: string;
  trxId: string;
  amount: number;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt: string | null;
  generatedPins: string[];
  screenshotUrl: string | null;
};

type PinSettings = {
  purchaseEnabled: boolean;
  availableAgainTime: string;
  disabledMessage: string;
  pinPrice: number;
  minQuantity: number;
  maxQuantity: number;
  paymentDetails: {
    accountTitle: string;
    accountNumber: string;
    paymentMethod: string;
    instructions: string;
    qrCodeUrl: string | null;
  };
  paymentMethods?: PaymentMethodDetail[];
};

type PaymentMethodDetail = {
  paymentMethod: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  qrCodeUrl: string | null;
};

const defaultSettings: PinSettings = {
  purchaseEnabled: true,
  availableAgainTime: "",
  disabledMessage: "PIN/Token Purchase is temporarily unavailable. Please try again later.",
  pinPrice: 1000,
  minQuantity: 1,
  maxQuantity: 1000,
  paymentDetails: {
    accountTitle: "",
    accountNumber: "",
    paymentMethod: "Easypaisa",
    instructions: "",
    qrCodeUrl: null,
  },
};

const SUPPORTED_PAYMENT_METHODS = ["JazzCash", "Easypaisa", "Bank Account"];

const normalizePaymentMethods = (settings: PinSettings): PaymentMethodDetail[] => {
  const source = settings.paymentMethods?.length ? settings.paymentMethods : [settings.paymentDetails];
  return SUPPORTED_PAYMENT_METHODS.map((paymentMethod) => {
    const saved = source.find((method) => method.paymentMethod === paymentMethod);
    return {
      paymentMethod,
      accountTitle: saved?.accountTitle || "",
      accountNumber: saved?.accountNumber || "",
      instructions: saved?.instructions || "",
      qrCodeUrl: saved?.qrCodeUrl || null,
    };
  });
};

const ManagePinRequests = () => {
  const [requests, setRequests] = useState<PinRequestRow[]>([]);
  const [settings, setSettings] = useState<PinSettings>(defaultSettings);
  const [qrFiles, setQrFiles] = useState<Record<number, File | null>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [rows, config] = await Promise.all([
      api("/api/pins/admin/requests/"),
      api("/api/pins/admin/settings/"),
    ]);
    setRequests(rows);
    setSettings({
      ...config,
      paymentMethods: normalizePaymentMethods(config),
    });
  };

  useEffect(() => {
    load().catch(() => setRequests([]));
  }, []);

  const paymentMethods = normalizePaymentMethods(settings);

  const updatePaymentMethod = (index: number, field: keyof PaymentMethodDetail, value: string) => {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: (prev.paymentMethods?.length ? prev.paymentMethods : [prev.paymentDetails]).map((method, methodIndex) =>
        methodIndex === index ? { ...method, [field]: value } : method,
      ),
    }));
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const formData = new FormData();
      formData.append("purchaseEnabled", String(settings.purchaseEnabled));
      formData.append("availableAgainTime", settings.availableAgainTime || "");
      formData.append("paymentMethods", JSON.stringify(paymentMethods));
      Object.entries(qrFiles).forEach(([index, file]) => {
        if (file) formData.append(`qrCode_${index}`, file);
      });

      const nextSettings = await api("/api/pins/admin/settings/", {
        method: "POST",
        body: formData,
      });
      setSettings({
        ...nextSettings,
        paymentMethods: normalizePaymentMethods(nextSettings),
      });
      setQrFiles({});
      toast({ title: "Settings Saved", description: "PIN purchase payment details were updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      await api(`/api/pins/admin/requests/${id}/`, { method: "POST", body: JSON.stringify({ action }) });
      await load();
      toast({ title: `Request ${action}`, description: `PIN request has been ${action}.` });
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
      <div className="max-w-full space-y-6 overflow-hidden animate-fade-in">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <Ticket className="h-6 w-6 text-primary" />
          Pin Requests & Settings
        </h1>

        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">PIN Purchase Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="grid gap-4 rounded-md border border-border/50 bg-muted/30 p-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                <div>
                  <Label className="text-sm font-semibold">Purchase Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {settings.purchaseEnabled ? "Users can submit new PIN purchase requests." : settings.disabledMessage}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Available Again Time</Label>
                  <Input
                    placeholder="8 A.M"
                    value={settings.availableAgainTime || ""}
                    onChange={(event) => setSettings((prev) => ({ ...prev, availableAgainTime: event.target.value }))}
                  />
                </div>
                <Switch
                  checked={settings.purchaseEnabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, purchaseEnabled: checked }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Label className="text-base font-semibold">Payment Methods</Label>
                  <p className="text-xs text-muted-foreground">Fill the details you want users to see for each supported method.</p>
                </div>

                {paymentMethods.map((method, index) => (
                  <div key={index} className="rounded-md border border-border/50 bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Method {index + 1}</p>
                      <Badge variant="secondary">{method.paymentMethod}</Badge>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-2 min-w-0">
                        <Label>Payment Method</Label>
                        <Select value={method.paymentMethod} disabled>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JazzCash">JazzCash</SelectItem>
                            <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                            <SelectItem value="Bank Account">Bank Account</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Account Title</Label>
                        <Input value={method.accountTitle} onChange={(event) => updatePaymentMethod(index, "accountTitle", event.target.value)} />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Account Number</Label>
                        <Input value={method.accountNumber} onChange={(event) => updatePaymentMethod(index, "accountNumber", event.target.value)} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="space-y-2 min-w-0">
                        <Label>Instruction Box</Label>
                        <Textarea
                          value={method.instructions}
                          onChange={(event) => updatePaymentMethod(index, "instructions", event.target.value)}
                          className="min-h-[96px]"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>QR Code (Optional)</Label>
                        <Input type="file" accept="image/*" onChange={(event) => setQrFiles((prev) => ({ ...prev, [index]: event.target.files?.[0] ?? null }))} />
                        {method.qrCodeUrl ? (
                          <img src={method.qrCodeUrl} alt={`${method.paymentMethod} QR Code`} className="h-24 w-24 rounded-md border object-contain" />
                        ) : (
                          <p className="text-xs text-muted-foreground">No QR code uploaded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">
                  PIN price PKR {settings.pinPrice.toLocaleString()} | Limit {settings.minQuantity}-{settings.maxQuantity}
                </Badge>
                <Button type="submit" disabled={savingSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>PIN Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated Codes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No PIN purchase requests found.</TableCell>
                    </TableRow>
                  ) : requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.userName}</TableCell>
                      <TableCell className="font-mono text-xs">{req.userId}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{req.requestedAt}</p>
                          {req.processedAt ? <p className="text-muted-foreground">Processed: {req.processedAt}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>{req.quantity}</TableCell>
                      <TableCell>PKR {req.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{req.trxId}</TableCell>
                      <TableCell>
                        {req.screenshotUrl ? (
                          <a href={req.screenshotUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Missing</span>
                        )}
                      </TableCell>
                      <TableCell><Badge className={getStatusBadge(req.status)}>{req.status}</Badge></TableCell>
                      <TableCell className="max-w-[220px]">
                        {req.generatedPins.length > 0 ? (
                          <div className="max-h-28 space-y-1 overflow-auto text-xs font-mono">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManagePinRequests;
