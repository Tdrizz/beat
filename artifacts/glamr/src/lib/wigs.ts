// Minimal wig catalogue used by the dual-scroll try-on carousel.
//
// Scope: kept intentionally small (a handful of representative styles +
// 3-5 colours each) — just enough to drive the in-try-on switcher. The
// full wig catalog page & detail flow lives in a separate task; this file
// can be expanded or replaced wholesale by that work without breaking the
// try-on integration, as long as the `WigStyle` / `WigColor` shape holds.
//
// We deliberately ship pure-CSS gradient swatches instead of image assets
// so the carousel renders without any network round-trip and adds zero
// bundle weight.

export interface WigColor {
  id: string;
  name: string;
  /** Top-of-head colour (root) */
  rootHex: string;
  /** Tip / mid-length colour. Equal to rootHex for solids. */
  tipHex: string;
}

export interface WigStyle {
  id: string;
  name: string;
  length: "Pixie" | "Short" | "Bob" | "Shoulder" | "Long" | "Extra Long";
  texture: "Straight" | "Wavy" | "Curly" | "Coily" | "Braided" | "Locs";
  vibe: string;
  description: string;
  colors: WigColor[];
}

// Shared palette — same colour ids/labels reused across styles so users
// can find their "go-to" colour quickly while scrolling.
const C = {
  jet:      { id: "jet",       name: "Jet Black",       rootHex: "#1a1414", tipHex: "#1a1414" },
  espresso: { id: "espresso",  name: "Espresso",        rootHex: "#2b1d14", tipHex: "#3a281a" },
  chestnut: { id: "chestnut",  name: "Chestnut",        rootHex: "#5a3a22", tipHex: "#7a5030" },
  honey:    { id: "honey",     name: "Honey Blonde",    rootHex: "#7a5030", tipHex: "#d3a86a" },
  platinum: { id: "platinum",  name: "Platinum",        rootHex: "#b8a896", tipHex: "#ede4d4" },
  copper:   { id: "copper",    name: "Copper",          rootHex: "#7a3018", tipHex: "#c25a25" },
  burgundy: { id: "burgundy",  name: "Burgundy",        rootHex: "#2a0a10", tipHex: "#6b1828" },
  rose:     { id: "rose",      name: "Rose Gold",       rootHex: "#7a4555", tipHex: "#d99fa0" },
  plum:     { id: "plum",      name: "Plum",            rootHex: "#28102a", tipHex: "#5a2466" },
  ice:      { id: "ice",       name: "Ice Blue",        rootHex: "#26303a", tipHex: "#a6c8df" },
  pink:     { id: "pink",      name: "Bubblegum",       rootHex: "#7a2a4a", tipHex: "#f0a0c0" },
  balayage: { id: "balayage",  name: "Balayage",        rootHex: "#2b1d14", tipHex: "#c79766" },
} as const satisfies Record<string, WigColor>;

export const wigStyles: WigStyle[] = [
  {
    id: "sleek-bob",
    name: "Sleek Bob",
    length: "Bob",
    texture: "Straight",
    vibe: "Polished, editorial",
    description: "Blunt chin-grazing bob with a glassy mirror finish.",
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.platinum, C.burgundy],
  },
  {
    id: "long-body-wave",
    name: "Long Body Wave",
    length: "Long",
    texture: "Wavy",
    vibe: "Soft glamour",
    description: "Loose, bouncy S-waves cascading past the chest.",
    colors: [C.espresso, C.chestnut, C.honey, C.balayage, C.copper, C.rose],
  },
  {
    id: "curly-fro",
    name: "Curly Fro",
    length: "Shoulder",
    texture: "Curly",
    vibe: "Bold, voluminous",
    description: "Defined 3C-4A spiral curls with halo volume.",
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    length: "Pixie",
    texture: "Straight",
    vibe: "Edgy, minimalist",
    description: "Cropped pixie with side-swept fringe and tapered nape.",
    colors: [C.jet, C.espresso, C.platinum, C.copper, C.ice],
  },
  {
    id: "knotless-braids",
    name: "Knotless Braids",
    length: "Extra Long",
    texture: "Braided",
    vibe: "Protective, statement",
    description: "Mid-back knotless box braids, lightweight finish.",
    colors: [C.jet, C.espresso, C.honey, C.burgundy, C.rose],
  },
  {
    id: "faux-locs",
    name: "Faux Locs",
    length: "Long",
    texture: "Locs",
    vibe: "Goddess energy",
    description: "Sleek-rooted faux locs with soft tapered ends.",
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "deep-wave-frontal",
    name: "Deep Wave Frontal",
    length: "Long",
    texture: "Wavy",
    vibe: "Mermaid",
    description: "Defined deep waves with a melted lace frontal hairline.",
    colors: [C.jet, C.espresso, C.chestnut, C.balayage, C.honey],
  },
  {
    id: "shag-layers",
    name: "Shag Layers",
    length: "Shoulder",
    texture: "Wavy",
    vibe: "Rock & roll",
    description: "Choppy 70s shag with curtain bangs and feathery layers.",
    colors: [C.espresso, C.chestnut, C.copper, C.honey, C.burgundy],
  },
  {
    id: "kinky-coily",
    name: "Kinky Coily",
    length: "Shoulder",
    texture: "Coily",
    vibe: "Natural, textural",
    description: "Tight 4B-4C coils with a defined high-density crown.",
    colors: [C.jet, C.espresso, C.chestnut, C.burgundy, C.plum],
  },
  {
    id: "long-straight",
    name: "Silk Straight",
    length: "Extra Long",
    texture: "Straight",
    vibe: "Hi-shine, sleek",
    description: "Mid-back pin-straight wig with a centre part and silky cuticle.",
    colors: [C.jet, C.espresso, C.honey, C.platinum, C.ice, C.pink],
  },
];

/** Pseudo-option representing "use my own hair" — first in the carousel. */
export const NO_WIG_ID = "none" as const;

export function getWigStyle(id: string | null | undefined): WigStyle | null {
  if (!id || id === NO_WIG_ID) return null;
  return wigStyles.find((w) => w.id === id) ?? null;
}

/** CSS background string for a vertical root→tip gradient swatch. */
export function wigSwatchGradient(color: WigColor): string {
  return `linear-gradient(180deg, ${color.rootHex} 0%, ${color.rootHex} 35%, ${color.tipHex} 100%)`;
}
