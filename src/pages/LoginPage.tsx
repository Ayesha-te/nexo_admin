import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, User, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(identifier, password);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.20),transparent_30%),radial-gradient(circle_at_85%_15%,hsl(var(--secondary)/0.22),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.60))] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle,hsl(var(--primary)/0.35)_1px,transparent_1px),radial-gradient(circle,hsl(var(--secondary)/0.25)_1px,transparent_1px)] [background-position:0_0,22px_28px] [background-size:46px_46px,64px_64px]" />

      <div className="relative z-10 w-full max-w-md space-y-4">
        <Card className="overflow-hidden rounded-2xl border-white/60 bg-white/70 shadow-[0_22px_70px_-38px_hsl(var(--nexo-dark)/0.65)] backdrop-blur-xl">
          <CardHeader className="pb-0 pt-6 text-center">
            <div className="mx-auto flex h-32 w-64 items-center justify-center overflow-hidden">
              <img
                src="/ChatGPT_Image_Mar_3__2026__02_42_58_PM-removebg-preview.png"
                alt="Nexocart"
                className="h-52 w-auto max-w-none"
              />
            </div>
            <CardTitle className="font-display text-xl font-bold text-foreground">Nexocart</CardTitle>
            <div className="mx-auto mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Admin Panel Login
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-6 sm:p-6 sm:pt-6">
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-foreground/80">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    name="username"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    placeholder="Enter admin username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="h-11 w-full font-semibold text-primary-foreground transition-opacity hover:opacity-90 nexo-gradient">
                {submitting ? "Please wait..." : "Admin Login"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Restricted access &middot; Authorized administrators only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
