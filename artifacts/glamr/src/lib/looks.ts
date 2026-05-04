export interface LookStep {
  id: string;
  name: string;
  instruction: string;
  color?: string;
  colorName?: string;
}

export interface Look {
  id: string;
  name: string;
  mood: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  era?: string;
  celebrity?: string;
  description: string;
  timeEstimate: string;
  steps: {
    base: LookStep;
    eyes: LookStep;
    brows: LookStep;
    lips: LookStep;
    cheeks: LookStep;
  };
  palette: string[];
}

export const byEraLooks: Look[] = [
  {
    id: "1920s-flapper",
    name: "1920s Flapper",
    mood: "Dramatic",
    difficulty: "Intermediate",
    era: "1920s",
    timeEstimate: "25 min",
    description: "Dark kohl-rimmed eyes, porcelain skin, and bold dark lips inspired by the Jazz Age rebels who danced through Prohibition.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Apply ivory foundation and set with powder for a matte porcelain finish.", color: "#f8f4f0", colorName: "Ivory Matte" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Smudge charcoal shadow across the lid and rim heavily with black kohl.", color: "#2d2d2d", colorName: "Smoky Charcoal" },
      brows: { id: "brows", name: "Brows", instruction: "Draw a thin, extended, downward-sloping arch.", color: "#222222", colorName: "Dark Ash" },
      lips: { id: "lips", name: "Lips", instruction: "Exaggerate the cupid's bow with a deep burgundy shade.", color: "#1a0a0a", colorName: "Deep Burgundy" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Keep cheeks pale and matte.", color: "#e8d8d0", colorName: "Pale Matte" },
    },
    palette: ["#f8f4f0", "#2d2d2d", "#1a0a0a"],
  },
  {
    id: "1940s-pinup",
    name: "1940s Pin-Up",
    mood: "Classic",
    difficulty: "Beginner",
    era: "1940s",
    timeEstimate: "15 min",
    description: "Victory rolls glamour — vivid red lips, winged liner, and a polished wartime beauty that was an act of defiance.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Warm medium foundation for a healthy glow.", color: "#f0dac8", colorName: "Warm Medium" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Sweep brown in the crease and draw a fine winged liner.", color: "#3a1a00", colorName: "Classic Wing" },
      brows: { id: "brows", name: "Brows", instruction: "Create a defined, natural arch.", color: "#4a3020", colorName: "Warm Brown" },
      lips: { id: "lips", name: "Lips", instruction: "Apply a true, vivid red lip.", color: "#cc1020", colorName: "True Red" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Add a rosy flush to the apples of the cheeks.", color: "#d87070", colorName: "Rosy Apples" },
    },
    palette: ["#f0dac8", "#3a1a00", "#cc1020"],
  },
  {
    id: "1950s-hollywood",
    name: "1950s Hollywood Glam",
    mood: "Iconic",
    difficulty: "Advanced",
    era: "1950s",
    timeEstimate: "40 min",
    description: "Marilyn-era perfection: immaculate skin, dramatic cat-eye, nude lips, and sculpted bone structure.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Create a flawless, matte base.", color: "#f5e0d0", colorName: "Flawless Matte" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Champagne lid with an extended dramatic cat-eye liner.", color: "#1a1a1a", colorName: "Extended Cat-Eye" },
      brows: { id: "brows", name: "Brows", instruction: "Sculpt a full, defined brow.", color: "#3a2010", colorName: "Defined Arch" },
      lips: { id: "lips", name: "Lips", instruction: "Apply a soft nude pink lip.", color: "#f2c4b0", colorName: "Nude Pink" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Soft peach blush with a subtle highlight.", color: "#e8a088", colorName: "Soft Peach" },
    },
    palette: ["#f5e0d0", "#1a1a1a", "#f2c4b0"],
  },
  {
    id: "1960s-mod",
    name: "1960s Mod",
    mood: "Playful",
    difficulty: "Advanced",
    era: "1960s",
    timeEstimate: "40 min",
    description: "Twiggy's doll-lash revolution: graphic liner, white shadow, sky-high lashes, and pale nude lips for maximum eye drama.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Apply a pale, porcelain matte base.", color: "#faf0e8", colorName: "Porcelain" },
      eyes: { id: "eyes", name: "Eyes", instruction: "White lid, graphic black crease liner, and painted lower lashes.", color: "#000000", colorName: "Graphic Black" },
      brows: { id: "brows", name: "Brows", instruction: "Keep brows bleached or very light.", color: "#d0c8b8", colorName: "Light Ash" },
      lips: { id: "lips", name: "Lips", instruction: "Apply a pale nude beige lip.", color: "#f5f0e8", colorName: "Pale Beige" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Keep cheeks barely there.", color: "#f0e0d0", colorName: "Barely There" },
    },
    palette: ["#faf0e8", "#000000", "#f5f0e8"],
  },
  {
    id: "1970s-disco",
    name: "1970s Disco Glam",
    mood: "Electric",
    difficulty: "Intermediate",
    era: "1970s",
    timeEstimate: "25 min",
    description: "Studio 54 afterhours: bronze skin, glitter lids, frosty lips, and enough shimmer to catch the mirror ball.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Create a warm, bronzed base.", color: "#d89868", colorName: "Warm Bronze" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Apply bronze and gold glitter with smudged liner.", color: "#d4a843", colorName: "Gold Glitter" },
      brows: { id: "brows", name: "Brows", instruction: "Brush up for a natural, full look.", color: "#4a3020", colorName: "Natural Full" },
      lips: { id: "lips", name: "Lips", instruction: "Swipe on a frosted nude-pink lip.", color: "#e8c4a0", colorName: "Frosted Pink" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Sweep bronzer high on the cheekbones.", color: "#c87850", colorName: "High Bronzer" },
    },
    palette: ["#d89868", "#d4a843", "#e8c4a0"],
  },
  {
    id: "1980s-power",
    name: "1980s Power Glam",
    mood: "Bold",
    difficulty: "Intermediate",
    era: "1980s",
    timeEstimate: "25 min",
    description: "Dynasty shoulders, Dynasty makeup — electric blue shadow, heavy blush in fuchsia arcs, and lips painted for boardroom domination.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Apply a full coverage matte foundation.", color: "#f0d8c8", colorName: "Full Matte" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Blend electric blue and purple shadows aggressively.", color: "#0040cc", colorName: "Electric Blue" },
      brows: { id: "brows", name: "Brows", instruction: "Fill in for a bold, thick brow.", color: "#222222", colorName: "Bold Thick" },
      lips: { id: "lips", name: "Lips", instruction: "Paint a sharp raspberry lip.", color: "#cc2060", colorName: "Raspberry" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Drape heavy fuchsia blush up to the temples.", color: "#e0204a", colorName: "Fuchsia Drape" },
    },
    palette: ["#0040cc", "#cc2060", "#e0204a"],
  },
  {
    id: "1990s-grunge",
    name: "1990s Grunge Chic",
    mood: "Edgy",
    difficulty: "Beginner",
    era: "1990s",
    timeEstimate: "15 min",
    description: "Courtney Love lipstick smeared with intent — smudged liner, dark brown lip, barely-there concealer, deliberately undone.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Minimal concealer, let natural skin show.", color: "#e8d8c8", colorName: "Bare Skin" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Heavily smudge black kohl pencil around the eyes.", color: "#1a1a1a", colorName: "Smudged Kohl" },
      brows: { id: "brows", name: "Brows", instruction: "Leave brows minimal and natural.", color: "#403028", colorName: "Natural" },
      lips: { id: "lips", name: "Lips", instruction: "Apply a dark brown plum lip.", color: "#4a1a2a", colorName: "Brown Plum" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "No blush.", color: "transparent", colorName: "None" },
    },
    palette: ["#e8d8c8", "#1a1a1a", "#4a1a2a"],
  },
  {
    id: "2000s-y2k",
    name: "2000s Y2K",
    mood: "Glittery",
    difficulty: "Beginner",
    era: "2000s",
    timeEstimate: "15 min",
    description: "Bubblegum gloss lips, crystalline liner, and icy blue shadow — the aesthetic that launched a million MySpace profiles.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Light, dewy base.", color: "#f5e8d8", colorName: "Dewy Light" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Icy blue lid with graphic liner and individual glitter pieces.", color: "#aad4f0", colorName: "Icy Blue" },
      brows: { id: "brows", name: "Brows", instruction: "Thin, over-plucked style.", color: "#503828", colorName: "Thin Arch" },
      lips: { id: "lips", name: "Lips", instruction: "Pink gloss heavily lined with a darker pencil.", color: "#f0a0c8", colorName: "Bubblegum Gloss" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Peachy shimmer blush.", color: "#f0b8a8", colorName: "Peach Shimmer" },
    },
    palette: ["#aad4f0", "#f0a0c8", "#f0b8a8"],
  },
  {
    id: "2010s-contour",
    name: "2010s Contour Queen",
    mood: "Sculpted",
    difficulty: "Advanced",
    era: "2010s",
    timeEstimate: "40 min",
    description: "Kim K's makeup artist secret — strategic shadows carve cheekbones from thin air, strobing illuminates, and brows are painted architecture.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Full glam base with aggressive highlight and contour.", color: "#e0b898", colorName: "Full Glam" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Warm brown blend with dramatic liner.", color: "#5a3a20", colorName: "Warm Brown Blend" },
      brows: { id: "brows", name: "Brows", instruction: "Sculpted, microbladed ombre brow.", color: "#3a2010", colorName: "Ombre Brow" },
      lips: { id: "lips", name: "Lips", instruction: "Matte liquid nude lip.", color: "#d8a890", colorName: "Matte Nude" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Sharp contour, blush, and blinding strobe highlight.", color: "#8b5a3a", colorName: "Sharp Contour" },
    },
    palette: ["#5a3a20", "#d8a890", "#8b5a3a"],
  },
  {
    id: "2020s-glass",
    name: "2020s Glass Skin",
    mood: "Luminous",
    difficulty: "Beginner",
    era: "2020s",
    timeEstimate: "15 min",
    description: "Dewy skin as the destination — barely there base, glossy lids, natural brows, and lips that look like they're always just been kissed.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Skin tint with dew drops for a glass-like finish.", color: "#f8e8d0", colorName: "Glass Skin" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Clear gloss on lids.", color: "#ffffff", colorName: "Clear Gloss" },
      brows: { id: "brows", name: "Brows", instruction: "Soap brows, brushed up and fluffy.", color: "#403020", colorName: "Fluffy Brow" },
      lips: { id: "lips", name: "Lips", instruction: "Sheer pink lip oil.", color: "#f0c8d0", colorName: "Sheer Pink" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "A dot of liquid blush blended out.", color: "#e898a8", colorName: "Liquid Flush" },
    },
    palette: ["#f8e8d0", "#ffffff", "#f0c8d0"],
  }
];

export const celebrityLooks: Look[] = [
  {
    id: "audrey-breakfast",
    name: "Audrey Hepburn",
    mood: "Timeless",
    difficulty: "Intermediate",
    celebrity: "Audrey Hepburn",
    era: "1961 Breakfast at Tiffany's",
    timeEstimate: "25 min",
    description: "Holly Golightly's updo moment — sleek chignon, elongated cat-eye, delicate lash, and pale nude lip. Effortless Upper East Side.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Luminous porcelain finish.", color: "#faf0e8", colorName: "Porcelain" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Elongated cat-eye and delicate individual lashes.", color: "#1a1a1a", colorName: "Classic Black" },
      brows: { id: "brows", name: "Brows", instruction: "Strong, defined, slightly rounded arch.", color: "#3a2820", colorName: "Strong Brunette" },
      lips: { id: "lips", name: "Lips", instruction: "Pale nude rose lip.", color: "#d4a090", colorName: "Nude Rose" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Soft natural blush.", color: "#e0b0a0", colorName: "Soft Flush" },
    },
    palette: ["#faf0e8", "#1a1a1a", "#d4a090"],
  },
  {
    id: "marilyn-red",
    name: "Marilyn Monroe",
    mood: "Sultry",
    difficulty: "Intermediate",
    celebrity: "Marilyn Monroe",
    era: "1950s",
    timeEstimate: "25 min",
    description: "The most copied makeup look in history — red lip bow with liner, winged cat-eye, and that perfect beauty mark.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Flawless warm base.", color: "#f5e8d8", colorName: "Warm Flawless" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Cat-eye wing over a natural lid.", color: "#1a1a1a", colorName: "Sharp Wing" },
      brows: { id: "brows", name: "Brows", instruction: "Peaked, arched brows.", color: "#c8a880", colorName: "Warm Blonde" },
      lips: { id: "lips", name: "Lips", instruction: "True red lip with an overdrawn bow.", color: "#cc0020", colorName: "Monroe Red" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Soft peach glow.", color: "#e8b8a0", colorName: "Peach Glow" },
    },
    palette: ["#f5e8d8", "#1a1a1a", "#cc0020"],
  },
  {
    id: "twiggy-mod",
    name: "Twiggy",
    mood: "Doll-Like",
    difficulty: "Advanced",
    celebrity: "Twiggy",
    era: "1960s Mod",
    timeEstimate: "40 min",
    description: "The lower lash illusion that made Twiggy's eyes look enormous — painted lower lashes, triple mascara top, graphic lids.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Matte, pale coverage.", color: "#f8f0e8", colorName: "Pale Matte" },
      eyes: { id: "eyes", name: "Eyes", instruction: "White lid, graphic crease, and painted lower lashes.", color: "#000000", colorName: "Graphic Black" },
      brows: { id: "brows", name: "Brows", instruction: "Pale, minimal brows.", color: "#d0c0b0", colorName: "Pale Ash" },
      lips: { id: "lips", name: "Lips", instruction: "Nude pink lip.", color: "#f0e8e0", colorName: "Nude Pink" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Minimal to no blush.", color: "transparent", colorName: "None" },
    },
    palette: ["#f8f0e8", "#000000", "#f0e8e0"],
  },
  {
    id: "diana-70s",
    name: "Diana Ross",
    mood: "Commanding",
    difficulty: "Intermediate",
    celebrity: "Diana Ross",
    era: "1970s Drama",
    timeEstimate: "25 min",
    description: "Disco-era Supreme power — enormous lashes, sculpted cheekbones, rich brown tones, and a presence that fills every room.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Warm bronze finish.", color: "#a06040", colorName: "Warm Bronze" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Rich brown shadow with voluminous false lashes.", color: "#3a1a00", colorName: "Rich Brown" },
      brows: { id: "brows", name: "Brows", instruction: "Defined, strong brows.", color: "#2a1810", colorName: "Deep Brown" },
      lips: { id: "lips", name: "Lips", instruction: "Warm berry lip.", color: "#8a3a4a", colorName: "Warm Berry" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Sculpted bronze and highlight.", color: "#804020", colorName: "Sculpted Bronze" },
    },
    palette: ["#a06040", "#3a1a00", "#8a3a4a"],
  },
  {
    id: "madonna-rebel",
    name: "Madonna",
    mood: "Rebellious",
    difficulty: "Beginner",
    celebrity: "Madonna",
    era: "1980s Rebel",
    timeEstimate: "15 min",
    description: "Like a Virgin crossed with Desperately Seeking Susan — heavy liner, mismatched eye shadow, pink blush arcs, and anything-goes lip.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Light, matte coverage.", color: "#f0e0d0", colorName: "Light Matte" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Heavy black liner and smudged blue shadow.", color: "#000080", colorName: "Rebel Blue" },
      brows: { id: "brows", name: "Brows", instruction: "Dark, untamed brows.", color: "#2a2018", colorName: "Untamed" },
      lips: { id: "lips", name: "Lips", instruction: "Bright raspberry pink lip.", color: "#e02060", colorName: "Raspberry Pink" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Heavy pink blush swept up to the temples.", color: "#d84070", colorName: "Pink Drape" },
    },
    palette: ["#000080", "#e02060", "#d84070"],
  },
  {
    id: "naomi-90s",
    name: "Naomi Campbell",
    mood: "Fierce",
    difficulty: "Intermediate",
    celebrity: "Naomi Campbell",
    era: "1990s Supermodel",
    timeEstimate: "25 min",
    description: "Runway precision meets editorial drama — strong brows, flawless coverage, jewel-toned lid pop, and a lip that means business.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Full, flawless coverage.", color: "#8a5a40", colorName: "Flawless Bronze" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Deep jewel-toned lid with precise liner.", color: "#2a0a4a", colorName: "Deep Amethyst" },
      brows: { id: "brows", name: "Brows", instruction: "Defined, sculpted brows.", color: "#20100a", colorName: "Sculpted Dark" },
      lips: { id: "lips", name: "Lips", instruction: "Rich burgundy lip.", color: "#601030", colorName: "Rich Burgundy" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Deep, sculpted contour.", color: "#603020", colorName: "Deep Sculpt" },
    },
    palette: ["#8a5a40", "#2a0a4a", "#601030"],
  },
  {
    id: "jlo-y2k",
    name: "Jennifer Lopez",
    mood: "Radiant",
    difficulty: "Intermediate",
    celebrity: "Jennifer Lopez",
    era: "Y2K Glow",
    timeEstimate: "25 min",
    description: "J.Lo's signature — bronzed skin turned up to maximum, shimmery champagne lid, warm nude lips, and an overall light-from-within warmth.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Bronzed, warm glow.", color: "#c89870", colorName: "Golden Glow" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Champagne shimmer and warm brown crease.", color: "#d4a030", colorName: "Champagne Shimmer" },
      brows: { id: "brows", name: "Brows", instruction: "Natural, full brows.", color: "#503828", colorName: "Natural Full" },
      lips: { id: "lips", name: "Lips", instruction: "Warm nude beige lip gloss.", color: "#c89060", colorName: "Warm Nude" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Gold bronzer and warm blush.", color: "#b87048", colorName: "Gold Bronzer" },
    },
    palette: ["#c89870", "#d4a030", "#c89060"],
  },
  {
    id: "rihanna-edgy",
    name: "Rihanna",
    mood: "Boundary-Pushing",
    difficulty: "Advanced",
    celebrity: "Rihanna",
    era: "2010s Edgy",
    timeEstimate: "40 min",
    description: "Whether bloodied editorial, graphic liner, or Fenty beauty realness — Rihanna's look always says 'I made this rule, I'll break it.'",
    steps: {
      base: { id: "base", name: "Base", instruction: "Flawless full coverage.", color: "#a87858", colorName: "Flawless Medium" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Bold, graphic liner wing.", color: "#1a004a", colorName: "Graphic Navy" },
      brows: { id: "brows", name: "Brows", instruction: "Strong, structured brows.", color: "#3a2010", colorName: "Structured Brown" },
      lips: { id: "lips", name: "Lips", instruction: "Deep berry or bold statement lip.", color: "#601a3a", colorName: "Deep Berry" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Sculpted and heavily strobed.", color: "#8a5038", colorName: "Strobed Sculpt" },
    },
    palette: ["#a87858", "#1a004a", "#601a3a"],
  },
  {
    id: "zendaya-ethereal",
    name: "Zendaya",
    mood: "Ethereal",
    difficulty: "Beginner",
    celebrity: "Zendaya",
    era: "2020s Ethereal",
    timeEstimate: "15 min",
    description: "Euphoria meets real life — glitter freckles, dewy skin, soft smoky eye with unexpected color pops and glossy nude lip.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Dewy skin tint.", color: "#b88870", colorName: "Dewy Tint" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Soft smoky eye with subtle color pop and glitter.", color: "#6040a0", colorName: "Soft Violet Pop" },
      brows: { id: "brows", name: "Brows", instruction: "Natural, strong brows.", color: "#402818", colorName: "Natural Strong" },
      lips: { id: "lips", name: "Lips", instruction: "Nude lip gloss.", color: "#e8c4b8", colorName: "Nude Gloss" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Natural blush with glitter freckles.", color: "#c87868", colorName: "Glitter Flush" },
    },
    palette: ["#6040a0", "#e8c4b8", "#c87868"],
  },
  {
    id: "beyonce-golden",
    name: "Beyoncé",
    mood: "Regal",
    difficulty: "Advanced",
    celebrity: "Beyoncé",
    era: "Golden Goddess",
    timeEstimate: "40 min",
    description: "Renaissance goddess — liquid gold highlight, warm smoky amber eye, skin that looks lit from within, and an earth-goddess lip.",
    steps: {
      base: { id: "base", name: "Base", instruction: "Glowing, warm foundation.", color: "#b88050", colorName: "Glowing Warmth" },
      eyes: { id: "eyes", name: "Eyes", instruction: "Amber gold smoky eye.", color: "#c88020", colorName: "Amber Gold" },
      brows: { id: "brows", name: "Brows", instruction: "Sculpted, full brows.", color: "#4a2810", colorName: "Sculpted Full" },
      lips: { id: "lips", name: "Lips", instruction: "Warm terracotta nude lip.", color: "#c07040", colorName: "Terracotta Nude" },
      cheeks: { id: "cheeks", name: "Cheeks", instruction: "Gold highlight and warm bronzer.", color: "#a05830", colorName: "Gold Highlight" },
    },
    palette: ["#b88050", "#c88020", "#c07040"],
  }
];

export const allLooks = [...byEraLooks, ...celebrityLooks];
