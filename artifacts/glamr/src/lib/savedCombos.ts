// Resolves a stored { lookId, wigStyleId, wigColorId, intensity } combo into
// the catalogue objects needed to render a card and build a try-on deep link.
//
// Combos are stored denormalised (catalogue ids only). The catalogues live in
// code and can change between when a combo was saved and when it's shown, so a
// combo whose look no longer resolves returns `null` and is skipped by callers.
import {
  allLooks, eyeLooks, lipLooks, trendLooks, moreEyeLooks, moreLipLooks, type Look,
} from "./looks";
import { wigStyles, NO_WIG_ID, type WigStyle, type WigColor } from "./wigs";
import type { SavedCombo } from "./api";

const ALL_LOOKS: Look[] = [
  ...allLooks, ...eyeLooks, ...lipLooks,
  ...trendLooks, ...moreEyeLooks, ...moreLipLooks,
];

export interface ResolvedCombo {
  combo: SavedCombo;
  look: Look;
  wig: WigStyle | null;
  color: WigColor | null;
  /** Deep link into try-on with the selections pre-applied. */
  href: string;
}

/** Build the `/try-on/:lookId?…` deep link for a combo's selections. */
export function comboHref(combo: Pick<SavedCombo, "lookId" | "wigStyleId" | "wigColorId" | "intensity">): string {
  const params = new URLSearchParams();
  if (combo.wigStyleId && combo.wigStyleId !== NO_WIG_ID) {
    params.set("wig", combo.wigStyleId);
    if (combo.wigColorId) params.set("color", combo.wigColorId);
  }
  if (typeof combo.intensity === "number") params.set("intensity", String(combo.intensity));
  const qs = params.toString();
  return `/try-on/${combo.lookId}${qs ? `?${qs}` : ""}`;
}

/** Resolve a stored combo into catalogue objects, or `null` if the look is gone. */
export function resolveCombo(combo: SavedCombo): ResolvedCombo | null {
  const look = ALL_LOOKS.find((l) => l.id === combo.lookId);
  if (!look) return null;
  const wig = combo.wigStyleId === NO_WIG_ID
    ? null
    : wigStyles.find((w) => w.id === combo.wigStyleId) ?? null;
  const color = wig
    ? wig.colors.find((c) => c.id === combo.wigColorId) ?? wig.colors[0] ?? null
    : null;
  return { combo, look, wig, color, href: comboHref(combo) };
}

/** Short human label for a combo's pairing, e.g. "Smoky Charcoal + Sleek Bob / Jet Black". */
export function comboLabel(resolved: ResolvedCombo): string {
  const { look, wig, color } = resolved;
  if (!wig) return `${look.name} · My hair`;
  return `${look.name} + ${wig.name}${color ? ` / ${color.name}` : ""}`;
}
