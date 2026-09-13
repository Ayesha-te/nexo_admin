import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MonitorPlay, Save } from "lucide-react";
import { api } from "@/lib/api";

type AdsSettingsData = {
  enabled: boolean;
  dailyLimit: number;
  welcomeRewardPkr: number;
  welcomeDurationDays: number;
  pairRewardPkr: number;
  pairCycleDays: number;
};

type AdsHistoryRow = {
  id: number;
  userId: number;
  watchedDate: string;
  rewardPkr: number;
  cycleType: "welcome" | "pair" | null;
  createdAt: string;
};

const defaultSettings: AdsSettingsData = {
  enabled: true,
  dailyLimit: 3,
  welcomeRewardPkr: 11,
  welcomeDurationDays: 3,
  pairRewardPkr: 5,
  pairCycleDays: 3,
};

const AdsSettings = () => {
  const [settings, setSettings] = useState<AdsSettingsData>(defaultSettings);
  const [history, setHistory] = useState<AdsHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api("/api/ads/admin/settings/").then(setSettings).catch(() => setSettings(defaultSettings));
    api("/api/ads/admin/history/").then(setHistory).catch(() => setHistory([]));
  }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api("/api/ads/admin/settings/", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      toast({ title: "Settings Saved", description: "Ads module settings were updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to save Ads settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getCycleBadge = (cycleType: AdsHistoryRow["cycleType"]) => {
    if (cycleType === "welcome") return "bg-secondary/10 text-secondary border-secondary/20";
    if (cycleType === "pair") return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground border-border/50";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <MonitorPlay className="w-6 h-6 text-primary" />
          Ads Settings
        </h1>

        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Ads Module Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/30 p-3">
                <div>
                  <Label className="text-sm font-semibold">Ads Module {settings.enabled ? "ON" : "OFF"}</Label>
                  <p className="text-xs text-muted-foreground">Turn the entire Ads earning feature on or off for all users.</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Daily Ads Limit</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.dailyLimit}
                    onChange={(event) => setSettings((prev) => ({ ...prev, dailyLimit: Number(event.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Maximum ads a user can watch per calendar day (does not change with pair count).</p>
                </div>

                <div className="space-y-2">
                  <Label>Welcome Ads Reward (PKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.welcomeRewardPkr}
                    onChange={(event) => setSettings((prev) => ({ ...prev, welcomeRewardPkr: Number(event.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Reward per ad during the one-time Welcome Ads window.</p>
                </div>

                <div className="space-y-2">
                  <Label>Welcome Ads Duration (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.welcomeDurationDays}
                    onChange={(event) => setSettings((prev) => ({ ...prev, welcomeDurationDays: Number(event.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">How many calendar days the Welcome Ads bonus lasts for a new account.</p>
                </div>

                <div className="space-y-2">
                  <Label>Pair Ads Reward (PKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.pairRewardPkr}
                    onChange={(event) => setSettings((prev) => ({ ...prev, pairRewardPkr: Number(event.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Reward per ad once a qualifying Binary Pair unlocks the Ads cycle.</p>
                </div>

                <div className="space-y-2">
                  <Label>Pair Ads Cycle (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={settings.pairCycleDays}
                    onChange={(event) => setSettings((prev) => ({ ...prev, pairCycleDays: Number(event.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">How many calendar days each Pair-unlocked Ads cycle lasts before a new qualifying pair is needed.</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Mobile card list */}
        <div className="space-y-3 md:hidden">
          {history.length === 0 ? (
            <Card className="nexo-card-glow border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">No Ads activity yet.</CardContent>
            </Card>
          ) : (
            history.map((row) => (
              <Card key={row.id} className="nexo-card-glow border-border/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">User ID: {row.userId}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.watchedDate}</p>
                    </div>
                    <Badge className={`shrink-0 ${getCycleBadge(row.cycleType)}`}>{row.cycleType || "n/a"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Reward</p>
                      <p className="font-medium text-foreground">PKR {Number(row.rewardPkr).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recorded At</p>
                      <p className="font-medium text-foreground">{row.createdAt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop table */}
        <Card className="nexo-card-glow border-border/50 hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg font-display">Ads History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Reward (PKR)</TableHead>
                    <TableHead>Cycle Type</TableHead>
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No Ads activity yet.</TableCell>
                    </TableRow>
                  ) : (
                    history.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.userId}</TableCell>
                        <TableCell>{row.watchedDate}</TableCell>
                        <TableCell>PKR {Number(row.rewardPkr).toLocaleString()}</TableCell>
                        <TableCell><Badge className={getCycleBadge(row.cycleType)}>{row.cycleType || "n/a"}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.createdAt}</TableCell>
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

export default AdsSettings;
