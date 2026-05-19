import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TUTORIALS,
  TUTORIAL_CATEGORY_LABELS,
  getTutorial,
  type Tutorial,
  type TutorialCategory,
} from "@/lib/tutorials";
import { useArchetype } from "../hooks/useArchetype";
import type { ArchetypeId } from "../lib/archetypes";
import {
  byEraLooks, trendLooks,
  allEyeLooks, allLipLooks, allCompleteLooks, ALL_LOOKS_FLAT, Look,
  halloweenLooks, gothLooks, styleExpansionLooks, pageantLooks, dragLooks,
} from "../lib/looks";
import { getLookImage } from "../lib/lookImages";
import { type GothSubcategory, GOTH_SUBCATEGORY_LABELS } from "../lib/goth";
import {
  lashBrands, lashStyles, recommendLooksForLash,
  type LashStyle,
} from "../lib/lashes";
import { brands, Brand } from "../lib/brands";
import { palettes, Palette } from "../lib/palettes";
import { getDailyBeat, SEASON_THEME } from "../lib/dailyBeat";
import { useFavorites } from "../hooks/useFavorites";
import { useStreak } from "../hooks/useStreak";
import { StreakBadge } from "../components/StreakBadge";
import { MoodRail, type MoodOption } from "../components/MoodRail";
import { ArchetypeCallout } from "../components/ArchetypeCallout";
import { BrandLogo } from "../components/BrandLogo";
import { BrandImage } from "../components/BrandImage";
import { brandGradient } from "../lib/brandImages";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Camera, Eye, Smile, Layers, Search, X,
  Heart, TrendingUp, ScanFace, Clock, ChevronRight, ChevronLeft, CalendarDays,
  Crown, Palette as PaletteIcon, ExternalLink, Leaf,
  BookOpen, FlaskConical, Apple, Brush, Star,
  Ghost, Skull, Citrus, Coffee, BookHeart, Gem, Drama,
  GraduationCap,
} from "lucide-react";

interface TutorialStat {
  tutorialId: string;
  averageRating: number;
  reviewCount: number;
}

type Difficulty = "All" | "Beginner" | "Intermediate" | "Advanced";

// ── Vanity Bulb Row ────────────────────────────────────────────────────────────

/* Decorative SVG butterfly used to flank the "Beat" wordmark.
 * Wings flap subtly via a perspective skew on a framer-motion loop —
 * subtle enough to feel alive without being distracting. */
function Butterfly({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? -1 : 1;
  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={44}
      height={44}
      className="shrink-0 -mb-2 sm:-mb-3"
      style={{ transform: `scaleX(${flip})` }}
      initial={{ rotate: 0 }}
      animate={{ rotate: [0, -4, 0, 4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`bf-${side}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path
        d="M32 14 C30 22 30 42 32 50 C34 42 34 22 32 14 Z"
        fill="#7e22ce"
        opacity="0.85"
      />
      {/* Antennae */}
      <path
        d="M32 14 C30 9 26 7 22 8 M32 14 C34 9 38 7 42 8"
        stroke="#7e22ce"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Upper wings */}
      <motion.g
        animate={{ scaleX: [1, 0.92, 1, 0.92, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "32px 28px" }}
      >
        <path
          d="M32 26 C18 10 4 14 6 26 C8 34 20 32 32 30 Z"
          fill={`url(#bf-${side}-wing)`}
          stroke="#9d174d"
          strokeWidth="1"
          opacity="0.9"
        />
        <path
          d="M32 26 C46 10 60 14 58 26 C56 34 44 32 32 30 Z"
          fill={`url(#bf-${side}-wing)`}
          stroke="#9d174d"
          strokeWidth="1"
          opacity="0.9"
        />
        {/* Wing dots */}
        <circle cx="14" cy="22" r="1.6" fill="#fff" opacity="0.85" />
        <circle cx="50" cy="22" r="1.6" fill="#fff" opacity="0.85" />
      </motion.g>
      {/* Lower wings */}
      <motion.g
        animate={{ scaleX: [1, 0.94, 1, 0.94, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
        style={{ transformOrigin: "32px 36px" }}
      >
        <path
          d="M32 34 C22 38 14 48 20 54 C26 56 30 46 32 40 Z"
          fill={`url(#bf-${side}-wing)`}
          stroke="#9d174d"
          strokeWidth="1"
          opacity="0.85"
        />
        <path
          d="M32 34 C42 38 50 48 44 54 C38 56 34 46 32 40 Z"
          fill={`url(#bf-${side}-wing)`}
          stroke="#9d174d"
          strokeWidth="1"
          opacity="0.85"
        />
      </motion.g>
    </motion.svg>
  );
}

function VanityBulbs({ count = 12 }: { count?: number }) {
  return (
    <div className="vanity-bulbs w-full py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vanity-bulb" style={{ animationDelay: `${(i * 0.25) % 3}s` }} />
      ))}
    </div>
  );
}

// ── Trending Tutorials Rail ───────────────────────────────────────────────────
// Discovery boost for Tutorials, which otherwise only live in the More drawer.
// Pulls aggregate ratings from `/api/tutorials/stats` and shows the top 5 by
// average rating (ties broken by review count). If no reviews exist yet the
// rail hides itself — we don't want to bait-and-switch with an empty section
// or a hard-coded "trending" list.

// Archetype → preferred tutorial categories. Used to bias the trending
// rail toward what the user's archetype tends to spend time on. These
// are loose preferences (not exclusions) — if there aren't enough
// matches we backfill from the overall top-rated list.
const ARCHETYPE_TUTORIAL_CATEGORIES: Record<ArchetypeId, TutorialCategory[]> = {
  romantic:   ["lips", "skincare", "foundation"],
  siren:      ["eyes", "lips", "contouring"],
  icon:       ["brows", "lips", "foundation"],
  muse:       ["eyes", "lips"],
  rebel:      ["eyes", "lips", "brows"],
  naturalist: ["skincare", "foundation"],
};

function TrendingTutorialsRail() {
  const { archetype } = useArchetype();
  const { data, isLoading } = useQuery({
    queryKey: ["tutorial-stats"],
    queryFn: () => api.get<{ stats: TutorialStat[] }>("/tutorials/stats"),
  });

  const top = useMemo(() => {
    const stats = data?.stats ?? [];
    const rated = stats
      .filter((s) => s.reviewCount > 0)
      .map((s) => ({ stat: s, tutorial: getTutorial(s.tutorialId) }))
      .filter((x): x is { stat: TutorialStat; tutorial: Tutorial } => x.tutorial !== null);
    rated.sort((a, b) => {
      const diff = b.stat.averageRating - a.stat.averageRating;
      if (diff !== 0) return diff;
      return b.stat.reviewCount - a.stat.reviewCount;
    });
    if (!archetype) return rated.slice(0, 5);
    // Bias: matches first (in rating order), then backfill with the
    // remaining top-rated so the rail always shows 5 when possible
    // and never goes empty just because the archetype's preferred
    // categories have few rated tutorials yet.
    const preferred = new Set(ARCHETYPE_TUTORIAL_CATEGORIES[archetype]);
    const matches = rated.filter((r) => preferred.has(r.tutorial.category));
    const rest    = rated.filter((r) => !preferred.has(r.tutorial.category));
    return [...matches, ...rest].slice(0, 5);
  }, [data, archetype]);

  if (isLoading || top.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-6 mb-10"
      aria-labelledby="trending-tutorials-heading"
    >
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <h2 id="trending-tutorials-heading" className="font-serif text-lg sm:text-xl font-bold leading-tight">
              Trending tutorials this week
            </h2>
            <p className="text-xs text-muted-foreground">Top-rated step-by-steps from the community.</p>
          </div>
        </div>
        <Link href="/tutorials" className="shrink-0">
          <Button variant="ghost" size="sm" className="gap-1 rounded-full text-xs">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide">
        {top.map(({ tutorial, stat }) => (
          <Link
            key={tutorial.id}
            href={`/tutorials/${tutorial.id}`}
            className="snap-start shrink-0 w-56 sm:w-60 bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30">
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[10px] font-semibold uppercase tracking-wider">
                {TUTORIAL_CATEGORY_LABELS[tutorial.category]}
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[11px] font-semibold flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {stat.averageRating.toFixed(1)}
                <span className="text-muted-foreground font-normal">({stat.reviewCount})</span>
              </div>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <p className="font-semibold text-sm leading-tight line-clamp-2">{tutorial.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">by {tutorial.instructor}</p>
              <div className="flex items-center justify-between mt-auto pt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {tutorial.minutes} min
                </span>
                <span className="capitalize">{tutorial.difficulty}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

// ── Daily Beat Card ───────────────────────────────────────────────────────────

function DailyBeatCard() {
  const ALL = useMemo(() => [...allCompleteLooks, ...allEyeLooks, ...allLipLooks], []);
  const beat = useMemo(() => getDailyBeat(ALL), [ALL]);
  if (!beat.look) return null;

  const theme = SEASON_THEME[beat.season];
  const look = beat.look;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
      className="max-w-2xl mx-auto px-6 mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/20 shadow-xl" style={{ background: theme.gradient }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: look.palette[1] }} />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-15 blur-2xl" style={{ background: look.palette[2] }} />
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-3.5 h-3.5 opacity-60" style={{ color: theme.badgeText }} />
                <span className="text-xs font-semibold uppercase tracking-wider opacity-60" style={{ color: theme.badgeText }}>{beat.dateLabel}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight" style={{ color: theme.badgeText }}>{beat.dayMessage.greeting}</h2>
              <p className="text-sm mt-0.5 opacity-70 max-w-xs leading-relaxed" style={{ color: theme.badgeText }}>{beat.dayMessage.sub}</p>
            </div>
            <span className="shrink-0 text-3xl sm:text-4xl select-none" role="img" aria-label={beat.season}>{theme.emoji}</span>
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
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: theme.badge, color: theme.badgeText }}>Today's Beat</span>
                <span className="text-xs px-2 py-0.5 rounded-full opacity-70 border" style={{ borderColor: theme.badgeText + "40", color: theme.badgeText }}>{look.difficulty}</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold leading-tight mb-0.5" style={{ color: theme.badgeText }}>{look.name}</h3>
              <p className="italic text-sm opacity-60 mb-1" style={{ color: theme.badgeText }}>{look.mood}</p>
              <div className="flex items-center gap-1 opacity-55 mb-3">
                <Clock className="w-3 h-3" style={{ color: theme.badgeText }} />
                <span className="text-xs" style={{ color: theme.badgeText }}>{look.timeEstimate}</span>
              </div>
              <p className="text-sm italic leading-relaxed opacity-75 mb-4" style={{ color: theme.badgeText }}>"{beat.quote}"</p>
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
  const gradStyle = { background: `linear-gradient(135deg, ${look.palette[0]} 0%, ${look.palette[1]} 50%, ${look.palette[2]} 100%)` };
  const imgSrc = getLookImage(look.id, import.meta.env.BASE_URL, look.palette as [string, string, string]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.35) }} layout
    >
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className="h-44 w-full relative overflow-hidden" style={gradStyle}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt={`${look.name} makeup look`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <button
            onClick={e => { e.preventDefault(); onToggleFav(look.id); }}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
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
            <span className="text-xs text-muted-foreground">{look.era || look.celebrity || ""}</span>
            <span className="italic text-primary/80 text-xs">{look.mood}</span>
          </CardDescription>
        </CardHeader>
        {/* CTAs always visible — hover-reveal hurts mobile usage (BJ Fogg:
            keep the core action one tap away). Try-On is the primary
            action; details is a secondary text link. */}
        <CardFooter className="pt-2 flex items-center gap-2">
          <Link href={`/try-on/${look.id}`} className="flex-1">
            <Button size="sm" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold">
              <Camera className="w-3.5 h-3.5" />Try with AI
            </Button>
          </Link>
          <Link href={`/looks/${look.id}`} className="shrink-0">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground rounded-full">Details</Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ── Lash Brand & Style cards ──────────────────────────────────────────────────

function LashBrandCard({ brand }: { brand: typeof lashBrands[number] }) {
  return (
    <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
      <div className="p-5 flex items-start gap-3">
        <BrandLogo name={brand.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{brand.heritage}</p>
          <CardTitle className="font-serif text-xl leading-tight mt-0.5">{brand.name}</CardTitle>
          <p className="text-sm text-muted-foreground italic mt-1">{brand.tagline}</p>
        </div>
      </div>
      <div className="px-5 pb-5 space-y-2">
        <p className="text-xs text-foreground/80 leading-relaxed">{brand.vibe}</p>
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <p><span className="font-semibold text-foreground">Notable:</span> {brand.notable}</p>
          <p><span className="font-semibold text-foreground">Price:</span> {brand.priceRange}</p>
        </div>
      </div>
    </Card>
  );
}

function LashStyleCard({ style, looksPool }: { style: LashStyle; looksPool: Look[] }) {
  const [open, setOpen] = useState(false);
  const recs = useMemo(() => recommendLooksForLash(style, looksPool, 4), [style, looksPool]);
  return (
    <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 flex flex-col">
      <div className={`relative h-32 w-full bg-gradient-to-br ${style.swatch} flex items-end p-4`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-wider text-white/90 font-semibold">{style.finish}</p>
          <h3 className="font-serif text-2xl text-white drop-shadow font-bold leading-tight">{style.name}</h3>
        </div>
        <Badge variant="secondary" className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white border-none text-xs">{style.difficulty}</Badge>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <p className="text-sm text-foreground/80 leading-snug">{style.blurb}</p>
        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Best for:</span> {style.bestFor}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {style.tags.slice(0, 8).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{tag}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1 text-xs text-primary font-semibold inline-flex items-center gap-1 self-start hover:underline"
        >
          {open ? "Hide matches" : "Match to look"}
          <ChevronRight className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {recs.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">No matching looks yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {recs.map((l) => (
                    <Link key={l.id} href={`/looks/${l.id}`}>
                      <div
                        className="rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/40 transition-colors"
                        style={{ background: `linear-gradient(135deg, ${l.palette[0]} 0%, ${l.palette[1]} 50%, ${l.palette[2]} 100%)` }}
                      >
                        <div className="p-2.5 bg-gradient-to-t from-black/70 to-transparent">
                          <p className="text-[11px] font-serif font-bold text-white leading-tight drop-shadow">{l.name}</p>
                          <p className="text-[9px] uppercase tracking-wider text-white/80 mt-0.5">{l.mood}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}>
      <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
        <BrandImage
          imageKey={`brand-${brand.id}`}
          alt={`${brand.name} aesthetic`}
          fallbackGradient={brandGradient(brand.palette)}
          height="h-36"
        >
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <span className="font-serif text-white text-lg leading-tight drop-shadow-md tracking-wide">
              {brand.name}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/85 text-foreground/80 shadow-sm`}>
              {brand.tier}
            </span>
          </div>
        </BrandImage>
        <div className="h-3 w-full flex">
          {brand.palette.map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <BrandLogo name={brand.name} size={48} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>{brand.tier}</span>
                  <span className="text-xs text-muted-foreground">{brand.heritage} · {brand.founded}</span>
                </div>
                <CardTitle className="font-serif text-xl">{brand.name}</CardTitle>
                <p className="text-sm text-muted-foreground italic mt-0.5">{brand.tagline}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <div className="px-6 pb-3 flex-1">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{brand.vibe}</p>
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
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-primary mt-2 hover:underline">
              {expanded ? "Show less" : `+${brand.heroProducts.length - 2} more products`}
            </button>
          )}
        </div>
        <CardFooter className="pt-0 pb-4 px-6 mt-auto flex gap-2">
          {brand.matchedLookId && (
            <Link href={`/try-on/${brand.matchedLookId}`} className="flex-1">
              <Button size="sm" className="w-full gap-1.5 text-xs"><Camera className="w-3 h-3" />Try Signature Look</Button>
            </Link>
          )}
          <Button size="sm" variant="outline" className="shrink-0 gap-1 text-xs" onClick={() => setExpanded(e => !e)}>
            <ExternalLink className="w-3 h-3" />{expanded ? "Less" : "More"}
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}>
      <Card className="overflow-hidden bg-card border-border hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
        <BrandImage
          imageKey={`palette-${palette.id}`}
          alt={`${palette.brand} ${palette.name}`}
          fallbackGradient={brandGradient(palette.colors)}
          height="h-28"
        >
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
            <span className="font-serif text-white text-sm leading-tight drop-shadow-md tracking-wide">
              {palette.brand}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/85 text-foreground/80 shadow-sm">
              {palette.shades} shades
            </span>
          </div>
        </BrandImage>
        <div className="w-full p-3 bg-zinc-900/5 dark:bg-zinc-100/5">
          <div className="space-y-1">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map((c, ci) => <div key={ci} className="flex-1 rounded-sm shadow-inner" style={{ backgroundColor: c, height: "28px" }} />)}
              </div>
            ))}
          </div>
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <BrandLogo name={palette.brand} size={36} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">{palette.brand}</p>
                <CardTitle className="font-serif text-lg leading-snug">{palette.name}</CardTitle>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-bold text-primary">{palette.price}</p>
              <p className="text-xs text-muted-foreground">{palette.shades} shades</p>
            </div>
          </div>
        </CardHeader>
        <div className="px-6 pb-2 flex-1">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{palette.description}</p>
          <div className="flex gap-1 flex-wrap">
            {palette.tags.map(tag => <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>)}
          </div>
        </div>
        <CardFooter className="px-6 pb-4 pt-2">
          {palette.matchedLookId ? (
            <Link href={`/try-on/${palette.matchedLookId}`} className="w-full">
              <Button size="sm" className="w-full gap-1.5 text-xs"><Camera className="w-3 h-3" />Try Similar Look in AR</Button>
            </Link>
          ) : <Button size="sm" variant="outline" className="w-full text-xs" disabled>Coming Soon</Button>}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ── Section shortcuts (Skincare / Diary / Special Products) ────────────────────

function SectionShortcuts() {
  const shortcuts = [
    {
      href: "/skincare",
      icon: <Leaf className="w-5 h-5" />,
      label: "Skincare Guide",
      desc: "Morning, evening & holistic routines",
      gradient: "from-green-500/20 to-emerald-500/10",
      border: "border-green-500/20",
    },
    {
      href: "/diary",
      icon: <BookOpen className="w-5 h-5" />,
      label: "Skin Diary",
      desc: "Track your looks & skin journey",
      gradient: "from-rose-500/20 to-pink-500/10",
      border: "border-rose-500/20",
    },
    {
      href: "/special-products",
      icon: <FlaskConical className="w-5 h-5" />,
      label: "Special Products",
      desc: "Serums, gold masks & luxury tools",
      gradient: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/20",
    },
    {
      href: "/nutrition",
      icon: <Apple className="w-5 h-5" />,
      label: "Skin Nutrition",
      desc: "Foods, vitamins & supplements for glow",
      gradient: "from-fuchsia-500/20 to-pink-500/10",
      border: "border-fuchsia-500/20",
    },
    {
      href: "/juicing",
      icon: <Citrus className="w-5 h-5" />,
      label: "Juicing for Beauty",
      desc: "Glow, collagen & clear-skin recipes",
      gradient: "from-orange-500/20 to-pink-500/10",
      border: "border-orange-500/20",
    },
    {
      href: "/tools",
      icon: <Brush className="w-5 h-5" />,
      label: "Brushes & Tools",
      desc: "38 picks across 24 trusted brands",
      gradient: "from-violet-500/20 to-purple-500/10",
      border: "border-violet-500/20",
    },
    {
      href: "/slay-bible",
      icon: <BookHeart className="w-5 h-5" />,
      label: "The Slay Bible",
      desc: "Skincare guide for every condition",
      gradient: "from-rose-500/20 to-fuchsia-500/10",
      border: "border-rose-500/20",
    },
    {
      href: "/teapot",
      icon: <Coffee className="w-5 h-5" />,
      label: "The Teapot",
      desc: "Community feed — spill the tea",
      gradient: "from-pink-500/20 to-rose-500/10",
      border: "border-pink-500/20",
    },
    {
      href: "/esthetician-hub",
      icon: <Gem className="w-5 h-5" />,
      label: "Esthetician Hub",
      desc: "Find verified skin pros near you",
      gradient: "from-amber-500/20 to-yellow-500/10",
      border: "border-amber-500/20",
    },
  ];
  return (
    <div className="max-w-6xl mx-auto px-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortcuts.map((s, i) => (
          <Link href={s.href} key={s.href}>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-r ${s.gradient} ${s.border} cursor-pointer hover:shadow-md transition-all`}
            >
              <div className="text-primary shrink-0">{s.icon}</div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

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
      <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
        <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-serif">{emptyMsg || "No looks found."}</p>
      </div>
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
    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <p className="text-lg font-serif text-foreground">No saved looks yet</p>
      <p className="text-sm text-muted-foreground mt-1">Tap the heart on any look to save it here.</p>
    </div>
  );
}

const TIERS = ["All", "Luxury", "Prestige", "Mid-Range", "Indie", "Drugstore"] as const;
type TierFilter = typeof TIERS[number];
const DIFFICULTIES: Difficulty[] = ["All", "Beginner", "Intermediate", "Advanced"];
const EVERY_LOOK: Look[] = ALL_LOOKS_FLAT;
// ── Home ──────────────────────────────────────────────────────────────────────

// Time-aware greeting — small but powerful "personalisation" signal
// (Self-Determination Theory: relatedness; Cialdini: liking/familiarity).
function greetingForHour(h: number) {
  if (h < 5)  return "Late night, gorgeous";
  if (h < 12) return "Good morning, gorgeous";
  if (h < 17) return "Good afternoon, gorgeous";
  if (h < 21) return "Good evening, gorgeous";
  return "Hello, night owl";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("All");
  const [brandQuery, setBrandQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("All");
  const [paletteQuery, setPaletteQuery] = useState("");
  const [activeMood, setActiveMood] = useState<MoodOption | null>(null);
  const [lookCategory, setLookCategory] = useState<string | null>(null);
  const [gothSub, setGothSub] = useState<GothSubcategory | "all">("all");
  const [lashView, setLashView] = useState<"styles" | "brands">("styles");
  const [lashSearch, setLashSearch] = useState("");
  const { favorites, toggle, isFavorite } = useFavorites();
  const streak = useStreak();
  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  const handleMoodSelect = (mood: MoodOption | null) => {
    setActiveMood(mood);
    setQuery(mood?.query ?? "");
    // Smooth scroll the looks grid into view so the user immediately sees the result
    requestAnimationFrame(() => {
      document.getElementById("looks-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const filter = (source: Look[]) => source.filter(l => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || [l.name, l.mood, l.era ?? "", l.celebrity ?? ""].some(s => s.toLowerCase().includes(q));
    const matchD = difficulty === "All" || l.difficulty === difficulty;
    return matchQ && matchD;
  });

  const filtered = useMemo(() => {
    const gothFiltered = gothSub === "all" ? gothLooks : gothLooks.filter(l => l.subcategory === gothSub);
    const everyForAll: Look[] = [
      ...allCompleteLooks, ...halloweenLooks, ...gothLooks, ...styleExpansionLooks,
      ...pageantLooks, ...dragLooks,
    ];
    return {
      all:        filter(everyForAll),
      era:        filter(byEraLooks),
      halloween:  filter(halloweenLooks),
      goth:       filter(gothFiltered),
      moreStyles: filter(styleExpansionLooks),
      trending:   filter([...trendLooks, ...styleExpansionLooks]),
      eyes:       filter(allEyeLooks),
      lips:       filter(allLipLooks),
      pageant:    filter(pageantLooks),
      drag:       filter(dragLooks),
      saved:      filter(EVERY_LOOK.filter(l => favorites.has(l.id))),
    };
  }, [query, difficulty, favorites, gothSub]);

  const filteredLashBrands = useMemo(() => {
    const q = lashSearch.trim().toLowerCase();
    if (!q) return lashBrands;
    return lashBrands.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.vibe.toLowerCase().includes(q) ||
      b.notable.toLowerCase().includes(q),
    );
  }, [lashSearch]);

  const filteredLashStyles = useMemo(() => {
    const q = lashSearch.trim().toLowerCase();
    if (!q) return lashStyles;
    return lashStyles.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.blurb.toLowerCase().includes(q) ||
      s.tags.some(t => t.includes(q)),
    );
  }, [lashSearch]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return brands.filter(b => {
      const matchQ = !q || b.name.toLowerCase().includes(q) || b.vibe.toLowerCase().includes(q);
      const matchT = tierFilter === "All" || b.tier === tierFilter;
      return matchQ && matchT;
    });
  }, [brandQuery, tierFilter]);

  const filteredPalettes = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    return palettes.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [paletteQuery]);

  const lookTabs = [
    { id: "all",        label: "All",        icon: <Layers className="w-3.5 h-3.5" />,       title: "Complete Makeup Styles", looks: filtered.all,
      blurb: "Every look in the catalogue.", gradient: "from-rose-200 via-pink-200 to-orange-100" },
    { id: "trending",   label: "Trending",   icon: <TrendingUp className="w-3.5 h-3.5" />,   title: "Trending Styles",        looks: filtered.trending,
      blurb: "What's hot right now on the FYP.", gradient: "from-pink-300 via-fuchsia-200 to-violet-200" },
    { id: "halloween",  label: "Halloween",  icon: <Ghost className="w-3.5 h-3.5" />,        title: "Halloween Looks",        looks: filtered.halloween,
      blurb: `${halloweenLooks.length} costumes — from glam witch to sugar skull.`, gradient: "from-orange-400 via-purple-500 to-zinc-900" },
    { id: "goth",       label: "Goth",       icon: <Skull className="w-3.5 h-3.5" />,        title: "Goth Styles",            looks: filtered.goth,
      blurb: "Trad, soft, pastel, e-girl, cyber & romantic.", gradient: "from-zinc-700 via-zinc-800 to-black" },
    { id: "pageant",    label: "Pageant",    icon: <Crown className="w-3.5 h-3.5" />,       title: "Beauty Pageant Looks",   looks: filtered.pageant,
      blurb: "Stage-ready glam — from swimsuit to evening gown.", gradient: "from-amber-200 via-yellow-100 to-rose-200" },
    { id: "drag",       label: "Drag",       icon: <Drama className="w-3.5 h-3.5" />,       title: "Drag Queen Looks",       looks: filtered.drag,
      blurb: "Full fantasy — club kid to ballroom eleganza.", gradient: "from-fuchsia-400 via-purple-300 to-pink-300" },
    { id: "more",       label: "More Styles", icon: <Sparkles className="w-3.5 h-3.5" />,    title: "More Modern Styles",     looks: filtered.moreStyles,
      blurb: "Douyin, latte, indie sleaze & more.", gradient: "from-fuchsia-200 via-rose-200 to-amber-200" },
    { id: "era",        label: "By Era",     icon: <CalendarDays className="w-3.5 h-3.5" />, title: "By Era",                 looks: filtered.era,
      blurb: "1920s flapper to Y2K — pick your decade.", gradient: "from-amber-200 via-rose-200 to-purple-200" },
    { id: "eyes",       label: "Eyes",       icon: <Eye className="w-3.5 h-3.5" />,          title: "Eye Styles",             looks: filtered.eyes,
      blurb: "Liners, smokes, graphics & shimmers.", gradient: "from-sky-200 via-violet-200 to-pink-200" },
    { id: "lips",       label: "Lips",       icon: <Smile className="w-3.5 h-3.5" />,        title: "Lip Styles",             looks: filtered.lips,
      blurb: "Glosses, ombres, bitten reds and beyond.", gradient: "from-rose-300 via-red-200 to-orange-200" },
    { id: "saved",      label: "Saved",      icon: <Heart className="w-3.5 h-3.5" />,        title: "Saved Looks",            looks: filtered.saved,
      blurb: "Looks you've hearted to come back to.", gradient: "from-rose-200 via-pink-100 to-rose-200" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">

      {/* ── Hero: greeting + streak + mood (above the fold) ───────────────
          Reordered around what daily users actually need first thing:
          1) personalised greeting (relatedness)
          2) streak badge (loss aversion / variable reward)
          3) mood pill picker (mood-first selection — Hick's law)
          4) compact "Find my look" link as secondary action.            */}
      <div className="vanity-bg pt-2">
        <VanityBulbs count={14} />

        <header className="pt-5 pb-6 px-5 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Brand wordmark + slogan + butterflies.
              * Layout choices:
              *   • "Beat" is now the dominant element — Fredoka, oversized, with
              *     a soft rose→fuchsia gradient fill so it reads as the hero.
              *   • Two hand-drawn butterflies flank the wordmark (gently
              *     animated wing-flap via framer-motion) to reinforce the
              *     floral motif without feeling like clipart.
              *   • Slogan sits underneath in Caveat (script) for a hand-
              *     written, intimate feel.
              *   • Personalised greeting is preserved underneath, smaller, so
              *     the daily-personalisation hit isn't lost.
              *   • Streak badge floats top-right, away from the centred wordmark.
              */}
            <div className="relative mb-5">
              <div className="absolute right-0 top-0">
                <StreakBadge current={streak.current} triedToday={streak.triedToday} />
              </div>

              <div className="flex flex-col items-center text-center pt-1">
                <div className="flex items-end justify-center gap-2 sm:gap-3">
                  <Butterfly side="left" />
                  <h1
                    className="font-serif font-bold leading-none tracking-tight bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-[0_2px_0_rgba(255,200,220,0.35)]"
                    style={{ fontSize: "clamp(4rem, 18vw, 6rem)" }}
                  >
                    Beat
                  </h1>
                  <Butterfly side="right" />
                </div>

                <p
                  className="font-script text-foreground/70 mt-1"
                  style={{ fontSize: "clamp(1.05rem, 4.5vw, 1.35rem)", lineHeight: 1.1 }}
                >
                  Makeup is art, not a mask.
                </p>

                <h2 className="font-serif text-lg md:text-xl font-semibold leading-tight text-foreground/80 mt-3">
                  {greeting}
                  <Sparkles className="inline-block w-4 h-4 ml-1.5 text-primary" />
                </h2>
              </div>
            </div>

            <MoodRail active={activeMood?.label ?? null} onSelect={handleMoodSelect} />

            <div className="mt-4 flex items-center gap-2">
              <Link href="/match">
                <Button variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs">
                  <ScanFace className="w-3.5 h-3.5" />
                  Find my perfect look
                  <span className="text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-px font-bold">AI</span>
                </Button>
              </Link>
              {activeMood && (
                <button
                  onClick={() => handleMoodSelect(null)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Clear mood <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        </header>

        <VanityBulbs count={14} />
      </div>

      {/* Daily Beat card — variable reward (changes daily) */}
      <div className="mt-6">
        <DailyBeatCard />
      </div>

      {/* Trending tutorials rail — surfaces top-rated tutorials directly on
          Home so they're not buried behind the More drawer. */}
      <TrendingTutorialsRail />

      {/* Archetype callout — entry point to the personality quiz, or a
          banner showing the user's archetype if they've already taken it. */}
      <ArchetypeCallout />

      {/* Section shortcuts */}
      <SectionShortcuts />

      {/* Main Tabs */}
      <main id="looks-grid" className="max-w-6xl mx-auto px-6 scroll-mt-4">
        <Tabs defaultValue="looks" className="w-full">

          <div className="flex justify-start sm:justify-center mb-8 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            <TabsList className="bg-card border border-border flex-shrink-0 h-auto p-1 gap-0.5">
              <TabsTrigger value="looks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                <Layers className="w-3.5 h-3.5" />Looks
              </TabsTrigger>
              <TabsTrigger value="lashes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5 px-4 py-2 text-sm whitespace-nowrap">
                <Eye className="w-3.5 h-3.5" />Lashes
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
            <div className="mb-8 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search looks, moods, eras, celebrities…"
                  className="pl-9 pr-9 bg-card border-border focus-visible:ring-primary" />
                {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${difficulty === d ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Category landing → click a card to open that category's looks.
                State-driven (no inner Tabs) so the back button can return to
                the category grid and the card animations feel intentional. */}
            {lookCategory === null ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <SectionHeader
                  icon={<Layers className="w-5 h-5" />}
                  title="Browse by category"
                  count={lookTabs.length}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {lookTabs.map((t, i) => {
                    const count = t.id === "saved" ? favorites.size : t.looks.length;
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => setLookCategory(t.id)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        className="group relative text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className={`h-20 sm:h-24 bg-gradient-to-br ${t.gradient} relative`}>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-foreground/80">
                            {count} {count === 1 ? "look" : "looks"}
                          </div>
                          <div className="absolute bottom-2 left-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm">
                            {t.icon ?? <Sparkles className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 className="font-serif font-bold text-sm sm:text-base leading-tight">{t.label}</h3>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">{t.blurb}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (() => {
              const t = lookTabs.find(x => x.id === lookCategory)!;
              return (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => setLookCategory(null)}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 -ml-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to categories
                  </button>
                  <SectionHeader icon={t.icon ?? <Sparkles className="w-5 h-5" />} title={t.title} count={t.looks.length} />
                  {t.id === "goth" && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {(["all", ...Object.keys(GOTH_SUBCATEGORY_LABELS)] as const).map(sub => (
                        <button
                          key={sub}
                          onClick={() => setGothSub(sub as GothSubcategory | "all")}
                          className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${gothSub === sub ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}
                        >
                          {sub === "all" ? "All" : GOTH_SUBCATEGORY_LABELS[sub as GothSubcategory]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {t.id === "saved" && favorites.size === 0
                      ? <EmptyFavorites />
                      : <LookGrid looks={t.looks} isFav={isFavorite} onToggleFav={toggle} emptyMsg="No looks match your search." />}
                  </div>
                </motion.div>
              );
            })()}
          </TabsContent>

          {/* ── LASHES TAB ───────────────────────────────────────────────────── */}
          <TabsContent value="lashes" className="mt-0">
            <div className="mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input value={lashSearch} onChange={e => setLashSearch(e.target.value)}
                  placeholder="Search lash brands, styles, vibes…"
                  className="pl-9 pr-9 bg-card border-border" />
                {lashSearch && <button onClick={() => setLashSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <div className="flex gap-1 p-1 bg-muted/50 rounded-full self-start">
                <button
                  type="button"
                  onClick={() => setLashView("styles")}
                  aria-pressed={lashView === "styles"}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    lashView === "styles" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Styles ({filteredLashStyles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLashView("brands")}
                  aria-pressed={lashView === "brands"}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    lashView === "brands" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Brands ({filteredLashBrands.length})
                </button>
              </div>
            </div>

            {lashView === "styles" ? (
              <>
                <SectionHeader icon={<Eye className="w-5 h-5" />} title="Lash Styles" count={filteredLashStyles.length} unit="style" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredLashStyles.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center py-24 text-center">
                      <Eye className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-serif">No lash styles match.</p>
                    </div>
                  ) : filteredLashStyles.map((s) => (
                    <LashStyleCard key={s.id} style={s} looksPool={EVERY_LOOK} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeader icon={<Crown className="w-5 h-5" />} title="Lash Brands" count={filteredLashBrands.length} unit="brand" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredLashBrands.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center py-24 text-center">
                      <Crown className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <p className="text-lg font-serif">No brands match.</p>
                    </div>
                  ) : filteredLashBrands.map((b) => <LashBrandCard key={b.id} brand={b} />)}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── BRANDS TAB ──────────────────────────────────────────────────── */}
          <TabsContent value="brands" className="mt-0">
            <div className="mb-8 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input value={brandQuery} onChange={e => setBrandQuery(e.target.value)}
                  placeholder="Search brands by name, vibe, aesthetic…"
                  className="pl-9 pr-9 bg-card border-border" />
                {brandQuery && <button onClick={() => setBrandQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {TIERS.map(t => (
                  <button key={t} onClick={() => setTierFilter(t)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${tierFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <SectionHeader icon={<Crown className="w-5 h-5" />} title="Top Makeup Brands" count={filteredBrands.length} unit="brand" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center py-24 text-center">
                  <Crown className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-serif">No brands match your search.</p>
                </div>
              ) : filteredBrands.map((brand, i) => <BrandCard key={brand.id} brand={brand} index={i} />)}
            </div>
          </TabsContent>

          {/* ── PALETTES TAB ────────────────────────────────────────────────── */}
          <TabsContent value="palettes" className="mt-0">
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input value={paletteQuery} onChange={e => setPaletteQuery(e.target.value)}
                  placeholder="Search palettes by name, brand, vibe, or tag…"
                  className="pl-9 pr-9 bg-card border-border" />
                {paletteQuery && <button onClick={() => setPaletteQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
            </div>
            <SectionHeader icon={<PaletteIcon className="w-5 h-5" />} title="Makeup Palettes" count={filteredPalettes.length} unit="palette" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPalettes.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center py-24 text-center">
                  <PaletteIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-serif">No palettes match your search.</p>
                </div>
              ) : filteredPalettes.map((palette, i) => <PaletteCard key={palette.id} palette={palette} index={i} />)}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
