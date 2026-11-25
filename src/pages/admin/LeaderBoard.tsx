import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Medal, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Leader = {
  userId: number;
  userName: string;
  profilePic: string;
  currentIncome: number;
};

const rankStyles = [
  { label: "Top Leader", icon: Crown, ring: "border-amber-300 bg-amber-50 text-amber-600", badge: "bg-amber-500 text-white" },
  { label: "2nd Leader", icon: Trophy, ring: "border-sky-300 bg-sky-50 text-sky-600", badge: "bg-sky-500 text-white" },
  { label: "3rd Leader", icon: Medal, ring: "border-violet-300 bg-violet-50 text-violet-600", badge: "bg-violet-500 text-white" },
];

const defaultRankStyle = { label: "Leader", icon: Medal, ring: "border-slate-300 bg-slate-50 text-slate-600", badge: "bg-slate-500 text-white" };

const formatPkr = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;

const LeaderBoard = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/accounts/leaderboard/")
      .then(setLeaders)
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Leader Board</h1>
          <p className="text-sm text-muted-foreground">Top 10 users ranked by current income, pulled from live system records.</p>
        </div>

        {loading ? (
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading leaders...</CardContent>
          </Card>
        ) : leaders.length === 0 ? (
          <Card className="nexo-card-glow border-border/50">
            <CardContent className="p-6 text-sm text-muted-foreground">No leaders with current income yet.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {leaders.map((leader, index) => {
              const style = rankStyles[index] || defaultRankStyle;
              const RankIcon = style.icon;
              const avatarLetter = (leader.userName || "U").trim().charAt(0).toUpperCase();
              return (
                <Card key={leader.userId} className="nexo-card-glow border-border/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4", style.ring)}>
                      <div className="flex h-full w-full overflow-hidden rounded-full bg-white">
                        {leader.profilePic ? (
                          <img src={leader.profilePic} alt={leader.userName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="m-auto font-display text-lg font-semibold">{avatarLetter}</span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", style.badge)}>
                          <RankIcon className="h-3.5 w-3.5" />
                          #{index + 1}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{style.label}</span>
                      </div>
                      <h2 className="mt-1 truncate font-display text-lg font-semibold text-foreground">{leader.userName || "User"}</h2>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-muted/50 px-4 py-2 text-right">
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Current Income</p>
                      <p className="font-display text-base font-semibold text-foreground">{formatPkr(leader.currentIncome)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeaderBoard;
