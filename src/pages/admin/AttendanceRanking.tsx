import { useEffect, useMemo, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { api } from "@/lib/api";

type RankingEntry = {
  userId: number;
  userName: string;
  email: string;
  presentDays: number;
};

type RankingData = {
  month: string;
  tiers: {
    "27+": RankingEntry[];
    "25-26": RankingEntry[];
    "20-24": RankingEntry[];
  };
  summary: {
    "20+": number;
    "25+": number;
    "27+": number;
  };
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

const TIER_SECTIONS: { key: "27+" | "25-26" | "20-24"; label: string; emoji: string }[] = [
  { key: "27+", label: "Super Achiever (27+ Days)", emoji: "🟣" },
  { key: "25-26", label: "Top Achiever (25-26 Days)", emoji: "🔵" },
  { key: "20-24", label: "Regular Achiever (20-24 Days)", emoji: "🟢" },
];

const AttendanceRanking = () => {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<RankingData | null>(null);

  const load = useCallback(async (m: string) => {
    try {
      const result = await api(`/api/attendance/admin/ranking/?month=${m}`);
      setData(result);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const summary = data?.summary || { "20+": 0, "25+": 0, "27+": 0 };

  const statCards = useMemo(
    () => [
      { title: "20+ Attendance Users", value: summary["20+"] || 0, icon: Star, gradient: "from-emerald-500 to-teal-500" },
      { title: "25+ Attendance Users", value: summary["25+"] || 0, icon: Medal, gradient: "from-sky-500 to-cyan-500" },
      { title: "27+ Attendance Users", value: summary["27+"] || 0, icon: Award, gradient: "from-primary to-secondary" },
    ],
    [summary],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Monthly Attendance Ranking
          </h1>
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="sm:max-w-[200px]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title} className="nexo-card-glow border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {TIER_SECTIONS.map((tier) => {
            const entries = data?.tiers?.[tier.key] || [];
            return (
              <Card key={tier.key} className="nexo-card-glow border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    {tier.emoji} {tier.label}
                  </h3>
                  {entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users in this category yet.</p>
                  ) : (
                    <ol className="space-y-2">
                      {entries.map((entry, index) => (
                        <li
                          key={entry.userId}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-sm"
                        >
                          <span className="min-w-0 truncate text-foreground">
                            {index + 1}. {entry.userName}
                          </span>
                          <span className="shrink-0 font-semibold text-foreground">{entry.presentDays} Days</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceRanking;
