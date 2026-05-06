// ── Skincare data ──────────────────────────────────────────────────────────────

export type SkinType = "Oily" | "Dry" | "Combination" | "Sensitive" | "Normal";
export type Concern = "Anti-Aging" | "Brightening" | "Hydration" | "Acne" | "Pores" | "Texture" | "Pigmentation" | "Redness";
export type RoutineTime = "Morning" | "Evening" | "Weekly";

// ── Routine Steps ─────────────────────────────────────────────────────────────

export interface RoutineStep {
  id: string;
  step: number;
  name: string;
  why: string;
  how: string;
  duration: string;
  tip: string;
  skinTypes: SkinType[];
  time: RoutineTime[];
  productCategory: string;
  icon: string;
}

export const morningRoutine: RoutineStep[] = [
  {
    id: "m1-cleanser",
    step: 1,
    name: "Gentle Cleanser",
    why: "Removes overnight sebum, any residual products, and prepares skin to absorb the layers that follow.",
    how: "Dampen face with lukewarm water (never hot — it strips the skin barrier). Apply a coin-sized amount, lather gently with fingertips using circular upward motions. Massage for 60 seconds. Rinse thoroughly. Pat dry with a clean cloth — never rub.",
    duration: "90 seconds",
    tip: "Cold water as your final rinse helps tighten pores slightly before the day.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Morning"],
    productCategory: "Cleanser",
    icon: "💧",
  },
  {
    id: "m2-toner",
    step: 2,
    name: "Hydrating Toner / Essence",
    why: "Balances skin pH after cleansing (which is slightly alkaline). Prepares skin to absorb serums more effectively. Can add the first layer of hydration.",
    how: "Pour a 5p/nickel-sized amount into clean palms or a cotton pad. For palms: press (don't rub) gently into face and neck. For cotton: swipe upward in gentle strokes. Layer 2-3 times for extra hydration if needed (the 7-skin method).",
    duration: "30 seconds",
    tip: "Look for hydrating toners (hyaluronic acid, glycerin) in the morning. Avoid alcohol-based toners which can be too stripping.",
    skinTypes: ["Dry", "Combination", "Normal", "Sensitive"],
    time: ["Morning"],
    productCategory: "Toner",
    icon: "✨",
  },
  {
    id: "m3-vitamin-c",
    step: 3,
    name: "Vitamin C Serum",
    why: "The most important morning antioxidant. Protects against UV and pollution damage, brightens existing pigmentation, boosts collagen synthesis, and makes your SPF work better.",
    how: "Apply 3–5 drops to fingertips. Press gently onto face and neck. Give it 60 seconds to sink in before the next step. Do not mix with niacinamide or retinol (skin irritation risk — use at different times).",
    duration: "2 minutes (including absorption time)",
    tip: "Store Vitamin C serums away from light and heat — they oxidise quickly. A yellowing formula has degraded and should be replaced.",
    skinTypes: ["Oily", "Dry", "Combination", "Normal"],
    time: ["Morning"],
    productCategory: "Serum",
    icon: "🍊",
  },
  {
    id: "m4-moisturiser",
    step: 4,
    name: "Moisturiser",
    why: "Locks in the hydration from previous steps. Creates a barrier to prevent trans-epidermal water loss (TEWL) throughout the day.",
    how: "Take a pea-to-almond-sized amount depending on your skin type. Apply to face and neck using upward, outward strokes. Oily skin types can use a gel moisturiser. Dry types need a richer cream. Always moisturise even if oily — dehydrated oily skin overproduces sebum.",
    duration: "30 seconds",
    tip: "Apply while skin is still slightly damp from the previous step for enhanced moisture retention.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Morning"],
    productCategory: "Moisturiser",
    icon: "🌿",
  },
  {
    id: "m5-spf",
    step: 5,
    name: "Sunscreen SPF 30–50+",
    why: "The single most evidence-backed anti-aging and skin-cancer prevention step. UV exposure causes 80%+ of visible skin aging. No skincare routine is complete without it.",
    how: "Apply the '2 finger rule' — two finger-lengths of product for the face and neck alone. This is more than you think. Apply as the LAST skincare step before makeup. Reapply every 2 hours in direct sun.",
    duration: "1 minute",
    tip: "SPF only works at the right quantity. Under-applying cuts the protection dramatically. Try a tinted SPF to double as light foundation coverage.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Morning"],
    productCategory: "Sunscreen",
    icon: "☀️",
  },
];

export const eveningRoutine: RoutineStep[] = [
  {
    id: "e1-makeup-remover",
    step: 1,
    name: "Makeup Remover / Micellar Water",
    why: "Makeup — especially waterproof formulas — is not fully removed by regular cleansers alone. Micellar water uses surfactant micelles that attract and lift oil and pigment without stripping the barrier.",
    how: "Saturate a reusable cotton pad. Hold over closed eye for 10 seconds (this dissolves mascara without rubbing). Then gently swipe downward. For foundation: swipe across the face. Never rub aggressively — the skin around the eyes is 40% thinner than the rest of the face.",
    duration: "2 minutes",
    tip: "Double-cleansing is always more effective than single cleansing when you've worn full makeup: makeup remover first, then cleanser.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Evening"],
    productCategory: "Makeup Remover",
    icon: "🧹",
  },
  {
    id: "e2-cleanser",
    step: 2,
    name: "Deep Cleanser",
    why: "The second cleanse removes what the makeup remover left behind — residual cleanser, sebum, SPF, and environmental pollutants that accumulate throughout the day.",
    how: "You can use a slightly more active cleanser in the evening. Consider salicylic acid (oily/acne), gentle lactic acid (dry/texture), or amino acid cleansers (sensitive). Massage for 90 seconds minimum, focusing on the T-zone and around the nose where debris accumulates.",
    duration: "2 minutes",
    tip: "Cleansing for longer (up to 60 seconds) is proven to remove significantly more debris than a quick rinse.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Evening"],
    productCategory: "Cleanser",
    icon: "💫",
  },
  {
    id: "e3-exfoliant",
    step: 3,
    name: "Chemical Exfoliant (2–3x/week)",
    why: "AHAs (glycolic, lactic acid) exfoliate the skin surface, treating texture, dullness, and hyperpigmentation. BHAs (salicylic acid) penetrate pores to clear congestion. Enzymes (papaya, pineapple) are gentler alternatives.",
    how: "After cleansing, apply a thin layer to the face and neck. Do NOT use with retinol on the same evening (acids + retinol = irritation). Start with 1x per week and increase to 3x as skin tolerates. Always follow with moisturiser.",
    duration: "Leave on — not a wash-off",
    tip: "The skin tingling slightly is normal. Burning or stinging is a sign to rinse off and dilute. Lower strength more frequently is better than high strength occasionally.",
    skinTypes: ["Oily", "Combination", "Normal"],
    time: ["Evening"],
    productCategory: "Exfoliant",
    icon: "🔬",
  },
  {
    id: "e4-retinol",
    step: 4,
    name: "Retinol / Retinoid (alternate nights)",
    why: "The most scientifically proven anti-aging ingredient. Speeds cell turnover, stimulates collagen production, reduces wrinkles, fades pigmentation, and clears acne. Takes 12 weeks to see full results.",
    how: "Apply a pea-sized amount across the face only after moisturiser has been absorbed (the sandwich method reduces irritation). Start with retinol 0.025% or 0.05%. Do not use on alternate nights from your acid exfoliant. Always follow with moisturiser on top.",
    duration: "5 minutes (including buffering time)",
    tip: "Retinol makes skin photosensitive — always use SPF the following morning. The 'retinol uglies' (flaking, redness) in weeks 3–6 are normal and temporary.",
    skinTypes: ["Oily", "Normal", "Combination"],
    time: ["Evening"],
    productCategory: "Retinol",
    icon: "⚗️",
  },
  {
    id: "e5-night-moisturiser",
    step: 5,
    name: "Rich Night Moisturiser / Sleeping Mask",
    why: "Skin repairs and regenerates 3x faster at night. A richer moisturiser or occlusive sleeping mask traps water, supports the barrier repair process, and ensures you wake up with hydrated, plump skin.",
    how: "Apply a generous amount — more than your morning moisturiser — to face and neck. Sleeping masks can be applied on top. Do not rinse off. A humectant-occlusive combo (hyaluronic acid + shea/ceramides) is the most effective.",
    duration: "1 minute",
    tip: "The 'skin barrier' is your skin's protective shield. When it's damaged (tight, red, flaky after products), pause actives and focus on ceramide + niacinamide moisturisers for 2 weeks to rebuild it.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Evening"],
    productCategory: "Moisturiser",
    icon: "🌙",
  },
  {
    id: "e6-eye-cream",
    step: 6,
    name: "Eye Cream",
    why: "The periorbital area (around the eyes) is uniquely vulnerable — it has fewer sebaceous glands, is exposed to constant movement (blinking ~20,000 times/day), and shows aging earliest. Targeted eye cream addresses this.",
    how: "Take a grain-of-rice-sized amount on your ring finger (weakest finger = gentlest pressure). Tap in a circular motion around the entire orbital bone — starting from the inner corner, moving under the eye, and around the brow bone. Never apply directly to the lid or on the waterline.",
    duration: "30 seconds",
    tip: "Apply eye cream before your face moisturiser — it's a thinner, more targeted formula that should absorb into the delicate skin before richer products are layered over.",
    skinTypes: ["Oily", "Dry", "Combination", "Sensitive", "Normal"],
    time: ["Evening"],
    productCategory: "Eye Cream",
    icon: "👁️",
  },
];

export const weeklyTreatments: RoutineStep[] = [
  {
    id: "w1-clay-mask",
    step: 1,
    name: "Clay / Purifying Mask",
    why: "Clay (kaolin, bentonite, rhassoul) physically draws sebum and impurities from pores like a magnet. The most effective pore-clearing treatment for oily and acne-prone skin.",
    how: "Apply a thin, even layer to face avoiding the eye and lip area. Leave for 10–15 minutes — not until it cracks completely dry (this can over-strip). Rinse with lukewarm water using upward circular motions. Follow with toner and moisturiser.",
    duration: "15 minutes",
    tip: "Never leave clay mask until it's completely dry and cracking — this damages the skin barrier. Apply over areas of concern (T-zone) and leave a lighter layer over drier areas.",
    skinTypes: ["Oily", "Combination"],
    time: ["Weekly"],
    productCategory: "Face Mask",
    icon: "🌍",
  },
  {
    id: "w2-hydrating-mask",
    step: 2,
    name: "Hydrating Sheet Mask",
    why: "Sheet masks deliver a concentrated dose of humectant and soothing ingredients under an occlusive layer, creating a sealed chamber that drives active ingredients deeper into the skin.",
    how: "Cleanse and tone skin first. Open mask and apply, aligning with eyes, nose, and mouth. Press to remove air bubbles. Leave for exactly 15–20 minutes (not longer — ingredients re-absorb from skin after this time). Peel off and pat remaining essence into skin — do not rinse.",
    duration: "20 minutes",
    tip: "Keep sheet masks in the fridge for a de-puffing, cooling anti-inflammatory effect — especially helpful for redness-prone or post-workout skin.",
    skinTypes: ["Dry", "Combination", "Sensitive", "Normal"],
    time: ["Weekly"],
    productCategory: "Face Mask",
    icon: "🌊",
  },
  {
    id: "w3-scalp-facial",
    step: 3,
    name: "Facial Oil Treatment / Facial Massage",
    why: "Facial oils containing oleic and linoleic fatty acids reinforce the lipid barrier. Combined with gua sha or roller massage, they improve lymphatic drainage (reduces puffiness), increase circulation (promotes glow), and relax facial tension (reduces wrinkle formation from repeated expressions).",
    how: "Apply 3–5 drops of facial oil to palms and warm between hands. Press firmly onto face. Using clean gua sha: apply gentle-to-moderate pressure and glide upward along jawline, cheeks, forehead, and outward to temples. Each stroke: 3–5 times per area. Always stroke away from the nose.",
    duration: "10 minutes",
    tip: "The gua sha technique should never cause bruising. Moderate, comfortable pressure is all that's needed. Consistency matters more than intensity — 10 minutes weekly over 3 months produces visible structural changes.",
    skinTypes: ["Dry", "Combination", "Sensitive", "Normal"],
    time: ["Weekly"],
    productCategory: "Facial Oil",
    icon: "💎",
  },
];

// ── Ingredient Guide ─────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  category: "Hydrator" | "Exfoliant" | "Antioxidant" | "Cell-Turnover" | "Barrier" | "Brightener" | "Soothing";
  what: string;
  benefits: string[];
  bestFor: SkinType[];
  concerns: Concern[];
  howToUse: string;
  pairedWith: string[];
  avoidWith: string[];
  concentration: string;
  icon: string;
}

export const ingredients: Ingredient[] = [
  {
    id: "hyaluronic-acid",
    name: "Hyaluronic Acid (HA)",
    category: "Hydrator",
    what: "A naturally occurring polysaccharide that can hold 1,000x its weight in water. Your skin naturally contains HA but production decreases with age.",
    benefits: ["Deep hydration", "Plumps fine lines", "Improves elasticity", "Suitable for all skin types"],
    bestFor: ["Dry", "Normal", "Sensitive", "Combination", "Oily"],
    concerns: ["Hydration", "Anti-Aging"],
    howToUse: "Apply to damp skin (it needs water to attract moisture). Best in toners, serums, or moisturisers. Use morning and evening.",
    pairedWith: ["Vitamin C", "Niacinamide", "Peptides", "Retinol"],
    avoidWith: [],
    concentration: "0.1% – 2%",
    icon: "💧",
  },
  {
    id: "vitamin-c",
    name: "Vitamin C (L-Ascorbic Acid)",
    category: "Antioxidant",
    what: "The most powerful topical antioxidant. Fights free radical damage from UV/pollution, brightens skin, inhibits melanin production, and boosts collagen.",
    benefits: ["Brightening", "Antioxidant protection", "Fades dark spots", "Stimulates collagen", "Enhances SPF"],
    bestFor: ["Normal", "Combination", "Oily"],
    concerns: ["Brightening", "Pigmentation", "Anti-Aging"],
    howToUse: "Apply morning after cleansing, before moisturiser and SPF. Stable forms (ascorbyl glucoside, sodium ascorbyl phosphate) better for sensitive skin.",
    pairedWith: ["Hyaluronic Acid", "SPF", "Vitamin E", "Ferulic Acid"],
    avoidWith: ["Niacinamide (can cause flushing)", "AHAs/BHAs (increases irritation)", "Retinol"],
    concentration: "10% – 20%",
    icon: "🍊",
  },
  {
    id: "niacinamide",
    name: "Niacinamide (Vitamin B3)",
    category: "Brightener",
    what: "A water-soluble vitamin that addresses multiple skin concerns simultaneously — arguably the most versatile skincare ingredient.",
    benefits: ["Minimises pores", "Controls sebum", "Fades hyperpigmentation", "Strengthens barrier", "Reduces redness", "Anti-inflammatory"],
    bestFor: ["Oily", "Combination", "Sensitive", "Normal"],
    concerns: ["Pores", "Acne", "Brightening", "Redness"],
    howToUse: "Can be used morning and evening. Works in any step of routine. Excellent in toners, serums, and moisturisers.",
    pairedWith: ["Hyaluronic Acid", "Peptides", "Ceramides", "Zinc"],
    avoidWith: ["Vitamin C (same time — use at different times of day)"],
    concentration: "4% – 10%",
    icon: "⚡",
  },
  {
    id: "retinol",
    name: "Retinol / Retinoids",
    category: "Cell-Turnover",
    what: "Vitamin A derivatives — the gold standard of anti-aging. Prescription tretinoin is the strongest; OTC retinol is slower but still highly effective.",
    benefits: ["Speeds cell turnover", "Stimulates collagen", "Reduces wrinkles", "Clears acne", "Fades pigmentation", "Smooths texture"],
    bestFor: ["Oily", "Normal", "Combination"],
    concerns: ["Anti-Aging", "Acne", "Texture", "Pigmentation"],
    howToUse: "Evening only (photosensitive). Start 1x/week, increase slowly. Use SPF every morning when using retinol. Beginner: 0.025–0.05%. Advanced: 0.5–1%.",
    pairedWith: ["Hyaluronic Acid", "Ceramides", "Squalane"],
    avoidWith: ["AHAs/BHAs (same evening)", "Vitamin C", "Benzoyl Peroxide"],
    concentration: "0.025% – 1% (OTC) | 0.025% – 0.1% (Rx tretinoin)",
    icon: "⚗️",
  },
  {
    id: "aha",
    name: "AHA (Glycolic / Lactic Acid)",
    category: "Exfoliant",
    what: "Alpha Hydroxy Acids loosen the bonds between dead skin cells at the surface, revealing fresher, brighter skin beneath. Glycolic acid is smallest (most penetrating); lactic acid is gentler.",
    benefits: ["Exfoliates dead skin", "Brightening", "Fades hyperpigmentation", "Smooths texture", "Improves product absorption"],
    bestFor: ["Normal", "Dry", "Combination"],
    concerns: ["Brightening", "Texture", "Pigmentation", "Anti-Aging"],
    howToUse: "Evening use only. Apply after cleansing, before moisturiser. Start with lower concentrations (5–10%) 2x/week. Do not layer with retinol.",
    pairedWith: ["Hyaluronic Acid", "SPF (next morning is essential)"],
    avoidWith: ["Retinol (same evening)", "Vitamin C", "BHA (high irritation risk)"],
    concentration: "5% – 30% (professional peels higher)",
    icon: "🔬",
  },
  {
    id: "ceramides",
    name: "Ceramides",
    category: "Barrier",
    what: "Naturally occurring lipids that form 50% of the skin barrier. Ceramides are the 'mortar' between skin cells that prevent moisture loss and protect against irritants.",
    benefits: ["Strengthens skin barrier", "Prevents moisture loss", "Reduces sensitivity", "Calms irritation", "Essential for skin health"],
    bestFor: ["Dry", "Sensitive", "Normal", "Combination"],
    concerns: ["Hydration", "Redness"],
    howToUse: "Can be used morning and evening. Best in moisturisers and targeted treatments. Ideal for barrier repair after over-exfoliation or irritation.",
    pairedWith: ["Hyaluronic Acid", "Niacinamide", "Fatty Acids", "Cholesterol"],
    avoidWith: [],
    concentration: "Any formulation effective — look for them in the first 5 ingredients",
    icon: "🛡️",
  },
  {
    id: "salicylic-acid",
    name: "Salicylic Acid (BHA)",
    category: "Exfoliant",
    what: "A beta hydroxy acid that's oil-soluble — meaning it penetrates INTO pores (AHAs can't do this). Dissolves the sebum and debris that cause blackheads, whiteheads, and cystic acne.",
    benefits: ["Clears blocked pores", "Reduces blackheads", "Anti-inflammatory", "Reduces oiliness", "Prevents breakouts"],
    bestFor: ["Oily", "Combination"],
    concerns: ["Acne", "Pores"],
    howToUse: "Evening. Apply after cleansing to affected areas. Cleansers (2%) are gentler and better for beginners. Serums/toners (1–2%) for more targeted action.",
    pairedWith: ["Niacinamide", "Hyaluronic Acid"],
    avoidWith: ["AHAs (same step — high irritation)", "Retinol", "Vitamin C"],
    concentration: "0.5% – 2%",
    icon: "🫧",
  },
  {
    id: "peptides",
    name: "Peptides",
    category: "Anti-Aging",
    what: "Short amino acid chains that signal the skin to produce more collagen, elastin, and other proteins. Different peptides address different concerns — from wrinkles (Matrixyl) to pigmentation (Melanostatine).",
    benefits: ["Stimulates collagen", "Firms skin", "Reduces wrinkles", "Improves elasticity", "Regenerates skin", "Anti-aging"],
    bestFor: ["Normal", "Dry", "Combination", "Oily"],
    concerns: ["Anti-Aging", "Texture"],
    howToUse: "Morning or evening. Best applied after toner and before moisturiser. Peptides work slowly — allow 8–12 weeks minimum to assess results.",
    pairedWith: ["Hyaluronic Acid", "Niacinamide", "Retinol (alternating)"],
    avoidWith: ["AHAs/BHAs (acids can degrade peptide bonds — use at different times)"],
    concentration: "Variable — look for specific peptide names in ingredients list",
    icon: "🧬",
  },
];

// ── Holistic Tips ─────────────────────────────────────────────────────────────

export interface HolisticTip {
  id: string;
  category: "Nutrition" | "Hydration" | "Sleep" | "Stress" | "Exercise" | "Environment" | "Habits";
  title: string;
  explanation: string;
  howTo: string;
  skinBenefit: string;
  icon: string;
}

export const holisticTips: HolisticTip[] = [
  {
    id: "nutrition-omega3",
    category: "Nutrition",
    title: "Omega-3 Fatty Acids — Eat Your Glow",
    explanation: "Omega-3s (found in salmon, walnuts, flaxseeds, sardines) are the structural building blocks of skin cell membranes. Without adequate omega-3s, the cell membrane becomes rigid, reducing moisture retention and cellular communication.",
    howTo: "Aim for 2 portions of oily fish per week (salmon, mackerel, sardines, anchovies). If vegetarian/vegan: flaxseeds, chia seeds, walnuts, and a quality algae-based omega-3 supplement.",
    skinBenefit: "Reduced inflammation (less redness, less acne), improved moisture retention, stronger skin barrier, and reduced severity of inflammatory conditions like eczema and psoriasis.",
    icon: "🐟",
  },
  {
    id: "nutrition-antioxidants",
    category: "Nutrition",
    title: "Eat the Rainbow — Antioxidants In",
    explanation: "Free radicals — from UV, pollution, stress, and processed foods — are the primary cause of premature skin aging. Dietary antioxidants (vitamins A, C, E, polyphenols) neutralise free radicals from the inside out, protecting collagen and DNA.",
    howTo: "Eat 5+ different colours of vegetables and fruits per day. Particularly powerful: blueberries, pomegranate, dark leafy greens, sweet potato, and red/yellow peppers. Green tea provides powerful EGCG antioxidant.",
    skinBenefit: "Protection against UV damage and photoaging, collagen preservation, reduced pigmentation formation, and a natural lit-from-within glow.",
    icon: "🌈",
  },
  {
    id: "nutrition-sugar",
    category: "Nutrition",
    title: "Reduce Sugar — Protect Your Collagen",
    explanation: "Glycation — when excess sugar molecules bind to and damage collagen and elastin proteins — is a leading cause of skin aging. This creates cross-linking that makes skin stiff, dull, and prone to sagging. Glycation also feeds acne-causing bacteria.",
    howTo: "Reduce refined sugars, white bread, processed foods, and high-GI foods. Replace with complex carbohydrates, protein, and healthy fats. This doesn't mean eliminate sugar — moderation and food quality matter most.",
    skinBenefit: "Preserved collagen structure (firmer, more elastic skin), reduced acne, decreased inflammation, and protection against premature wrinkling.",
    icon: "🍬",
  },
  {
    id: "hydration-water",
    category: "Hydration",
    title: "Internal Hydration — 8 Glasses Daily",
    explanation: "Skin is 64% water. Chronic dehydration visibly reduces skin fullness, plumpness, and elasticity — making fine lines more prominent. While topical hyaluronic acid is effective, internal hydration is the foundation.",
    howTo: "Aim for 2–2.5 litres (8 glasses) of water daily. Herbal teas count. Caffeine can increase fluid excretion — compensate with an extra glass per coffee. Electrolytes (sodium, potassium, magnesium) help retain cellular water — add a pinch of quality sea salt or use electrolyte supplements.",
    skinBenefit: "Improved skin plumpness and turgor (skin bounces back when pinched), more radiant complexion, reduced appearance of fine lines, better skin cell function.",
    icon: "💧",
  },
  {
    id: "sleep-repair",
    category: "Sleep",
    title: "Beauty Sleep — Skin Regenerates at Night",
    explanation: "Growth hormone (essential for cell repair and collagen synthesis) is predominantly secreted during deep sleep. Cortisol (inflammatory stress hormone) is lowest during sleep. Skin cell turnover accelerates 3x at night.",
    howTo: "Aim for 7–9 hours of quality sleep. Consistent sleep and wake times maintain circadian rhythm. Sleep on a silk pillowcase to reduce friction (a major cause of sleep-crease wrinkles and hair damage). Elevate your head slightly to reduce under-eye puffiness via lymphatic drainage.",
    skinBenefit: "Accelerated skin repair, collagen synthesis, reduced under-eye circles, decreased puffiness, balanced cortisol (less inflammation and breakouts).",
    icon: "🌙",
  },
  {
    id: "stress-cortisol",
    category: "Stress",
    title: "Manage Cortisol — Stress Visibly Ages Skin",
    explanation: "Chronic elevated cortisol (the stress hormone) breaks down collagen, triggers inflammatory pathways (acne, rosacea, eczema flares), increases sebum production, slows wound healing, and accelerates telomere shortening (cellular aging).",
    howTo: "Evidence-based stress management: 10 minutes of daily meditation (apps: Headspace, Calm), breathwork (4-7-8 breathing), regular gentle exercise, time in nature, social connection, and creative activities. Even 5 minutes of deep breathing measurably lowers cortisol.",
    skinBenefit: "Reduced acne breakouts, improved inflammatory skin conditions, better collagen preservation, faster wound healing, improved skin barrier function.",
    icon: "🧘",
  },
  {
    id: "exercise-circulation",
    category: "Exercise",
    title: "Exercise — The Natural Facial",
    explanation: "Cardiovascular exercise increases heart rate and blood flow, delivering oxygen and nutrients to skin cells while carrying away waste products. A 2014 study found that regular exercisers had skin that biologically resembled people 20–30 years younger.",
    howTo: "30+ minutes of moderate cardio 5x per week (brisk walking, cycling, swimming). Always remove makeup before exercise — sweat trapped under foundation blocks pores. Cleanse immediately after exercise. Cold water post-workout can reduce post-exercise redness.",
    skinBenefit: "Improved skin tone and radiance (from circulation), slower aging (at cellular level), reduced stress hormones (less breakouts), improved collagen production.",
    icon: "🏃",
  },
  {
    id: "environment-pollution",
    category: "Environment",
    title: "Protect Against Pollution — City Skin Defence",
    explanation: "Urban pollution particulate matter (PM2.5) penetrates skin, causing free radical damage, inflammation, collagen breakdown, and hyperpigmentation. It's estimated to be responsible for up to 20% of skin aging in urban dwellers.",
    howTo: "Double cleanse every evening — pollution particles physically adhere to skin and sunscreen. Look for skincare containing antioxidants (Vitamin C, E, niacinamide). An SPF also acts as a physical barrier against some pollution particles.",
    skinBenefit: "Reduced free radical damage, less premature aging, fewer breakouts from pollution-blocked pores, preserved skin tone evenness.",
    icon: "🏙️",
  },
  {
    id: "habits-no-touching",
    category: "Habits",
    title: "Stop Touching Your Face — Bacteria Transmission",
    explanation: "The average person touches their face 23 times per hour unconsciously. Each touch transfers bacteria, viruses, and environmental pollutants from hands (which touch thousands of surfaces) directly to the facial skin, causing breakouts and infection.",
    howTo: "Build awareness of the habit through mindfulness. Keep hands clean — wash or sanitise regularly. When you need to touch your face (applying skincare), always wash hands first. Never pick or squeeze blemishes — this spreads bacteria and causes post-inflammatory hyperpigmentation (PIH) that takes months to fade.",
    skinBenefit: "Dramatically reduced bacterial acne, reduced virus transmission (cold sores), reduced environmental contamination of skin, faster healing of existing blemishes.",
    icon: "🤲",
  },
  {
    id: "habits-clean-tools",
    category: "Habits",
    title: "Clean Your Makeup Brushes — Weekly",
    explanation: "Makeup brushes are one of the most overlooked sources of skin bacteria. A single unwashed brush can harbour Staphylococcus aureus, E. coli, and Streptococcus — all acne-causing and potentially dangerous bacteria.",
    howTo: "Spot-clean brushes after each use with a quick-dry brush cleanser spray. Deep-clean with brush shampoo (or baby shampoo) weekly. Lay flat to dry — never upright (water drains into the ferrule and loosens glue). Replace sponges every 1–3 months.",
    skinBenefit: "Dramatically reduced bacterial breakouts, cleaner colour application, prolonged brush life, reduced risk of eye and skin infections.",
    icon: "🖌️",
  },
  {
    id: "habits-silk-pillowcase",
    category: "Habits",
    title: "Silk Pillowcase — Overnight Skin and Hair Investment",
    explanation: "Cotton pillowcases have a rough texture that creates friction against skin during sleep — causing pressure wrinkles, sleep lines, and hair breakage. Cotton also absorbs moisture from skin, dehydrating it overnight.",
    howTo: "Switch to a 100% silk (grade 6A mulberry silk) or high-quality satin pillowcase. Wash weekly with gentle silk detergent in cold water. As an alternative, wrap hair in silk and use a silk or satin sleeping bonnet.",
    skinBenefit: "Reduced sleep crease wrinkles (especially between the brows and cheeks), maintained skin moisture overnight, less hair breakage and frizz.",
    icon: "🛏️",
  },
  {
    id: "nutrition-collagen",
    category: "Nutrition",
    title: "Collagen Peptides — Supplement Wisely",
    explanation: "Oral collagen peptides have a growing body of evidence supporting their efficacy. When hydrolysed (broken into small peptides), they're absorbed into the bloodstream, signalling skin cells to produce more collagen.",
    howTo: "1 scoop (10g) of hydrolysed collagen peptide powder daily in any liquid. Look for types I and III (skin-specific). Best combined with Vitamin C (required for collagen synthesis). Results take 8–12 weeks minimum.",
    skinBenefit: "Improved skin elasticity, reduced wrinkle depth, improved joint health, stronger hair and nails.",
    icon: "💊",
  },
];

// ── Skin Type Guides ─────────────────────────────────────────────────────────

export interface SkinTypeGuide {
  type: SkinType;
  description: string;
  signs: string[];
  avoid: string[];
  embrace: string[];
  topProducts: string[];
  icon: string;
}

export const skinTypeGuides: SkinTypeGuide[] = [
  {
    type: "Oily",
    description: "Overactive sebaceous glands produce excess sebum, creating shine, enlarged pores, and a higher tendency to breakouts. The upside: oily skin ages more slowly and stays naturally moisturised.",
    signs: ["Shine within 1–2 hours of cleansing", "Enlarged or visible pores", "Foundation breaks down quickly", "Frequent blackheads and breakouts", "Skin feels 'full' or heavy"],
    avoid: ["Heavy cream moisturisers", "Coconut oil (highly comedogenic)", "Heavy wax-based products", "Skipping moisturiser (causes rebound oil production)", "Harsh soaps that strip skin (causes rebound)"],
    embrace: ["Gel moisturisers", "Niacinamide (oil control)", "Salicylic acid (BHA cleansers)", "Clay masks 1–2x weekly", "Lightweight SPF formulas", "Oil-free makeup"],
    topProducts: ["Paula's Choice BHA Liquid", "The Ordinary Niacinamide 10%", "Cetaphil Oily Skin Cleanser", "Neutrogena Hydro Boost Gel"],
    icon: "🫧",
  },
  {
    type: "Dry",
    description: "Insufficient sebum production or a compromised skin barrier leads to tight, flaky, or rough skin. The barrier cannot retain moisture effectively, causing chronic dehydration.",
    signs: ["Tight feeling after cleansing", "Flaking or rough patches", "Makeup sits in lines", "Itching or sensitivity", "Dull, lack-lustre complexion"],
    avoid: ["Alcohol-based toners and products", "Harsh foaming cleansers", "Over-exfoliation", "Long hot showers", "Skipping moisturiser"],
    embrace: ["Cream or oil-based cleansers", "Hyaluronic acid layering", "Ceramide moisturisers", "Facial oils (squalane, rosehip)", "Overnight sleeping masks", "Humidifier"],
    topProducts: ["La Roche-Posay Toleriane Hydrating Cleanser", "CeraVe Moisturising Cream", "Drunk Elephant Protini", "Tatcha Dewy Skin Cream"],
    icon: "🌵",
  },
  {
    type: "Combination",
    description: "The T-zone (forehead, nose, chin) is oily while the cheeks are normal to dry. This is the most common skin type globally — requiring a targeted, zone-specific approach.",
    signs: ["Shiny T-zone but normal or dry cheeks", "Breakouts primarily on nose and forehead", "Dry or flaky patches at cheeks or jawline", "Foundation disappears from T-zone faster"],
    avoid: ["Heavy products on the T-zone", "Skipping T-zone treatment", "One-size-fits-all heavy creams"],
    embrace: ["Multi-masking (clay on T-zone, hydrating on cheeks)", "Gel moisturiser on T-zone", "Richer formula on dry areas", "Balanced BHA toner on oily zones"],
    topProducts: ["Aveeno Calm and Restore Oat Serum", "Glow Recipe Watermelon Toner", "The INKEY List Niacinamide", "COSRX Salicylic Acid Toner"],
    icon: "⚖️",
  },
  {
    type: "Sensitive",
    description: "A hyper-reactive skin type prone to redness, burning, stinging, and allergic responses. The skin barrier is often compromised, making it reactive to a wide range of ingredients and environmental stimuli.",
    signs: ["Redness or flushing easily", "Burning or stinging when applying products", "Reacts to fragrance, heat, or stress", "Rosaceous or redness-prone appearance", "Breakouts from new products frequently"],
    avoid: ["Fragrance (synthetic or natural)", "Essential oils", "High concentrations of acids", "Alcohol", "Harsh physical exfoliants", "Frequent actives switching"],
    embrace: ["Minimal ingredient lists", "Fragrance-free formulas", "Ceramides and barrier repair", "Oat extracts (colloidal oatmeal)", "Centella Asiatica (Cica)", "Patch testing before new products"],
    topProducts: ["Avène Skin Recovery Cream", "La Roche-Posay Cicaplast Baume B5", "Vanicream Moisturizing Skin Cream", "Dr Jart Cicapair Tiger Grass Cream"],
    icon: "🌸",
  },
  {
    type: "Normal",
    description: "The least common skin type — balanced sebum production, minimal sensitivity, small pores, even tone, and good hydration. Requires maintenance more than correction.",
    signs: ["No significant oiliness or dryness", "Rarely breaks out", "Even skin tone", "Pores are small and not particularly visible", "Makeup lasts reasonably well throughout the day"],
    avoid: ["Neglect (normal skin can drift without care)", "Over-complicating routine", "Skipping SPF"],
    embrace: ["SPF daily", "Antioxidant serums", "Gentle exfoliation 2x weekly", "Focus on prevention over correction"],
    topProducts: ["Medik8 Vitamin C Serum", "Altruist SPF50 (budget)", "Augustinus Bader Rich Cream (luxury)", "The Ordinary AHA 30%+BHA 2% Peeling Solution"],
    icon: "✅",
  },
];
