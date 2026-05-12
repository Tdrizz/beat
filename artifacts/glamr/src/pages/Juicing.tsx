import { useMemo, useState } from "react";
import { Search, Sparkles, Citrus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  JUICES,
  JUICE_BENEFITS,
  JUICE_BENEFIT_LABELS,
  JUICE_BENEFIT_EMOJI,
  type JuiceBenefit,
  type JuiceRecipe,
} from "@/lib/juicing";

type BenefitFilter = "all" | JuiceBenefit;

export default function Juicing() {
  const [benefit, setBenefit] = useState<BenefitFilter>("all");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return JUICES.filter((j) => {
      if (benefit !== "all" && !j.benefits.includes(benefit)) return false;
      if (
        needle &&
        !`${j.name} ${j.summary} ${j.detail} ${j.ingredients.join(" ")}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      return true;
    });
  }, [benefit, q]);

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
              <Citrus className="w-5 h-5 text-primary" />
            </span>
            <h1 className="font-serif text-3xl">Juicing for beauty</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {JUICES.length} juice and smoothie recipes targeted at the
            beauty benefits that show up in your mirror — collagen, glow,
            clear skin, hydration, detox, and more.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Educational only — not medical advice. If you're managing a
            condition or on medication, talk to a clinician before
            starting a new juicing routine.
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipes, ingredients…"
            className="pl-9"
          />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-semibold">
            What's your beauty goal?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <BenefitPill active={benefit === "all"} onClick={() => setBenefit("all")}>
              <Sparkles className="w-3 h-3" /> All
            </BenefitPill>
            {JUICE_BENEFITS.map((b) => (
              <BenefitPill key={b} active={benefit === b} onClick={() => setBenefit(b)}>
                <span aria-hidden>{JUICE_BENEFIT_EMOJI[b]}</span> {JUICE_BENEFIT_LABELS[b]}
              </BenefitPill>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No recipes match that filter — try clearing it.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((j, i) => (
              <JuiceCard key={j.id} j={j} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JuiceCard({ j, index }: { j: JuiceRecipe; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col group hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className={`relative aspect-[5/3] w-full bg-gradient-to-br ${j.swatch}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Citrus className="w-10 h-10 text-white/70 drop-shadow" />
        </div>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {j.benefits.slice(0, 2).map((b) => (
            <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-background/85 backdrop-blur font-semibold uppercase tracking-wider">
              {JUICE_BENEFIT_EMOJI[b]} {JUICE_BENEFIT_LABELS[b]}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <p className="font-serif text-lg font-bold leading-tight">{j.name}</p>
        <p className="text-xs text-muted-foreground leading-snug">{j.summary}</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{j.detail}</p>
        <div className="mt-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Ingredients</p>
          <ul className="text-xs text-foreground/80 list-disc list-inside space-y-0.5">
            {j.ingredients.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          <span className="font-semibold text-foreground">Prep:</span> {j.prep}
        </p>
      </div>
    </motion.div>
  );
}

function BenefitPill({
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
