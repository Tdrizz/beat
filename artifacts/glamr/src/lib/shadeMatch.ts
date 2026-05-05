import { Look } from "./looks";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ── Types ──────────────────────────────────────────────────────────────────

export type SkinDepth = "fair" | "light" | "medium" | "tan" | "deep";
export type Undertone  = "warm" | "cool" | "neutral";

export interface SkinProfile {
  depth: SkinDepth;
  undertone: Undertone;
  hex: string;
}

// ── Pixel sampling ─────────────────────────────────────────────────────────

function samplePixels(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  radius = 10
): [number, number, number] {
  const x  = Math.max(0, Math.round(cx - radius));
  const y  = Math.max(0, Math.round(cy - radius));
  const sz = radius * 2;
  const d  = ctx.getImageData(x, y, sz, sz).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 10) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  }
  if (!n) return [200, 170, 140];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

// ── Profile classification ─────────────────────────────────────────────────

export function classifyProfile(r: number, g: number, b: number): SkinProfile {
  const [, , l] = rgbToHsl(r, g, b);
  const warmBias = r - b;
  const undertone: Undertone = warmBias > 22 ? "warm" : warmBias < -8 ? "cool" : "neutral";

  let depth: SkinDepth;
  if      (l > 72) depth = "fair";
  else if (l > 58) depth = "light";
  else if (l > 42) depth = "medium";
  else if (l > 28) depth = "tan";
  else              depth = "deep";

  return { depth, undertone, hex: rgbToHex(r, g, b) };
}

// ── Sample skin from video frame using landmarks ───────────────────────────

export function sampleSkinProfile(
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[]
): SkinProfile {
  const w = video.videoWidth;
  const h = video.videoHeight;
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const ctx = off.getContext("2d")!;
  ctx.drawImage(video, 0, 0);

  // Sample from both cheeks (landmarks 50, 280) and forehead area (10)
  const sample = (idx: number, r = 12): [number, number, number] => {
    const lm = landmarks[idx];
    return samplePixels(ctx, lm.x * w, lm.y * h, r);
  };

  const pts = [sample(50), sample(280), sample(36), sample(266)];
  const avg = pts.reduce(
    ([ar, ag, ab], [r, g, b]) => [ar + r, ag + g, ab + b],
    [0, 0, 0]
  ).map(v => Math.round(v / pts.length)) as [number, number, number];

  return classifyProfile(avg[0], avg[1], avg[2]);
}

// ── Shade tables ───────────────────────────────────────────────────────────
// For each [depth][undertone], we store adjusted shades for base/eyes/lips/cheeks/brows.
// These are curated to be flattering on that specific profile.

type StepShades = {
  base:   string;
  eyes:   string;
  lips:   string;
  cheeks: string;
  brows:  string;
};

const SHADE_TABLE: Record<SkinDepth, Record<Undertone, StepShades>> = {
  fair: {
    warm:    { base: "#f8e8d8", eyes: "#c8a880", lips: "#e09878", cheeks: "#f0b898", brows: "#8a6040" },
    cool:    { base: "#f8eae8", eyes: "#b890b0", lips: "#e09098", cheeks: "#f0a0b0", brows: "#7a6070" },
    neutral: { base: "#f8e8e0", eyes: "#c0a898", lips: "#d8988a", cheeks: "#f0a8a0", brows: "#806858" },
  },
  light: {
    warm:    { base: "#f0d8c0", eyes: "#b88850", lips: "#d08860", cheeks: "#e8a870", brows: "#7a5030" },
    cool:    { base: "#f0d8d8", eyes: "#a88098", lips: "#c87888", cheeks: "#e898a0", brows: "#705868" },
    neutral: { base: "#f0d8cc", eyes: "#b09078", lips: "#c88878", cheeks: "#e8a890", brows: "#786050" },
  },
  medium: {
    warm:    { base: "#e0c8a0", eyes: "#a87030", lips: "#b87040", cheeks: "#d89060", brows: "#6a4020" },
    cool:    { base: "#e0c0c0", eyes: "#906880", lips: "#b06878", cheeks: "#d08090", brows: "#604860" },
    neutral: { base: "#e0c0a8", eyes: "#a07858", lips: "#b07858", cheeks: "#c88870", brows: "#6a4838" },
  },
  tan: {
    warm:    { base: "#c8a070", eyes: "#905020", lips: "#984020", cheeks: "#c07030", brows: "#502808" },
    cool:    { base: "#c09898", eyes: "#7a4870", lips: "#903050", cheeks: "#b05070", brows: "#4a3050" },
    neutral: { base: "#c09878", eyes: "#8a5838", lips: "#9a4838", cheeks: "#b06050", brows: "#503018" },
  },
  deep: {
    warm:    { base: "#8a6030", eyes: "#703010", lips: "#782010", cheeks: "#984020", brows: "#381808" },
    cool:    { base: "#7a5858", eyes: "#502848", lips: "#601040", cheeks: "#902858", brows: "#301828" },
    neutral: { base: "#8a5838", eyes: "#603020", lips: "#6a2018", cheeks: "#8a3828", brows: "#301810" },
  },
};

// ── Blend two hex colors ───────────────────────────────────────────────────

function blendHex(a: string, b: string, t: number): string {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  const r = (c: string, s: number, e: number) =>
    Math.round(parseInt(c.slice(s, e), 16) * (1 - t) + parseInt(pb.slice(s, e), 16) * t);
  return rgbToHex(r(pa, 0, 2), r(pa, 2, 4), r(pa, 4, 6));
}

// ── Main function ──────────────────────────────────────────────────────────

/**
 * Returns a new Look with step colors adapted to the user's skin profile.
 * The adjustment blends 60% toward the skin-matched shade, keeping 40% of
 * the look's original design intent so the style identity is preserved.
 */
export function matchShadesToSkin(look: Look, profile: SkinProfile): Look {
  const table = SHADE_TABLE[profile.depth][profile.undertone];
  const blend = 0.62; // how far to shift toward the matched shade

  const adaptColor = (original: string | undefined, target: string): string => {
    if (!original || original === "transparent") return original ?? "transparent";
    return blendHex(original, target, blend);
  };

  return {
    ...look,
    steps: {
      ...look.steps,
      base:   look.steps.base   ? { ...look.steps.base,   color: adaptColor(look.steps.base.color,   table.base),   colorName: "Skin-Matched" } : look.steps.base,
      eyes:   look.steps.eyes   ? { ...look.steps.eyes,   color: adaptColor(look.steps.eyes.color,   table.eyes),   colorName: "Skin-Matched" } : look.steps.eyes,
      lips:   look.steps.lips   ? { ...look.steps.lips,   color: adaptColor(look.steps.lips.color,   table.lips),   colorName: "Skin-Matched" } : look.steps.lips,
      cheeks: look.steps.cheeks ? { ...look.steps.cheeks, color: adaptColor(look.steps.cheeks.color, table.cheeks), colorName: "Skin-Matched" } : look.steps.cheeks,
      brows:  look.steps.brows  ? { ...look.steps.brows,  color: adaptColor(look.steps.brows.color,  table.brows),  colorName: "Skin-Matched" } : look.steps.brows,
    },
  };
}

export const DEPTH_LABELS: Record<SkinDepth, string> = {
  fair:   "Fair",
  light:  "Light",
  medium: "Medium",
  tan:    "Tan",
  deep:   "Deep",
};

export const UNDERTONE_LABELS: Record<Undertone, string> = {
  warm:    "Warm",
  cool:    "Cool",
  neutral: "Neutral",
};
