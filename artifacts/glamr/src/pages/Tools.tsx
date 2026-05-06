import { useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Brush } from "lucide-react";
import {
  TOOLS,
  TOOL_CATEGORIES,
  TOOL_CATEGORY_LABELS,
  TOOL_BRANDS,
  formatPrice,
  type ToolCategory,
} from "@/lib/tools";

type Filter = "all" | ToolCategory;
type BrandFilter = "all" | (typeof TOOL_BRANDS)[number];

const DEFAULT_SORT: Sort = "popular";

const SORTS = ["popular", "price-asc", "price-desc"] as const;
type Sort = typeof SORTS[number];
const SORT_LABELS: Record<Sort, string> = {
  popular:    "Curated",
  "price-asc":  "Price ↑",
  "price-desc": "Price ↓",
};

export default function Tools() {
  const [filter, setFilter] = useState<Filter>("all");
  const [brand, setBrand] = useState<BrandFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const resetAll = () => {
    setFilter("all");
    setBrand("all");
    setQ("");
    setSort(DEFAULT_SORT);
  };

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = TOOLS.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (brand !== "all" && t.brand !== brand) return false;
      if (needle && !`${t.brand} ${t.name} ${t.use}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    if (sort === "price-asc")  list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    return list;
  }, [filter, brand, q, sort]);

  // Quick stats line under the title — gives the page a sense of scope
  // even before the user filters anything.
  const totals = useMemo(() => ({
    count: TOOLS.length,
    brands: TOOL_BRANDS.length,
    cheapest: Math.min(...TOOLS.map((t) => t.priceCents)),
    priciest: Math.max(...TOOLS.map((t) => t.priceCents)),
  }), []);

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Brush className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-3xl">Brushes & tools</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totals.count} hand-picked tools from {totals.brands} brands —
            from {formatPrice(totals.cheapest)} drugstore staples to{" "}
            {formatPrice(totals.priciest)} pro devices. Prices are USD MSRP
            and may vary by retailer.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools, brands, or use…"
            className="pl-9"
          />
        </div>

        {/* Category pills — horizontal scroll on phones, wraps on desktop. */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <CategoryPill active={filter === "all"} onClick={() => setFilter("all")}>
            All ({TOOLS.length})
          </CategoryPill>
          {TOOL_CATEGORIES.map((c) => {
            const n = TOOLS.filter((t) => t.category === c).length;
            return (
              <CategoryPill key={c} active={filter === c} onClick={() => setFilter(c)}>
                {TOOL_CATEGORY_LABELS[c]} ({n})
              </CategoryPill>
            );
          })}
        </div>

        {/* Brand + sort row. */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value as BrandFilter)}
            className="bg-background border border-input rounded-full h-9 px-3 text-xs font-medium"
            aria-label="Filter by brand"
          >
            <option value="all">All brands</option>
            {TOOL_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 ml-auto">
            {SORTS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sort === s ? "default" : "outline"}
                className="rounded-full text-xs h-8"
                onClick={() => setSort(s)}
              >
                {SORT_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No tools match those filters.</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={resetAll}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((t) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${t.brand} — ${t.name}, ${formatPrice(t.priceCents, t.currency)}`}
                className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br ${t.swatch} shadow-sm`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{t.brand}</p>
                    <p className="font-semibold text-sm leading-tight">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                      {TOOL_CATEGORY_LABELS[t.category]}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-snug flex-1">{t.use}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                  <span className="text-base font-bold text-primary">{formatPrice(t.priceCents, t.currency)}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
                    Visit brand <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryPill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full text-xs font-semibold px-3 py-1.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
