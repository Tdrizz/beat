/**
 * Beauty archetypes. Each archetype is a "personality lens" the app uses
 * to personalise look recommendations, palette suggestions, and per-area
 * makeup tips on top of the existing face-shape / skin-tone analysis.
 *
 * Why six and not twelve: a 5-question quiz can robustly separate ~6 buckets;
 * any more and the noise floor (single-question swings) makes results feel
 * arbitrary. These six are also what beauty editorial has converged on for
 * decades (romantic / siren / icon / muse / rebel / naturalist).
 *
 * `moodMatchers` is what we use to filter the existing look catalogue —
 * substrings checked case-insensitively against `Look.mood` so we don't
 * have to retag every catalogue entry.
 */
export type ArchetypeId =
  | "romantic"
  | "siren"
  | "icon"
  | "muse"
  | "rebel"
  | "naturalist";

export interface ArchetypeTip {
  area: "base" | "eyes" | "brows" | "cheeks" | "lips";
  text: string;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  tagline: string;
  description: string;
  /** 4-6 hex swatches that define the archetype's signature palette. */
  palette: string[];
  /** Substrings matched against `Look.mood` (case-insensitive). */
  moodMatchers: string[];
  /** Personalised area-by-area makeup direction for this archetype. */
  tips: ArchetypeTip[];
  /** Mood-rail style adjective list — used in the result page subhead. */
  vibes: string[];
}

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  romantic: {
    id: "romantic",
    name: "The Romantic",
    tagline: "Soft. Dreamy. A blush of poetry.",
    description:
      "You're drawn to softness — the gauzy filter of a candle-lit room, a hand-written note, the colour of the inside of a peony. Your beauty is luminous and tender, and your makeup amplifies that warmth instead of armouring against the world.",
    palette: ["#fbe7e3", "#f3b6ad", "#e08a8a", "#c46c7a", "#8a4a5e"],
    moodMatchers: ["doll", "playful", "warm", "radiant", "luminous", "ethereal"],
    vibes: ["Tender", "Glowy", "Hand-written-letter pretty"],
    tips: [
      { area: "base", text: "Skip matte. Use a satin or dewy base so light catches the highest points of your face — that 'just-walked-in-from-the-cold' flush." },
      { area: "cheeks", text: "Cream blush in petal pink or peach, pressed high on the cheekbones with fingertips, then a barely-there layer on the bridge of the nose." },
      { area: "eyes", text: "Wash the lid in a soft champagne, smudge a warm rose along the lash line. Lots of mascara, no liner — keep eyes round and open." },
      { area: "lips", text: "A glossy rose-petal lip with a slightly blurred edge. Dab the centre with a touch of shimmer for a bitten-fruit finish." },
      { area: "brows", text: "Brush brows up and set with clear gel. Avoid hard pencil — softness is the whole story." },
    ],
  },
  siren: {
    id: "siren",
    name: "The Siren",
    tagline: "Magnetic. Sultry. The room turns to look.",
    description:
      "You don't ask for attention — you receive it. Your beauty signature is heat: a smoulder in the eye, a stain on the lip, the kind of finish that reads from across a crowded room. Drama is your default, not your special-occasion.",
    palette: ["#1a0a0a", "#4a1018", "#8a1d2c", "#c0223a", "#e8806b"],
    moodMatchers: ["sultry", "smoldering", "smouldering", "commanding", "bold", "fierce", "dramatic"],
    vibes: ["Smoky", "Velvet", "Slow-burning"],
    tips: [
      { area: "eyes", text: "Build a smoky eye in chocolate or aubergine — pat colour into the lash line first, then diffuse outward. Lash-line liner, no wing required." },
      { area: "lips", text: "A blotted blood-red or oxblood lip is your uniform. Line just slightly outside the natural border, then press the colour in with a fingertip for a 'lived-in' stain." },
      { area: "cheeks", text: "Skip pink — go bronze or terracotta, sculpted under the cheekbone. The shadow is what gives the face its drama." },
      { area: "base", text: "Skin should look polished, not powdery. A satin foundation with a strategic highlight on the brow bone and cupid's bow." },
      { area: "brows", text: "Defined and slightly arched — the brow is the curtain framing the smoke." },
    ],
  },
  icon: {
    id: "icon",
    name: "The Icon",
    tagline: "Polished. Timeless. A face you'd see on a coin.",
    description:
      "You like things to be considered. Tailored. Done well. Your makeup is a vocabulary of classics — the perfect red, the perfect liner, the perfect skin — executed with precision rather than reinvented every weekend. People save your photos for inspiration.",
    palette: ["#f4ece2", "#d8b48a", "#b07d4e", "#6b3a2a", "#1d1310"],
    moodMatchers: ["classic", "iconic", "timeless", "sculpted", "precise", "cohesive", "regal", "editorial"],
    vibes: ["Tailored", "Cinematic", "Old-Hollywood"],
    tips: [
      { area: "base", text: "Invest in skin first. A second-skin foundation, set only where you need it (T-zone), and a long-wear concealer that doesn't move all night." },
      { area: "brows", text: "Brows are the architecture — fill in sparse spots with hair-stroke flicks, lock with brow gel. Symmetrical, defined, never blocky." },
      { area: "eyes", text: "A clean winged liner in true black, mascara on top lashes only, and a single warm taupe in the crease. Done." },
      { area: "lips", text: "Find your perfect classic red and treat it like a wardrobe staple. Line, fill, blot, repeat." },
      { area: "cheeks", text: "Subtle bronzer along the cheekbone, a whisper of pink on the apples. Restraint is the whole point." },
    ],
  },
  muse: {
    id: "muse",
    name: "The Muse",
    tagline: "Artistic. Ethereal. Painterly.",
    description:
      "You see makeup as a medium. Colour theory, texture play, light on skin — these are tools, not just products. Your face changes with your mood, and your mood is rich. Editorial covers, gallery openings and full-moon picnics all live in your camera roll.",
    palette: ["#2c1844", "#6a3aa8", "#b07ee8", "#e8b8c8", "#f5d878"],
    moodMatchers: ["ethereal", "celestial", "boundary", "editorial", "glittery", "dreamy"],
    vibes: ["Painterly", "Iridescent", "Slightly otherworldly"],
    tips: [
      { area: "eyes", text: "Play with unexpected pigment — lavender on the inner corner, an apricot wash on the lid, a gold liner along the lower lash line. The eye is your canvas." },
      { area: "cheeks", text: "Layer a cream blush under a powder one in a slightly different temperature for depth — coral over a soft mauve, or peach over berry." },
      { area: "lips", text: "Try a sheer wash of an unusual colour — rust, plum, terra-cotta — applied with a fingertip so the texture stays modern, never costumey." },
      { area: "base", text: "Mix a drop of liquid highlighter into your foundation for that lit-from-within glow. Skip heavy powder." },
      { area: "brows", text: "Soft, brushed-up, slightly undone — your brows should look lived-in, like you just got back from a trip." },
    ],
  },
  rebel: {
    id: "rebel",
    name: "The Rebel",
    tagline: "Edgy. Daring. Rules are for other faces.",
    description:
      "You'd rather be talked about than ignored. Black liner, neon flick, glitter where there shouldn't be glitter — your face is your art project, and you're not asking permission. Trends are starting points, not endpoints.",
    palette: ["#0a0a0a", "#1c1c2e", "#4a1a6a", "#d81e8a", "#f0c800"],
    moodMatchers: ["edgy", "rebellious", "electric", "punk", "boundary", "fierce"],
    vibes: ["Sharp", "High-contrast", "Unapologetic"],
    tips: [
      { area: "eyes", text: "Lean into graphic — a thick winged liner, a floating crease, a neon flick in the inner corner. Felt-tip liners are your best friend." },
      { area: "lips", text: "A blackened plum, a true black, or a chrome silver. Mattes and metallics, never gloss." },
      { area: "brows", text: "Bleached, shaved, or brushed sideways — anything but conventional. The brow is a statement." },
      { area: "base", text: "Skin can be matte and almost masklike — that's the contrast that makes the colour pop. Don't be afraid of zero highlight." },
      { area: "cheeks", text: "Skip blush entirely on heavy-eye days. When you do wear it, go cool — mauve, plum, or a sheer red." },
    ],
  },
  naturalist: {
    id: "naturalist",
    name: "The Naturalist",
    tagline: "Fresh. Glowing. Skin first, always.",
    description:
      "Your beauty philosophy is 'enhance, don't overwrite.' You'd rather spend on a great serum than a great eyeshadow palette, and your idea of a full face takes seven minutes. The result reads as healthy, lit, and entirely yourself.",
    palette: ["#fdeede", "#ecd1b7", "#d4a37e", "#a86c4a", "#5c3422"],
    moodMatchers: ["luminous", "radiant", "warm", "cohesive", "fresh", "glowy", "natural"],
    vibes: ["Skin-first", "Lit-from-within", "Effortless"],
    tips: [
      { area: "base", text: "Build with a tinted moisturiser or skin tint — never full coverage. Concealer only where you need it, pressed with a finger so it melts in." },
      { area: "cheeks", text: "Cream blush, applied before powder, in a colour just two shades warmer than your natural flush. A drop of liquid highlight on the very top of the cheekbone." },
      { area: "lips", text: "A tinted lip balm or a sheer berry stain. Bite, blot, repeat." },
      { area: "brows", text: "Brushed up with clear gel and lightly filled with a soap brow technique — the goal is fluffy, not drawn." },
      { area: "eyes", text: "Curl lashes, one coat of brown mascara, maybe a swipe of warm cream shadow. Your skin is doing the talking." },
    ],
  },
};

export const ARCHETYPE_LIST: Archetype[] = Object.values(ARCHETYPES);

export function getArchetype(id: ArchetypeId | null | undefined): Archetype | null {
  if (!id) return null;
  return ARCHETYPES[id] ?? null;
}

/**
 * Returns true if the look's mood matches one of this archetype's
 * mood-keyword substrings. Case-insensitive substring match so a look
 * tagged "Smouldering Glam" matches the siren's "smouldering" matcher.
 */
export function lookMatchesArchetype(look: { mood: string }, archetype: Archetype): boolean {
  const m = look.mood.toLowerCase();
  return archetype.moodMatchers.some((kw) => m.includes(kw));
}
