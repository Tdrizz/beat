import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { AuthedRoute } from "@/components/AuthedRoute";
import { api, type Product } from "@/lib/api";

interface Stats {
  totalClicks: number;
  totalEstCents: number;
  byProduct: Array<{ productId: string; c: number; product: Product | null; estCommissionCents: number }>;
}

function StatsInner() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["affiliate-stats"],
    queryFn: () => api.get<Stats>("/affiliate/me/stats"),
  });
  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
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
              </div>
            </div>
            <div className="space-y-2">
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
