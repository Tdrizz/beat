import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  current: number;
  triedToday: boolean;
}

/**
 * Tiny streak chip for the top of the home screen.
 *
 * Loss-aversion / Zeigarnik visual cue: when today is *not* yet completed,
 * the flame pulses gently — subtle reminder that the streak is "open".
 * When today is done, it locks into a saturated solid state — closure +
 * positive reinforcement (operant conditioning, variable-ratio reward).
 */
export function StreakBadge({ current, triedToday }: Props) {
  if (current === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
        <Flame className="w-3.5 h-3.5 opacity-60" />
        Start your streak
      </div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        triedToday
          ? "bg-gradient-to-r from-primary/20 to-accent/20 border-primary/40 text-primary"
          : "bg-card border-border text-foreground/80"
      }`}
    >
      <motion.span
        animate={triedToday ? {} : { scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="inline-flex"
      >
        <Flame className={`w-3.5 h-3.5 ${triedToday ? "fill-primary text-primary" : "text-accent"}`} />
      </motion.span>
      <span>{current} day{current === 1 ? "" : "s"}</span>
    </motion.div>
  );
}
