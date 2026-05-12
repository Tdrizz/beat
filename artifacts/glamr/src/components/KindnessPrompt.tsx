import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

const MEAN_PATTERNS = [
  /\bugly\b/i,
  /\bfat\b/i,
  /\bhideous\b/i,
  /\bdisgusting\b/i,
  /\bgross\b/i,
  /\bfugly\b/i,
  /\byou look (terrible|awful|horrible|bad|nasty|rough)/i,
  /\blooks? like (trash|garbage|crap|shit|hell)/i,
  /\bso ugly\b/i,
  /\btoo ugly\b/i,
  /\bbusted\b/i,
  /\bhag\b/i,
  /\bbeat face.*(wrong|bad|terrible)/i,
  /\btrash\b/i,
  /\bno one.*(love|like|date)/i,
  /\bwho.*(wear|do|apply).*(that|this)/i,
  /\bnasty\b/i,
  /\bpathetic\b/i,
  /\bworthless\b/i,
  /\bloser\b/i,
  /\bslut\b/i,
  /\bwhore\b/i,
  /\bbitch\b/i,
  /\bskank\b/i,
];

export function containsMeanContent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (!lower) return false;
  return MEAN_PATTERNS.some((rx) => rx.test(lower));
}

export function KindnessOverlay({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      return;
    }
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          onDismiss();
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label="Kindness reminder"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="mx-6 max-w-sm w-full bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 dark:from-rose-950 dark:via-pink-950 dark:to-fuchsia-950 rounded-3xl p-8 text-center shadow-2xl border border-rose-200/50 dark:border-rose-800/50"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500 flex items-center justify-center mb-5 shadow-lg">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <p className="font-serif text-xl sm:text-2xl leading-snug text-foreground mb-3">
              Be kind
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              We've all been made to feel ugly.{" "}
              <span className="font-semibold text-foreground">
                We're better women than this.
              </span>
            </p>
            <div className="text-xs text-muted-foreground">
              Resuming in{" "}
              <span className="font-bold text-primary">{countdown}</span>s
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useKindnessCheck() {
  const [showOverlay, setShowOverlay] = useState(false);
  // Remember the exact text the user was last warned about. Once the
  // 5s overlay has played for that text we let them resubmit it as-is
  // (the prompt is a nudge, not a hard block). Editing the text resets
  // the override, so a fresh mean phrase triggers the overlay again.
  const [acknowledgedText, setAcknowledgedText] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  const checkText = useCallback(
    (text: string): boolean => {
      if (!containsMeanContent(text)) return false;
      if (acknowledgedText !== null && acknowledgedText === text) {
        // User already saw the prompt for this exact text — let it through.
        return false;
      }
      setPendingText(text);
      setShowOverlay(true);
      return true;
    },
    [acknowledgedText],
  );

  const dismiss = useCallback(() => {
    setShowOverlay(false);
    setAcknowledgedText(pendingText);
    setPendingText(null);
  }, [pendingText]);

  return { showOverlay, checkText, dismiss };
}
