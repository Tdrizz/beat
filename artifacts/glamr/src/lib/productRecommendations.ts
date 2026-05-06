// Per-look and per-step product recommendations with multiple brand options

export interface ProductOption {
  brand: string;
  name: string;
  shade?: string;
  price: string;
  priceRange: "Budget" | "Mid" | "Luxury" | "Ultra-Luxury";
  finish?: string;
  coverage?: string;
  hex: string;
  description: string;
  proTip?: string;
}

export interface StepProducts {
  stepId: string;
  stepName: string;
  tool: string;
  productOptions: ProductOption[];
}

export interface LookProductGuide {
  lookId: string;
  totalCost: { budget: string; mid: string; luxury: string };
  steps: StepProducts[];
}

// ── Universal step product options ──────────────────────────────────────────

export const universalBaseProducts: ProductOption[] = [
  { brand: "Maybelline", name: "Fit Me Matte & Poreless Foundation", shade: "Multiple", price: "$11", priceRange: "Budget", finish: "Matte", coverage: "Medium", hex: "#e0c8a8", description: "A drugstore classic beloved by pros. Matte finish, natural-looking coverage, 40 shades." },
  { brand: "Fenty Beauty", name: "Pro Filt'r Soft Matte Foundation", shade: "Multiple (50 shades)", price: "$38", priceRange: "Mid", finish: "Soft-Matte", coverage: "Medium-Full", hex: "#d4a878", description: "The shade-range benchmark. Inclusive, buildable coverage that won't transfer on everything you touch.", proTip: "Mix with the Fenty Skin Hydra Vizor for a skin-tint effect." },
  { brand: "Giorgio Armani", name: "Luminous Silk Foundation", shade: "Multiple", price: "$72", priceRange: "Luxury", finish: "Natural", coverage: "Light-Medium", hex: "#e0c0a0", description: "The most beloved foundation in professional makeup artistry. Undetectable on skin. Preferred by Charlotte Tilbury, Lisa Eldridge, and every top MUA." },
  { brand: "Charlotte Tilbury", name: "Hollywood Flawless Filter", shade: "Multiple (9 shades)", price: "$49", priceRange: "Mid", finish: "Radiant", coverage: "Light", hex: "#e8d0b8", description: "Not a foundation — a radiant filter. Use alone for barely-there coverage or mix into foundation for a glow.", proTip: "Mix half-and-half with your foundation for a red-carpet skin effect." },
  { brand: "NARS", name: "Natural Radiant Longwear Foundation", shade: "Multiple (33 shades)", price: "$55", priceRange: "Luxury", finish: "Natural", coverage: "Medium-Full", hex: "#d8b890", description: "Longwear formula that maintains a natural, radiant finish for 16 hours. A backstage staple." },
  { brand: "NYX", name: "Bare with Me Tinted Skin Veil", shade: "Multiple (9 shades)", price: "$15", priceRange: "Budget", finish: "Dewy", coverage: "Light", hex: "#e8d8c8", description: "Lightweight, SPF-infused tint for minimal coverage with maximum glow." },
];

export const universalConcealerProducts: ProductOption[] = [
  { brand: "Tarte", name: "Shape Tape Concealer", shade: "Multiple (30+ shades)", price: "$30", priceRange: "Mid", finish: "Matte", coverage: "Full", hex: "#e8d0b0", description: "America's #1 selling concealer. Creamy full coverage that doesn't crease when set correctly." },
  { brand: "NARS", name: "Radiant Creamy Concealer", shade: "Multiple", price: "$32", priceRange: "Mid", finish: "Natural", coverage: "Full", hex: "#e0c8a8", description: "Cult status for a reason. Natural finish full coverage that looks like skin." },
  { brand: "Maybelline", name: "Fit Me Concealer", shade: "Multiple", price: "$8", priceRange: "Budget", finish: "Natural", coverage: "Full", hex: "#e8d8c0", description: "The best budget concealer. Natural finish, buildable coverage, doesn't crack." },
  { brand: "Charlotte Tilbury", name: "Magic Away Concealer", shade: "Multiple", price: "$36", priceRange: "Luxury", finish: "Radiant", coverage: "Full", hex: "#f0d8c0", description: "The concealer that truly covers everything — including dark circles — with a radiant, non-cakey finish." },
];

export const universalPrimerProducts: ProductOption[] = [
  { brand: "NYX", name: "Pore Filler Primer", shade: "Universal", price: "$17", priceRange: "Budget", finish: "Blurring", coverage: "N/A", hex: "#f5f0ec", description: "Fills pores and blurs texture. Creates a smooth canvas for foundation." },
  { brand: "Milk Makeup", name: "Hydro Grip Primer", shade: "Universal", price: "$36", priceRange: "Mid", finish: "Grip/Dewy", coverage: "N/A", hex: "#e8f0ec", description: "The primer that grips makeup to skin. Blue agave and hyaluronic acid for hydration." },
  { brand: "Charlotte Tilbury", name: "Airbrush Flawless Primer", shade: "Universal", price: "$52", priceRange: "Luxury", finish: "Blurring", coverage: "N/A", hex: "#f8f0ec", description: "Blurs pores, hydrates, and grips foundation for up to 14-hour wear." },
];

export const universalSettingProducts: ProductOption[] = [
  { brand: "Laura Mercier", name: "Translucent Loose Setting Powder", shade: "Translucent", price: "$40", priceRange: "Mid", finish: "Matte", coverage: "N/A", hex: "#f5f0e8", description: "The gold standard setting powder since 1996. Finely milled, invisible on all skin tones." },
  { brand: "Morphe", name: "Keep It Precise Translucent Loose Powder", shade: "Universal", price: "$18", priceRange: "Budget", finish: "Matte", coverage: "N/A", hex: "#f8f0e0", description: "A budget favourite that rivals luxury options. Ultra-fine milling, no flashback." },
  { brand: "Hourglass", name: "Veil Translucent Setting Powder", shade: "Translucent", price: "$58", priceRange: "Luxury", finish: "Luminous-Matte", coverage: "N/A", hex: "#f8f5f0", description: "The powder that gives your skin a lit-from-within glow while setting makeup for 10 hours.", proTip: "Mist with water to create a luminous 'baked' skin effect." },
];

export const universalBlushProducts: ProductOption[] = [
  { brand: "NARS", name: "Orgasm Blush", shade: "Orgasm", price: "$32", priceRange: "Mid", finish: "Shimmer", coverage: "N/A", hex: "#d47878", description: "The world's best-selling blush. Peachy-pink with gold shimmer that flatters every skin tone." },
  { brand: "Rare Beauty", name: "Soft Pinch Liquid Blush", shade: "Multiple (20 shades)", price: "$23", priceRange: "Mid", finish: "Natural", coverage: "N/A", hex: "#e87080", description: "The blush that broke the internet. Buildable, long-lasting, natural-looking flush." },
  { brand: "Milani", name: "Baked Blush", shade: "Multiple", price: "$11", priceRange: "Budget", finish: "Shimmer", coverage: "N/A", hex: "#d08888", description: "A budget Italian-baked blush that punches way above its price point for pigment and longevity." },
  { brand: "Charlotte Tilbury", name: "Cheek to Chic Blush", shade: "Multiple", price: "$40", priceRange: "Luxury", finish: "Satin", coverage: "N/A", hex: "#e09090", description: "Two-tone blush with a built-in highlight. Sculpts and highlights in one.", proTip: "Swirl the two shades together to get Charlotte's signature light-catching flush." },
];

export const universalHighlighterProducts: ProductOption[] = [
  { brand: "Becca Cosmetics", name: "Shimmering Skin Perfector", shade: "Multiple", price: "$42", priceRange: "Mid", finish: "Metallic Shimmer", coverage: "N/A", hex: "#f8e8c8", description: "The highlighter that created the strobing trend. Blinding, foiled metallic glow that photographs brilliantly." },
  { brand: "Hourglass", name: "Ambient Lighting Powder", shade: "Multiple", price: "$58", priceRange: "Luxury", finish: "Soft Glow", coverage: "N/A", hex: "#f8e0c0", description: "Not a highlighter — a light filter. Creates a photographic blur and soft inner glow." },
  { brand: "Wet n Wild", name: "MegaGlo Highlighting Powder", shade: "Multiple", price: "$5", priceRange: "Budget", finish: "Shimmer", coverage: "N/A", hex: "#f8e8b8", description: "An extraordinary budget highlighter. Pigmented, blendable, and actually comparable to luxury options." },
];

export const universalContourProducts: ProductOption[] = [
  { brand: "Anastasia Beverly Hills", name: "Contour Kit", shade: "Multiple ranges", price: "$40", priceRange: "Mid", finish: "Matte", coverage: "N/A", hex: "#c8a070", description: "The contouring kit that made contouring mainstream. Cool-toned powder contour and warm powder highlight." },
  { brand: "Charlotte Tilbury", name: "Filmstar Bronze & Glow", shade: "Multiple", price: "$74", priceRange: "Luxury", finish: "Natural Satin", coverage: "N/A", hex: "#c09050", description: "The double-ended kit used on every Charlotte Tilbury photoshoot and red carpet. Bronze and sculpt in one compact.", proTip: "Use the bronze shade lightly as a sun-kissed powder over foundation for a natural glow." },
  { brand: "e.l.f.", name: "Contour Palette", shade: "Universal", price: "$14", priceRange: "Budget", finish: "Matte", coverage: "N/A", hex: "#c09060", description: "A complete contouring kit at an accessible price. Light and medium shades included." },
];

export const universalEyeshadowProducts: ProductOption[] = [
  { brand: "Urban Decay", name: "Naked Palette (Original)", shade: "12 warm neutrals", price: "$54", priceRange: "Mid", finish: "Mix", coverage: "N/A", hex: "#c8a070", description: "The palette that redefined neutral eyeshadow. 12 universally flattering shades from pale nude to deep chocolate." },
  { brand: "Anastasia Beverly Hills", name: "Modern Renaissance Palette", shade: "14 warm tones", price: "$42", priceRange: "Mid", finish: "Mix", coverage: "N/A", hex: "#b86030", description: "Terracotta, burgundy, and burnt orange inspired by Renaissance paintings. The most talked-about palette of the decade." },
  { brand: "e.l.f.", name: "Bite-Size Eyeshadow", shade: "Multiple colorways", price: "$10", priceRange: "Budget", finish: "Mix", coverage: "N/A", hex: "#c8a880", description: "Tiny palette with 4 perfectly coordinated shades for a complete eye look. Accessible and travel-friendly." },
  { brand: "Pat McGrath Labs", name: "Mothership Palette", shade: "10 shades", price: "$125", priceRange: "Ultra-Luxury", finish: "Luxury Mix", coverage: "N/A", hex: "#c0a870", description: "The finest eyeshadow on the market. Ultra-high-pigment formula with foil, metallic, and matte finishes.", proTip: "Use a damp brush to apply the metallic shades for a blinding foiled finish." },
  { brand: "NYX", name: "Ultimate Shadow Palette", shade: "16 shades", price: "$18", priceRange: "Budget", finish: "Mix", coverage: "N/A", hex: "#d0b080", description: "40 shades in one affordable palette. Extensive range covering warm, cool, and bold colourways." },
];

export const universalLipProducts: ProductOption[] = [
  { brand: "MAC", name: "Ruby Woo Lipstick", shade: "Ruby Woo", price: "$21", priceRange: "Mid", finish: "Matte", coverage: "N/A", hex: "#b01828", description: "The world's most iconic red lipstick. Blue-toned red that flatters every skin tone." },
  { brand: "Charlotte Tilbury", name: "Matte Revolution Lipstick", shade: "Multiple (30+ shades)", price: "$35", priceRange: "Luxury", finish: "Matte", coverage: "N/A", hex: "#d4889a", description: "The cushiony, comfortable matte that started Charlotte Tilbury's empire. Pillow Talk is the most sold shade." },
  { brand: "NYX", name: "Soft Matte Lip Cream", shade: "Multiple", price: "$8", priceRange: "Budget", finish: "Soft Matte", coverage: "N/A", hex: "#c08090", description: "A surprisingly luxurious budget liquid lip. Comfortable matte formula in extensive shades." },
  { brand: "Pat McGrath Labs", name: "MatteTrance Lipstick", shade: "Multiple (50 shades)", price: "$40", priceRange: "Ultra-Luxury", finish: "Matte", coverage: "N/A", hex: "#8a1828", description: "The most pigmented matte lipstick available. Cushiony, not drying, with an almost lacquered depth of colour.", proTip: "Line first with a matching liner to extend wear time beyond 8 hours." },
  { brand: "Rare Beauty", name: "Kind Words Matte Lip", shade: "Multiple (24 shades)", price: "$21", priceRange: "Mid", finish: "Matte", coverage: "N/A", hex: "#c09898", description: "A comfortable, long-wearing matte that doesn't crack or dry out lips. Clean, thoughtfully formulated." },
];

export const universalLinerProducts: ProductOption[] = [
  { brand: "Urban Decay", name: "24/7 Glide-On Eye Pencil", shade: "Multiple (40+ shades)", price: "$24", priceRange: "Mid", finish: "Glossy (then sets to matte)", coverage: "N/A", hex: "#0a0a0a", description: "The waterproof liner that glides on effortlessly then sets firmly. Voted #1 liner by MUAs globally." },
  { brand: "NYX", name: "Epic Ink Liner", shade: "Black", price: "$12", priceRange: "Budget", finish: "Glossy", coverage: "N/A", hex: "#080808", description: "A liquid liner tip precise enough for hairlines. Flexible brush tip, waterproof, budget price." },
  { brand: "Charlotte Tilbury", name: "Pillow Liner", shade: "Multiple", price: "$30", priceRange: "Luxury", finish: "Natural Smudge", coverage: "N/A", hex: "#2a1808", description: "A soft, smudge-y liner that creates an effortless, not-too-precise look — the Charlotte signature.", proTip: "Smudge with a small brush immediately after drawing for a lived-in, editorial effect." },
];

export const universalMascaraProducts: ProductOption[] = [
  { brand: "Too Faced", name: "Better Than Sex Mascara", shade: "Black", price: "$29", priceRange: "Mid", finish: "Voluminous", coverage: "N/A", hex: "#0a0a0a", description: "America's #1 prestige mascara. Volume, length, and lift in one — falsie-without-falsies look." },
  { brand: "Maybelline", name: "Lash Sensational Sky High", shade: "Black", price: "$13", priceRange: "Budget", finish: "Lengthening", coverage: "N/A", hex: "#080808", description: "The mascara that sold out globally. A flexible wand that reaches every lash from root to tip. Extraordinary for the price." },
  { brand: "Charlotte Tilbury", name: "Pillow Talk Push Up Lashes Mascara", shade: "Pillow Talk Brown-Black", price: "$30", priceRange: "Luxury", finish: "Lifted and Curled", coverage: "N/A", hex: "#1a1010", description: "Curls, lifts, and adds volume simultaneously. The brown-black shade is perfect for a softer, more natural lash look.", proTip: "Wiggle the wand at the base of lashes before sweeping upward for maximum lift." },
  { brand: "ILIA", name: "Limitless Lash Mascara", shade: "Black", price: "$28", priceRange: "Mid", finish: "Natural", coverage: "N/A", hex: "#0a0a10", description: "A clean mascara that actually performs — nourishing formula with beeswax and castor oil for conditioning while building volume." },
];

export const universalBrowProducts: ProductOption[] = [
  { brand: "Anastasia Beverly Hills", name: "Brow Wiz Pencil", shade: "Multiple (16 shades)", price: "$25", priceRange: "Mid", finish: "Natural", coverage: "N/A", hex: "#5a3020", description: "The pencil that put brow artistry on the map. Micro-fine tip for hair-stroke precision." },
  { brand: "NYX", name: "Micro Brow Pencil", shade: "Multiple", price: "$12", priceRange: "Budget", finish: "Natural", coverage: "N/A", hex: "#5a3818", description: "The best budget brow pencil. Ultra-fine tip for natural hair-stroke effect. A genuine ABH Brow Wiz dupe." },
  { brand: "Benefit", name: "Gimme Brow+ Volumising Fibre Gel", shade: "Multiple (12 shades)", price: "$28", priceRange: "Mid", finish: "Natural Volumised", coverage: "N/A", hex: "#6a4020", description: "Tinted gel with micro-fibres that build brow density instantly. Brilliant for sparse brows or laminated-brow effect." },
  { brand: "Charlotte Tilbury", name: "Brow Lift", shade: "Multiple", price: "$30", priceRange: "Luxury", finish: "Defined and Lifted", coverage: "N/A", hex: "#7a5030", description: "A clear and tinted brow soap that lifts and sets brows in the laminated position without any products bleeding or stiffening.", proTip: "Wet the spoolie slightly before using to activate the maximum hold formula." },
];

// ── Per-look guide steps (using look ID as reference) ─────────────────────

export const lookGuides: LookProductGuide[] = [
  {
    lookId: "trend-clean-girl",
    totalCost: { budget: "$45", mid: "$145", luxury: "$320" },
    steps: [
      {
        stepId: "base",
        stepName: "Skin Prep & Base",
        tool: "Damp beauty blender, or fingers for skin tint",
        productOptions: universalBaseProducts.slice(0, 3),
      },
      {
        stepId: "eyes",
        stepName: "Natural Eye",
        tool: "Finger or flat eyeshadow brush",
        productOptions: universalEyeshadowProducts.slice(0, 3),
      },
      {
        stepId: "brows",
        stepName: "Brushed Brows",
        tool: "Spoolie + micro brow pencil",
        productOptions: universalBrowProducts,
      },
      {
        stepId: "lips",
        stepName: "MLBB Lip",
        tool: "Finger or lip brush",
        productOptions: universalLipProducts.slice(1, 4),
      },
      {
        stepId: "cheeks",
        stepName: "Flushed Blush",
        tool: "Large fluffy brush",
        productOptions: universalBlushProducts,
      },
    ],
  },
  {
    lookId: "trend-soft-glam",
    totalCost: { budget: "$55", mid: "$175", luxury: "$380" },
    steps: [
      {
        stepId: "base",
        stepName: "Full Glam Base",
        tool: "Damp beauty blender + setting brush",
        productOptions: universalBaseProducts,
      },
      {
        stepId: "eyes",
        stepName: "Warm Neutral Eye",
        tool: "Flat shader brush, crease brush, blending brush",
        productOptions: universalEyeshadowProducts,
      },
      {
        stepId: "brows",
        stepName: "Defined Brow",
        tool: "Angled brow brush + spoolie",
        productOptions: universalBrowProducts,
      },
      {
        stepId: "lips",
        stepName: "Rose Lip",
        tool: "Lip liner + lipstick or lip brush",
        productOptions: universalLipProducts,
      },
      {
        stepId: "cheeks",
        stepName: "Sculpted Cheek",
        tool: "Fan brush for highlight, contour brush, blush brush",
        productOptions: [...universalBlushProducts, ...universalHighlighterProducts],
      },
    ],
  },
];
