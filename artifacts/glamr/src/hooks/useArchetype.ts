import { useCallback, useEffect, useState } from "react";
import { ARCHETYPES, type ArchetypeId } from "../lib/archetypes";

/**
 * localStorage-backed archetype state. We don't persist server-side yet —
 * the quiz is anonymous and instant, and the archetype is essentially a
 * UI preference (like a theme). When/if we want it tied to the Clerk
 * profile, the migration is one POST and a hydrate-on-login.
 *
 * The shape includes `takenAt` so we can prompt long-time users to retake
 * the quiz ("It's been a year — has your style shifted?") without losing
 * their existing result.
 */
const STORAGE_KEY = "beat:archetype:v1";

interface Stored {
  archetype: ArchetypeId;
  takenAt: number;
}

function read(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate against the live archetype map so a corrupted/legacy value
    // can't reach the API (which would 400 on the enum) or render an
    // undefined archetype in the UI.
    if (
      parsed &&
      typeof parsed.archetype === "string" &&
      typeof parsed.takenAt === "number" &&
      Object.prototype.hasOwnProperty.call(ARCHETYPES, parsed.archetype)
    ) {
      return parsed as Stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function useArchetype() {
  const [stored, setStored] = useState<Stored | null>(() => read());

  // Re-sync if another tab takes the quiz — small touch, but it makes the
  // app feel alive when users have multiple tabs open.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setStored(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setArchetype = useCallback((archetype: ArchetypeId) => {
    const next: Stored = { archetype, takenAt: Date.now() };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* private mode / quota — ignore, in-memory state still works */ }
    setStored(next);
  }, []);

  const clear = useCallback(() => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setStored(null);
  }, []);

  return {
    archetype: stored?.archetype ?? null,
    takenAt: stored?.takenAt ?? null,
    setArchetype,
    clear,
  };
}
