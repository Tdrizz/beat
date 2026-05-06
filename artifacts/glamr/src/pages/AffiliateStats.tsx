import { useQuery } from "@tanstack/react-query";
import { AuthedRoute } from "@/components/AuthedRoute";
import { api, type AffiliateStatsResponse } from "@/lib/api";
import { TrendingUp } from "lucide-react";

function Sparkline({ series, days }: { series: AffiliateStatsResponse["series"]; days: number }) {
  // Build a dense day-by-day array so the line never has gaps.
  const map = new Map(series.map((s) => [s.day, s.c]));
  const today = new Date();
  const points: { day: string; c: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    points.push({ day: key, c: map.get(key) ?? 0 });
  }
  const max = Math.max(1, ...points.map((p) => p.c));
  const W = 280;
  const H = 60;
  const stepX = W / Math.max(1, points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${(H - (p.c / max) * (H - 6) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
      <path d={path} fill="none" stroke="hsl(340 70% 55%)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatsInner() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: () => api.get<AffiliateStatsResponse>("/affiliate/me/stats?days=30"),
  });
  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-serif text-3xl">Affiliate dashboard</h1>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">Clicks (30d)</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalClicks ?? 0}</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground">Est. earnings (30d)</p>
                <p className="text-3xl font-bold text-primary">${((stats?.totalEstCents ?? 0) / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Assumes {Math.round((stats?.estConversionRate ?? 0.05) * 100)}% click → buy.
                  Real payouts arrive via brand postbacks.
                </p>
              </div>
            </div>

            {stats && stats.series.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Daily clicks
                  </p>
                </div>
                <Sparkline series={stats.series} days={stats.days} />
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground px-1">Top products</h2>
              {stats?.byProduct.map((row) => (
                <div key={row.productId} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-full" style={{ backgroundColor: row.product?.color ?? "#888" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{row.product?.name ?? row.productId}</p>
                    <p className="text-xs text-muted-foreground">{row.c} clicks · est. ${(row.estCommissionCents / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {stats && stats.byProduct.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No clicks yet — share posts with product tags to start earning.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function AffiliateStats() {
  return (
    <AuthedRoute>
      <StatsInner />
    </AuthedRoute>
  );
}
