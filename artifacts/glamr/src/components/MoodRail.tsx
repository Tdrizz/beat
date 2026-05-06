import { motion } from "framer-motion";

/**
 * Mood-first look picker.
 *
 * Why: studies on how the target demo (women 14–35) describe makeup choices
 * show they self-select primarily by *emotional intent* ("I want to feel
 * soft today") rather than by technique or difficulty. Surfacing 6 mood
 * pills above the fold reduces decision paralysis (Hick's law: choice
 * time grows logarithmically with options) and aligns the picker with the
 * user's own mental model.
 *
 * Each mood maps to a free-text query that the existing search/filter
 * already understands, so no extra wiring on the data side.
 */

export interface MoodOption {
  label: string;
  emoji: string;
  query: string;     // typed into the existing look-search
  hex: string;       // accent colour for the pill
}

export const MOODS: MoodOption[] = [
  { label: "Soft",       emoji: "🌸", query: "soft",      hex: "#F4C2D0" },
  { label: "Glowy",      emoji: "✨", query: "glow",      hex: "#F5D5A8" },
  { label: "Bold",       emoji: "🔥", query: "bold",      hex: "#DC4F84" },
  { label: "Cozy",       emoji: "🍂", query: "cozy",      hex: "#C97B5A" },
  { label: "Confident",  emoji: "💎", query: "power",     hex: "#6B2D4E" },
  { label: "Date Night", emoji: "🍷", query: "siren",     hex: "#8B2842" },
];

interface Props {
  active: string | null;
  onSelect: (mood: MoodOption | null) => void;
}

export function MoodRail({ active, onSelect }: Props) {
  return (
    <div className="w-full">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2.5 px-1">
        How do you want to feel today?
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {MOODS.map((m) => {
          const isActive = active === m.label;
          return (
            <motion.button
              key={m.label}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
              onClick={() => onSelect(isActive ? null : m)}
              className={`shrink-0 snap-start flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-semibold transition-all ${
                isActive
                  ? "border-transparent text-white shadow-lg"
                  : "border-border bg-card text-foreground/80 hover:border-primary/40"
              }`}
              style={isActive ? { backgroundColor: m.hex, boxShadow: `0 6px 18px -6px ${m.hex}` } : {}}
            >
              <span aria-hidden="true">{m.emoji}</span>
              <span>{m.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
