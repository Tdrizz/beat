import type { Look } from "./looks";

export type GothSubcategory =
  | "trad-goth"
  | "soft-goth"
  | "pastel-goth"
  | "egirl-goth"
  | "cyber-goth"
  | "romantic-goth";

export const GOTH_SUBCATEGORY_LABELS: Record<GothSubcategory, string> = {
  "trad-goth":      "Trad Goth",
  "soft-goth":      "Soft Goth",
  "pastel-goth":    "Pastel Goth",
  "egirl-goth":     "E-Girl Goth",
  "cyber-goth":     "Cyber Goth",
  "romantic-goth":  "Romantic Goth",
};

export interface GothLook extends Look {
  subcategory: GothSubcategory;
  tags: string[];
}

type GothSeed = {
  id: string; name: string; subcategory: GothSubcategory;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  mood: string; time: string; blurb: string;
  base: [string, string, string];
  eyes: [string, string, string];
  brows: [string, string, string];
  lips: [string, string, string];
  cheeks: [string, string, string];
  palette: [string, string, string];
  tags: string[];
};

const mk = (s: GothSeed): GothLook => ({
  id: `goth-${s.id}`,
  name: s.name,
  mood: s.mood,
  difficulty: s.difficulty,
  era: GOTH_SUBCATEGORY_LABELS[s.subcategory],
  timeEstimate: s.time,
  description: s.blurb,
  steps: {
    base:   { id: "base",   name: "Base",   instruction: s.base[0],   color: s.base[1],   colorName: s.base[2] },
    eyes:   { id: "eyes",   name: "Eyes",   instruction: s.eyes[0],   color: s.eyes[1],   colorName: s.eyes[2] },
    brows:  { id: "brows",  name: "Brows",  instruction: s.brows[0],  color: s.brows[1],  colorName: s.brows[2] },
    lips:   { id: "lips",   name: "Lips",   instruction: s.lips[0],   color: s.lips[1],   colorName: s.lips[2] },
    cheeks: { id: "cheeks", name: "Cheeks", instruction: s.cheeks[0], color: s.cheeks[1], colorName: s.cheeks[2] },
  },
  palette: s.palette,
  subcategory: s.subcategory,
  tags: s.tags,
});

const RAW: GothSeed[] = [
  // ── Trad Goth ──────────────────────────────────────────────────────
  { id: "trad-classic", name: "Trad Goth Classic", subcategory: "trad-goth", difficulty: "Intermediate",
    mood: "Iconic", time: "25 min",
    blurb: "Bauhaus-era chalky pale skin, smoked black eye, sharp wing, deep matte black lip — the original.",
    base: ["Pale matte foundation 1-2 shades lighter than your tone.", "#e8d8d0", "Trad Pale"],
    eyes: ["Black shadow blended all over the lid + sharp wing.", "#0a0a0a", "Bauhaus Black"],
    brows: ["Defined, sharp, dark.", "#1a1010", "Sharp"],
    lips: ["Matte true black.", "#0a0a0a", "Trad Black"],
    cheeks: ["Pale, no blush.", "#d8c8c0", "None"],
    palette: ["#0a0a0a", "#1a1010", "#e8d8d0"], tags: ["goth", "trad goth", "smokey", "graphic"] },
  { id: "trad-spider", name: "Spider Lash Goth", subcategory: "trad-goth", difficulty: "Advanced",
    mood: "Dramatic", time: "35 min",
    blurb: "Spider-leg lashes painted under the eye, jet black smoke, blood-red lip — Robert Smith of The Cure energy.",
    base: ["Chalky pale base, white powder centred.", "#e8dcd0", "Cure White"],
    eyes: ["Jet black smoke + 5-6 painted spider-leg lashes radiating from under the eye.", "#0a0a0a", "Spider Black"],
    brows: ["Sharp, slightly arched, dark.", "#1a0a0a", "Sharp Arch"],
    lips: ["Smudged red painted unevenly across the lips.", "#9a0a18", "Smudged Red"],
    cheeks: ["Pale, no blush, hollow grey under cheekbone.", "#807078", "Hollow"],
    palette: ["#0a0a0a", "#9a0a18", "#807078"], tags: ["goth", "trad goth", "dramatic", "smokey"] },

  // ── Soft Goth ──────────────────────────────────────────────────────
  { id: "soft-violet", name: "Soft Goth Violet", subcategory: "soft-goth", difficulty: "Beginner",
    mood: "Moody", time: "15 min",
    blurb: "Smudged violet smoke, soft brushed brow, dark berry lip — daytime goth.",
    base: ["Soft satin foundation.", "#dcc4b0", "Soft Satin"],
    eyes: ["Smudged grey-violet shadow blended around the eye.", "#604858", "Soft Violet"],
    brows: ["Brushed up, soft.", "#3a2818", "Soft"],
    lips: ["Berry-stained tinted balm.", "#7a2838", "Berry"],
    cheeks: ["Cool plum sculpt under the cheekbone.", "#a07880", "Plum Sculpt"],
    palette: ["#604858", "#7a2838", "#a07880"], tags: ["goth", "soft goth", "soft", "muted"] },
  { id: "soft-mauve", name: "Soft Goth Mauve", subcategory: "soft-goth", difficulty: "Beginner",
    mood: "Romantic", time: "15 min",
    blurb: "Mauve-rose smoke, glossy berry lip, gentle lift — the goth for tea dates.",
    base: ["Luminous satin foundation.", "#e0c8b0", "Luminous Satin"],
    eyes: ["Mauve and rose shadow softly blended.", "#a07080", "Mauve Rose"],
    brows: ["Brushed up, soft.", "#3a2010", "Soft"],
    lips: ["Glossy berry tinted balm.", "#9a3848", "Berry Gloss"],
    cheeks: ["Cool berry blush.", "#c87080", "Berry Flush"],
    palette: ["#a07080", "#9a3848", "#c87080"], tags: ["goth", "soft goth", "soft", "romantic"] },

  // ── Pastel Goth ────────────────────────────────────────────────────
  { id: "pastel-lilac", name: "Pastel Goth Lilac", subcategory: "pastel-goth", difficulty: "Beginner",
    mood: "Dreamy", time: "20 min",
    blurb: "Lilac shadow with a sharp black wing, pastel lip — sweet and sour.",
    base: ["Pale dewy base.", "#f0d8c8", "Pale Dewy"],
    eyes: ["Lilac pastel shadow with a sharp jet black wing.", "#c8a8d8", "Lilac Wing"],
    brows: ["Brushed up, soft.", "#3a2010", "Soft"],
    lips: ["Glossy lilac-pink.", "#d098b8", "Lilac Lip"],
    cheeks: ["Cool pink cream.", "#e8a8c8", "Pastel Pink"],
    palette: ["#c8a8d8", "#d098b8", "#e8a8c8"], tags: ["goth", "pastel goth", "soft", "graphic"] },
  { id: "pastel-mint", name: "Pastel Goth Mint", subcategory: "pastel-goth", difficulty: "Beginner",
    mood: "Playful", time: "20 min",
    blurb: "Mint shadow, sharp black liner, glossy black lip — pastel meets edgy.",
    base: ["Pale dewy base.", "#f0e0d0", "Pale"],
    eyes: ["Mint pastel shadow with a sharp jet black wing.", "#a8c8b8", "Mint"],
    brows: ["Brushed up, soft.", "#3a2010", "Soft"],
    lips: ["Glossy black.", "#0a0a0a", "Glossy Black"],
    cheeks: ["Cool pink blush.", "#d8a8b8", "Pink"],
    palette: ["#a8c8b8", "#0a0a0a", "#d8a8b8"], tags: ["goth", "pastel goth", "graphic", "playful"] },

  // ── E-Girl Goth ─────────────────────────────────────────────────────
  { id: "egirl-classic", name: "E-Girl Classic", subcategory: "egirl-goth", difficulty: "Beginner",
    mood: "Cute", time: "15 min",
    blurb: "Heavy blush 'sunburn' across the nose, sharp winged liner, glossy lip, drawn-on heart on the cheek.",
    base: ["Dewy pale base.", "#f0d0c0", "Dewy Pale"],
    eyes: ["Sharp black liner wing.", "#0a0a0a", "Black Liner"],
    brows: ["Soft, brushed up.", "#3a2010", "Soft"],
    lips: ["Glossy mauve-pink.", "#c08898", "Mauve Gloss"],
    cheeks: ["Heavy pink blush across the apples and bridge of the nose + drawn-on heart on the cheek.", "#e87898", "E-Girl Sunburn"],
    palette: ["#0a0a0a", "#c08898", "#e87898"], tags: ["goth", "egirl", "tiktok", "cute"] },
  { id: "egirl-grunge", name: "E-Girl Grunge", subcategory: "egirl-goth", difficulty: "Intermediate",
    mood: "Edgy", time: "20 min",
    blurb: "Smudged kohl liner, dark berry lip, heavy pink blush — TikTok grunge sweetheart.",
    base: ["Pale satin base.", "#e8d0c0", "Pale Satin"],
    eyes: ["Smudged black kohl all the way around the eye.", "#1a1010", "Smudged Kohl"],
    brows: ["Defined, soft.", "#3a2010", "Defined"],
    lips: ["Dark berry-stained matte.", "#5a1828", "Berry Matte"],
    cheeks: ["Heavy pink blush across the apples and nose.", "#e87898", "Pink Sunburn"],
    palette: ["#1a1010", "#5a1828", "#e87898"], tags: ["goth", "egirl", "grunge", "soft"] },

  // ── Cyber Goth ──────────────────────────────────────────────────────
  { id: "cyber-neon", name: "Cyber Goth Neon", subcategory: "cyber-goth", difficulty: "Advanced",
    mood: "Rave", time: "35 min",
    blurb: "Neon UV liner shapes outside the eye, jet black smoke base, glossy black lip — warehouse rave goth.",
    base: ["Pale matte base.", "#e8d0c0", "Pale Matte"],
    eyes: ["Black smoke + UV neon green and pink graphic liner painted in geometric shapes outside the eye.", "#e0e040", "UV Neon"],
    brows: ["Bleached or covered, redrawn sharply higher in neon pink.", "#e040a0", "Neon Pink Brow"],
    lips: ["Glossy black.", "#0a0a0a", "Black Gloss"],
    cheeks: ["Sharp cool sculpt.", "#705870", "Sculpt"],
    palette: ["#e0e040", "#e040a0", "#0a0a0a"], tags: ["goth", "cyber goth", "neon", "graphic"] },
  { id: "cyber-chrome", name: "Cyber Goth Chrome", subcategory: "cyber-goth", difficulty: "Advanced",
    mood: "Futuristic", time: "35 min",
    blurb: "Mirror-silver lid, black geometric circuit lines extending from the temple, glossy chrome lip.",
    base: ["Cool dewy base + silver strobe.", "#dcd0c8", "Cyber Cool"],
    eyes: ["Mirror silver shimmer + thin black circuit lines extending outward.", "#c8c8d0", "Mirror Silver"],
    brows: ["Sleek, sharp, slightly thinner.", "#1a0a08", "Cyber Sharp"],
    lips: ["Glossy chrome silver.", "#a8a8b0", "Chrome"],
    cheeks: ["Cool sculpt + silver strobe.", "#806878", "Cyber Sculpt"],
    palette: ["#c8c8d0", "#a8a8b0", "#806878"], tags: ["goth", "cyber goth", "futuristic", "graphic"] },

  // ── Romantic Goth ───────────────────────────────────────────────────
  { id: "romantic-rose", name: "Romantic Goth Rose", subcategory: "romantic-goth", difficulty: "Intermediate",
    mood: "Sultry", time: "25 min",
    blurb: "Smouldering wine smoke, deep oxblood lip, ivory porcelain skin — Victorian romance with fangs.",
    base: ["Pale luminous porcelain base.", "#f0e0d0", "Porcelain"],
    eyes: ["Deep wine smoked all around the eye, glossy in the centre.", "#5a1828", "Wine Smoke"],
    brows: ["Defined, soft arch.", "#2a1818", "Defined"],
    lips: ["Deep oxblood matte.", "#5a0818", "Oxblood"],
    cheeks: ["Cool plum sculpt.", "#80505a", "Plum Sculpt"],
    palette: ["#5a1828", "#5a0818", "#80505a"], tags: ["goth", "romantic goth", "vampire", "smokey"] },
  { id: "romantic-velvet", name: "Romantic Goth Velvet", subcategory: "romantic-goth", difficulty: "Intermediate",
    mood: "Velvet", time: "25 min",
    blurb: "Black-cherry smoke, glossy black-cherry lip, brushed-up brow — the velvet curtain look.",
    base: ["Luminous satin foundation.", "#e8d0c0", "Velvet Satin"],
    eyes: ["Black cherry shadow smoked all around the eye.", "#3a0818", "Black Cherry"],
    brows: ["Brushed up, soft.", "#3a2010", "Brushed"],
    lips: ["Glossy black cherry.", "#3a0818", "Cherry Gloss"],
    cheeks: ["Berry sculpt.", "#a06070", "Berry Sculpt"],
    palette: ["#3a0818", "#a06070", "#e8d0c0"], tags: ["goth", "romantic goth", "smokey", "vampire"] },
];

export const gothLooks: GothLook[] = RAW.map(mk);

export function gothLooksByCategory(cat: GothSubcategory): GothLook[] {
  return gothLooks.filter((l) => l.subcategory === cat);
}
