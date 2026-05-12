// Eyelash brand catalogue + style catalogue + simple tag-based matcher
// that links lash styles to makeup looks (and vice versa).

export interface LashBrand {
  id: string;
  name: string;
  tagline: string;
  heritage: string;
  vibe: string;
  notable: string;
  priceRange: string;
}

export interface LashStyle {
  id: string;
  name: string;
  blurb: string;
  bestFor: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  finish: "Natural" | "Wispy" | "Dramatic" | "Editorial";
  /** Used by the matcher to pair with looks. */
  tags: string[];
  /** Tailwind gradient backdrop for the visual swatch. */
  swatch: string;
}

export const lashBrands: LashBrand[] = [
  { id: "ardell", name: "Ardell", tagline: "The original lash everyone starts with.",
    heritage: "American, since 1971", vibe: "Drugstore icon — affordable, accessible, dependable",
    notable: "Demi Wispies, Demi Pixie, Wispies", priceRange: "$ — under $10" },
  { id: "lilly-lashes", name: "Lilly Lashes", tagline: "The Insta-famous mink lash.",
    heritage: "American", vibe: "Influencer favourite — featherlight 3D mink and synthetic",
    notable: "Miami, Goddess, Mykonos", priceRange: "$$ — $25-40" },
  { id: "velour", name: "Velour Lashes", tagline: "Wispy, lightweight, and natural-looking.",
    heritage: "Canadian", vibe: "Editorial-grade with a barely-there feel",
    notable: "Effortless No.02, Doll Me Up, Whisp It Real Good", priceRange: "$$ — $25-30" },
  { id: "eylure", name: "Eylure", tagline: "British heritage lashes since 1947.",
    heritage: "British, since 1947", vibe: "Vintage Hollywood elegance, supermodel collabs",
    notable: "Naturals, Volume, Dramatic", priceRange: "$ — $5-15" },
  { id: "house-of-lashes", name: "House of Lashes", tagline: "The MUA backstage favourite.",
    heritage: "American", vibe: "Pro-grade quality, tons of styles, vegan options",
    notable: "Iconic, Noir Fairy, Sinful", priceRange: "$$ — $13-30" },
  { id: "kiss", name: "KISS", tagline: "Quick, easy, drugstore staple.",
    heritage: "American", vibe: "Beginner-friendly, magnetic + falsies, ubiquitous",
    notable: "Falscara, Magnetic, So Wispy", priceRange: "$ — $6-15" },
  { id: "sephora-collection", name: "Sephora Collection", tagline: "Sephora's in-house lash range.",
    heritage: "French/Global", vibe: "Reliable house brand spanning natural to dramatic",
    notable: "False Lashes Day to Night, Cat Eye", priceRange: "$ — $10-15" },
  { id: "tatti-lashes", name: "Tatti Lashes", tagline: "UK's celebrity-loved lash brand.",
    heritage: "British", vibe: "Influencer + celebrity hits — fluffy, glamour-driven",
    notable: "TL19, TL21, TL44", priceRange: "$$ — $15-25" },
  { id: "doe-lashes", name: "Doe Lashes", tagline: "Featherlight Korean-style daily wear.",
    heritage: "American/Korean", vibe: "Soft, doll-eye, Korean-influenced, hypoallergenic",
    notable: "Cashmere, Mochi, Snowflake", priceRange: "$$ — $20-25" },
  { id: "glamnetic", name: "Glamnetic", tagline: "Magnetic lash pioneers.",
    heritage: "American", vibe: "Magnetic eyeliner system, no-glue convenience",
    notable: "Virgo, Aries, Cancer", priceRange: "$$ — $25-35" },
];

export const lashStyles: LashStyle[] = [
  { id: "natural", name: "Natural", blurb: "Soft, light, mascara-extension energy. Like you, but better.",
    bestFor: "Daily wear, no-makeup looks, soft glam.",
    difficulty: "Beginner", finish: "Natural", swatch: "from-rose-200 via-pink-200 to-orange-100",
    tags: ["natural", "soft", "no-makeup", "soft glam", "clean girl", "beginner", "office", "bridal", "minimal"] },
  { id: "wispy", name: "Wispy", blurb: "Soft outer flare with criss-crossed wispy fibres — elevated daily wear.",
    bestFor: "Soft glam, festival, bridal, romantic looks.",
    difficulty: "Beginner", finish: "Wispy", swatch: "from-rose-300 via-pink-300 to-fuchsia-200",
    tags: ["wispy", "soft", "soft glam", "bridal", "romantic", "ethereal", "fairy", "festival", "indie sleaze"] },
  { id: "dramatic", name: "Dramatic", blurb: "Long, full and unmissable — turn-the-room lash.",
    bestFor: "Night out, hard glam, halloween, drag, smokey eye.",
    difficulty: "Intermediate", finish: "Dramatic", swatch: "from-violet-500 via-fuchsia-500 to-rose-500",
    tags: ["dramatic", "smokey", "hard glam", "halloween", "vampire", "devil", "siren", "drag", "advanced", "night out", "goth"] },
  { id: "fox-eye", name: "Fox-Eye", blurb: "Tapered outer lashes that lift the corner of the eye outward.",
    bestFor: "Foxy liner looks, modern editorial, snatched faces.",
    difficulty: "Intermediate", finish: "Wispy", swatch: "from-amber-400 via-orange-400 to-rose-400",
    tags: ["fox-eye", "foxy", "graphic", "editorial", "siren", "old money", "auburn", "warm"] },
  { id: "doll-eye", name: "Doll-Eye", blurb: "Longer in the centre to round and open the eye into a wide doll shape.",
    bestFor: "Doe-eye looks, douyin, pastel, romantic bridal.",
    difficulty: "Beginner", finish: "Wispy", swatch: "from-pink-300 via-rose-300 to-rose-200",
    tags: ["doll", "doe", "douyin", "pastel goth", "romantic", "ballet core", "soft", "bridal"] },
  { id: "cat-eye", name: "Cat-Eye", blurb: "Longer at the outer corner — sharpens and elongates the eye.",
    bestFor: "Cat-eye liner looks, halloween cat, editorial.",
    difficulty: "Beginner", finish: "Dramatic", swatch: "from-zinc-700 via-zinc-900 to-black",
    tags: ["cat", "cat-eye", "graphic", "halloween", "editorial", "trad goth", "sleek", "siren"] },
  { id: "manga", name: "Manga", blurb: "Spiky bottom lashes plus separated top lashes — anime doll energy.",
    bestFor: "Anime, douyin, gyaru, e-girl looks.",
    difficulty: "Advanced", finish: "Editorial", swatch: "from-indigo-500 via-violet-500 to-pink-400",
    tags: ["anime", "manga", "douyin", "gyaru", "egirl", "graphic", "advanced", "halloween"] },
  { id: "fluffy", name: "Fluffy", blurb: "Multi-layered fluffy lashes for a cloud-like volume without weight.",
    bestFor: "Soft glam, fairy, romantic, daily wear.",
    difficulty: "Beginner", finish: "Wispy", swatch: "from-violet-200 via-pink-200 to-rose-200",
    tags: ["fluffy", "soft", "fairy", "romantic", "soft glam", "ethereal", "ballet core", "bridal"] },
  { id: "hybrid", name: "Hybrid", blurb: "Mix of classic and volume — versatile day-to-night.",
    bestFor: "Most looks. The Swiss Army knife of lashes.",
    difficulty: "Intermediate", finish: "Wispy", swatch: "from-rose-400 via-pink-400 to-fuchsia-300",
    tags: ["hybrid", "soft glam", "night out", "festival", "bridal", "office"] },
  { id: "mega-volume", name: "Mega Volume", blurb: "Stacked, dense, jet-black — maximum impact.",
    bestFor: "Hard glam, drag, night out, halloween.",
    difficulty: "Advanced", finish: "Dramatic", swatch: "from-black via-zinc-800 to-zinc-900",
    tags: ["mega volume", "dramatic", "drag", "hard glam", "halloween", "advanced", "night out", "goth"] },
  { id: "wet-look", name: "Wet-Look", blurb: "Glossed, clumped lashes for the just-cried editorial moment.",
    bestFor: "Editorial, indie sleaze, grunge, soft goth.",
    difficulty: "Intermediate", finish: "Editorial", swatch: "from-cyan-400 via-blue-400 to-indigo-400",
    tags: ["wet-look", "editorial", "indie sleaze", "grunge", "soft goth", "advanced"] },
];

// ── Tag matcher ────────────────────────────────────────────────────────

export interface LookLike {
  name?: string;
  mood?: string;
  era?: string;
  difficulty?: string;
  description?: string;
  tags?: string[];
}

/** Score how well a lash style matches a given look-shaped object.
 * The score is the count of overlapping normalised tokens between the
 * lash's `tags` and the look's name/mood/era/description/tags. */
export function scoreLashForLook(lash: LashStyle, look: LookLike): number {
  const haystack = [
    look.name, look.mood, look.era, look.difficulty, look.description,
    ...(look.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  let score = 0;
  for (const tag of lash.tags) {
    if (haystack.includes(tag.toLowerCase())) score += 1;
  }
  return score;
}

export function recommendLashesForLook(look: LookLike, limit = 3): LashStyle[] {
  return [...lashStyles]
    .map((l) => ({ l, s: scoreLashForLook(l, look) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .slice(0, limit)
    .map((x) => x.l);
}

export function recommendLooksForLash<T extends LookLike>(lash: LashStyle, candidates: T[], limit = 6): T[] {
  return [...candidates]
    .map((l) => ({ l, s: scoreLashForLook(lash, l) }))
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.s > 0)
    .slice(0, limit)
    .map((x) => x.l);
}
