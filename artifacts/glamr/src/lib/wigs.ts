// Wig catalogue for the AI wig try-on flow.
//
// Two consumers share this data:
//   1. The in-try-on dual-scroll switcher (TryOn.tsx WigRail) — quick swap.
//   2. The standalone catalog (/wigs) + detail (/wigs/:id) pages.
//
// We deliberately ship pure-CSS gradient swatches instead of image assets so
// the catalog renders without any network round-trip and adds zero bundle
// weight. The gradient is a root→tip blend that reads convincingly as a
// colour chip; the photoreal render comes from Gemini at try-on time.
//
// IMPORTANT: `length` and `texture` are enum-locked to match the server-side
// Zod schema in `artifacts/api-server/src/routes/aiTryon.ts`. Adding a value
// here that the server doesn't accept will 400 every try-on for that style.

export type WigLength = "Pixie" | "Short" | "Bob" | "Shoulder" | "Long" | "Extra Long";
export type WigTexture = "Straight" | "Wavy" | "Curly" | "Coily" | "Braided" | "Locs";
export type FaceShape = "Oval" | "Round" | "Square" | "Heart" | "Long" | "Diamond";
export type Occasion =
  | "Everyday" | "Work" | "Party" | "Bridal" | "Editorial" | "Festival" | "Protective";

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
  length: WigLength;
  texture: WigTexture;
  vibe: string;
  description: string;
  /** Face shapes this style flatters — used as suitability tags + filters. */
  faceShapes: FaceShape[];
  /** Occasions the style suits — used as suitability tags + filters. */
  occasions: Occasion[];
  colors: WigColor[];
}

// Shared palette — same colour ids/labels reused across styles so users
// can find their "go-to" colour quickly while scrolling. Solids set
// rootHex === tipHex; dimensional colours (balayage, ombré, money-piece)
// blend root → tip.
const C = {
  jet:        { id: "jet",        name: "Jet Black",         rootHex: "#1a1414", tipHex: "#1a1414" },
  espresso:   { id: "espresso",   name: "Espresso",          rootHex: "#2b1d14", tipHex: "#3a281a" },
  chestnut:   { id: "chestnut",   name: "Chestnut",          rootHex: "#5a3a22", tipHex: "#7a5030" },
  caramel:    { id: "caramel",    name: "Caramel",           rootHex: "#6a4326", tipHex: "#b07a44" },
  honey:      { id: "honey",      name: "Honey Blonde",      rootHex: "#7a5030", tipHex: "#d3a86a" },
  strawberry: { id: "strawberry", name: "Strawberry Blonde", rootHex: "#9a4a36", tipHex: "#e0a878" },
  platinum:   { id: "platinum",   name: "Platinum",          rootHex: "#b8a896", tipHex: "#ede4d4" },
  ash:        { id: "ash",        name: "Ash Blonde",        rootHex: "#8a8070", tipHex: "#c7bda8" },
  copper:     { id: "copper",     name: "Copper",            rootHex: "#7a3018", tipHex: "#c25a25" },
  ginger:     { id: "ginger",     name: "Ginger",            rootHex: "#7a3414", tipHex: "#c2632a" },
  auburn:     { id: "auburn",     name: "Auburn",            rootHex: "#4a160c", tipHex: "#7a2a14" },
  burgundy:   { id: "burgundy",   name: "Burgundy",          rootHex: "#2a0a10", tipHex: "#6b1828" },
  plum:       { id: "plum",       name: "Plum",              rootHex: "#28102a", tipHex: "#5a2466" },
  rose:       { id: "rose",       name: "Rose Gold",         rootHex: "#7a4555", tipHex: "#d99fa0" },
  pink:       { id: "pink",       name: "Bubblegum",         rootHex: "#7a2a4a", tipHex: "#f0a0c0" },
  lavender:   { id: "lavender",   name: "Lavender",          rootHex: "#4a3a6a", tipHex: "#b9a3e0" },
  cobalt:     { id: "cobalt",     name: "Cobalt Blue",       rootHex: "#1a2a5a", tipHex: "#3a5ec0" },
  ice:        { id: "ice",        name: "Ice Blue",          rootHex: "#26303a", tipHex: "#a6c8df" },
  silver:     { id: "silver",     name: "Silver",            rootHex: "#7a7a82", tipHex: "#cfd2d8" },
  balayage:   { id: "balayage",   name: "Balayage",          rootHex: "#2b1d14", tipHex: "#c79766" },
  ombre:      { id: "ombre",      name: "Ombré",             rootHex: "#1a1414", tipHex: "#c79766" },
  money:      { id: "money",      name: "Money Piece",       rootHex: "#1f1714", tipHex: "#d8b074" },
} as const satisfies Record<string, WigColor>;

export const wigStyles: WigStyle[] = [
  // ── Bobs & lobs ───────────────────────────────────────────────────────────
  {
    id: "sleek-bob",
    name: "Sleek Bob",
    length: "Bob",
    texture: "Straight",
    vibe: "Polished, editorial",
    description: "Blunt chin-grazing bob with a glassy mirror finish and a sharp centre part.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Work", "Editorial", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.platinum, C.burgundy, C.cobalt],
  },
  {
    id: "blunt-bob",
    name: "Blunt Cut Bob",
    length: "Bob",
    texture: "Straight",
    vibe: "Architectural",
    description: "One-length blunt cut with razor-clean ends — pure geometric impact.",
    faceShapes: ["Oval", "Heart", "Long"],
    occasions: ["Editorial", "Work", "Party"],
    colors: [C.jet, C.espresso, C.auburn, C.platinum, C.plum, C.silver],
  },
  {
    id: "french-bob",
    name: "French Bob",
    length: "Bob",
    texture: "Straight",
    vibe: "Parisian cool",
    description: "Jaw-length bob with a wispy micro-fringe — effortless rive-gauche chic.",
    faceShapes: ["Oval", "Square", "Diamond"],
    occasions: ["Everyday", "Work", "Editorial"],
    colors: [C.espresso, C.chestnut, C.caramel, C.honey, C.copper],
  },
  {
    id: "pin-straight-bob",
    name: "Pin-Straight Bob",
    length: "Bob",
    texture: "Straight",
    vibe: "Hi-shine",
    description: "Glass-flat bob with a side part and tucked ends for maximum sheen.",
    faceShapes: ["Oval", "Round", "Heart"],
    occasions: ["Work", "Party", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.platinum, C.rose, C.ice],
  },
  {
    id: "wavy-lob",
    name: "Wavy Lob",
    length: "Shoulder",
    texture: "Wavy",
    vibe: "Effortless",
    description: "Collarbone-grazing long bob with soft tousled bends and lived-in movement.",
    faceShapes: ["Oval", "Round", "Square", "Long"],
    occasions: ["Everyday", "Work", "Party"],
    colors: [C.espresso, C.chestnut, C.caramel, C.honey, C.balayage, C.rose],
  },
  {
    id: "layered-lob",
    name: "Layered Lob",
    length: "Shoulder",
    texture: "Wavy",
    vibe: "Modern, bouncy",
    description: "Long bob carved with face-framing layers for volume and swing.",
    faceShapes: ["Round", "Square", "Long", "Diamond"],
    occasions: ["Everyday", "Work", "Editorial"],
    colors: [C.chestnut, C.caramel, C.honey, C.strawberry, C.balayage, C.money],
  },
  {
    id: "blunt-cut-lob",
    name: "Blunt Cut Lob",
    length: "Shoulder",
    texture: "Straight",
    vibe: "Clean lines",
    description: "Sharp one-length lob skimming the shoulders — minimal, expensive-looking.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Work", "Editorial", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.ash, C.platinum, C.burgundy],
  },

  // ── Pixies & crops ────────────────────────────────────────────────────────
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    length: "Pixie",
    texture: "Straight",
    vibe: "Edgy, minimalist",
    description: "Cropped pixie with side-swept fringe and a tapered nape.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Everyday", "Editorial", "Party"],
    colors: [C.jet, C.espresso, C.platinum, C.copper, C.ice, C.silver],
  },
  {
    id: "tapered-pixie",
    name: "Tapered Pixie",
    length: "Pixie",
    texture: "Coily",
    vibe: "Bold, natural",
    description: "Short tapered cut on natural coils with a defined sponge-twist crown.",
    faceShapes: ["Oval", "Square", "Heart"],
    occasions: ["Everyday", "Editorial", "Protective"],
    colors: [C.jet, C.espresso, C.copper, C.honey, C.burgundy, C.silver],
  },
  {
    id: "afro-puff",
    name: "Afro Puff",
    length: "Short",
    texture: "Coily",
    vibe: "Playful, natural",
    description: "High-density rounded puff with a clean edge — fresh and youthful.",
    faceShapes: ["Oval", "Heart", "Long"],
    occasions: ["Everyday", "Festival", "Protective"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "modern-mullet",
    name: "Modern Mullet",
    length: "Short",
    texture: "Wavy",
    vibe: "Rock & roll",
    description: "Short-on-top, long-in-back shag mullet with curtain-y face pieces.",
    faceShapes: ["Oval", "Diamond", "Heart"],
    occasions: ["Editorial", "Party", "Festival"],
    colors: [C.jet, C.espresso, C.copper, C.platinum, C.plum, C.cobalt],
  },

  // ── Layered & shag ────────────────────────────────────────────────────────
  {
    id: "shag-layers",
    name: "Shag Layers",
    length: "Shoulder",
    texture: "Wavy",
    vibe: "Rock & roll",
    description: "Choppy 70s shag with curtain bangs and feathery, piecey layers.",
    faceShapes: ["Oval", "Square", "Long"],
    occasions: ["Everyday", "Festival", "Party"],
    colors: [C.espresso, C.chestnut, C.copper, C.honey, C.burgundy, C.ginger],
  },
  {
    id: "feathered-shag",
    name: "Feathered Shag",
    length: "Shoulder",
    texture: "Wavy",
    vibe: "Soft 70s",
    description: "Wispy feathered layers with a soft flick at the ends — Farrah energy.",
    faceShapes: ["Round", "Square", "Heart"],
    occasions: ["Everyday", "Party", "Editorial"],
    colors: [C.chestnut, C.caramel, C.honey, C.strawberry, C.balayage],
  },
  {
    id: "curtain-bang-layers",
    name: "Curtain Bang Layers",
    length: "Long",
    texture: "Straight",
    vibe: "Soft glam",
    description: "Long layered cut with sweeping curtain bangs that frame the cheekbones.",
    faceShapes: ["Round", "Square", "Long", "Heart"],
    occasions: ["Everyday", "Work", "Party"],
    colors: [C.espresso, C.chestnut, C.caramel, C.honey, C.money, C.balayage],
  },

  // ── Waves ─────────────────────────────────────────────────────────────────
  {
    id: "long-body-wave",
    name: "Long Body Wave",
    length: "Long",
    texture: "Wavy",
    vibe: "Soft glamour",
    description: "Loose, bouncy S-waves cascading past the chest with brushed-out volume.",
    faceShapes: ["Oval", "Round", "Square", "Long"],
    occasions: ["Party", "Bridal", "Everyday"],
    colors: [C.espresso, C.chestnut, C.honey, C.balayage, C.copper, C.rose, C.money],
  },
  {
    id: "loose-wave-lace",
    name: "Loose Wave Lace",
    length: "Long",
    texture: "Wavy",
    vibe: "Romantic",
    description: "Soft loose waves on a melted lace part for an invisible hairline.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Bridal", "Party", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.balayage, C.platinum],
  },
  {
    id: "deep-wave-frontal",
    name: "Deep Wave Frontal",
    length: "Long",
    texture: "Wavy",
    vibe: "Mermaid",
    description: "Defined deep waves with a melted lace frontal hairline, ear to ear.",
    faceShapes: ["Oval", "Round", "Long"],
    occasions: ["Party", "Festival", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.balayage, C.honey, C.burgundy],
  },
  {
    id: "water-wave",
    name: "Water Wave",
    length: "Long",
    texture: "Wavy",
    vibe: "Beachy",
    description: "Springy water-wave pattern with a wet-look sheen and natural rebound.",
    faceShapes: ["Oval", "Square", "Heart"],
    occasions: ["Festival", "Party", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.copper, C.burgundy],
  },
  {
    id: "spanish-wave",
    name: "Spanish Wave",
    length: "Extra Long",
    texture: "Wavy",
    vibe: "Sultry",
    description: "Loose, glossy Spanish waves with a side sweep, falling to the waist.",
    faceShapes: ["Oval", "Round", "Long"],
    occasions: ["Party", "Bridal", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.balayage, C.money],
  },
  {
    id: "closure-body-wave",
    name: "Closure Body Wave",
    length: "Long",
    texture: "Wavy",
    vibe: "Polished install",
    description: "Body-wave bundles finished with a seamless lace closure crown.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Bridal", "Work", "Party"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.balayage],
  },

  // ── Curls & coils ─────────────────────────────────────────────────────────
  {
    id: "curly-fro",
    name: "Curly Fro",
    length: "Shoulder",
    texture: "Curly",
    vibe: "Bold, voluminous",
    description: "Defined 3C–4A spiral curls with halo volume and a rounded silhouette.",
    faceShapes: ["Oval", "Heart", "Long"],
    occasions: ["Everyday", "Festival", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy, C.copper],
  },
  {
    id: "kinky-coily",
    name: "Kinky Coily",
    length: "Shoulder",
    texture: "Coily",
    vibe: "Natural, textural",
    description: "Tight 4B–4C coils with a defined, high-density crown.",
    faceShapes: ["Oval", "Square", "Heart"],
    occasions: ["Everyday", "Protective", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.burgundy, C.plum, C.honey],
  },
  {
    id: "kinky-curly-long",
    name: "Kinky Curly Long",
    length: "Long",
    texture: "Curly",
    vibe: "Statement volume",
    description: "Full-bodied kinky curls falling well past the shoulders with big bounce.",
    faceShapes: ["Oval", "Round", "Long"],
    occasions: ["Party", "Festival", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy, C.copper],
  },
  {
    id: "voluminous-curls",
    name: "Voluminous Curls",
    length: "Long",
    texture: "Curly",
    vibe: "Showstopper",
    description: "Big bombshell barrel curls with a deep side part and dramatic body.",
    faceShapes: ["Oval", "Square", "Long"],
    occasions: ["Party", "Bridal", "Editorial"],
    colors: [C.espresso, C.chestnut, C.honey, C.balayage, C.copper, C.rose],
  },
  {
    id: "jerry-curl",
    name: "Jerry Curl",
    length: "Shoulder",
    texture: "Curly",
    vibe: "Retro glossy",
    description: "Tight, glossy jerry curls with a wet-look finish and springy texture.",
    faceShapes: ["Oval", "Heart", "Square"],
    occasions: ["Party", "Festival", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.burgundy, C.copper],
  },
  {
    id: "360-frontal-curly",
    name: "360 Frontal Curly",
    length: "Long",
    texture: "Curly",
    vibe: "Up-do ready",
    description: "Curly install on a 360 lace frontal so you can part and pull back anywhere.",
    faceShapes: ["Oval", "Round", "Heart"],
    occasions: ["Bridal", "Party", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },

  // ── Straight ──────────────────────────────────────────────────────────────
  {
    id: "long-straight",
    name: "Silk Straight",
    length: "Extra Long",
    texture: "Straight",
    vibe: "Hi-shine, sleek",
    description: "Mid-back pin-straight wig with a centre part and a silky cuticle finish.",
    faceShapes: ["Oval", "Round", "Square", "Heart"],
    occasions: ["Work", "Party", "Editorial"],
    colors: [C.jet, C.espresso, C.honey, C.platinum, C.ice, C.pink, C.cobalt],
  },
  {
    id: "bone-straight",
    name: "Bone Straight",
    length: "Extra Long",
    texture: "Straight",
    vibe: "Razor sheen",
    description: "Ultra-flat bone-straight waist-length hair with blunt, dense ends.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Party", "Editorial", "Work"],
    colors: [C.jet, C.espresso, C.chestnut, C.platinum, C.burgundy, C.silver],
  },
  {
    id: "middle-part-straight",
    name: "Middle-Part Straight",
    length: "Long",
    texture: "Straight",
    vibe: "Clean, classic",
    description: "Sleek centre-parted straight hair, tucked behind the ears.",
    faceShapes: ["Oval", "Round", "Square"],
    occasions: ["Work", "Everyday", "Bridal"],
    colors: [C.jet, C.espresso, C.chestnut, C.caramel, C.honey, C.ash],
  },
  {
    id: "lace-frontal-straight",
    name: "Lace Frontal Straight",
    length: "Long",
    texture: "Straight",
    vibe: "Flawless hairline",
    description: "Straight bundles on an ear-to-ear lace frontal with baby-hair styling.",
    faceShapes: ["Oval", "Round", "Heart", "Diamond"],
    occasions: ["Bridal", "Work", "Party"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.balayage, C.money],
  },

  // ── Braids ────────────────────────────────────────────────────────────────
  {
    id: "knotless-braids",
    name: "Knotless Braids",
    length: "Extra Long",
    texture: "Braided",
    vibe: "Protective, statement",
    description: "Mid-back knotless box braids with a lightweight, flat-root finish.",
    faceShapes: ["Oval", "Square", "Heart", "Long"],
    occasions: ["Protective", "Everyday", "Festival"],
    colors: [C.jet, C.espresso, C.honey, C.burgundy, C.rose, C.copper],
  },
  {
    id: "box-braids",
    name: "Box Braids",
    length: "Extra Long",
    texture: "Braided",
    vibe: "Classic protective",
    description: "Uniform medium box braids with crisp parts — the timeless protective style.",
    faceShapes: ["Oval", "Square", "Heart", "Long"],
    occasions: ["Protective", "Everyday", "Party"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "jumbo-braids",
    name: "Jumbo Braids",
    length: "Long",
    texture: "Braided",
    vibe: "Bold, quick",
    description: "Chunky jumbo braids for high-impact volume with fewer parts.",
    faceShapes: ["Oval", "Heart", "Long"],
    occasions: ["Festival", "Protective", "Party"],
    colors: [C.jet, C.espresso, C.honey, C.copper, C.plum],
  },
  {
    id: "fulani-braids",
    name: "Fulani Braids",
    length: "Long",
    texture: "Braided",
    vibe: "Adorned, cultural",
    description: "Centre cornrow with side braids and beaded accents — intricate and regal.",
    faceShapes: ["Oval", "Square", "Diamond"],
    occasions: ["Festival", "Editorial", "Protective"],
    colors: [C.jet, C.espresso, C.honey, C.copper, C.burgundy],
  },
  {
    id: "micro-braids",
    name: "Micro Braids",
    length: "Extra Long",
    texture: "Braided",
    vibe: "Featherlight",
    description: "Hundreds of tiny braids with a fluid, almost hair-like swing.",
    faceShapes: ["Oval", "Round", "Heart"],
    occasions: ["Protective", "Everyday", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "cornrow-feed-in",
    name: "Feed-In Cornrows",
    length: "Shoulder",
    texture: "Braided",
    vibe: "Sleek, sporty",
    description: "Straight-back feed-in cornrows with a flat, scalp-hugging finish.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Everyday", "Protective", "Festival"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.copper],
  },

  // ── Locs ──────────────────────────────────────────────────────────────────
  {
    id: "faux-locs",
    name: "Faux Locs",
    length: "Long",
    texture: "Locs",
    vibe: "Goddess energy",
    description: "Sleek-rooted faux locs with soft, tapered ends.",
    faceShapes: ["Oval", "Square", "Long"],
    occasions: ["Protective", "Festival", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy, C.copper],
  },
  {
    id: "butterfly-locs",
    name: "Butterfly Locs",
    length: "Shoulder",
    texture: "Locs",
    vibe: "Textured, boho",
    description: "Distressed butterfly locs with that signature looped, airy texture.",
    faceShapes: ["Oval", "Heart", "Diamond"],
    occasions: ["Festival", "Protective", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
  {
    id: "goddess-locs",
    name: "Goddess Locs",
    length: "Extra Long",
    texture: "Locs",
    vibe: "Bohemian glam",
    description: "Smooth goddess locs with loose curly tendrils woven throughout.",
    faceShapes: ["Oval", "Square", "Long"],
    occasions: ["Festival", "Bridal", "Editorial"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.copper, C.burgundy],
  },
  {
    id: "passion-twists",
    name: "Passion Twists",
    length: "Long",
    texture: "Locs",
    vibe: "Soft, romantic",
    description: "Two-strand passion twists with a soft, springy, water-wave texture.",
    faceShapes: ["Oval", "Round", "Heart"],
    occasions: ["Protective", "Festival", "Everyday"],
    colors: [C.jet, C.espresso, C.chestnut, C.honey, C.burgundy],
  },
];

/** Pseudo-option representing "use my own hair" — first in the carousel. */
export const NO_WIG_ID = "none" as const;

export const WIG_LENGTHS: WigLength[] = ["Pixie", "Short", "Bob", "Shoulder", "Long", "Extra Long"];
export const WIG_TEXTURES: WigTexture[] = ["Straight", "Wavy", "Curly", "Coily", "Braided", "Locs"];

export function getWigStyle(id: string | null | undefined): WigStyle | null {
  if (!id || id === NO_WIG_ID) return null;
  return wigStyles.find((w) => w.id === id) ?? null;
}

export function getWigColor(style: WigStyle, colorId: string | null | undefined): WigColor | null {
  if (!colorId) return style.colors[0] ?? null;
  return style.colors.find((c) => c.id === colorId) ?? style.colors[0] ?? null;
}

/** CSS background string for a vertical root→tip gradient swatch. */
export function wigSwatchGradient(color: WigColor): string {
  return `linear-gradient(180deg, ${color.rootHex} 0%, ${color.rootHex} 35%, ${color.tipHex} 100%)`;
}

/** Opens a buyer-facing shopping search without pretending Beat is the seller. */
export function shopWigHref(style: WigStyle, color: WigColor | null): string {
  const query = `${style.name} wig ${color?.name ?? ""}`.trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}
