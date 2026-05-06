// Curated skin-nutrition catalogue: foods, vitamins, minerals, and
// supplements with documented benefits for skin/hair/nails. Sourced from
// peer-reviewed dermatology + nutrition literature (the page surfaces a
// "not medical advice" disclaimer). Imagery lives under
// `public/nutrition/<id>.<ext>`.

export const SKIN_CONCERNS = [
  "glow",
  "acne",
  "hydration",
  "anti-aging",
  "sensitivity",
  "hyperpigmentation",
  "hair-nails",
  "gut-skin",
] as const;
export type SkinConcern = typeof SKIN_CONCERNS[number];

export const CONCERN_LABELS: Record<SkinConcern, string> = {
  "glow":              "Glow",
  "acne":              "Clear skin",
  "hydration":         "Hydration",
  "anti-aging":        "Anti-aging",
  "sensitivity":       "Calm + soothe",
  "hyperpigmentation": "Even tone",
  "hair-nails":        "Hair + nails",
  "gut-skin":          "Gut–skin axis",
};

export const CONCERN_EMOJI: Record<SkinConcern, string> = {
  "glow":              "✨",
  "acne":              "🌿",
  "hydration":         "💧",
  "anti-aging":        "🌸",
  "sensitivity":       "🌷",
  "hyperpigmentation": "🍊",
  "hair-nails":        "💅",
  "gut-skin":          "🌱",
};

export const NUTRITION_KINDS = ["food", "vitamin", "mineral", "supplement"] as const;
export type NutritionKind = typeof NUTRITION_KINDS[number];

export const KIND_LABELS: Record<NutritionKind, string> = {
  food:       "Foods",
  vitamin:    "Vitamins",
  mineral:    "Minerals",
  supplement: "Supplements",
};

export interface NutritionItem {
  id: string;
  name: string;
  kind: NutritionKind;
  /** One-line punchy summary for the card. */
  summary: string;
  /** 2–3 sentence longer explanation, shown on tap. */
  detail: string;
  concerns: SkinConcern[];
  /** "Eat 2-3 cups/week" or "RDA: 75 mg/day" — practical guidance. */
  dose: string;
  /** Public path under artifacts/glamr/public. */
  image: string;
  /** Tailwind gradient backdrop for the card. */
  swatch: string;
}

// Helper: build the image path with a fallback extension placeholder.
// Real paths populated by image-search at build time, but until then
// we use the slug-based convention — Tools.tsx-style graceful 404 in UI.
const img = (id: string, ext = "jpg") => `/nutrition/${id}.${ext}`;

export const NUTRITION: NutritionItem[] = [
  // ── Foods ───────────────────────────────────────────────────────────
  {
    id: "salmon",
    name: "Wild salmon",
    kind: "food",
    summary: "Omega-3 fatty acids for plump, hydrated skin.",
    detail: "EPA and DHA reinforce the skin barrier, reduce inflammation that drives breakouts, and support natural ceramide production. Pair with leafy greens for a complete glow plate.",
    concerns: ["hydration", "anti-aging", "acne"],
    dose: "2–3 servings (3–4 oz) per week.",
    image: img("salmon"),
    swatch: "from-rose-300 to-orange-400",
  },
  {
    id: "avocado",
    name: "Avocado",
    kind: "food",
    summary: "Vitamin E + healthy fats for a dewy finish.",
    detail: "The fatty acids in avocado help your skin hold water, while vitamin E neutralises UV-induced free radicals. Half a fruit a day is the sweet spot in clinical studies.",
    concerns: ["hydration", "glow", "anti-aging"],
    dose: "Half an avocado daily.",
    image: img("avocado"),
    swatch: "from-emerald-300 to-lime-400",
  },
  {
    id: "blueberries",
    name: "Blueberries",
    kind: "food",
    summary: "Anthocyanins fight oxidative stress.",
    detail: "Frozen or fresh, blueberries are one of the most antioxidant-dense foods on earth. Anthocyanins help blunt the collagen-damaging oxidation triggered by UV and pollution.",
    concerns: ["anti-aging", "glow"],
    dose: "½ cup, 4–5 days a week.",
    image: img("blueberries"),
    swatch: "from-violet-400 to-indigo-500",
  },
  {
    id: "sweet-potato",
    name: "Sweet potato",
    kind: "food",
    summary: "Beta-carotene for warm, even tone.",
    detail: "Your body converts beta-carotene into vitamin A (retinol) — the same molecule dermatologists use topically to fade hyperpigmentation and smooth texture from the inside out.",
    concerns: ["hyperpigmentation", "glow", "anti-aging"],
    dose: "1 medium sweet potato 2–3×/week.",
    image: img("sweet-potato"),
    swatch: "from-orange-400 to-amber-500",
  },
  {
    id: "spinach",
    name: "Spinach",
    kind: "food",
    summary: "Folate + iron + lutein triple threat.",
    detail: "Iron deficiency is one of the most under-diagnosed causes of dull skin and brittle nails in women under 35. Spinach pairs iron with vitamin C for absorption and lutein for blue-light defence.",
    concerns: ["glow", "hair-nails"],
    dose: "2 cups raw daily, or 1 cup cooked.",
    image: img("spinach"),
    swatch: "from-green-400 to-emerald-600",
  },
  {
    id: "walnuts",
    name: "Walnuts",
    kind: "food",
    summary: "Plant omega-3 (ALA) + zinc.",
    detail: "A small handful covers the day's ALA — the plant precursor to EPA — plus a meaningful dose of zinc, which is a non-negotiable for clear skin.",
    concerns: ["acne", "hydration", "hair-nails"],
    dose: "Small handful (~28 g) daily.",
    image: img("walnuts"),
    swatch: "from-amber-500 to-stone-600",
  },
  {
    id: "green-tea",
    name: "Green tea",
    kind: "food",
    summary: "EGCG calms redness and shields from UV.",
    detail: "The polyphenol EGCG has been shown in trials to reduce UV-induced erythema and slow the breakdown of collagen. Iced or hot — both work.",
    concerns: ["sensitivity", "anti-aging", "acne"],
    dose: "2–3 cups daily (caffeine permitting).",
    image: img("green-tea", "png"),
    swatch: "from-emerald-400 to-teal-500",
  },
  {
    id: "tomato",
    name: "Cooked tomato",
    kind: "food",
    summary: "Lycopene = internal SPF support.",
    detail: "Cooking tomatoes (think sauce, soup, roasted) makes lycopene 4× more bioavailable. Doesn't replace SPF but adds a measurable layer of UV defence.",
    concerns: ["anti-aging", "hyperpigmentation"],
    dose: "½ cup cooked, 4×/week.",
    image: img("tomato"),
    swatch: "from-red-400 to-rose-500",
  },
  {
    id: "kefir",
    name: "Kefir",
    kind: "food",
    summary: "Live probiotics for the gut–skin axis.",
    detail: "Emerging research links a diverse gut microbiome to fewer breakouts, less rosacea, and stronger barrier function. Kefir packs more strains than yogurt.",
    concerns: ["gut-skin", "acne"],
    dose: "½–1 cup daily.",
    image: img("kefir"),
    swatch: "from-pink-200 to-rose-400",
  },
  {
    id: "bone-broth",
    name: "Bone broth",
    kind: "food",
    summary: "Whole-food collagen + glycine.",
    detail: "Slow-simmered broth delivers collagen peptides plus the amino acid glycine, which supports your body's own collagen synthesis. A cosier alternative to powdered collagen.",
    concerns: ["anti-aging", "hair-nails"],
    dose: "1 cup (250 ml) daily.",
    image: img("bone-broth"),
    swatch: "from-amber-300 to-orange-500",
  },

  // ── Vitamins ────────────────────────────────────────────────────────
  {
    id: "vit-c",
    name: "Vitamin C",
    kind: "vitamin",
    summary: "Brightens, evens tone, builds collagen.",
    detail: "Required as a co-factor for the enzymes that build collagen. Topical + oral together are the gold-standard combo for fading post-acne marks and dark spots over 8–12 weeks.",
    concerns: ["hyperpigmentation", "glow", "anti-aging"],
    dose: "75–90 mg/day from food + supplement.",
    image: img("vit-c", "png"),
    swatch: "from-orange-400 to-yellow-500",
  },
  {
    id: "vit-d",
    name: "Vitamin D3",
    kind: "vitamin",
    summary: "Barrier function + immune calm.",
    detail: "Most women under 35 are insufficient. Adequate D3 helps regulate the inflammatory loops behind eczema, rosacea, and acne. Test, then supplement to a level of 50–80 ng/mL.",
    concerns: ["sensitivity", "acne", "hair-nails"],
    dose: "1000–2000 IU/day (test first).",
    image: img("vit-d"),
    swatch: "from-amber-300 to-yellow-400",
  },
  {
    id: "vit-a",
    name: "Vitamin A",
    kind: "vitamin",
    summary: "Cell turnover from the inside.",
    detail: "Vitamin A normalises keratinisation — the same mechanism that makes retinol work topically. Best from food (liver, eggs, sweet potato) rather than mega-doses.",
    concerns: ["acne", "anti-aging", "hyperpigmentation"],
    dose: "700 mcg RAE/day.",
    image: img("vit-a"),
    swatch: "from-orange-300 to-rose-400",
  },
  {
    id: "vit-e",
    name: "Vitamin E",
    kind: "vitamin",
    summary: "Lipid-soluble antioxidant for the barrier.",
    detail: "Sits in cell membranes and quenches the lipid peroxidation that ages skin. Synergises with vitamin C — take them together.",
    concerns: ["anti-aging", "hydration"],
    dose: "15 mg/day (food preferred).",
    image: img("vit-e"),
    swatch: "from-yellow-300 to-amber-500",
  },
  {
    id: "biotin",
    name: "Biotin (B7)",
    kind: "vitamin",
    summary: "Hair shaft strength + nail growth.",
    detail: "True biotin deficiency is rare, but supplementation has been shown to thicken brittle nails after ~6 months. Skip if doing thyroid or troponin blood tests — biotin skews results.",
    concerns: ["hair-nails"],
    dose: "30–100 mcg/day.",
    image: img("biotin"),
    swatch: "from-amber-200 to-orange-300",
  },
  {
    id: "niacinamide-oral",
    name: "Niacinamide (B3)",
    kind: "vitamin",
    summary: "Reduces redness and oil production.",
    detail: "500 mg twice daily has been shown to reduce non-melanoma skin cancer recurrence and tame inflammatory acne lesions. The oral form complements topical niacinamide serums.",
    concerns: ["acne", "sensitivity", "anti-aging"],
    dose: "500 mg twice daily.",
    image: img("niacinamide-oral"),
    swatch: "from-rose-300 to-pink-500",
  },

  // ── Minerals ────────────────────────────────────────────────────────
  {
    id: "zinc",
    name: "Zinc",
    kind: "mineral",
    summary: "The clear-skin mineral.",
    detail: "Multiple meta-analyses show zinc reduces inflammatory acne lesion counts. Take with food to avoid nausea, and don't exceed 40 mg long-term — it crowds out copper.",
    concerns: ["acne", "hair-nails"],
    dose: "15–30 mg/day with food.",
    image: img("zinc", "webp"),
    swatch: "from-stone-400 to-zinc-600",
  },
  {
    id: "selenium",
    name: "Selenium",
    kind: "mineral",
    summary: "Antioxidant enzyme cofactor.",
    detail: "Powers glutathione peroxidase — your body's master antioxidant enzyme. Two Brazil nuts a day is the easiest way to hit your RDA.",
    concerns: ["anti-aging", "glow"],
    dose: "55 mcg/day (≈ 2 Brazil nuts).",
    image: img("selenium"),
    swatch: "from-amber-700 to-stone-700",
  },
  {
    id: "iron",
    name: "Iron",
    kind: "mineral",
    summary: "For dull skin + brittle hair.",
    detail: "Low ferritin is a hidden cause of pale, lacklustre skin and shedding hair in menstruating women. Test ferritin (ideal 50–100 ng/mL) before supplementing — too much iron is harmful.",
    concerns: ["glow", "hair-nails"],
    dose: "18 mg/day (test first).",
    image: img("iron", "png"),
    swatch: "from-red-500 to-rose-700",
  },
  {
    id: "magnesium",
    name: "Magnesium",
    kind: "mineral",
    summary: "Sleep, stress, hormonal acne.",
    detail: "Magnesium glycinate calms the cortisol axis at night — and cortisol is one of the biggest drivers of hormonal breakouts and dull mornings. Bonus: better sleep = better skin.",
    concerns: ["acne", "sensitivity", "anti-aging"],
    dose: "300–400 mg glycinate at night.",
    image: img("magnesium"),
    swatch: "from-violet-300 to-purple-500",
  },

  // ── Supplements (combos / actives) ──────────────────────────────────
  {
    id: "collagen-peptides",
    name: "Collagen peptides",
    kind: "supplement",
    summary: "Hydrolysed collagen for elasticity.",
    detail: "RCTs show 2.5–10 g/day of hydrolysed collagen peptides for 8+ weeks improves skin elasticity and hydration. Choose marine or grass-fed bovine; mix into coffee or smoothies.",
    concerns: ["anti-aging", "hydration", "hair-nails"],
    dose: "5–10 g daily for 12+ weeks.",
    image: img("collagen-peptides"),
    swatch: "from-pink-300 to-rose-500",
  },
  {
    id: "hyaluronic-oral",
    name: "Oral hyaluronic acid",
    kind: "supplement",
    summary: "Pulls water into the dermis.",
    detail: "Low-MW hyaluronic acid (120 mg/day) has clinical data for reducing fine wrinkles after 12 weeks. Pair with adequate water intake — it can't hydrate what isn't there.",
    concerns: ["hydration", "anti-aging"],
    dose: "120–200 mg/day.",
    image: img("hyaluronic-oral"),
    swatch: "from-sky-300 to-blue-500",
  },
  {
    id: "omega-3",
    name: "Omega-3 (EPA/DHA)",
    kind: "supplement",
    summary: "Inflammation, redness, barrier.",
    detail: "If you don't eat fatty fish 2–3×/week, supplement 1–2 g of combined EPA + DHA. Look for IFOS-certified for purity. Calms inflammatory acne and rosacea over 8+ weeks.",
    concerns: ["acne", "sensitivity", "hydration"],
    dose: "1000–2000 mg EPA+DHA daily.",
    image: img("omega-3"),
    swatch: "from-cyan-400 to-teal-600",
  },
  {
    id: "probiotic",
    name: "Multi-strain probiotic",
    kind: "supplement",
    summary: "Diverse strains for the gut–skin axis.",
    detail: "Look for strains with skin data: L. paracasei, L. rhamnosus, B. lactis, B. longum. 10–25 billion CFU is plenty — more isn't better.",
    concerns: ["gut-skin", "acne", "sensitivity"],
    dose: "10–25 billion CFU/day.",
    image: img("probiotic"),
    swatch: "from-pink-300 to-fuchsia-500",
  },
  {
    id: "astaxanthin",
    name: "Astaxanthin",
    kind: "supplement",
    summary: "Most potent natural carotenoid.",
    detail: "Sourced from microalgae; ~500× more potent than vitamin E in some assays. Trials show 4–12 mg/day for 8 weeks improves skin moisture and reduces fine lines.",
    concerns: ["anti-aging", "hydration", "hyperpigmentation"],
    dose: "4–12 mg/day with a fatty meal.",
    image: img("astaxanthin", "png"),
    swatch: "from-rose-500 to-red-600",
  },
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    kind: "supplement",
    summary: "Adaptogen for stress-driven breakouts.",
    detail: "An evidence-based adaptogen that lowers cortisol — the hormone behind jaw-line hormonal acne. Pair with magnesium at night.",
    concerns: ["acne", "sensitivity"],
    dose: "300–600 mg KSM-66 daily.",
    image: img("ashwagandha"),
    swatch: "from-amber-500 to-orange-700",
  },
  {
    id: "spearmint-tea",
    name: "Spearmint tea",
    kind: "supplement",
    summary: "Anti-androgen for hormonal acne.",
    detail: "Two cups daily for 30 days has shown a measurable drop in free testosterone and acne lesion counts in women with PCOS-pattern breakouts.",
    concerns: ["acne"],
    dose: "2 cups daily.",
    image: img("spearmint-tea"),
    swatch: "from-emerald-300 to-teal-400",
  },
  {
    id: "evening-primrose",
    name: "Evening primrose oil",
    kind: "supplement",
    summary: "GLA for cyclical dryness + eczema.",
    detail: "The gamma-linolenic acid in EPO supports the skin lipid barrier — particularly helpful for eczema-prone or PMS-cycle dryness.",
    concerns: ["sensitivity", "hydration"],
    dose: "500–1000 mg/day.",
    image: img("evening-primrose"),
    swatch: "from-yellow-300 to-amber-400",
  },
  {
    id: "saw-palmetto",
    name: "Saw palmetto",
    kind: "supplement",
    summary: "Hair shedding from androgen sensitivity.",
    detail: "A natural 5-alpha reductase inhibitor that may help slow androgenetic hair thinning. Talk to a doctor first — it's a real hormonal modulator.",
    concerns: ["hair-nails"],
    dose: "160–320 mg/day.",
    image: img("saw-palmetto", "png"),
    swatch: "from-amber-600 to-stone-700",
  },
];

export function nutritionForConcern(c: SkinConcern): NutritionItem[] {
  return NUTRITION.filter((n) => n.concerns.includes(c));
}
