import type { Profile } from "@workspace/db";

// Fields that must NEVER leave the server — billing internals, etc. Add
// to this list as new sensitive columns land on `profiles`.
type PrivateKey = "stripeCustomerId" | "premiumUntil";

export type PublicProfile = Omit<Profile, PrivateKey>;

// Strip billing/private columns from a profile before sending it to a
// client. Use this wherever profile data is serialized into a response,
// including embedded profiles in feed/comments/notifications/classes.
export function publicProfile<T extends Partial<Profile>>(p: T): Omit<T, PrivateKey> {
  const { stripeCustomerId: _s, premiumUntil: _u, ...rest } = p as T & {
    stripeCustomerId?: Profile["stripeCustomerId"];
    premiumUntil?: Profile["premiumUntil"];
  };
  void _s; void _u;
  return rest as Omit<T, PrivateKey>;
}

// Variant for the common `value ?? null` embedding pattern (e.g.
// `instructor: byId.get(id) ?? null`). Keeps null callers strictly typed
// without forcing a non-null assertion at every call site.
export function publicProfileOrNull<T extends Partial<Profile>>(p: T): Omit<T, PrivateKey>;
export function publicProfileOrNull(p: null | undefined): null;
export function publicProfileOrNull<T extends Partial<Profile>>(
  p: T | null | undefined,
): Omit<T, PrivateKey> | null;
export function publicProfileOrNull<T extends Partial<Profile>>(
  p: T | null | undefined,
): Omit<T, PrivateKey> | null {
  return p ? publicProfile(p) : null;
}
