import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { ARCHETYPES, type ArchetypeId } from "../lib/archetypes";
import { api } from "../lib/api";

// Module-level "last synced" marker, shared across every component that
// calls useArchetype(). Without this, every mount (TopNav + Feed + Home +
// Brands + …) would re-fire `PUT /profiles/me/archetype`, producing the
// PUT-storm we saw in the logs on every page navigation.
let moduleLastSynced: ArchetypeId | null = null;

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
  const { isSignedIn } = useAuth();

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

  useEffect(() => {
    if (!isSignedIn) return;
    const a = stored?.archetype ?? null;
    if (!a) return; // never push a null wipe — clear() is local-only
    if (a === moduleLastSynced) return;
    // Optimistically mark synced so concurrent hook instances (TopNav,
    // Feed, Brands, etc. all mount at once) don't fire duplicate PUTs.
    moduleLastSynced = a;
    api.put("/profiles/me/archetype", { archetype: a }).catch(() => {
      // Roll back so the next render can retry — but only if the value
      // we tried to push is still the latest one (otherwise a newer
      // attempt has already taken over).
      if (moduleLastSynced === a) moduleLastSynced = null;
    });
  }, [isSignedIn, stored?.archetype]);

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
