import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  byEraLooks, celebrityLooks, trendLooks,
  allEyeLooks, allLipLooks, allCompleteLooks, Look
} from "../lib/looks";
import { brands, Brand } from "../lib/brands";
import { palettes, Palette } from "../lib/palettes";
import { getDailyBeat, SEASON_THEME } from "../lib/dailyBeat";
import { useFavorites } from "../hooks/useFavorites";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Camera, Eye, Smile, Layers, Search, X,
  Heart, TrendingUp, ScanFace, Clock, ChevronRight, CalendarDays,
  Crown, Palette as PaletteIcon, ExternalLink
} from "lucide-react";

type Difficulty = "All" | "Beginner" | "Intermediate" | "Advanced";

// ── Daily Beat Card ───────────────────────────────────────────────────────────

function DailyBeatCard() {
  const ALL = useMemo(() => [
    ...allCompleteLooks, ...allEyeLooks, ...allLipLooks
  ], []);

  const beat = useMemo(() => getDailyBeat(ALL), [ALL]);
  if (!beat.look) return null;

  const theme = SEASON_THEME[beat.season];
  const look = beat.look;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="max-w-2xl mx-auto px-6 mb-8"
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl"
        style={{ background: theme.gradient }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-2xl"
          style={{ background: look.palette[1] }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15 blur-2xl"
          style={{ background: look.palette[2] }} />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-3.5 h-3.5 opacity-60" style={{ color: theme.badgeText }} />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-60"
                  style={{ color: theme.badgeText }}>
                  {beat.dateLabel}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight"
                style={{ color: theme.badgeText }}>
                {beat.dayMessage.greeting}
              </h2>
              <p className="text-sm mt-0.5 opacity-70 max-w-xs leading-relaxed"
                style={{ color: theme.badgeText }}>
                {beat.dayMessage.sub}
              </p>
            </div>
            <span className="shrink-0 text-3xl sm:text-4xl select-none" role="img" aria-label={beat.season}>
              {theme.emoji}
            </span>
          </div>

          <div className="h-px mb-4 opacity-20" style={{ background: theme.badgeText }} />

          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1 shrink-0 mt-0.5">
              {look.palette.map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white/40 shadow-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: theme.badge, color: theme.badgeText }}>
                  Today's Beat
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full opacity-70 border" style={{ borderColor: theme.badgeText + "40", color: theme.badgeText }}>
                  {look.difficulty}
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight mb-0.5" style={{ color: theme.badgeText }}>
                {look.name}
              </h3>
              <p className="italic text-sm opacity-60 mb-1" style={{ color: theme.badgeText }}>{look.mood}</p>
              <div className="flex items-center gap-1 opacity-55 mb-3">
                <Clock className="w-3 h-3" style={{ color: theme.badgeText }} />
                <span className="text-xs" style={{ color: theme.badgeText }}>{look.timeEstimate}</span>
              </div>
              <p className="text-sm italic leading-relaxed opacity-75 mb-4" style={{ color: theme.badgeText }}>
                "{beat.quote}"
              </p>
              <div className="flex gap-2">
                <Link href={`/try-on/${look.id}`}>
                  <Button size="sm" className="gap-1.5 rounded-full shadow-md font-semibold" style={{ background: theme.badgeText, color: "#fff" }}>
                    <Camera className="w-3.5 h-3.5" />Try It Now
                  </Button>
                </Link>
                <Link href={`/looks/${look.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 rounded-full" style={{ color: theme.badgeText }}>
                    See Details <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Look card ─────────────────────────────────────────────────────────────────

function LookCard({ look, index, isFav, onToggleFav }: {
  look: Look; index: number; isFav: boolean; onToggleFav: (id: string) => void;
}) {
  const gradStyle = {
    background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)`,
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.35) }}
      layout
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="h-32 w-full relative" style={gradStyle}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all duration-500" />
          <button
            onClick={e => { e.preventDefault(); onToggleFav(look.id); }}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all"
          >
            <Heart className={`w-3.5 h-3.5 transition-all duration-200 ${isFav ? "fill-rose-400 text-rose-400 scale-110" : "text-white"}`} />
          </button>
          <div className="absolute bottom-2 left-2 flex gap-1.5">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-md text-white border-none text-xs">{look.difficulty}</Badge>
            <Badge variant="outline" className="bg-black/50 backdrop-blur-md text-white border-white/20 text-xs">{look.timeEstimate}</Badge>
          </div>
        </div>
        <CardHeader className="pb-2 flex-grow">
          <CardTitle className="font-serif text-lg text-foreground leading-snug">{look.name}</CardTitle>
          <CardDescription className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{look.era || look.celebrity}</span>
            <span className="italic text-primary/80 text-xs">{look.mood}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link href={`/looks/${look.id}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">See More</Button>
          </Link>
          <Link href={`/try-on/${look.id}`} className="w-full">
            <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Camera className="w-3 h-3 mr-1.5" />Try Now
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ── Brand card ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Luxury:    { bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-300" },
  Prestige:  { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  "Mid-Range": { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300" },
  Indie:     { bg: "bg-green-100 dark:bg-green-900/30",   text: "text-green-700 dark:text-green-300" },
  Drugstore: { bg: "bg-zinc-100 dark:bg-zinc-800/50",     text: "text-zinc-600 dark:text-zinc-300" },
};

function BrandCard({ brand, index }: { brand: Brand; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_COLORS[brand.tier] ?? TIER_COLORS.Prestige;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
        {/* Palette strip */}
        <div className="h-3 w-full flex">
          {brand.palette.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>
                  {brand.tier}
                </span>
                <span className="text-xs text-muted-foreground">{brand.heritage} · {brand.founded}</span>
              </div>
              <CardTitle className="font-serif text-xl">{brand.name}</CardTitle>
              <p className="text-sm text-muted-foreground italic mt-0.5">{brand.tagline}</p>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{brand.vibe}</p>

          {/* Hero products */}
          <div className="space-y-2">
            {brand.heroProducts.slice(0, expanded ? undefined : 2).map(prod => (
              <div key={prod.name} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40">
                <div className="w-7 h-7 rounded-full shrink-0 border-2 border-background shadow-sm mt-0.5" style={{ backgroundColor: prod.hex }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{prod.name}</p>
                    <span className="text-xs text-primary font-bold shrink-0">{prod.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{prod.type}</p>
                  {expanded && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{prod.description}</p>}
                </div>
              </div>
            ))}
          </div>

          {brand.heroProducts.length > 2 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-primary mt-2 hover:underline"
            >
              {expanded ? "Show less" : `+${brand.heroProducts.length - 2} more products`}
            </button>
          )}
        </div>

        {expanded && (
          <div className="px-6 pb-3">
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs font-semibold text-primary mb-1">Signature Look</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{brand.signatureLook}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Inclusivity: </span>{brand.inclusivity}
            </p>
          </div>
        )}

        <CardFooter className="pt-0 pb-4 px-6 mt-auto flex gap-2">
          {brand.matchedLookId && (
            <Link href={`/try-on/${brand.matchedLookId}`} className="flex-1">
              <Button size="sm" className="w-full gap-1.5 text-xs">
                <Camera className="w-3 h-3" />Try Signature Look
              </Button>
            </Link>
          )}
          <Button
            size="sm" variant="outline"
            className="shrink-0 gap-1 text-xs"
            onClick={() => setExpanded(e => !e)}
          >
            <ExternalLink className="w-3 h-3" />
            {expanded ? "Less" : "More"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ── Palette card ──────────────────────────────────────────────────────────────

function PaletteCard({ palette, index }: { palette: Palette; index: number }) {
  const rows = [palette.colors.slice(0, Math.ceil(palette.colors.length / 2)), palette.colors.slice(Math.ceil(palette.colors.length / 2))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
        {/* Shade grid */}
        <div className="w-full p-3 bg-zinc-900/5 dark:bg-zinc-100/5">
          <div className="space-y-1">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((c, ci) => (
                  <div
                    key={ci}
                    className="flex-1 rounded-sm shadow-inner"
                    style={{ backgroundColor: c, height: "28px" }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{palette.brand}</p>
              <CardTitle className="font-serif text-lg leading-snug">{palette.name}</CardTitle>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-bold text-primary">{palette.price}</p>
              <p className="text-xs text-muted-foreground">{palette.shades} shades</p>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-2 flex-1">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{palette.description}</p>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">{palette.finish}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {palette.tags.map(tag => (
              <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <CardFooter className="px-6 pb-4 pt-2">
          {palette.matchedLookId ? (
            <Link href={`/try-on/${palette.matchedLookId}`} className="w-full">
              <Button size="sm" className="w-full gap-1.5 text-xs">
                <Camera className="w-3 h-3" />Try Similar Look in AR
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="w-full text-xs" disabled>
              Coming Soon
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, unit = "look" }: { icon: React.ReactNode; title: string; count: number; unit?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="text-primary">{icon}</div>
      <div>
        <h2 className="font-serif text-2xl text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{count} {unit}{count !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

function LookGrid({ looks, isFav, onToggleFav, emptyMsg }: {
  looks: Look[]; isFav: (id: string) => boolean;
  onToggleFav: (id: string) => void; emptyMsg?: string;
}) {
  if (looks.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
        <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-serif">{emptyMsg || "No looks found."}</p>
      </motion.div>
    );
  }
  return (
    <AnimatePresence mode="popLayout">
      {looks.map((look, i) => (
        <LookCard key={look.id} look={look} index={i} isFav={isFav(look.id)} onToggleFav={onToggleFav} />
      ))}
    </AnimatePresence>
  );
}

function EmptyFavorites() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-lg font-serif text-foreground">No saved looks yet</p>
      <p className="text-sm text-muted-foreground mt-1">Tap the heart on any look to save it here.</p>
    </motion.div>
  );
}

// ── Brand search filter ───────────────────────────────────────────────────────

const TIERS = ["All", "Luxury", "Prestige", "Mid-Range", "Indie", "Drugstore"] as const;
type TierFilter = typeof TIERS[number];

// ── Home page ─────────────────────────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ["All", "Beginner", "Intermediate", "Advanced"];
const EVERY_LOOK = [...allCompleteLooks, ...allEyeLooks, ...allLipLooks];

export default function Home() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");
  const [brandQuery, setBrandQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("All");
  const [paletteQuery, setPaletteQuery] = useState("");
  const { favorites, toggle, isFavorite } = useFavorites();

  const filter = (source: Look[]) => source.filter(l => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || [l.name, l.mood, l.era ?? "", l.celebrity ?? ""].some(s => s.toLowerCase().includes(q));
    const matchD = difficulty === "All" || l.difficulty === difficulty;
    return matchQ && matchD;
  });

  const filtered = useMemo(() => ({
    all: filter(allCompleteLooks),
    era: filter(byEraLooks),
    celebrity: filter(celebrityLooks),
    trending: filter(trendLooks),
    eyes: filter(allEyeLooks),
    lips: filter(allLipLooks),
    saved: filter(EVERY_LOOK.filter(l => favorites.has(l.id))),
  }), [query, difficulty, favorites]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return brands.filter(b => {
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.vibe.toLowerCase().includes(q) || b.aesthetic.toLowerCase().includes(q);
      const matchT = tierFilter === "All" || b.tier === tierFilter;
      return matchQ && matchT;
    });
  }, [brandQuery, tierFilter]);

  const filteredPalettes = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    return palettes.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.vibe.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [paletteQuery]);

  const lookTabs = [
    { id: "all",       label: "All Looks",  icon: <Layers className="w-3.5 h-3.5" />,     title: "Complete Makeup Styles", looks: filtered.all },
    { id: "trending",  label: "Trending",   icon: <TrendingUp className="w-3.5 h-3.5" />, title: "Trending Styles",        looks: filtered.trending },
    { id: "era",       label: "By Era",     icon: null,                                    title: "By Era",                 looks: filtered.era },
    { id: "celebrity", label: "Celebrity",  icon: null,                                    title: "Celebrity Icons",        looks: filtered.celebrity },
    { id: "eyes",      label: "Eyes",       icon: <Eye className="w-3.5 h-3.5" />,        title: "Eye Styles",             looks: filtered.eyes },
    { id: "lips",      label: "Lips",       icon: <Smile className="w-3.5 h-3.5" />,      title: "Lip Styles",             looks: filtered.lips },
    { id: "saved",     label: "Saved",      icon: <Heart className="w-3.5 h-3.5" />,      title: "Saved Looks",            looks: filtered.saved },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">

      {/* Header */}
      <header className="pt-14 pb-6 px-6 text-center max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary tracking-tight mb-3 flex items-center justify-center gap-3">
            Beat <Sparkles className="w-8 h-8 text-accent" />
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-light tracking-wide mb-6">
            Iconic artistry. Live on your face.
          </p>
          <Link href="/match">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <ScanFace className="w-4 h-4" />
              Find My Perfect Look
              <span className="text-xs bg-primary-foreground/20 rounded-full px-2 py-0.5 font-normal">AI</span>
            </motion.div>
          </Link>
        </motion.div>
      </header>

      {/* Daily Beat card */}
      <DailyBeatCard />

      {/* Main Tabs */}
      <main className="max-w-6xl mx-auto px-6">
        <Tabs defaultValue="looks" className="w-full">

          {/* Top-level navigation */}
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <TabsList className="bg-card border border-border flex-shrink-0 h-auto p-1 gap-0.5">
              <TabsTrigger value="looks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                <Layers className="w-3.5 h-3.5" />Looks
              </TabsTrigger>
              <TabsTrigger value="brands" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                <Crown className="w-3.5 h-3.5" />Top Brands
              </TabsTrigger>
              <TabsTrigger value="palettes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                <PaletteIcon className="w-3.5 h-3.5" />Palettes
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── LOOKS TAB ───────────────────────────────────────────────────── */}
          <TabsContent value="looks" className="mt-0">
            {/* Search + difficulty filter */}
            <div className="mb-8 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search looks, moods, eras, celebrities…"
                  className="pl-9 pr-9 bg-card border-border focus-visible:ring-primary"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                      difficulty === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Inner look sub-tabs */}
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-start mb-6 overflow-x-auto pb-2">
                <TabsList className="bg-muted/60 flex-shrink-0 h-auto p-1 gap-0.5">
                  {lookTabs.map(t => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap"
                    >
                      {t.icon}
                      {t.label}
                      {t.id === "saved" && favorites.size > 0 && (
                        <span className="ml-0.5 text-xs bg-rose-500 text-white rounded-full px-1.5 py-px leading-none">
                          {favorites.size}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {lookTabs.map(t => (
                <TabsContent key={t.id} value={t.id} className="mt-0">
                  <SectionHeader
                    icon={t.icon ?? <Sparkles className="w-5 h-5" />}
                    title={t.title}
                    count={t.looks.length}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {t.id === "saved" && favorites.size === 0
                      ? <EmptyFavorites />
                      : <LookGrid looks={t.looks} isFav={isFavorite} onToggleFav={toggle} emptyMsg="No looks match your search." />
                    }
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* ── BRANDS TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="brands" className="mt-0">
            <div className="mb-8 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={brandQuery}
                  onChange={e => setBrandQuery(e.target.value)}
                  placeholder="Search brands by name, vibe, aesthetic…"
                  className="pl-9 pr-9 bg-card border-border focus-visible:ring-primary"
                />
                {brandQuery && (
                  <button onClick={() => setBrandQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {TIERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                      tierFilter === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <SectionHeader
              icon={<Crown className="w-5 h-5" />}
              title="Top Makeup Brands"
              count={filteredBrands.length}
              unit="brand"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                  <Crown className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-serif">No brands match your search.</p>
                </motion.div>
              ) : filteredBrands.map((brand, i) => (
                <BrandCard key={brand.id} brand={brand} index={i} />
              ))}
            </div>
          </TabsContent>

          {/* ── PALETTES TAB ────────────────────────────────────────────────── */}
          <TabsContent value="palettes" className="mt-0">
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={paletteQuery}
                  onChange={e => setPaletteQuery(e.target.value)}
                  placeholder="Search palettes by name, brand, vibe, or tag…"
                  className="pl-9 pr-9 bg-card border-border focus-visible:ring-primary"
                />
                {paletteQuery && (
                  <button onClick={() => setPaletteQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <SectionHeader
              icon={<PaletteIcon className="w-5 h-5" />}
              title="Makeup Palettes"
              count={filteredPalettes.length}
              unit="palette"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPalettes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
                  <PaletteIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-serif">No palettes match your search.</p>
                </motion.div>
              ) : filteredPalettes.map((palette, i) => (
                <PaletteCard key={palette.id} palette={palette} index={i} />
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
