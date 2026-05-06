// Server-side mirror of the frontend `archetypes.ts` mood matchers. We keep
// this small, hand-curated map here (rather than pulling lib/db into the
// glamr bundle) so the feed can prefer posts whose `mood` substring-matches
// one of the archetype's keywords. Kept in sync with
// artifacts/glamr/src/lib/archetypes.ts manually — small enough that drift
// is obvious in code review.
import type { ArchetypeId } from "@workspace/db";

export const ARCHETYPE_MOOD_MATCHERS: Record<ArchetypeId, string[]> = {
  romantic: ["doll", "playful", "warm", "radiant", "luminous", "ethereal"],
  siren: ["smoul", "sultry", "glam", "bombshell", "vamp", "noir"],
  icon: ["editorial", "polished", "classic", "tailored", "couture", "graphic-clean"],
  muse: ["dream", "soft", "pastel", "iridescent", "fairy", "celestial"],
  rebel: ["graphic", "edgy", "punk", "bold", "sharp", "neon"],
  naturalist: ["fresh", "natural", "skin", "minimal", "barely", "clean"],
};

export const ARCHETYPE_CHALLENGES: Record<ArchetypeId, { headline: string; body: string }> = {
  romantic: { headline: "Petal week", body: "Post a soft, glowy daytime look in your signature rose / peach palette." },
  siren: { headline: "After-dark week", body: "Post a smouldering night-out look — push depth on the eye, satin skin." },
  icon: { headline: "Couture-clean week", body: "Post a tailored, restrained look — every line deliberate, nothing extra." },
  muse: { headline: "Iridescent week", body: "Post an ethereal look that uses an unexpected colour temperature." },
  rebel: { headline: "Sharp-edge week", body: "Post a graphic, high-contrast look that breaks one beauty 'rule'." },
  naturalist: { headline: "Skin-first week", body: "Post a tinted-balm-only look — glow has to come from skincare, not shimmer." },
};

/**
 * Returns true if the post's `mood` (case-insensitive) contains one of
 * the archetype's matcher substrings.
 */
export function postMatchesArchetype(mood: string | null, archetype: ArchetypeId): boolean {
  if (!mood) return false;
  const m = mood.toLowerCase();
  return ARCHETYPE_MOOD_MATCHERS[archetype].some((kw) => m.includes(kw));
}
