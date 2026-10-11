import { Look } from "./looks";
import { FaceAnalysis, SkinToneCategory, EyeShapeType, FaceShapeType } from "../hooks/useFaceAnalysis";

export interface ScoredLook extends Look {
  score: number;
  reasons: string[];
}

// ── Scoring maps ───────────────────────────────────────────────────────────

const SKIN_TONE_IDS: Record<SkinToneCategory, string[]> = {
  "Fair": [
    "trend-glass-skin", "trend-balletcore", "trend-no-makeup", "trend-y2k", "eye-fairy", "lip-whisper-pink", "trend-grunge",
    "1960s-mod", "1920s-flapper", "lip-french-blurred",
  ],
  "Light": [
    "trend-soft-glam", "trend-cottagecore", "trend-bridal", "trend-clean-girl", "1940s-pinup", "eye-tightline", "lip-popsicle",
    "trend-old-money", "1950s-hollywood", "lip-soap-brow-nude",
  ],
  "Medium Light": [
    "trend-soft-glam", "trend-glass-skin", "1950s-hollywood",
    "trend-bridal", "eye-chrome", "lip-strawberry", "trend-festival",
    "eye-doe", "trend-indie-softgirl", "lip-orchid",
  ],
  "Medium": [
    "trend-soft-glam", "trend-siren", "1970s-disco",
    "trend-dark-academia", "eye-foxy", "lip-cherry-bomb", "trend-old-money",
    "eye-arabic-kohl", "lip-warm-brown", "trend-office",
  ],
  "Tan": [
    "trend-hard-glam", "trend-festival", "trend-mob-wife", "1990s-grunge",
    "eye-butterfly", "lip-warm-brown", "trend-night-out", "eye-editorial-color",
    "lip-cherry-bomb", "trend-avant-garde",
  ],
  "Deep": [
    "trend-night-out", "trend-siren", "trend-goth",
    "lip-cherry-bomb", "eye-arabic-kohl", "trend-hard-glam", "eye-editorial-color",
    "lip-orchid", "trend-avant-garde", "1970s-disco",
  ],
};

const EYE_SHAPE_IDS: Record<EyeShapeType, string[]> = {
  "Almond": [
    "eye-doublecat", "eye-foxy", "trend-soft-glam", "trend-siren", "eye-chrome",
    "eye-arabic-kohl", "trend-old-money", "1960s-mod", "lip-cherry-bomb",
  ],
  "Round": [
    "eye-doe", "eye-editorial-color", "trend-balletcore", "trend-y2k",
    "trend-soft-glam", "eye-tightline", "trend-indie-softgirl", "lip-popsicle",
  ],
  "Hooded": [
    "eye-tightline", "eye-reverse-cat", "trend-clean-girl", "eye-arabic-kohl",
    "trend-office", "eye-foxy", "lip-french-blurred", "trend-old-money",
  ],
  "Monolid": [
    "eye-chrome", "eye-editorial-color", "eye-arabic-kohl", "trend-avant-garde",
    "trend-festival", "eye-butterfly", "trend-glass-skin", "lip-cherry-bomb",
  ],
  "Upturned": [
    "eye-siren", "eye-reverse-cat", "trend-grunge", "eye-butterfly",
    "trend-goth", "eye-editorial-color", "lip-orchid", "trend-festival",
  ],
  "Downturned": [
    "eye-doublecat", "eye-foxy", "trend-festival", "eye-chrome",
    "trend-soft-glam", "eye-doe", "trend-bridal", "lip-strawberry",
  ],
};

const FACE_SHAPE_IDS: Record<FaceShapeType, string[]> = {
  "Oval": [], // Oval suits everything — handled with flat bonus
  "Round": [
    "trend-hard-glam", "trend-night-out", "trend-mob-wife", "eye-foxy",
    "trend-siren", "trend-dark-academia", "lip-french-blurred", "eye-doublecat",
  ],
  "Square": [
    "trend-soft-glam", "trend-bridal", "trend-cottagecore", "lip-whisper-pink",
    "trend-balletcore", "eye-doe", "trend-indie-softgirl", "lip-popsicle",
  ],
  "Heart": [
    "lip-cherry-bomb", "lip-french-blurred", "lip-orchid", "trend-old-money",
    "lip-strawberry", "lip-warm-brown", "trend-soft-glam", "lip-bratz",
  ],
  "Diamond": [
    "trend-avant-garde", "eye-butterfly", "trend-festival", "eye-editorial-color",
    "trend-glass-skin", "eye-chrome", "trend-siren", "eye-fairy",
  ],
  "Oblong": [
    "trend-hard-glam", "trend-festival", "eye-butterfly", "trend-mob-wife",
    "eye-doe", "trend-soft-glam", "lip-popsicle", "trend-cottagecore",
  ],
};

// ── Reason generators ──────────────────────────────────────────────────────

function skinReason(cat: SkinToneCategory, undertone: string, lookName: string): string {
  const map: Record<SkinToneCategory, string> = {
    "Fair":         `Pale palettes and soft contrast flatter ${cat} skin beautifully.`,
    "Light":        `Light skin pops against this look's colour story.`,
    "Medium Light": `The balanced pigment in ${cat} skin makes these shades shine.`,
    "Medium":       `${cat} skin tones carry rich, warm shades with ease.`,
    "Tan":          `Bold, saturated pigments are irresistible on ${cat} skin.`,
    "Deep":         `Deep skin is the ultimate canvas — this look radiates.`,
  };
  return map[cat];
}

function eyeReason(type: EyeShapeType): string {
  const map: Record<EyeShapeType, string> = {
    "Almond":     "Complements your symmetrical almond eyes.",
    "Round":      "Opens and balances your naturally wide eye shape.",
    "Hooded":     "Maximises visible lid space on hooded lids.",
    "Monolid":    "Creates striking definition on a smooth lid.",
    "Upturned":   "Works with your naturally lifted outer corner.",
    "Downturned": "Lifts and angles your eyes for a foxy effect.",
  };
  return map[type];
}

function faceReason(type: FaceShapeType): string {
  const map: Record<FaceShapeType, string> = {
    "Oval":     "Suits your versatile oval face shape.",
    "Round":    "Adds length and definition to your soft proportions.",
    "Square":   "Softens and romanticises your strong bone structure.",
    "Heart":    "Balances a wide forehead by drawing the eye downward.",
    "Diamond":  "Highlights your striking cheekbone structure.",
    "Oblong":   "Adds horizontal width to balance your longer face.",
  };
  return map[type];
}

// ── Main scorer ────────────────────────────────────────────────────────────

export function recommendLooks(analysis: FaceAnalysis, allLooks: Look[]): ScoredLook[] {
  const { skinTone, eyeShape, faceShape } = analysis;

  const skinIds = new Set(SKIN_TONE_IDS[skinTone.category] ?? []);
  const eyeIds = new Set(EYE_SHAPE_IDS[eyeShape.type] ?? []);
  const faceIds = new Set(FACE_SHAPE_IDS[faceShape.type] ?? []);
  const isOval = faceShape.type === "Oval";

  // De-duplicate looks by id
  const seen = new Set<string>();
  const unique = allLooks.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });

  const scored: ScoredLook[] = unique.map(look => {
    let score = 30;
    const reasons: string[] = [];

    if (skinIds.has(look.id)) {
      score += 40;
      reasons.push(skinReason(skinTone.category, skinTone.undertone, look.name));
    }
    if (eyeIds.has(look.id)) {
      score += 30;
      reasons.push(eyeReason(eyeShape.type));
    }
    if (isOval) {
      score += 15;
      reasons.push(faceReason("Oval"));
    } else if (faceIds.has(look.id)) {
      score += 25;
      reasons.push(faceReason(faceShape.type));
    }

    // Add undertone bonus
    if (skinTone.undertone === "Warm") {
      const warmIds = new Set(["trend-mob-wife", "trend-dark-academia", "1970s-disco", "lip-warm-brown", "trend-soft-glam"]);
      if (warmIds.has(look.id)) { score += 10; }
    } else if (skinTone.undertone === "Cool") {
      const coolIds = new Set(["trend-goth", "trend-balletcore", "trend-y2k", "lip-orchid", "eye-fairy"]);
      if (coolIds.has(look.id)) { score += 10; }
    }

    if (reasons.length === 0) {
      reasons.push("A versatile choice that works beautifully with your features.");
    }

    return { ...look, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 9);
}
