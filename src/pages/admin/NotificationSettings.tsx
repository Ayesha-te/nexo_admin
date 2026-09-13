import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save, Search, Send } from "lucide-react";
import { api } from "@/lib/api";

type NotifType = {
  id: number;
  notifType: string;
  enabled: boolean;
  titleTemplate: string;
  messageTemplate: string;
};

type NotifLog = {
  id: number;
  notifType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  [key: string]: unknown;
};

const readableType = (value: string) =>
  value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const NotificationSettings = () => {
  const { toast } = useToast();

  // Section 1: Notification Types
  const [types, setTypes] = useState<NotifType[]>([]);
  const [savingTypes, setSavingTypes] = useState(false);

  // Section 2: Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetMode, setTargetMode] = useState<"all" | "selected">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  // Section 3: Log
  const [log, setLog] = useState<NotifLog[]>([]);

  useEffect(() => {
    api("/api/notifications/admin/types/")
      .then((data) => setTypes(Array.isArray(data) ? data : []))
      .catch(() => setTypes([]));
    api("/api/notifications/admin/log/")
      .then((data) => setLog(Array.isArray(data) ? data : []))
      .catch(() => setLog([]));
  }, []);

  useEffect(() => {
    if (targetMode !== "selected" || usersLoaded) return;
    api("/api/accounts/admin/users/")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoaded(true));
  }, [targetMode, usersLoaded]);

  const updateType = (id: number, field: keyof NotifType, value: string | boolean) => {
    setTypes((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const saveTypes = async () => {
    setSavingTypes(true);
    try {
      const payload = types.map(({ id, enabled, titleTemplate, messageTemplate }) => ({
        id,
        enabled,
        titleTemplate,
        messageTemplate,
      }));
      const updated = await api("/api/notifications/admin/types/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTypes(Array.isArray(updated) ? updated : []);
      toast({ title: "Settings Saved", description: "Notification types were updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save notification types", variant: "destructive" });
    } finally {
      setSavingTypes(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.firstName, user.lastName, user.email, user.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [users, userSearch]);

  const toggleUserSelected = (id: number, checked: boolean) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const resetBroadcastForm = () => {
    setBroadcastTitle("");
    setBroadcastMessage("");
    setTargetMode("all");
    setSelectedUserIds(new Set());
  };

  const sendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({ title: "Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (targetMode === "selected" && selectedUserIds.size === 0) {
      toast({ title: "Error", description: "Select at least one user.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const result = await api("/api/notifications/admin/broadcast/", {
        method: "POST",
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          userIds: targetMode === "all" ? "all" : Array.from(selectedUserIds),
        }),
      });
      toast({ title: "Broadcast Sent", description: `Notification sent to ${result?.sent ?? 0} user(s).` });
      resetBroadcastForm();
      const refreshed = await api("/api/notifications/admin/log/").catch(() => null);
      if (Array.isArray(refreshed)) setLog(refreshed);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send broadcast", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const displayedLog = log.slice(0, 200);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <Bell className="h-6 w-6 text-primary" />
          Notification Settings
        </h1>

        {/* Section 1: Notification Types */}
        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Notification Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {types.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No notification types found.</p>
            ) : (
              types.map((item) => (
                <div key={item.id} className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{readableType(item.notifType)}</p>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(checked) => updateType(item.id, "enabled", checked)}
                    />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2 min-w-0">
                      <Label>Title Template</Label>
                      <Input
                        value={item.titleTemplate}
                        onChange={(event) => updateType(item.id, "titleTemplate", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label>Message Template</Label>
                      <Textarea
                        value={item.messageTemplate}
                        onChange={(event) => updateType(item.id, "messageTemplate", event.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Placeholders like {"{start_date}"} / {"{end_date}"} are supported for cycle-related types.
                  </p>
                </div>
              ))
            )}
            <div className="flex justify-end">
              <Button onClick={saveTypes} disabled={savingTypes} className="gap-2">
                <Save className="h-4 w-4" />
                {savingTypes ? "Saving..." : "Save All"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Broadcast a Notification */}
        <Card className="nexo-card-glow border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-display">Broadcast a Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={broadcastTitle} onChange={(event) => setBroadcastTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={broadcastMessage}
                onChange={(event) => setBroadcastMessage(event.target.value)}
                className="min-h-[96px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Target</Label>
              <RadioGroup
                value={targetMode}
                onValueChange={(value) => setTargetMode(value as "all" | "selected")}
                className="flex flex-col gap-2 sm:flex-row sm:gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="target-all" />
                  <Label htmlFor="target-all" className="cursor-pointer font-normal">All Users</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="selected" id="target-selected" />
                  <Label htmlFor="target-selected" className="cursor-pointer font-normal">Selected Users</Label>
                </div>
              </RadioGroup>
            </div>

            {targetMode === "selected" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="pl-10"
                  />
                </div>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border/50 p-2">
                  {filteredUsers.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No users found.</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        htmlFor={`user-${user.id}`}
                        className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/40"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUserIds.has(user.id)}
                          onCheckedChange={(checked) => toggleUserSelected(user.id, Boolean(checked))}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{selectedUserIds.size} user(s) selected</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={sendBroadcast} disabled={sending} className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Sent Notifications Log */}
        <div className="space-y-3 md:hidden">
          {displayedLog.length === 0 ? (
            <Card className="nexo-card-glow border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">No notifications sent yet.</CardContent>
            </Card>
          ) : (
            displayedLog.map((item) => (
              <Card key={item.id} className="nexo-card-glow border-border/50">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{readableType(item.notifType)}</p>
                    </div>
                    <Badge
                      className={
                        item.isRead
                          ? "shrink-0 bg-primary/10 text-primary border-primary/20"
                          : "shrink-0 bg-secondary/10 text-secondary border-secondary/20"
                      }
                    >
                      {item.isRead ? "Read" : "Unread"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.createdAt}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="nexo-card-glow border-border/50 hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg font-display">Sent Notifications Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No notifications sent yet.</TableCell>
                    </TableRow>
                  ) : (
                    displayedLog.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{readableType(item.notifType)}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.isRead
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-secondary/10 text-secondary border-secondary/20"
                            }
                          >
                            {item.isRead ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.createdAt}</TableCell>
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

export default NotificationSettings;
