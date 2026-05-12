import { useMemo, useState } from "react";
import { Search, BookHeart, ChevronDown, ChevronUp, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  SLAY_BIBLE,
  SKIN_CONDITIONS,
  CONDITION_LABELS,
  CONDITION_EMOJI,
  CONDITION_SWATCH,
  type SkinCondition,
  type SlayTip,
} from "@/lib/slayBible";

type Filter = "all" | SkinCondition;

export default function SlayBible() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SLAY_BIBLE.filter((entry) => {
      if (filter !== "all" && entry.condition !== filter) return false;
      if (
        needle &&
        !`${CONDITION_LABELS[entry.condition]} ${entry.overview} ${entry.tips.map((t) => `${t.title} ${t.detail}`).join(" ")}`
          .toLowerCase()
          .includes(needle)
      )
        return false;
      return true;
    });
  }, [filter, q]);

  return (
    <div className="min-h-screen vanity-bg">
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10">
              <BookHeart className="w-5 h-5 text-primary" />
            </span>
            <h1 className="font-serif text-3xl">The Slay Bible</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Your go-to guide for every skin and hair condition that affects how
            you feel in the mirror. Real advice, proven ingredients, and makeup
            tips that actually work.
          </p>
          <p className="text-[11px] text-muted-foreground/80 italic">
            Educational only — not medical advice. Always consult a
            dermatologist for persistent conditions.
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conditions, tips, ingredients…"
            className="pl-9"
          />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 font-semibold">
            Filter by condition
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <FilterPill
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              <Sparkles className="w-3 h-3" /> All
            </FilterPill>
            {SKIN_CONDITIONS.map((c) => (
              <FilterPill
                key={c}
                active={filter === c}
                onClick={() => setFilter(c)}
              >
                <span aria-hidden>{CONDITION_EMOJI[c]}</span>{" "}
                {CONDITION_LABELS[c]}
              </FilterPill>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No conditions match that filter — try clearing it.
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((entry, i) => (
              <ConditionCard key={entry.condition} entry={entry} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ConditionCard({
  entry,
  index,
}: {
  entry: (typeof SLAY_BIBLE)[number];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const swatch = CONDITION_SWATCH[entry.condition];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <div className={`relative h-20 bg-gradient-to-br ${swatch}`}>
          <div className="absolute inset-0 flex items-center px-5 gap-3">
            <span className="text-3xl" aria-hidden>
              {CONDITION_EMOJI[entry.condition]}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl font-bold text-foreground drop-shadow-sm">
                {CONDITION_LABELS[entry.condition]}
              </h2>
              <p className="text-xs text-foreground/70 truncate">
                {entry.tips.length} tip{entry.tips.length !== 1 ? "s" : ""}
              </p>
            </div>
            {open ? (
              <ChevronUp className="w-5 h-5 text-foreground/60 shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/60 shrink-0" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {entry.overview}
              </p>
              {entry.tips.map((tip) => (
                <TipCard key={tip.id} tip={tip} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TipCard({ tip }: { tip: SlayTip }) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
      <h3 className="font-serif text-lg font-bold">{tip.title}</h3>
      <p className="text-sm text-foreground/80 leading-relaxed">{tip.detail}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-1.5">
            Do
          </p>
          <ul className="space-y-1">
            {tip.doList.map((item) => (
              <li
                key={item}
                className="text-xs text-foreground/80 flex items-start gap-1.5"
              >
                <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold mb-1.5">
            Avoid
          </p>
          <ul className="space-y-1">
            {tip.avoidList.map((item) => (
              <li
                key={item}
                className="text-xs text-foreground/80 flex items-start gap-1.5"
              >
                <span className="text-rose-500 mt-0.5 shrink-0 text-[10px]">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
          Key ingredients
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tip.ingredients.map((ing) => (
            <span
              key={ing}
              className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
            >
              {ing}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 rounded-lg p-3 border border-fuchsia-200/30 dark:border-fuchsia-800/30">
        <p className="text-[10px] uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 font-semibold mb-1">
          Makeup tip
        </p>
        <p className="text-xs text-foreground/80 leading-relaxed">
          {tip.makeupTip}
        </p>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
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
