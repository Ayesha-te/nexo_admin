import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Copy, KeyRound, Mail, RefreshCcw } from "lucide-react";

type ResetResult = {
  email: string;
  userName: string;
  newPassword: string;
};

const ResetUserPassword = () => {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ResetResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);

    if (!email.trim()) {
      toast({ title: "Email Required", description: "Please enter the user's email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const data = await api("/api/accounts/admin/reset-password/", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setResult(data);
      toast({ title: "Password Reset", description: "A new password has been generated for this user." });
    } catch (error: any) {
      toast({ title: "Reset Failed", description: error?.message || "Unable to reset password.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    if (!result?.newPassword) return;
    await navigator.clipboard.writeText(result.newPassword);
    toast({ title: "Copied", description: "New password copied to clipboard." });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" />
          Reset User Password
        </h1>

        <Card className="nexo-card-glow border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label>User Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter user email"
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="nexo-gradient text-primary-foreground">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {submitting ? "Generating..." : "Generate Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-semibold text-foreground">{result.userName || result.email}</p>
                <p className="text-sm text-muted-foreground">{result.email}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-background p-4">
                <p className="text-sm font-semibold text-muted-foreground">New Password</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-lg font-bold text-primary">
                    {result.newPassword}
                  </code>
                  <Button type="button" variant="outline" onClick={copyPassword}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResetUserPassword;
