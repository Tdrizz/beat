export type SkinCondition =
  | "eczema"
  | "blemishes"
  | "cold-sores"
  | "hair-loss"
  | "thin-hair"
  | "clogged-pores"
  | "pimples"
  | "dark-circles"
  | "hyperpigmentation"
  | "rosacea"
  | "dry-skin"
  | "oily-skin"
  | "stretch-marks"
  | "wrinkles"
  | "sun-damage"
  | "dandruff"
  | "melasma"
  | "keratosis-pilaris"
  | "dehydrated-skin"
  | "sensitive-skin"
  | "large-pores"
  | "hormonal-acne"
  | "ingrown-hairs"
  | "puffy-eyes";

export const SKIN_CONDITIONS: SkinCondition[] = [
  "eczema",
  "blemishes",
  "cold-sores",
  "hair-loss",
  "thin-hair",
  "clogged-pores",
  "pimples",
  "hormonal-acne",
  "dark-circles",
  "puffy-eyes",
  "hyperpigmentation",
  "melasma",
  "rosacea",
  "dry-skin",
  "dehydrated-skin",
  "oily-skin",
  "large-pores",
  "sensitive-skin",
  "keratosis-pilaris",
  "stretch-marks",
  "ingrown-hairs",
  "wrinkles",
  "sun-damage",
  "dandruff",
];

export const CONDITION_LABELS: Record<SkinCondition, string> = {
  eczema: "Eczema",
  blemishes: "Blemishes",
  "cold-sores": "Cold Sores",
  "hair-loss": "Hair Loss",
  "thin-hair": "Thin Hair",
  "clogged-pores": "Clogged Pores",
  pimples: "Pimples",
  "dark-circles": "Dark Circles",
  hyperpigmentation: "Hyperpigmentation",
  rosacea: "Rosacea",
  "dry-skin": "Dry Skin",
  "oily-skin": "Oily Skin",
  "stretch-marks": "Stretch Marks",
  wrinkles: "Fine Lines & Wrinkles",
  "sun-damage": "Sun Damage",
  dandruff: "Dandruff & Scalp",
  melasma: "Melasma",
  "keratosis-pilaris": "Keratosis Pilaris",
  "dehydrated-skin": "Dehydrated Skin",
  "sensitive-skin": "Sensitive Skin",
  "large-pores": "Large Pores",
  "hormonal-acne": "Hormonal Acne",
  "ingrown-hairs": "Ingrown Hairs",
  "puffy-eyes": "Puffy Eyes",
};

export const CONDITION_EMOJI: Record<SkinCondition, string> = {
  eczema: "🩹",
  blemishes: "✨",
  "cold-sores": "💋",
  "hair-loss": "💇‍♀️",
  "thin-hair": "🧴",
  "clogged-pores": "🔬",
  pimples: "🫧",
  "dark-circles": "👁️",
  hyperpigmentation: "🌗",
  rosacea: "🌹",
  "dry-skin": "🏜️",
  "oily-skin": "💧",
  "stretch-marks": "🐯",
  wrinkles: "🕐",
  "sun-damage": "☀️",
  dandruff: "❄️",
  melasma: "🦋",
  "keratosis-pilaris": "🌾",
  "dehydrated-skin": "🥛",
  "sensitive-skin": "🌸",
  "large-pores": "🔭",
  "hormonal-acne": "🌙",
  "ingrown-hairs": "🪒",
  "puffy-eyes": "🫖",
};

export const CONDITION_SWATCH: Record<SkinCondition, string> = {
  eczema: "from-rose-300 to-amber-200",
  blemishes: "from-pink-300 to-fuchsia-200",
  "cold-sores": "from-red-300 to-rose-200",
  "hair-loss": "from-amber-300 to-orange-200",
  "thin-hair": "from-yellow-300 to-amber-200",
  "clogged-pores": "from-slate-300 to-zinc-200",
  pimples: "from-sky-300 to-blue-200",
  "dark-circles": "from-indigo-300 to-violet-200",
  hyperpigmentation: "from-amber-400 to-yellow-200",
  rosacea: "from-rose-400 to-pink-200",
  "dry-skin": "from-orange-200 to-amber-100",
  "oily-skin": "from-emerald-300 to-teal-200",
  "stretch-marks": "from-amber-200 to-rose-200",
  wrinkles: "from-purple-300 to-violet-200",
  "sun-damage": "from-yellow-400 to-orange-200",
  dandruff: "from-slate-200 to-zinc-300",
  melasma: "from-amber-300 to-rose-200",
  "keratosis-pilaris": "from-pink-200 to-orange-100",
  "dehydrated-skin": "from-cyan-200 to-blue-100",
  "sensitive-skin": "from-pink-200 to-rose-100",
  "large-pores": "from-zinc-300 to-stone-200",
  "hormonal-acne": "from-violet-300 to-pink-200",
  "ingrown-hairs": "from-amber-200 to-stone-200",
  "puffy-eyes": "from-blue-200 to-indigo-100",
};

export interface SlayTip {
  id: string;
  title: string;
  detail: string;
  doList: string[];
  avoidList: string[];
  ingredients: string[];
  makeupTip: string;
}

export interface SlayConditionEntry {
  condition: SkinCondition;
  overview: string;
  tips: SlayTip[];
}

export const SLAY_BIBLE: SlayConditionEntry[] = [
  {
    condition: "eczema",
    overview:
      "Eczema (atopic dermatitis) causes dry, itchy, inflamed patches. Keeping the skin barrier strong is everything — gentle products, rich emollients, and avoiding triggers.",
    tips: [
      {
        id: "ecz-1",
        title: "Repair the barrier first",
        detail:
          "Use fragrance-free ceramide creams morning and night. Pat — never rub — onto damp skin to lock in moisture.",
        doList: [
          "Layer ceramide cream on damp skin",
          "Use lukewarm water (never hot)",
          "Pat dry gently with a soft towel",
        ],
        avoidList: [
          "Fragranced lotions",
          "Hot showers or baths",
          "Rough exfoliants",
        ],
        ingredients: ["Ceramides", "Colloidal oatmeal", "Squalane", "Shea butter"],
        makeupTip:
          "Use a hydrating primer with hyaluronic acid before foundation to prevent flaking. Cream products sit better on eczema-prone skin than powders.",
      },
      {
        id: "ecz-2",
        title: "Calm the flare",
        detail:
          "During an active flare, simplify your routine drastically. Only cleanse with micellar water or a balm, and apply a thick healing ointment.",
        doList: [
          "Switch to micellar water as your cleanser",
          "Apply healing ointment on raw patches",
          "Wear cotton gloves at night to prevent scratching",
        ],
        avoidList: [
          "Active ingredients (retinol, AHA/BHA)",
          "Makeup on actively broken skin",
          "Wool or synthetic fabrics near the face",
        ],
        ingredients: ["Petrolatum", "Centella asiatica", "Allantoin", "Zinc oxide"],
        makeupTip:
          "Skip foundation on active flares. A tinted SPF or BB cream with zinc oxide can provide light coverage while calming redness.",
      },
    ],
  },
  {
    condition: "blemishes",
    overview:
      "Blemishes include post-acne marks, dark spots, and uneven skin tone. Consistent exfoliation and sun protection are your best friends.",
    tips: [
      {
        id: "blm-1",
        title: "Fade marks with acids",
        detail:
          "Chemical exfoliants like AHAs and vitamin C brighten dark marks over 4-8 weeks. Always pair with SPF 30+.",
        doList: [
          "Use vitamin C serum every morning",
          "Apply AHA toner 2-3x per week at night",
          "Wear SPF 30+ daily, even indoors",
        ],
        avoidList: [
          "Picking or squeezing spots",
          "Skipping sunscreen",
          "Over-exfoliating (more than 3x/week)",
        ],
        ingredients: ["Vitamin C (L-ascorbic acid)", "Glycolic acid", "Niacinamide", "Alpha arbutin"],
        makeupTip:
          "Use a peach or orange colour corrector under concealer for dark marks. Set with a light dusting of translucent powder.",
      },
      {
        id: "blm-2",
        title: "Stop the next mark forming",
        detail:
          "Most blemishes are post-inflammatory marks left by spots you've squeezed. Treating active breakouts gently is how you prevent the next round of dark spots.",
        doList: [
          "Hands off — never pick or pop",
          "Use a hydrocolloid pimple patch overnight on whiteheads",
          "Apply azelaic acid 10% — it treats acne AND fades marks at the same time",
        ],
        avoidList: [
          "Wearing makeup over broken skin",
          "Hot water on inflamed spots",
          "Switching products every week — give actives 6-8 weeks",
        ],
        ingredients: ["Azelaic acid", "Tranexamic acid", "Centella asiatica", "Liquorice root"],
        makeupTip:
          "Stipple — don't drag — concealer over post-acne marks with a small dense brush so you don't lift the surrounding foundation. A skin tint with peach undertones reads more natural than full coverage.",
      },
    ],
  },
  {
    condition: "cold-sores",
    overview:
      "Cold sores (HSV-1) are triggered by stress, sun, illness, or hormonal changes. Quick treatment and barrier protection shorten outbreaks.",
    tips: [
      {
        id: "cs-1",
        title: "Act fast at the tingle",
        detail:
          "Apply an antiviral cream (aciclovir/docosanol) at the very first tingle — this can cut outbreak duration in half.",
        doList: [
          "Keep antiviral cream in your bag at all times",
          "Apply SPF lip balm daily to prevent sun-triggered outbreaks",
          "Replace your lip products after an outbreak",
        ],
        avoidList: [
          "Sharing lip products or utensils",
          "Touching the sore then touching your eyes",
          "Exfoliating lips during an outbreak",
        ],
        ingredients: ["Aciclovir", "Docosanol", "Lysine", "Lemon balm extract"],
        makeupTip:
          "During an outbreak, skip lip products entirely. Use a lip-safe hydrocolloid patch over the sore — some are tinted and can sit under a matte liquid lip once the blister stage has passed.",
      },
    ],
  },
  {
    condition: "hair-loss",
    overview:
      "Hair loss in women can stem from hormones, stress, nutritional deficiencies, or styling damage. Address the root cause while being gentle with your strands.",
    tips: [
      {
        id: "hl-1",
        title: "Nourish from the inside",
        detail:
          "Iron, biotin, zinc, and vitamin D deficiencies are common culprits. Get blood work done and supplement where needed.",
        doList: [
          "Eat iron-rich foods (spinach, lentils, red meat)",
          "Take a hair-specific multivitamin with biotin",
          "Massage scalp for 5 minutes daily to boost circulation",
        ],
        avoidList: [
          "Tight hairstyles (ponytails, braids) that cause traction",
          "Heat styling without protectant",
          "Crash diets or extreme calorie restriction",
        ],
        ingredients: ["Biotin", "Minoxidil (topical)", "Rosemary oil", "Iron + ferritin"],
        makeupTip:
          "Hair fibres and root touch-up powders instantly camouflage thinning areas. Apply to the part line and hairline before going out.",
      },
    ],
  },
  {
    condition: "thin-hair",
    overview:
      "Fine or thin hair lacks volume and can look flat. The right products and techniques create the illusion of thickness without weighing hair down.",
    tips: [
      {
        id: "th-1",
        title: "Volumise without weight",
        detail:
          "Use lightweight mousses and root-lifting sprays instead of heavy creams. Blow-dry upside-down for instant lift.",
        doList: [
          "Apply volumising mousse to damp roots",
          "Blow-dry upside-down with a round brush",
          "Use dry shampoo at roots for texture and grip",
        ],
        avoidList: [
          "Heavy conditioners on roots",
          "Silicone-heavy serums",
          "Brushing wet hair (use a wide-tooth comb)",
        ],
        ingredients: ["Rice water", "Biotin shampoo", "Castor oil (scalp only)", "Keratin"],
        makeupTip:
          "Use an eyeshadow that matches your hair colour to fill in a visible part line or sparse hairline — blend with a small brush.",
      },
    ],
  },
  {
    condition: "clogged-pores",
    overview:
      "Clogged pores (comedones) happen when dead skin and sebum get trapped. Regular gentle exfoliation and non-comedogenic products keep them clear.",
    tips: [
      {
        id: "cp-1",
        title: "BHA is your best friend",
        detail:
          "Salicylic acid (BHA) is oil-soluble, meaning it can penetrate into pores and dissolve the gunk. Use a 2% BHA toner or serum nightly.",
        doList: [
          "Use salicylic acid 2% toner every evening",
          "Double cleanse at night (oil cleanser → water cleanser)",
          "Use non-comedogenic moisturiser and SPF",
        ],
        avoidList: [
          "Sleeping in makeup",
          "Pore strips (they only remove surface debris)",
          "Coconut oil on the face",
        ],
        ingredients: ["Salicylic acid (BHA)", "Niacinamide", "Clay (kaolin/bentonite)", "Tea tree oil"],
        makeupTip:
          "Use a silicone-free, water-based primer to prevent foundation from settling into pores. Avoid thick, full-coverage foundations.",
      },
    ],
  },
  {
    condition: "pimples",
    overview:
      "Pimples (acne) form when bacteria, oil, and dead skin clog follicles. Consistent gentle care beats aggressive treatment every time.",
    tips: [
      {
        id: "pim-1",
        title: "Spot-treat, don't nuke",
        detail:
          "Benzoyl peroxide (2.5-5%) kills acne bacteria without over-drying. Apply only to active spots, not the whole face.",
        doList: [
          "Spot-treat with benzoyl peroxide at night",
          "Cleanse twice daily with a gentle foaming cleanser",
          "Change pillowcases twice a week",
        ],
        avoidList: [
          "Popping or picking (causes scarring and spreads bacteria)",
          "Over-washing (strips the skin and triggers more oil)",
          "Toothpaste as a spot treatment",
        ],
        ingredients: ["Benzoyl peroxide 2.5%", "Salicylic acid", "Azelaic acid", "Zinc PCA"],
        makeupTip:
          "Green colour corrector neutralises redness from active pimples. Apply with a tiny brush, then layer concealer on top. Set with powder to keep it in place all day.",
      },
    ],
  },
  {
    condition: "dark-circles",
    overview:
      "Dark circles have many causes — genetics, lack of sleep, allergies, thin under-eye skin, or hyperpigmentation. Targeted care can significantly reduce their appearance.",
    tips: [
      {
        id: "dc-1",
        title: "Brighten and depuff",
        detail:
          "Caffeine serums constrict blood vessels and reduce puffiness. Vitamin C and retinol help thicken the thin skin under eyes over time.",
        doList: [
          "Apply caffeine eye cream every morning",
          "Use retinol eye cream at night (start 2x/week)",
          "Get 7-9 hours of sleep consistently",
          "Stay hydrated — dehydration makes circles worse",
        ],
        avoidList: [
          "Rubbing your eyes",
          "Salty foods before bed (causes puffiness)",
          "Skipping SPF around the eye area",
        ],
        ingredients: ["Caffeine", "Vitamin K", "Retinol", "Peptides"],
        makeupTip:
          "Use a peach/salmon corrector for blue-toned circles or an orange corrector for deeper skin tones. Apply in a triangle shape under the eye, then blend concealer over it.",
      },
      {
        id: "dc-2",
        title: "Match the corrector to your undertone",
        detail:
          "The biggest concealer mistake is using one shade lighter than your foundation everywhere. Under-eye darkness needs a colour-theory fix first, then a brightening concealer on top.",
        doList: [
          "Fair/light skin → pink-peach corrector",
          "Medium/olive → salmon or warm peach",
          "Deep skin → red or burnt-orange corrector",
          "Tap (don't drag) with a ring finger so warmth blends the product",
        ],
        avoidList: [
          "White or grey concealers under the eye (looks ashy)",
          "Heavy powder on top — bakes into lines",
          "Pulling the skin while applying",
        ],
        ingredients: ["Peach pigments", "Hyaluronic acid", "Mica (light-reflecting)", "Vitamin E"],
        makeupTip:
          "Set with the tiniest amount of finely-milled translucent powder pressed (not swept) under the eye. Re-hydrate mid-day with a spritz of facial mist before any touch-up.",
      },
    ],
  },
  {
    condition: "hyperpigmentation",
    overview:
      "Hyperpigmentation (melasma, sun spots, post-inflammatory marks) is excess melanin production. Sun protection is non-negotiable — even one unprotected day can undo weeks of progress.",
    tips: [
      {
        id: "hyp-1",
        title: "Layer your brighteners",
        detail:
          "Combine vitamin C (morning) with a retinoid (night) for the most effective fading. Add a niacinamide serum to both routines for extra support.",
        doList: [
          "Apply vitamin C serum + SPF 50 every morning",
          "Use a retinoid at night (start low, build up)",
          "Add niacinamide 5-10% to both AM and PM routines",
        ],
        avoidList: [
          "Sun exposure without SPF 50+",
          "Lemon juice or baking soda DIYs",
          "Picking at dark spots",
        ],
        ingredients: ["Tranexamic acid", "Kojic acid", "Azelaic acid", "Arbutin"],
        makeupTip:
          "A full-coverage mineral foundation with SPF provides both coverage and protection. Use a peach corrector on deeper spots before applying foundation.",
      },
    ],
  },
  {
    condition: "rosacea",
    overview:
      "Rosacea causes persistent redness, visible blood vessels, and sometimes bumps. Gentle, anti-inflammatory skincare is key — avoid anything that causes flushing.",
    tips: [
      {
        id: "ros-1",
        title: "Calm and protect",
        detail:
          "Use a gentle cleanser, azelaic acid for redness, and mineral SPF. Avoid common triggers like alcohol, spicy food, hot drinks, and extreme temperatures.",
        doList: [
          "Use azelaic acid 10-15% daily",
          "Apply mineral (zinc oxide) SPF — less irritating than chemical filters",
          "Keep a trigger diary to identify your personal flare triggers",
        ],
        avoidList: [
          "Fragranced skincare",
          "Alcohol-based toners",
          "Physical scrubs or harsh exfoliants",
          "Hot water on the face",
        ],
        ingredients: ["Azelaic acid", "Centella asiatica", "Green tea extract", "Zinc oxide"],
        makeupTip:
          "A green-tinted primer cancels redness before foundation. Use a mineral foundation — it sits on top of the skin instead of sinking in, which is less irritating for rosacea.",
      },
    ],
  },
  {
    condition: "dry-skin",
    overview:
      "Dry skin lacks oil and moisture, leading to flaking, tightness, and dullness. Building a lipid-rich routine restores the glow.",
    tips: [
      {
        id: "dry-1",
        title: "Seal in moisture",
        detail:
          "Apply humectants (hyaluronic acid) on damp skin, follow with an emollient (squalane), and seal with an occlusive (shea butter or petrolatum) at night.",
        doList: [
          "Apply hyaluronic acid to damp skin",
          "Layer squalane oil over serum",
          "Use a sleeping mask or thick cream at night",
        ],
        avoidList: [
          "Foaming cleansers (they strip oils)",
          "Alcohol-based products",
          "Over-exfoliating",
        ],
        ingredients: ["Hyaluronic acid", "Squalane", "Ceramides", "Glycerin"],
        makeupTip:
          "Use a dewy or hydrating foundation — matte formulas will cling to dry patches. Mix a drop of facial oil into your foundation for a luminous finish.",
      },
    ],
  },
  {
    condition: "oily-skin",
    overview:
      "Oily skin overproduces sebum, leading to shine and breakouts. The trick is to hydrate without adding oil — stripping the skin makes oil production worse.",
    tips: [
      {
        id: "oil-1",
        title: "Hydrate, don't strip",
        detail:
          "Use a lightweight gel moisturiser and niacinamide to regulate oil production. Over-cleansing triggers rebound oiliness.",
        doList: [
          "Cleanse twice daily with a gentle gel cleanser",
          "Use niacinamide 10% serum daily",
          "Apply a lightweight gel moisturiser (yes, oily skin needs moisture)",
        ],
        avoidList: [
          "Skipping moisturiser",
          "Over-washing or using harsh cleansers",
          "Heavy oils and butters on the face",
        ],
        ingredients: ["Niacinamide", "Hyaluronic acid", "Salicylic acid", "Zinc PCA"],
        makeupTip:
          "Apply a mattifying primer on the T-zone only. Use blotting papers throughout the day instead of adding more powder — layering powder makes you look cakey.",
      },
      {
        id: "oil-2",
        title: "Balance the shine zones",
        detail:
          "Most oily skin is actually combination — only the T-zone is greasy while cheeks can be dehydrated. Treat zones differently instead of stripping the whole face.",
        doList: [
          "Use clay mask twice a week on T-zone only",
          "Add a hydrating toner with PHA on cheeks",
          "Switch to silk pillowcases — cotton absorbs your face oils",
        ],
        avoidList: [
          "Alcohol-heavy mattifying toners on cheeks",
          "Touching your face throughout the day",
          "Powder foundation on dehydrated areas",
        ],
        ingredients: ["Kaolin clay", "PHA (gluconolactone)", "Zinc PCA", "Green tea"],
        makeupTip:
          "Use a setting spray with hyaluronic acid AND a separate mattifying spray on T-zone only. This gives a glow on cheeks while keeping the centre of the face shine-free for hours.",
      },
    ],
  },
  {
    condition: "stretch-marks",
    overview:
      "Stretch marks form when skin stretches rapidly (growth spurts, pregnancy, weight changes). They fade over time but can be minimised with consistent care.",
    tips: [
      {
        id: "sm-1",
        title: "Boost collagen and elasticity",
        detail:
          "Retinoids, vitamin C, and centella-based creams improve the appearance of newer (red/purple) stretch marks. Older (white/silver) marks respond to micro-needling or laser.",
        doList: [
          "Apply retinol cream to newer marks nightly",
          "Use bio-oil or rosehip oil to keep skin supple",
          "Stay hydrated and moisturise daily",
        ],
        avoidList: [
          "Retinoids during pregnancy",
          "Expecting overnight results (takes months)",
          "Harsh body scrubs on fresh marks",
        ],
        ingredients: ["Retinol", "Centella asiatica", "Rosehip oil", "Hyaluronic acid"],
        makeupTip:
          "Full-coverage body makeup or self-tanning drops can minimise the appearance of stretch marks for events. Set with a body setting spray.",
      },
    ],
  },
  {
    condition: "wrinkles",
    overview:
      "Fine lines and wrinkles are a natural part of ageing, accelerated by sun damage, smoking, and dehydration. Prevention (SPF) and repair (retinol) are the gold standard.",
    tips: [
      {
        id: "wr-1",
        title: "Retinol + SPF — the power duo",
        detail:
          "Retinol (vitamin A) is the most evidence-backed anti-ageing ingredient. Start low (0.25%) and build up to 1% over months. Always use SPF 50 in the morning.",
        doList: [
          "Use retinol at night, starting 2x/week",
          "Apply SPF 50 every morning (reapply every 2 hours outdoors)",
          "Use peptide serums for extra firmness",
        ],
        avoidList: [
          "Tanning beds",
          "Sleeping on your face (causes sleep wrinkles)",
          "Smoking or excess alcohol",
        ],
        ingredients: ["Retinol/retinaldehyde", "Peptides", "Vitamin C", "SPF 50"],
        makeupTip:
          "Use a light-reflecting, dewy foundation instead of matte — matte formulas settle into lines and make them more visible. Apply with a damp sponge for a smoother finish.",
      },
    ],
  },
  {
    condition: "sun-damage",
    overview:
      "Sun damage (photoaging) causes dark spots, uneven tone, leathery texture, and increased wrinkle risk. The single best anti-ageing product is sunscreen.",
    tips: [
      {
        id: "sd-1",
        title: "Reverse and protect",
        detail:
          "Vitamin C neutralises free radicals from UV. Retinoids repair DNA damage and boost collagen. But nothing works without daily SPF 50.",
        doList: [
          "Apply antioxidant serum (vitamin C + E + ferulic acid) every morning",
          "Use SPF 50 broad-spectrum daily — rain or shine",
          "Wear a wide-brimmed hat outdoors",
        ],
        avoidList: [
          "Tanning beds (never, ever)",
          "SPF lower than 30",
          "Relying on makeup with SPF as your only protection",
        ],
        ingredients: ["Vitamin C", "Ferulic acid", "Retinol", "SPF 50 broad-spectrum"],
        makeupTip:
          "Layer a tinted mineral SPF under your makeup for seamless double protection. Look for formulas with iron oxides — they also block visible light.",
      },
    ],
  },
  {
    condition: "dandruff",
    overview:
      "Dandruff and scalp conditions (seborrheic dermatitis) cause flaking, itching, and sometimes redness. They're fungal in origin and respond well to targeted anti-fungal ingredients.",
    tips: [
      {
        id: "dan-1",
        title: "Target the fungus",
        detail:
          "Use a shampoo with ketoconazole, zinc pyrithione, or salicylic acid 2-3 times per week. Alternate with your regular shampoo.",
        doList: [
          "Use anti-dandruff shampoo 2-3x/week, leaving it on for 3-5 minutes",
          "Massage scalp gently to lift flakes",
          "Apply tea tree oil diluted in carrier oil to the scalp weekly",
        ],
        avoidList: [
          "Scratching the scalp with nails",
          "Heavy styling products that build up",
          "Infrequent washing (allows fungus to thrive)",
        ],
        ingredients: ["Ketoconazole", "Zinc pyrithione", "Salicylic acid", "Tea tree oil"],
        makeupTip:
          "Wear dark clothing with a lint roller handy. Before styling, use a scalp mist with witch hazel to control flaking throughout the day.",
      },
    ],
  },
  {
    condition: "melasma",
    overview:
      "Melasma shows up as symmetrical brown or grey-brown patches, usually on cheeks, forehead and upper lip. It's hormonal (pregnancy, the pill) and worsens with sun, heat and even visible light — including your phone screen.",
    tips: [
      {
        id: "mel-1",
        title: "Block light, not just UV",
        detail:
          "Melasma reacts to visible light too, so a regular SPF isn't enough. You need a tinted mineral SPF with iron oxides, which blocks the blue light from screens and the sun.",
        doList: [
          "Use a tinted SPF 50 with iron oxides every single day",
          "Reapply over makeup with a powder SPF every 2 hours",
          "Add tranexamic acid serum AM + PM — proven to fade melasma",
        ],
        avoidList: [
          "Heat triggers — saunas, hot yoga, steamy showers on the face",
          "Waxing the upper lip (the trauma triggers more pigment)",
          "Hydroquinone for more than 3 months without a break",
        ],
        ingredients: ["Tranexamic acid", "Cysteamine", "Iron oxides (in SPF)", "Azelaic acid"],
        makeupTip:
          "Layer a peach corrector under foundation on the darkest patches, then use a colour-balancing primer (slight lavender tint) on top to even tone before foundation.",
      },
    ],
  },
  {
    condition: "keratosis-pilaris",
    overview:
      "KP — those rough little bumps on the backs of arms, thighs and cheeks — is just keratin plugging the hair follicles. It's harmless, very common, and improves dramatically with consistent gentle exfoliation plus moisture.",
    tips: [
      {
        id: "kp-1",
        title: "Chemical exfoliation beats scrubbing",
        detail:
          "Physical scrubs irritate KP and make it redder. Lactic acid or urea lotions dissolve the keratin plugs while moisturising at the same time.",
        doList: [
          "Apply a 10-12% urea or AmLactin lotion daily after showering",
          "Use a soft body brush in circular motions — gentle, not harsh",
          "Keep showers short and lukewarm to protect the barrier",
        ],
        avoidList: [
          "Loofahs and body scrubs (worsen redness)",
          "Soap bars that strip oils",
          "Picking at the bumps",
        ],
        ingredients: ["Urea 10-20%", "Lactic acid (AHA)", "Salicylic acid", "Ceramides"],
        makeupTip:
          "For the cheeks variation, use a hydrating cushion foundation tapped with a damp sponge instead of buffing with a brush — buffing exaggerates the texture.",
      },
    ],
  },
  {
    condition: "dehydrated-skin",
    overview:
      "Dehydrated skin lacks WATER (not oil) — so even oily skin can be dehydrated. Signs: tightness after cleansing, fine surface lines, dullness, and makeup that won't sit right. The fix is layered hydration, not heavier creams.",
    tips: [
      {
        id: "dh-1",
        title: "Layer humectants on damp skin",
        detail:
          "Hyaluronic acid only works when there's water already on your face. Apply HA to damp skin then immediately seal with a lightweight moisturiser to lock the water in.",
        doList: [
          "Apply hydrating toner or essence to wet skin",
          "Layer hyaluronic acid serum before it dries",
          "Seal with a gel-cream moisturiser",
          "Drink water consistently throughout the day",
        ],
        avoidList: [
          "Foaming/sulphate cleansers (strip the barrier)",
          "Hot water on the face",
          "Skipping moisturiser if you have oily skin — that's why you're shiny",
        ],
        ingredients: ["Hyaluronic acid (multi-weight)", "Glycerin", "Panthenol", "Beta-glucan"],
        makeupTip:
          "Mist your face with a hydrating spray BEFORE foundation, not after — the foundation glides on a moist base. A drop of essence mixed into liquid foundation prevents the chalky look.",
      },
    ],
  },
  {
    condition: "sensitive-skin",
    overview:
      "Sensitive skin reacts easily — stinging, burning, redness, itching from products that don't bother most people. The goal is a short, fragrance-free routine that focuses on rebuilding the barrier.",
    tips: [
      {
        id: "ss-1",
        title: "Less is more",
        detail:
          "A 3-step routine (gentle cleanser, ceramide moisturiser, mineral SPF) often outperforms a 10-step shelfie. Introduce new products one at a time, two weeks apart, so you can spot the culprit.",
        doList: [
          "Patch-test new products behind the ear for 3 days",
          "Stick to mineral (zinc oxide) sunscreens",
          "Use a 'skin barrier' cream with ceramides + cholesterol",
        ],
        avoidList: [
          "Essential oils (lavender, citrus, peppermint)",
          "Alcohol-based toners",
          "Combining multiple actives (retinol + acid + vitamin C)",
          "Anything labelled 'fragrance' or 'parfum'",
        ],
        ingredients: ["Ceramides", "Centella asiatica", "Panthenol (B5)", "Bisabolol"],
        makeupTip:
          "Choose 'sensitive skin' or 'minimalist' brands that skip fragrance and dyes. A skin tint or BB cream is gentler than full-coverage foundation; use a clean fluffy brush — sponges can harbour bacteria that flares sensitive skin.",
      },
    ],
  },
  {
    condition: "large-pores",
    overview:
      "Pore size is mostly genetic and can't be permanently shrunk, but you CAN minimise their appearance. Keeping them clear and stimulating collagen around them does the heavy lifting.",
    tips: [
      {
        id: "lp-1",
        title: "Niacinamide is the MVP",
        detail:
          "Niacinamide 10% used daily for 8+ weeks visibly tightens pores. Combine with weekly BHA to keep them clear, and retinol at night to firm the skin around them.",
        doList: [
          "Apply niacinamide 10% serum daily",
          "Use a 2% BHA toner 2-3x per week to clear oil plugs",
          "Add retinol at night to stimulate collagen",
          "Always remove SPF + makeup at night",
        ],
        avoidList: [
          "Pore strips (only remove surface debris and stretch pores)",
          "Heavy occlusive oils (coconut, mineral)",
          "Skipping cleanser after the gym",
        ],
        ingredients: ["Niacinamide 10%", "Salicylic acid (BHA)", "Retinol", "Clay (weekly mask)"],
        makeupTip:
          "Use a silicone-based primer (look for dimethicone high in the ingredients) over the nose and cheeks to optically blur pores. Avoid full-coverage matte foundations that settle into them — go for a satin/skin-like finish.",
      },
    ],
  },
  {
    condition: "hormonal-acne",
    overview:
      "Hormonal acne shows up as deep, cystic spots along the jawline, chin and neck — usually flaring the week before your period. Topicals help, but the real fix often comes from inside (diet, hormones, stress).",
    tips: [
      {
        id: "ha-1",
        title: "Target deep spots before they surface",
        detail:
          "Cystic acne starts forming up to 10 days before you see it. Use a spironolactone alternative routine: zinc, omega-3s, and topical azelaic acid daily — not just when you break out.",
        doList: [
          "Track your cycle — pre-empt with extra azelaic acid 10 days before period",
          "Take zinc 15-30mg + omega-3s daily (talk to your GP first)",
          "Use a warm compress on cystic spots, not toothpaste",
          "Talk to a doctor about spironolactone or hormonal options",
        ],
        avoidList: [
          "Squeezing cysts (turns into months of scarring)",
          "Dairy and high-glycemic foods if you notice they trigger you",
          "Layering 5 actives on the same spot",
        ],
        ingredients: ["Azelaic acid 10-15%", "Zinc", "Adapalene 0.1%", "Tea tree (spot-only)"],
        makeupTip:
          "On a cyst, skip foundation in that exact spot — a hydrocolloid patch + concealer dabbed over it reads better than thick layers. Use a green colour corrector first, then a single dab of concealer with a tiny brush.",
      },
    ],
  },
  {
    condition: "ingrown-hairs",
    overview:
      "Ingrowns happen when shaved or waxed hair curls back into the skin, causing red bumps, dark spots and sometimes pain. They're more common on Black, Latina and curly-haired skin where hair texture spirals naturally.",
    tips: [
      {
        id: "ih-1",
        title: "Prep, exfoliate, never dry-shave",
        detail:
          "Most ingrowns are prevented before the razor touches you. Warm water + a fresh sharp blade in the direction of hair growth, plus weekly chemical exfoliation, transforms the area.",
        doList: [
          "Exfoliate the area with a BHA toner 2-3x per week",
          "Shave in the direction of hair growth, not against",
          "Use a single-blade razor (multi-blades cut below skin level)",
          "Apply a 2% BHA spray immediately after shaving",
        ],
        avoidList: [
          "Dry shaving",
          "Using a dull blade",
          "Picking out ingrowns with tweezers (causes scarring + infection)",
          "Tight underwear or jeans on freshly shaved skin",
        ],
        ingredients: ["Salicylic acid 2%", "Glycolic acid 7%", "Witch hazel", "Tea tree oil"],
        makeupTip:
          "For ingrowns on the face (chin/jaw area), a green colour corrector neutralises redness before foundation. For dark spots left behind, azelaic acid daily fades them over 8-12 weeks.",
      },
    ],
  },
  {
    condition: "puffy-eyes",
    overview:
      "Puffy eyes can be allergies, fluid retention, lack of sleep, salty dinner, or just genetics. The cause matters — depuffing techniques work brilliantly for fluid, but not for fat pads (those need a doctor).",
    tips: [
      {
        id: "pe-1",
        title: "Drain the morning swell",
        detail:
          "First thing in the morning, use cold tools and gentle lymphatic massage to push fluid AWAY from the eye area towards the ears and down the neck.",
        doList: [
          "Keep a jade roller or ice globes in the fridge",
          "Roll outward from inner corner to temple, then down to collarbone",
          "Sleep with your head slightly elevated",
          "Cut salt + alcohol the night before an event",
        ],
        avoidList: [
          "Rubbing your eyes (worsens swelling and pigment)",
          "Heavy creams under the eye at night",
          "Skipping water — dehydration makes you retain fluid",
        ],
        ingredients: ["Caffeine eye cream", "Cold tools", "Peptides", "Cucumber/green tea extract"],
        makeupTip:
          "Apply concealer ONLY in a triangle on the dark area below the puff — never on the puff itself, which would just highlight it. A subtle satin highlight on the inner corner draws the eye away from the swelling.",
      },
    ],
  },
];
