import { useMemo, useState } from "react";
import { Apple, Search, ChevronDown, Sparkles, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  NUTRITION,
  NUTRITION_KINDS,
  KIND_LABELS,
  SKIN_CONCERNS,
  CONCERN_LABELS,
  CONCERN_EMOJI,
  type NutritionItem,
  type NutritionKind,
  type SkinConcern,
} from "@/lib/skinNutrition";

type ConcernFilter = "all" | SkinConcern;
type KindFilter = "all" | NutritionKind;

export default function Nutrition() {
  const [concern, setConcern] = useState<ConcernFilter>("all");
  const [kind, setKind] = useState<KindFilter>("all");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return NUTRITION.filter((n) => {
      if (kind !== "all" && n.kind !== kind) return false;
      if (concern !== "all" && !n.concerns.includes(concern)) return false;
      if (needle && !`${n.name} ${n.summary} ${n.detail}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [concern, kind, q]);

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
              <Apple className="w-5 h-5 text-primary" />
            </span>
            <h1 className="font-serif text-3xl">Skin nutrition</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {NUTRITION.length} foods, vitamins, minerals, and supplements with
            evidence for your skin, hair, and nails. Filter by concern to see
            what to add to your plate this week.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Educational only — not medical advice. Talk to a clinician before
            starting new supplements, especially if pregnant, nursing, or on
            medication.
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search foods, vitamins, supplements…"
            className="pl-9"
          />
        </div>

        {/* Concern pills — horizontal scroll on mobile, wraps on desktop. */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-semibold">
            What's your skin focus?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <ConcernPill active={concern === "all"} onClick={() => setConcern("all")}>
              <Sparkles className="w-3 h-3" /> All
            </ConcernPill>
            {SKIN_CONCERNS.map((c) => (
              <ConcernPill key={c} active={concern === c} onClick={() => setConcern(c)}>
                <span aria-hidden>{CONCERN_EMOJI[c]}</span> {CONCERN_LABELS[c]}
              </ConcernPill>
            ))}
          </div>
        </div>

        {/* Kind tabs (Foods / Vitamins / Minerals / Supplements). */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-full self-start">
          <KindTab active={kind === "all"} onClick={() => setKind("all")}>All ({NUTRITION.length})</KindTab>
          {NUTRITION_KINDS.map((k) => (
            <KindTab key={k} active={kind === k} onClick={() => setKind(k)}>
              {KIND_LABELS[k]} ({NUTRITION.filter((n) => n.kind === k).length})
            </KindTab>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nothing matches those filters yet — try clearing one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((n) => <NutritionCard key={n.id} n={n} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function NutritionCard({ n }: { n: NutritionItem }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col group hover:border-primary/40 hover:shadow-sm transition-all">
      <div className={`relative aspect-[5/3] w-full bg-gradient-to-br ${n.swatch} overflow-hidden`}>
        {!broken ? (
          <img
            src={n.image}
            alt={n.name}
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
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[10px] font-semibold uppercase tracking-wider">
          {KIND_LABELS[n.kind].replace(/s$/, "")}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="font-serif text-lg font-bold leading-tight">{n.name}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{n.summary}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {n.concerns.slice(0, 3).map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {CONCERN_EMOJI[c]} {CONCERN_LABELS[c]}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 text-xs text-primary font-semibold inline-flex items-center gap-1 self-start hover:underline"
        >
          {open ? "Less" : "More"} <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{n.detail}</p>
              <p className="text-[11px] text-muted-foreground mt-2">
                <span className="font-semibold text-foreground">Dose:</span> {n.dose}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConcernPill({
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
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3 py-1.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-foreground border-border hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function KindTab({
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
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
