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
  | "dandruff";

export const SKIN_CONDITIONS: SkinCondition[] = [
  "eczema",
  "blemishes",
  "cold-sores",
  "hair-loss",
  "thin-hair",
  "clogged-pores",
  "pimples",
  "dark-circles",
  "hyperpigmentation",
  "rosacea",
  "dry-skin",
  "oily-skin",
  "stretch-marks",
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
];
