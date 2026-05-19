// Curated in-app beauty tutorial catalogue. Tutorials are static content
// (no video hosting yet) — each one is a step-by-step guide with a hero
// image, difficulty/time metadata, product callouts, and pro tips.
// User ratings + reviews are stored server-side keyed by `id`.

export const TUTORIAL_CATEGORIES = [
  "eyes",
  "lips",
  "contouring",
  "skincare",
  "brows",
  "foundation",
] as const;
export type TutorialCategory = (typeof TUTORIAL_CATEGORIES)[number];

export const TUTORIAL_CATEGORY_LABELS: Record<TutorialCategory, string> = {
  eyes:       "Eyes",
  lips:       "Lips",
  contouring: "Contouring",
  skincare:   "Skincare",
  brows:      "Brows",
  foundation: "Foundation",
};

export const TUTORIAL_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type TutorialDifficulty = (typeof TUTORIAL_DIFFICULTIES)[number];

export const TUTORIAL_DIFFICULTY_LABELS: Record<TutorialDifficulty, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

export interface TutorialStep {
  title: string;
  body: string;
  // Optional short demo clip (10-30s) shown inline above the written
  // instructions on the detail page. Upload via the existing object
  // storage bucket (see `artifacts/api-server/src/routes/storage.ts`)
  // and paste either the returned `objectPath` (e.g.
  // `/objects/uploads/<id>` — it will be auto-resolved to the served
  // `/api/storage` route via `resolveTutorialMediaUrl`) or a
  // fully-qualified URL. See `replit.md` → "Tutorial step video
  // clips" for the curated upload flow and size guidance.
  videoUrl?: string;
  // Optional poster image for the video (recommended — shows before
  // the user hits play instead of a black frame). Same URL rules as
  // `videoUrl`.
  videoPoster?: string;
}

/**
 * Resolve a tutorial media URL into something the browser can fetch.
 *
 * Accepts:
 *  - Fully-qualified URLs (`https://…`, `http://…`, `data:…`, `blob:…`)
 *    → returned as-is.
 *  - Canonical object-storage entity paths from the upload flow
 *    (`/objects/<id>`) → prefixed with `/api/storage` so they hit the
 *    served route in `artifacts/api-server/src/routes/storage.ts`.
 *  - Anything else (already `/api/storage/...`, relative paths)
 *    → returned as-is.
 */
export function resolveTutorialMediaUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith("/objects/")) return `/api/storage${url}`;
  return url;
}

export interface Tutorial {
  id: string;
  title: string;
  category: TutorialCategory;
  difficulty: TutorialDifficulty;
  minutes: number;            // estimated time-to-finish
  instructor: string;         // attribution
  thumbnail: string;          // hero / card image
  summary: string;            // one-liner shown on the card
  tools: string[];            // bullet list of what you need
  steps: TutorialStep[];      // ordered step-by-step
  proTip?: string;            // optional standout tip
}

// Photos are sourced from Unsplash (free editorial use) — kept as remote
// URLs so we don't bloat the bundle. If a thumbnail 404s the card has a
// gradient fallback (see TutorialCard).
export const TUTORIALS: Tutorial[] = [
  {
    id: "soft-glam-smokey",
    title: "Soft glam smokey eye",
    category: "eyes",
    difficulty: "intermediate",
    minutes: 15,
    instructor: "Maya Okafor",
    thumbnail: "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=800&q=80",
    summary: "A bedroom-eye smokey that's blended enough for daytime but sultry enough for dinner.",
    tools: ["Neutral eyeshadow palette", "Fluffy blending brush", "Flat shader brush", "Black eyeliner", "Mascara"],
    steps: [
      { title: "Prime the lid",   body: "Pat a concealer or dedicated eye primer across the entire lid up to the brow bone to keep colour true and stop it creasing." },
      { title: "Lay the base",    body: "Sweep a warm matte mid-tone through the crease in windshield-wiper motions. Keep it above the natural socket line — this is your blending buffer." },
      { title: "Deepen the outer V", body: "Use a darker matte brown in a small 'V' at the outer corner and blend inward, stopping two-thirds across the lid." },
      { title: "Pack the lid",    body: "With a flat shader, press a shimmer or satin shade onto the centre of the lid — pressing (not sweeping) keeps the pigment intense." },
      { title: "Tightline",       body: "Smudge black liner into the upper lash line and waterline, then smoke a soft pencil under the lower lashes from the outer corner to the iris." },
      { title: "Mascara + finish", body: "Two coats of mascara, focus on the outer lashes. Optional: a single wispy half-lash on the outer third for lift." },
    ],
    proTip: "Tap a tiny bit of champagne shimmer in the inner corner LAST — it instantly opens the eye even after everything else is blended out.",
  },
  {
    id: "everyday-no-makeup",
    title: "Everyday 'no-makeup' face",
    category: "foundation",
    difficulty: "beginner",
    minutes: 8,
    instructor: "Priya Sharma",
    thumbnail: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
    summary: "Five-minute base that looks like great skin, not like you put product on great skin.",
    tools: ["Tinted moisturiser or skin tint", "Cream blush", "Concealer", "Brow gel", "Clear or tinted lip balm"],
    steps: [
      { title: "Moisturise + SPF", body: "Always start on hydrated skin — dry patches drink up tinted base and look patchy by lunch." },
      { title: "Tap, don't drag", body: "Press skin tint into the centre of the face with damp fingers, then pull outward. Less is more here." },
      { title: "Spot-conceal",    body: "Dot concealer only on things that bother you — inner corners, a blemish, around the nostrils — and tap with a ring finger." },
      { title: "Cream blush",     body: "One small dot on the apple of each cheek, blend up toward the temple. Smile, check symmetry, build a tiny bit more if needed." },
      { title: "Brows + lips",    body: "Brush brows up with a clear gel and finish with a tinted balm. Done." },
    ],
    proTip: "Apply cream products BEFORE any powder — they melt into the skin and stay put once you set them.",
  },
  {
    id: "classic-red-lip",
    title: "Bullet-proof classic red lip",
    category: "lips",
    difficulty: "beginner",
    minutes: 6,
    instructor: "Coco Bellini",
    thumbnail: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    summary: "Sharp edges, full saturation, and a wear that survives champagne and a kiss.",
    tools: ["Lip scrub", "Lip liner (red)", "Matte red lipstick", "Small concealer brush"],
    steps: [
      { title: "Prep",        body: "Buff lips with a sugar scrub or damp toothbrush, then apply a thin balm and blot it off — you want hydrated, not slippery." },
      { title: "Outline",     body: "Line the cupid's bow in two small X strokes, then connect the outer corners. Stay just barely on the lip line." },
      { title: "Fill in",     body: "Fill the entire lip with the same liner — this is what stops the colour bleeding when the lipstick wears down." },
      { title: "Lay the lipstick", body: "Apply directly from the bullet, then blot once with a tissue and press a second layer on top." },
      { title: "Sharpen",     body: "Use a small concealer brush around the entire lip border to crisp the edge and make the lip look fuller." },
    ],
    proTip: "Stick your finger in your mouth and pull it out — this removes the lipstick from the inside of your lips that ends up on your teeth.",
  },
  {
    id: "snatched-contour",
    title: "Snatched cream contour",
    category: "contouring",
    difficulty: "intermediate",
    minutes: 12,
    instructor: "Andre Lopez",
    thumbnail: "https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800&q=80",
    summary: "Sculpts cheekbones and jaw without looking like a stripe of mud across your face.",
    tools: ["Cream contour stick (2 shades cooler than skin)", "Cream highlight stick", "Damp beauty sponge", "Setting powder"],
    steps: [
      { title: "Find the shadow", body: "Suck in your cheeks. The hollow you feel between cheekbone and jaw is where the contour goes — draw a thin line there, NOT on the cheekbone." },
      { title: "Map the rest",   body: "Add the cream to the sides of the nose, along the jawline, and at the hairline temples. Don't connect any of the lines yet." },
      { title: "Bounce, don't drag", body: "Use a damp sponge to bounce the cream upward and back toward the ear. Dragging moves the product; bouncing diffuses it." },
      { title: "Highlight",      body: "Apply cream highlight down the centre of the nose, the chin, the cupid's bow, and the tops of the cheekbones." },
      { title: "Set sparingly",  body: "Press translucent powder only where you'll get oily — T-zone and chin. Leave the contour and highlight unset for that lit-from-within look." },
    ],
    proTip: "If you mess up: dip the sponge in a bit of foundation and bounce over the mistake — it 'erases' contour better than makeup remover.",
  },
  {
    id: "fluffy-laminated-brows",
    title: "Fluffy laminated-look brows",
    category: "brows",
    difficulty: "beginner",
    minutes: 5,
    instructor: "Hana Müller",
    thumbnail: "https://images.unsplash.com/photo-1581585504220-fc40b9d05bb6?w=800&q=80",
    summary: "The fake-lamination effect — feathery, straight-up, and full — with zero salon visits.",
    tools: ["Clear or tinted brow gel", "Brow pencil (one shade lighter than your hair)", "Spoolie", "Concealer + small brush"],
    steps: [
      { title: "Brush up",        body: "With a spoolie, brush every single hair straight up. You'll see where the gaps are." },
      { title: "Fill the gaps",   body: "Use tiny upward strokes with a fine pencil — you're imitating individual hairs, not drawing on a shape." },
      { title: "Set 'em up",      body: "Apply a strong-hold brow gel from the bottom of the hairs upward to lock them vertical." },
      { title: "Optional clean-up", body: "If you want a sharp finish, run a small concealer brush under the brow bone to define — but skip this for the most natural look." },
    ],
    proTip: "Tinted gel does 90% of the work. If you're new to brows, try just gel + a tiny bit of pencil in the sparse middle.",
  },
  {
    id: "glass-skin-routine",
    title: "K-beauty glass skin prep",
    category: "skincare",
    difficulty: "intermediate",
    minutes: 20,
    instructor: "Jisoo Park",
    thumbnail: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    summary: "Layer-based routine that leaves skin reflective, plump, and so smooth makeup glides on it.",
    tools: ["Oil cleanser", "Gentle foam cleanser", "Hydrating toner", "Essence", "Hyaluronic acid serum", "Moisturiser", "SPF 50"],
    steps: [
      { title: "Double cleanse",   body: "Massage an oil cleanser onto dry skin for 60 seconds — really work it. Rinse, then go in with a gentle foam cleanser." },
      { title: "Pat in toner",     body: "Pour a hydrating toner into your palms and press into the skin in 7 layers (the famous '7-skin method')." },
      { title: "Essence",          body: "Patting motions only — never wipe. Essences are 80% of the glow." },
      { title: "Serum",            body: "A hyaluronic acid serum locks the water in. Apply to slightly damp skin so it draws moisture downward, not out." },
      { title: "Seal it",          body: "Finish with a moisturiser to trap everything below. In the morning, finish with SPF 50 — non-negotiable." },
    ],
    proTip: "Glass skin is consistency, not products. Doing this nightly for two weeks does more than any single luxury serum.",
  },
  {
    id: "ombre-lip",
    title: "K-pop ombré lip",
    category: "lips",
    difficulty: "beginner",
    minutes: 4,
    instructor: "Coco Bellini",
    thumbnail: "https://images.unsplash.com/photo-1583241800698-9c2e30c2f9a3?w=800&q=80",
    summary: "Soft 'just-bitten' lip with darker centre and diffused edges — looks great in selfies.",
    tools: ["Lip balm", "Lip tint or stain", "Concealer", "Cotton swab"],
    steps: [
      { title: "Conceal the lip",  body: "Tap a tiny bit of concealer over your entire lip to neutralise the natural colour." },
      { title: "Tint the centre",  body: "Press a creamy tint onto the centre of both lips — just an inch-wide patch." },
      { title: "Diffuse outward",  body: "Press your lips together gently and use a finger to blur the colour outward in tiny dabs." },
      { title: "Reset the edges",  body: "Use a clean cotton swab to soften any harsh lines around the lip border." },
    ],
  },
  {
    id: "winged-eyeliner",
    title: "Foolproof winged liner",
    category: "eyes",
    difficulty: "advanced",
    minutes: 10,
    instructor: "Maya Okafor",
    thumbnail: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
    summary: "Symmetrical, sharp wings — the cheat-code method that works on every eye shape.",
    tools: ["Felt-tip liquid liner", "Concealer + small brush", "Cotton swab", "Optional: scotch tape"],
    steps: [
      { title: "Find the angle", body: "Hold the liner from the outer corner of your nostril through the outer corner of your eye — that imaginary line is your wing angle." },
      { title: "Mark the tip",   body: "Make a small dot where you want the wing to end. Repeat on the other eye and check symmetry in the mirror." },
      { title: "Connect to the lid", body: "Draw a thin line from the tip back into your lash line at the outer third of your lid, forming a triangle." },
      { title: "Fill the triangle", body: "Fill the triangle, then connect a thin line across the rest of your lash line. Always do the wing first, the line second." },
      { title: "Sharpen + clean", body: "Use a concealer-dipped small brush along the bottom edge of the wing to sharpen the line and erase any wobbles." },
    ],
    proTip: "Tilt your chin DOWN and look at the mirror so you can see your whole lid — don't lean your head back like in tutorials.",
  },
  {
    id: "barely-there-skin",
    title: "Skin-first foundation routine",
    category: "foundation",
    difficulty: "intermediate",
    minutes: 12,
    instructor: "Priya Sharma",
    thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    summary: "Medium-coverage that still looks like skin — no cakey under-eyes, no foundation line.",
    tools: ["Hydrating primer", "Liquid foundation (your shade)", "Damp sponge", "Brightening concealer", "Setting powder", "Setting spray"],
    steps: [
      { title: "Primer",          body: "Apply a hydrating primer with hands — push it in, don't smear it across." },
      { title: "Foundation",      body: "Three tiny dots on the forehead, two on each cheek, one on the chin. Press a damp sponge over each dot." },
      { title: "Concealer triangle", body: "Draw a small downward triangle under each eye (not a half-moon) and bounce in with the same sponge." },
      { title: "Set selectively", body: "Tap powder only under the eyes and across the T-zone. Leave the rest of the face dewy." },
      { title: "Set with mist",   body: "Two pumps of setting spray held at arm's length — this melts the powder back into the skin." },
    ],
    proTip: "Always blend foundation down your neck and earlobes — that's where 'mask face' happens.",
  },
  {
    id: "cut-crease-glam",
    title: "Cut crease for hooded eyes",
    category: "eyes",
    difficulty: "advanced",
    minutes: 25,
    instructor: "Andre Lopez",
    thumbnail: "https://images.unsplash.com/photo-1522335789203-aaa2c6e63a64?w=800&q=80",
    summary: "Defined cut crease that stays visible with your eyes open — designed specifically for hooded lids.",
    tools: ["Eyeshadow primer", "Concealer", "Small flat brush", "Pencil brush", "Eyeshadow palette", "Mascara + falsies optional"],
    steps: [
      { title: "Find the new crease", body: "With eyes OPEN, look straight ahead and mark with a light pencil where your hood meets your moving lid. That's your new crease — higher than the natural one." },
      { title: "Set the transition", body: "Blend a matte transition shade above that mark, fading into the brow bone." },
      { title: "Cut the crease",     body: "Use a small flat brush dipped in concealer to draw a sharp horizontal line along your mark — clean and high enough to be visible when open." },
      { title: "Pack the lid",       body: "Press a shimmer shade onto the lid below the cut, packing it tight against the concealer line." },
      { title: "Define the outer",   body: "Deepen the outer V with a darker matte and blend slightly upward — never past the cut line." },
      { title: "Liner + lashes",     body: "Thin liner along the upper lashes, mascara, optional wispy falsies for lift." },
    ],
    proTip: "Concealer = your cut crease 'eraser' AND your cut crease 'canvas'. Set it with a matching eyeshadow so it doesn't crease.",
  },
  {
    id: "monochromatic-glow",
    title: "Monochromatic warm-peach glow",
    category: "contouring",
    difficulty: "beginner",
    minutes: 7,
    instructor: "Hana Müller",
    thumbnail: "https://images.unsplash.com/photo-1620222740974-26da77c0c977?w=800&q=80",
    summary: "Same warm peach on eyes, cheeks, and lips — fastest 'put-together' look in beauty.",
    tools: ["Peach cream blush or multi-stick", "Fluffy eye brush", "Tinted lip balm in matching shade"],
    steps: [
      { title: "Cheeks first",   body: "Stipple a cream peach blush on the apples and blend up toward the temples." },
      { title: "Eyes",           body: "With a clean fluffy brush, pick up what's left on your finger and wash it across the lid and into the crease." },
      { title: "Lips",           body: "Finish with a sheer warm-peach balm. Match doesn't have to be exact — close is enough." },
    ],
    proTip: "Multi-sticks are made for this look. One product, three placements, you're done in 5 minutes.",
  },
  {
    id: "evening-skincare-recovery",
    title: "Post-makeup nightly recovery",
    category: "skincare",
    difficulty: "beginner",
    minutes: 10,
    instructor: "Jisoo Park",
    thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    summary: "Nighttime routine after a long day in makeup — focuses on detox + repair, not exfoliation.",
    tools: ["Oil/balm cleanser", "Gentle cleanser", "Hydrating toner", "Niacinamide serum", "Rich night cream"],
    steps: [
      { title: "Melt the makeup",  body: "Massage an oil or balm cleanser onto DRY skin for at least one full minute. This is where 90% of the makeup leaves your face." },
      { title: "Second cleanse",   body: "Follow with a gentle foam or cream cleanser to clear what the oil emulsified." },
      { title: "Tone + soothe",    body: "Press a hydrating toner into the skin — alcohol-free, ideally with centella or panthenol." },
      { title: "Niacinamide",      body: "A few drops of 5% niacinamide calms redness from makeup wear and balances oil overnight." },
      { title: "Seal with cream",  body: "Finish with a richer night cream. Skip retinol on nights you've worn full glam — your skin barrier is already working." },
    ],
    proTip: "Never go to sleep in makeup. Even one night = a week of recovery. If you're too tired, micellar wipes are a 30-second bridge to a real wash in the morning.",
  },
];

export function getTutorial(id: string): Tutorial | null {
  return TUTORIALS.find((t) => t.id === id) ?? null;
}

// NOTE: the API server holds a canonical `TUTORIAL_IDS` allowlist in
// `lib/db/src/schema/tutorials.ts` that it uses to validate review writes.
// If you add/remove/rename a tutorial here, update that list too — otherwise
// the server will 404 on reviews for the new id.
