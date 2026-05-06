import { useCallback, useEffect, useState } from "react";

/**
 * Daily-look streak tracker.
 *
 * Behaviour psychology basis:
 *  • Hooked model (Eyal) — variable reward + investment loop. The streak
 *    *is* the user's investment; breaking it feels like loss aversion
 *    (Kahneman & Tversky), which drives daily return better than any
 *    notification alone.
 *  • Duolingo's streak mechanic, repeatedly studied as one of the strongest
 *    daily-habit drivers in consumer mobile apps.
 *  • Zeigarnik effect — visible incomplete progress (today's beat not yet
 *    tried) draws cognitive return.
 *
 * Persisted to localStorage (no auth needed).  A "day" rolls over at the
 * user's local midnight.
 */

const KEY = "beat.streak.v1";

interface Persisted {
  current: number;
  best: number;
  lastDayKey: string | null;
}

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { current: 0, best: 0, lastDayKey: null };
    const parsed = JSON.parse(raw);
    return {
      current: typeof parsed.current === "number" ? parsed.current : 0,
      best: typeof parsed.best === "number" ? parsed.best : 0,
      lastDayKey: typeof parsed.lastDayKey === "string" ? parsed.lastDayKey : null,
    };
  } catch {
    return { current: 0, best: 0, lastDayKey: null };
  }
}

function save(s: Persisted) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota / privacy mode */ }
}

/** Reads the streak without mutating it — for read-only display. */
export function useStreak() {
  const [state, setState] = useState<Persisted>(() => {
    if (typeof window === "undefined") return { current: 0, best: 0, lastDayKey: null };
    const s = load();
    // If the user broke their streak (missed a day), zero `current` on read
    // so the badge is honest before any new try-on event.
    if (s.lastDayKey) {
      const last = new Date(s.lastDayKey);
      const today = new Date();
      const diffDays = Math.floor((+new Date(dayKey(today)) - +new Date(dayKey(last))) / 86_400_000);
      if (diffDays > 1) {
        const reset = { ...s, current: 0 };
        save(reset);
        return reset;
      }
    }
    return s;
  });

  /** Call when the user actually performs the daily action (opens a try-on). */
  const recordToday = useCallback(() => {
    const today = dayKey();
    setState(prev => {
      if (prev.lastDayKey === today) return prev; // already counted today
      let next = prev.current + 1;
      if (prev.lastDayKey) {
        const last = new Date(prev.lastDayKey);
        const diff = Math.floor((+new Date(today) - +new Date(dayKey(last))) / 86_400_000);
        if (diff > 1) next = 1; // missed a day → restart
      } else {
        next = 1;
      }
      const updated: Persisted = {
        current: next,
        best: Math.max(prev.best, next),
        lastDayKey: today,
      };
      save(updated);
      return updated;
    });
  }, []);

  // Keep tab in sync if user has the app open across midnight or in two tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setState(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const triedToday = state.lastDayKey === dayKey();
  return { current: state.current, best: state.best, triedToday, recordToday };
}
