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
import { BarChart3, MonitorPlay, Save, Trash2, Upload, Users, Video, Wallet } from "lucide-react";
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

type AdVideo = {
  id: number;
  title: string | null;
  videoUrl: string | null;
  durationSeconds: number;
  isActive: boolean;
  createdAt: string;
};

type PayoutStats = {
  totalPayout: number;
  adsCompleted: number;
  usersCount: number;
};

type DailyPayout = PayoutStats & { date: string };
type MonthlyPayout = PayoutStats & { month: string };

const defaultSettings: AdsSettingsData = {
  enabled: true,
  dailyLimit: 3,
  welcomeRewardPkr: 11,
  welcomeDurationDays: 3,
  pairRewardPkr: 5,
  pairCycleDays: 3,
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const currentMonthIso = () => new Date().toISOString().slice(0, 7);

const AdsSettings = () => {
  const [settings, setSettings] = useState<AdsSettingsData>(defaultSettings);
  const [history, setHistory] = useState<AdsHistoryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Ad videos state
  const [videos, setVideos] = useState<AdVideo[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDuration, setUploadDuration] = useState("15");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Payout report state
  const [dailyDate, setDailyDate] = useState(todayIso());
  const [monthlyMonth, setMonthlyMonth] = useState(currentMonthIso());
  const [dailyPayout, setDailyPayout] = useState<DailyPayout | null>(null);
  const [monthlyPayout, setMonthlyPayout] = useState<MonthlyPayout | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const loadVideos = () => {
    api("/api/ads/admin/videos/").then(setVideos).catch(() => setVideos([]));
  };

  const loadDailyPayout = (date?: string) => {
    setLoadingDaily(true);
    const query = date ? `?date=${date}` : "";
    api(`/api/ads/admin/payout/daily/${query}`)
      .then(setDailyPayout)
      .catch(() => setDailyPayout(null))
      .finally(() => setLoadingDaily(false));
  };

  const loadMonthlyPayout = (month?: string) => {
    setLoadingMonthly(true);
    const query = month ? `?month=${month}` : "";
    api(`/api/ads/admin/payout/monthly/${query}`)
      .then(setMonthlyPayout)
      .catch(() => setMonthlyPayout(null))
      .finally(() => setLoadingMonthly(false));
  };

  useEffect(() => {
    api("/api/ads/admin/settings/").then(setSettings).catch(() => setSettings(defaultSettings));
    api("/api/ads/admin/history/").then(setHistory).catch(() => setHistory([]));
    loadVideos();
    loadDailyPayout();
    loadMonthlyPayout();
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

  const uploadVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    const duration = Number(uploadDuration);
    if (!uploadFile) {
      toast({ title: "Error", description: "Please select a video file to upload.", variant: "destructive" });
      return;
    }
    if (!duration || duration < 15 || duration > 60) {
      toast({ title: "Error", description: "Video duration must be between 15 and 60 seconds.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("video", uploadFile);
      formData.append("title", uploadTitle || "");
      formData.append("durationSeconds", String(duration));
      formData.append("isActive", "true");

      await api("/api/ads/admin/videos/", { method: "POST", body: formData });
      loadVideos();
      setUploadTitle("");
      setUploadDuration("15");
      setUploadFile(null);
      setFileInputKey((key) => key + 1);
      toast({ title: "Video Uploaded", description: "The ad video was uploaded successfully." });
    } catch (error: any) {
      const data = error?.data;
      let message = error?.message || "Failed to upload video.";
      if (data && typeof data === "object" && !data.detail) {
        const firstField = Object.keys(data)[0];
        if (firstField) {
          const value = data[firstField];
          message = Array.isArray(value) ? value[0] : String(value);
        }
      } else if (data?.detail) {
        message = data.detail;
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleVideoActive = async (video: AdVideo, checked: boolean) => {
    setVideos((prev) => prev.map((item) => (item.id === video.id ? { ...item, isActive: checked } : item)));
    try {
      const formData = new FormData();
      formData.append("isActive", String(checked));
      const updated = await api(`/api/ads/admin/videos/${video.id}/`, { method: "PATCH", body: formData });
      setVideos((prev) => prev.map((item) => (item.id === video.id ? updated : item)));
    } catch (error: any) {
      setVideos((prev) => prev.map((item) => (item.id === video.id ? { ...item, isActive: !checked } : item)));
      toast({ title: "Error", description: error?.message || "Failed to update video status.", variant: "destructive" });
    }
  };

  const deleteVideo = async (video: AdVideo) => {
    if (!window.confirm(`Are you sure you want to delete "${video.title || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await api(`/api/ads/admin/videos/${video.id}/`, { method: "DELETE" });
      setVideos((prev) => prev.filter((item) => item.id !== video.id));
      toast({ title: "Video Deleted", description: "The ad video was removed." });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to delete video.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <MonitorPlay className="w-6 h-6 text-primary" />
          Ads Settings
        </h1>

        {/* Ads Payout Report */}
        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Ads Payout Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Daily */}
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-foreground">Today's Ads Payout</p>
                  <Input
                    type="date"
                    className="h-8 w-auto"
                    value={dailyDate}
                    onChange={(event) => {
                      setDailyDate(event.target.value);
                      loadDailyPayout(event.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Payout</p>
                      <p className="truncate font-semibold text-foreground">
                        {loadingDaily ? "..." : `PKR ${Number(dailyPayout?.totalPayout ?? 0).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shrink-0">
                      <Video className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Ads Watched</p>
                      <p className="truncate font-semibold text-foreground">{loadingDaily ? "..." : dailyPayout?.adsCompleted ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="truncate font-semibold text-foreground">{loadingDaily ? "..." : dailyPayout?.usersCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly */}
              <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-foreground">This Month's Ads Payout</p>
                  <Input
                    type="month"
                    className="h-8 w-auto"
                    value={monthlyMonth}
                    onChange={(event) => {
                      setMonthlyMonth(event.target.value);
                      loadMonthlyPayout(event.target.value);
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Payout</p>
                      <p className="truncate font-semibold text-foreground">
                        {loadingMonthly ? "..." : `PKR ${Number(monthlyPayout?.totalPayout ?? 0).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shrink-0">
                      <Video className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Ads Watched</p>
                      <p className="truncate font-semibold text-foreground">{loadingMonthly ? "..." : monthlyPayout?.adsCompleted ?? 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background/60 p-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="truncate font-semibold text-foreground">{loadingMonthly ? "..." : monthlyPayout?.usersCount ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Ad Videos */}
        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Ad Videos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={uploadVideo} className="space-y-4 rounded-md border border-border/50 bg-muted/30 p-3">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    placeholder="e.g. Welcome Bonus Ad"
                    value={uploadTitle}
                    onChange={(event) => setUploadTitle(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="60"
                    value={uploadDuration}
                    onChange={(event) => setUploadDuration(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Must be between 15 and 60 seconds.</p>
                </div>
                <div className="space-y-2">
                  <Label>Video File</Label>
                  <Input
                    key={fileInputKey}
                    type="file"
                    accept="video/*"
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={uploading} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>

            {/* Mobile card list */}
            <div className="space-y-3 md:hidden">
              {videos.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No ad videos uploaded yet.</p>
              ) : (
                videos.map((video) => (
                  <Card key={video.id} className="nexo-card-glow border-border/50">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{video.title || "Untitled"}</p>
                          <p className="truncate text-xs text-muted-foreground">{video.durationSeconds}s &middot; {video.createdAt}</p>
                        </div>
                        <Switch checked={video.isActive} onCheckedChange={(checked) => toggleVideoActive(video, checked)} />
                      </div>
                      {video.videoUrl ? (
                        <video src={video.videoUrl} controls className="h-24 w-40 rounded-md object-cover" />
                      ) : (
                        <p className="text-xs text-muted-foreground">No preview available.</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteVideo(video)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="w-full max-w-full overflow-x-auto">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No ad videos uploaded yet.</TableCell>
                      </TableRow>
                    ) : (
                      videos.map((video) => (
                        <TableRow key={video.id}>
                          <TableCell>
                            {video.videoUrl ? (
                              <video src={video.videoUrl} controls className="h-24 w-40 rounded-md object-cover" />
                            ) : (
                              <span className="text-sm text-muted-foreground">No preview</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{video.title || "Untitled"}</TableCell>
                          <TableCell>{video.durationSeconds}s</TableCell>
                          <TableCell>
                            <Switch checked={video.isActive} onCheckedChange={(checked) => toggleVideoActive(video, checked)} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{video.createdAt}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/30 text-destructive hover:bg-destructive/10"
                              onClick={() => deleteVideo(video)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
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
