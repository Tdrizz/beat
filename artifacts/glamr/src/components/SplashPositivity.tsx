import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "You are the moodboard.",
  "Your skin is allowed to breathe today.",
  "Glow is a verb.",
  "You're the trend, not the chase.",
  "Soft is strong.",
  "Today's beat is yours.",
  "You don't need a filter — you are one.",
  "Beautiful, on your own terms.",
  "Pretty is a side effect.",
  "Take up space, gorgeous.",
  "Your face does not owe anyone an apology.",
  "Make yourself the main character.",
] as const;

const VISIBLE_MS = 1800;

/**
 * Cold-start positivity splash. Shows on every page load (~1.8s).
 * Tap-to-dismiss for impatient users.
 * Honours `prefers-reduced-motion` by skipping the entrance animation.
 */
export function SplashPositivity() {
  const [visible, setVisible] = useState(true);
  const [message] = useState<string>(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)] ?? MESSAGES[0],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, []);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="splash-title"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.4 }}
          onClick={() => setVisible(false)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-8 bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 backdrop-blur-sm cursor-pointer"
        >
          <motion.div
            initial={reduce ? { y: 0, opacity: 1 } : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.05 }}
            className="text-center"
          >
            <h1
              id="splash-title"
              className="font-serif font-bold leading-none bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 bg-clip-text text-transparent"
              style={{ fontSize: "clamp(3rem, 14vw, 5rem)" }}
            >
              Beat
            </h1>
            <p
              className="font-script text-foreground/70 mt-2"
              style={{ fontSize: "clamp(1rem, 4.5vw, 1.4rem)" }}
            >
              Makeup is art, not a mask.
            </p>
          </motion.div>
          <motion.p
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.25 }}
            className="font-script text-2xl sm:text-3xl text-foreground/80 max-w-md text-center leading-snug"
          >
            {message}
          </motion.p>
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
            }}
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : 0.6 }}
            className="text-xs uppercase tracking-[0.2em] text-foreground/60 px-5 py-2 rounded-full border border-foreground/15 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
          >
            Enter Beat
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
