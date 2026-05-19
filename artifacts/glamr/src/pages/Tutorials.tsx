import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, GraduationCap, Search, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
  TUTORIALS,
  TUTORIAL_CATEGORIES,
  TUTORIAL_CATEGORY_LABELS,
  TUTORIAL_DIFFICULTIES,
  TUTORIAL_DIFFICULTY_LABELS,
  type Tutorial,
  type TutorialCategory,
  type TutorialDifficulty,
} from "@/lib/tutorials";

type CategoryFilter = "all" | TutorialCategory;
type DifficultyFilter = "all" | TutorialDifficulty;

const SORTS = ["top-rated", "most-reviewed", "quickest", "curated"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABELS: Record<Sort, string> = {
  "top-rated":     "Top rated",
  "most-reviewed": "Most reviewed",
  quickest:        "Quickest",
  curated:         "Curated",
};

interface TutorialStat {
  tutorialId: string;
  averageRating: number;
  reviewCount: number;
}

export default function Tutorials() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("top-rated");

  const { data } = useQuery({
    queryKey: ["tutorial-stats"],
    queryFn: () => api.get<{ stats: TutorialStat[] }>("/tutorials/stats"),
  });
  const statsById = useMemo(() => {
    const m = new Map<string, TutorialStat>();
    for (const s of data?.stats ?? []) m.set(s.tutorialId, s);
    return m;
  }, [data]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = TUTORIALS.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (needle && !`${t.title} ${t.summary} ${t.instructor}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const stat = (id: string) => statsById.get(id);
    if (sort === "top-rated") {
      // Bayesian-ish: anchor un-reviewed tutorials at ~3.5 so they don't
      // bubble unfairly above genuinely well-rated ones.
      const score = (id: string) => {
        const s = stat(id);
        if (!s || s.reviewCount === 0) return 3.5;
        return s.averageRating;
      };
      list = [...list].sort((a, b) => {
        const diff = score(b.id) - score(a.id);
        if (diff !== 0) return diff;
        return (stat(b.id)?.reviewCount ?? 0) - (stat(a.id)?.reviewCount ?? 0);
      });
    } else if (sort === "most-reviewed") {
      list = [...list].sort((a, b) => (stat(b.id)?.reviewCount ?? 0) - (stat(a.id)?.reviewCount ?? 0));
    } else if (sort === "quickest") {
      list = [...list].sort((a, b) => a.minutes - b.minutes);
    }
    return list;
  }, [category, difficulty, q, sort, statsById]);

  const totals = useMemo(() => ({
    count: TUTORIALS.length,
    categories: TUTORIAL_CATEGORIES.length,
    quickest: Math.min(...TUTORIALS.map((t) => t.minutes)),
  }), []);

  const resetAll = () => {
    setCategory("all");
    setDifficulty("all");
    setQ("");
    setSort("top-rated");
  };

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-3xl">Tutorials</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {totals.count} step-by-step beauty tutorials across {totals.categories} categories —
            from {totals.quickest}-minute everyday looks to advanced cut creases. Sorted by what the community rated best.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tutorials, instructors, or techniques…"
            className="pl-9"
            aria-label="Search tutorials"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <CategoryPill active={category === "all"} onClick={() => setCategory("all")}>
            All ({TUTORIALS.length})
          </CategoryPill>
          {TUTORIAL_CATEGORIES.map((c) => {
            const n = TUTORIALS.filter((t) => t.category === c).length;
            return (
              <CategoryPill key={c} active={category === c} onClick={() => setCategory(c)}>
                {TUTORIAL_CATEGORY_LABELS[c]} ({n})
              </CategoryPill>
            );
          })}
        </div>

        {/* Difficulty + sort row */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
            className="bg-background border border-input rounded-full h-9 px-3 text-xs font-medium"
            aria-label="Filter by difficulty"
          >
            <option value="all">All levels</option>
            {TUTORIAL_DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{TUTORIAL_DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 ml-auto flex-wrap">
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

        {visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No tutorials match those filters.</p>
            <Button size="sm" variant="ghost" className="mt-2" onClick={resetAll}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((t) => (
              <TutorialCard key={t.id} t={t} stat={statsById.get(t.id) ?? null} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TutorialCard({ t, stat }: { t: Tutorial; stat: TutorialStat | null }) {
  const [broken, setBroken] = useState(false);
  const hasReviews = stat && stat.reviewCount > 0;
  return (
    <Link
      href={`/tutorials/${t.id}`}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col"
    >
      <div className={`relative aspect-[4/3] w-full overflow-hidden ${broken ? "bg-gradient-to-br from-primary/30 to-accent/30" : "bg-muted"}`}>
        {!broken ? (
          <img
            src={t.thumbnail}
            alt={t.title}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[10px] font-semibold uppercase tracking-wider">
          {TUTORIAL_CATEGORY_LABELS[t.category]}
        </div>
        {hasReviews && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[11px] font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {stat!.averageRating.toFixed(1)}
            <span className="text-muted-foreground font-normal">({stat!.reviewCount})</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="font-semibold text-sm leading-tight">{t.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">by {t.instructor}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-snug flex-1">{t.summary}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t.minutes} min
          </span>
          <span className="capitalize">{TUTORIAL_DIFFICULTY_LABELS[t.difficulty]}</span>
        </div>
      </div>
    </Link>
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
