import { Look } from "./looks";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ── Color helpers ─────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a))})`;
}

function lighten(hex: string, amount = 0.4): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b]
    .map(v => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

function darken(hex: string, amount = 0.35): string {
  const { r, g, b } = hexToRgb(hex);
  return `#${[r, g, b]
    .map(v => Math.round(v * (1 - amount)).toString(16).padStart(2, "0"))
    .join("")}`;
}

// ── Landmark regions ──────────────────────────────────────────────────────────

const L_EYE_UPPER  = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const R_EYE_UPPER  = [362, 398, 384, 385, 386, 387, 388, 466, 263];
const L_EYE_LOWER  = [133, 155, 154, 153, 145, 144, 163, 7, 33];
const R_EYE_LOWER  = [263, 249, 390, 373, 374, 380, 381, 382, 362];

const L_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const R_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

const L_BROW_BONE = [46, 53, 52, 65, 55, 107, 66, 105, 63, 70, 156, 124, 35, 31, 226, 247];
const R_BROW_BONE = [276, 283, 282, 295, 285, 336, 296, 334, 293, 300, 383, 353, 265, 261, 446, 467];

const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82];
const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

const L_CHEEK = [116, 123, 147, 213, 192, 187, 207, 206, 203, 142, 126, 217, 174, 196, 197];
const R_CHEEK = [345, 352, 376, 433, 416, 411, 427, 426, 423, 371, 355, 437, 399, 420, 421];

// Cheekbone landmarks (high points, for highlighter)
const L_CHEEKBONE = [234, 93, 132, 58];
const R_CHEEKBONE = [454, 323, 361, 288];

// T-zone (forehead + nose bridge)
const FOREHEAD_CENTER = 10;
const NOSE_BRIDGE = [168, 6, 197, 195];
const NOSE_TIP = 1;

const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

// ── Geometry ──────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };

function lmPt(lm: NormalizedLandmark[], idx: number, w: number, h: number): Pt {
  return { x: lm[idx].x * w, y: lm[idx].y * h };
}

function pts(idxs: number[], lm: NormalizedLandmark[], w: number, h: number): Pt[] {
  return idxs.map(i => lmPt(lm, i, w, h));
}

function centroid(ps: Pt[]): Pt {
  const s = ps.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / ps.length, y: s.y / ps.length };
}

/**
 * Smooth Catmull-Rom-like path through points using quadratic bezier midpoints.
 * Produces buttery curves with no flat segments — essential for realistic lip
 * and eye outlines. When `close` is true the curve loops back through the
 * first/last points seamlessly.
 */
function smoothPath(ctx: CanvasRenderingContext2D, ps: Pt[], close = false) {
  if (ps.length < 2) return;
  ctx.beginPath();
  appendSmoothPath(ctx, ps, close);
}

/**
 * Append a smooth subpath WITHOUT calling beginPath(). Used to build composite
 * paths (e.g. face-oval MINUS eye/lip/brow holes) that are then clipped with
 * the even-odd fill rule.
 */
function appendSmoothPath(ctx: CanvasRenderingContext2D, ps: Pt[], close = false) {
  if (ps.length < 2) return;
  if (close && ps.length > 2) {
    // Start at midpoint between last and first to make the loop seamless
    const start = { x: (ps[ps.length - 1].x + ps[0].x) / 2, y: (ps[ps.length - 1].y + ps[0].y) / 2 };
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < ps.length; i++) {
      const cur = ps[i];
      const next = ps[(i + 1) % ps.length];
      const mx = (cur.x + next.x) / 2;
      const my = (cur.y + next.y) / 2;
      ctx.quadraticCurveTo(cur.x, cur.y, mx, my);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(ps[0].x, ps[0].y);
    for (let i = 1; i < ps.length - 1; i++) {
      const mx = (ps[i].x + ps[i + 1].x) / 2;
      const my = (ps[i].y + ps[i + 1].y) / 2;
      ctx.quadraticCurveTo(ps[i].x, ps[i].y, mx, my);
    }
    ctx.lineTo(ps[ps.length - 1].x, ps[ps.length - 1].y);
  }
}

function bbox(ps: Pt[]) {
  const xs = ps.map(p => p.x), ys = ps.map(p => p.y);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const x1 = Math.max(...xs), y1 = Math.max(...ys);
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

function fillBox(ctx: CanvasRenderingContext2D, ps: Pt[], pad = 4) {
  const b = bbox(ps);
  ctx.fillRect(b.x0 - pad, b.y0 - pad, b.w + pad * 2, b.h + pad * 2);
}

/**
 * Eye-shadow region: only the area ABOVE the upper lash line, extending up
 * toward (but not reaching) the brow. Excludes the lower lid entirely so the
 * dark wash doesn't bleed into the under-eye.
 */
function eyeShadowPoly(upper: Pt[], browPts: Pt[], expand: number): Pt[] {
  const browY = Math.min(...browPts.map(p => p.y));
  const lidTopY = Math.min(...upper.map(p => p.y));
  const range = Math.abs(lidTopY - browY);
  // Top of shadow region: lifted upward toward brow by `expand` of the brow-lid gap
  const top = upper.map(p => ({ x: p.x, y: p.y - range * expand }));
  // Bottom: the upper-lid line itself (so shadow stops at the lashes)
  return [...upper, ...top.reverse()];
}

// ── Renderer ──────────────────────────────────────────────────────────────────
//
// Realism principles:
//
//  • multiply  — darkens by multiplying pixel values. Preserves skin texture.
//  • screen    — lightens. Used for highlights, gloss, shimmer.
//  • soft-light — gentle contrast / saturation push. Good for tints.
//  • source-over is reserved for crisp liner only.
//
// Every step is clipped to its anatomical region with a SMOOTH bezier outline
// and feathered with `filter: blur()` so edges fade naturally into skin.

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  activeSteps: Record<string, number>,
  look: Look
) {
  const P = (idxs: number[]) => pts(idxs, landmarks, width, height);

  // Pre-compute regions used for masking
  const faceOvalPts = P(FACE_OVAL);
  const lEyeUpper = P(L_EYE_UPPER);
  const rEyeUpper = P(R_EYE_UPPER);
  const lEyeLower = P(L_EYE_LOWER);
  const rEyeLower = P(R_EYE_LOWER);
  const lipsOuter = P(LIPS_OUTER);
  const lipsInner = P(LIPS_INNER);
  const lBrow = P(L_BROW);
  const rBrow = P(R_BROW);

  // ── FOUNDATION / SKIN POLISH ──────────────────────────────────────────────
  // A whisper of skin-tint with a gentle brightening pass. Eyes/lips/brows
  // are clipped OUT so features stay vivid instead of getting muddied.
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    const intensity = activeSteps.base;

    ctx.save();
    // Build a composite clip: face oval MINUS eyes, brows, lips (even-odd).
    // appendSmoothPath leaves the existing path intact so multiple subpaths
    // accumulate before clip().
    ctx.beginPath();
    appendSmoothPath(ctx, faceOvalPts, true);
    appendSmoothPath(ctx, [...lEyeUpper, ...lEyeLower.slice(1, -1).reverse()], true);
    appendSmoothPath(ctx, [...rEyeUpper, ...rEyeLower.slice(1, -1).reverse()], true);
    appendSmoothPath(ctx, lBrow, true);
    appendSmoothPath(ctx, rBrow, true);
    appendSmoothPath(ctx, lipsOuter, true);
    ctx.clip("evenodd");

    // Layer 1: gentle tint via soft-light (won't mask texture)
    ctx.save();
    ctx.filter = `blur(${Math.round(width * 0.018)}px)`;
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = rgba(look.steps.base.color, 0.22 * intensity);
    fillBox(ctx, faceOvalPts, 8);
    ctx.restore();

    // Layer 2: subtle skin-glow via radial screen at cheekbones + T-zone
    const lCheekboneCentroid = centroid(P(L_CHEEKBONE));
    const rCheekboneCentroid = centroid(P(R_CHEEKBONE));
    const forehead = lmPt(landmarks, FOREHEAD_CENTER, width, height);
    const noseTip = lmPt(landmarks, NOSE_TIP, width, height);

    const glowSpots: Array<{ x: number; y: number; r: number; a: number }> = [
      { x: lCheekboneCentroid.x, y: lCheekboneCentroid.y, r: width * 0.07, a: 0.08 },
      { x: rCheekboneCentroid.x, y: rCheekboneCentroid.y, r: width * 0.07, a: 0.08 },
      { x: forehead.x, y: forehead.y + height * 0.025, r: width * 0.09, a: 0.06 },
      { x: noseTip.x, y: noseTip.y - height * 0.015, r: width * 0.025, a: 0.10 },
    ];

    ctx.save();
    ctx.filter = `blur(${Math.round(width * 0.012)}px)`;
    ctx.globalCompositeOperation = "screen";
    for (const spot of glowSpots) {
      const g = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.r);
      g.addColorStop(0, rgba("#fff4e8", spot.a * intensity));
      g.addColorStop(1, rgba("#fff4e8", 0));
      ctx.fillStyle = g;
      ctx.fillRect(spot.x - spot.r, spot.y - spot.r, spot.r * 2, spot.r * 2);
    }
    ctx.restore();

    ctx.restore();
  }

  // ── EYESHADOW ─────────────────────────────────────────────────────────────
  // Three soft layers, all confined to the LID region (above the lash line).
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    const intensity = activeSteps.eyes;
    const color = look.steps.eyes.color!;
    const dark  = darken(color, 0.32);
    const light = lighten(color, 0.55);

    const renderEye = (
      upper: Pt[],
      browPts: Pt[],
    ) => {
      const lid = eyeShadowPoly(upper, browPts, 0.65);
      const c   = centroid(lid);
      const b   = bbox(lid);

      // ── Layer 1: Broad lid wash — multiply, heavily blurred ──────────────
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.014)}px)`;
      ctx.globalCompositeOperation = "multiply";
      smoothPath(ctx, lid, true);
      ctx.clip();

      const g1 = ctx.createLinearGradient(c.x, b.y1, c.x, b.y0);
      g1.addColorStop(0,    rgba(dark,  0.55 * intensity));
      g1.addColorStop(0.30, rgba(color, 0.40 * intensity));
      g1.addColorStop(0.70, rgba(color, 0.20 * intensity));
      g1.addColorStop(1,    rgba(color, 0));
      ctx.fillStyle = g1;
      fillBox(ctx, lid, 6);
      ctx.restore();

      // ── Layer 2: Crease depth at outer corner — multiply ─────────────────
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.009)}px)`;
      ctx.globalCompositeOperation = "multiply";
      smoothPath(ctx, lid, true);
      ctx.clip();

      const outerPt  = upper[upper.length - 1];
      const creaseR  = width * 0.05;
      const cg = ctx.createRadialGradient(
        outerPt.x, outerPt.y - height * 0.005, 0,
        outerPt.x, outerPt.y - height * 0.005, creaseR * 2.2
      );
      cg.addColorStop(0,   rgba(dark, 0.50 * intensity));
      cg.addColorStop(0.4, rgba(dark, 0.22 * intensity));
      cg.addColorStop(1,   rgba(dark, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(outerPt.x - creaseR * 2.2, outerPt.y - creaseR * 2.2, creaseR * 4.4, creaseR * 4.4);
      ctx.restore();

      // ── Layer 3: Center-lid shimmer highlight — screen ───────────────────
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.005)}px)`;
      ctx.globalCompositeOperation = "screen";
      smoothPath(ctx, lid, true);
      ctx.clip();

      const midPt    = upper[Math.floor(upper.length / 2)];
      const shimmerR = width * 0.025;
      const sg = ctx.createRadialGradient(
        midPt.x, midPt.y - height * 0.008, 0,
        midPt.x, midPt.y - height * 0.008, shimmerR
      );
      sg.addColorStop(0, rgba(light, 0.42 * intensity));
      sg.addColorStop(1, rgba(light, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(midPt.x - shimmerR, midPt.y - shimmerR, shimmerR * 2, shimmerR * 2);
      ctx.restore();
    };

    renderEye(lEyeUpper, lBrow);
    renderEye(rEyeUpper, rBrow);

    // ── EYELINER ────────────────────────────────────────────────────────────
    // Liner only covers the OUTER 65% of the lid (real liner skips the inner
    // corner). It tapers from a hairline at the start to full thickness at
    // the outer corner, with a soft wing extension.
    const drawLiner = (upperPts: Pt[]) => {
      const startIdx = Math.floor(upperPts.length * 0.30);
      const linerPts = upperPts.slice(startIdx);
      if (linerPts.length < 2) return;

      // Multi-pass: a soft underglow then a crisp top stroke
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Underglow / halo (slightly blurred wider stroke)
      ctx.filter = `blur(${Math.max(0.6, width * 0.0012)}px)`;
      ctx.strokeStyle = rgba("#0a0a0a", 0.45 * intensity);
      ctx.lineWidth = Math.max(2.5, width * 0.0055);
      smoothPath(ctx, linerPts, false);
      ctx.stroke();

      // Crisp top stroke
      ctx.filter = "blur(0.3px)";
      ctx.strokeStyle = rgba("#0a0a0a", 0.92 * intensity);
      ctx.lineWidth = Math.max(1.4, width * 0.0032);
      smoothPath(ctx, linerPts, false);
      ctx.stroke();

      // ── Wing — short tapered flick ────────────────────────────────────────
      const last = linerPts[linerPts.length - 1];
      const prev = linerPts[Math.max(0, linerPts.length - 3)];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const wl = width * 0.020;
      const tip = {
        x: last.x + Math.cos(angle - 0.55) * wl,
        y: last.y + Math.sin(angle - 0.55) * wl - height * 0.010,
      };
      // Build a tapered triangle from last → tip → slightly back along lid
      const back = {
        x: last.x + Math.cos(angle + Math.PI) * wl * 0.35,
        y: last.y + Math.sin(angle + Math.PI) * wl * 0.35,
      };
      ctx.filter = "blur(0.4px)";
      ctx.fillStyle = rgba("#0a0a0a", 0.88 * intensity);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.lineTo(back.x, back.y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    drawLiner(lEyeUpper);
    drawLiner(rEyeUpper);

    // ── LASH-LINE SMUDGE on lower lid — multiply, very soft ──────────────────
    const drawLowerSmudge = (lowerPts: Pt[]) => {
      // Only outer 60% — preserves bright inner corner
      const startIdx = Math.floor(lowerPts.length * 0.20);
      const endIdx = Math.floor(lowerPts.length * 0.85);
      const smudge = lowerPts.slice(startIdx, endIdx);
      if (smudge.length < 2) return;

      ctx.save();
      ctx.filter = "blur(2px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth   = Math.max(1.2, width * 0.0028);
      ctx.strokeStyle = rgba(dark, 0.42 * intensity);
      ctx.lineCap     = "round";
      smoothPath(ctx, smudge, false);
      ctx.stroke();
      ctx.restore();
    };

    drawLowerSmudge(lEyeLower);
    drawLowerSmudge(rEyeLower);
  }

  // ── BROWS ─────────────────────────────────────────────────────────────────
  // multiply preserves the natural brow hair while tinting/filling sparse spots.
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    const intensity = activeSteps.brows;
    const color     = look.steps.brows.color!;

    const drawBrow = (browPts: Pt[]) => {
      const sortX = [...browPts].sort((a, b) => a.x - b.x);

      // Soft filled region — multiply at low opacity
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.005)}px)`;
      ctx.globalCompositeOperation = "multiply";
      smoothPath(ctx, browPts, true);
      ctx.fillStyle = rgba(color, 0.40 * intensity);
      ctx.fill();
      ctx.restore();

      // Hair-like strokes along the brow direction
      ctx.save();
      ctx.filter = "blur(0.7px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth   = Math.max(1.8, height * 0.0055);
      ctx.strokeStyle = rgba(color, 0.70 * intensity);
      ctx.lineCap     = "round";
      smoothPath(ctx, sortX, false);
      ctx.stroke();
      ctx.restore();
    };

    drawBrow(lBrow);
    drawBrow(rBrow);

    // Brow-bone highlight — screen keeps it light without masking
    const drawBrowBone = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c  = centroid(bp);
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.010)}px)`;
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, width * 0.05);
      g.addColorStop(0, rgba("#ffffff", 0.16 * intensity));
      g.addColorStop(1, rgba("#ffffff", 0));
      ctx.fillStyle = g;
      ctx.fillRect(c.x - width * 0.06, c.y - height * 0.04, width * 0.12, height * 0.08);
      ctx.restore();
    };

    drawBrowBone(L_BROW_BONE);
    drawBrowBone(R_BROW_BONE);
  }

  // ── BLUSH / CHEEKS ────────────────────────────────────────────────────────
  // Multiply + heavy blur = a natural-looking flush. Adds a soft highlighter
  // on top of the cheekbone for a dewy, sculpted finish.
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    const intensity = activeSteps.cheeks;
    const color     = look.steps.cheeks.color!;

    const drawBlush = (cheekIdxs: number[]) => {
      const cp = P(cheekIdxs);
      const c  = centroid(cp);
      const cx = c.x;
      const cy = c.y - height * 0.005;
      const rx = width  * 0.095;
      const ry = height * 0.062;

      // Main flush — multiply
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.024)}px)`;
      ctx.globalCompositeOperation = "multiply";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0,   rgba(color, 0.58 * intensity));
      g.addColorStop(0.5, rgba(color, 0.30 * intensity));
      g.addColorStop(1,   rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner glow — soft-light for warmth
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.014)}px)`;
      ctx.globalCompositeOperation = "soft-light";
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.55);
      g2.addColorStop(0, rgba(lighten(color, 0.35), 0.32 * intensity));
      g2.addColorStop(1, rgba(lighten(color, 0.35), 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.55, ry * 0.55, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlush(L_CHEEK);
    drawBlush(R_CHEEK);

    // High-cheekbone highlight (subtle screen pop above the blush)
    const drawCheekboneGlow = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c  = centroid(bp);
      const r  = width * 0.045;
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.011)}px)`;
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(c.x, c.y - height * 0.01, 0, c.x, c.y - height * 0.01, r);
      g.addColorStop(0, rgba("#fff4e8", 0.18 * intensity));
      g.addColorStop(1, rgba("#fff4e8", 0));
      ctx.fillStyle = g;
      ctx.fillRect(c.x - r, c.y - r - height * 0.01, r * 2, r * 2);
      ctx.restore();
    };

    drawCheekboneGlow(L_CHEEKBONE);
    drawCheekboneGlow(R_CHEEKBONE);
  }

  // ── LIPS ──────────────────────────────────────────────────────────────────
  // multiply tints the lips toward the chosen colour while skin texture shows.
  // The clip path uses smooth bezier curves (no jagged segments). Highlights
  // are positioned at the cupid's bow and lower-lip centre, not as full bands.
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    const intensity  = activeSteps.lips;
    const color      = look.steps.lips.color!;
    const colorDark  = darken(color, 0.25);
    const colorLight = lighten(color, 0.50);
    const c          = centroid(lipsOuter);
    const b          = bbox(lipsOuter);
    const midY       = (b.y0 + b.y1) / 2;

    // Smooth lip clip: outer MINUS inner (excludes the mouth opening / teeth).
    // Two subpaths accumulated with appendSmoothPath so even-odd works.
    const clipLips = () => {
      ctx.beginPath();
      appendSmoothPath(ctx, lipsOuter, true);
      appendSmoothPath(ctx, lipsInner, true);
      ctx.clip("evenodd");
    };

    // ── Layer 1: Base colour — multiply ──────────────────────────────────
    ctx.save();
    ctx.filter = "blur(0.8px)";
    ctx.globalCompositeOperation = "multiply";
    clipLips();
    ctx.fillStyle = rgba(color, 0.62 * intensity);
    fillBox(ctx, lipsOuter, 3);
    ctx.restore();

    // ── Layer 2: Soft-light saturation boost ─────────────────────────────
    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.globalCompositeOperation = "soft-light";
    clipLips();
    ctx.fillStyle = rgba(color, 0.34 * intensity);
    fillBox(ctx, lipsOuter, 3);
    ctx.restore();

    // ── Layer 3: Cupid's bow highlight — small radial screen ─────────────
    ctx.save();
    ctx.filter = `blur(${Math.round(width * 0.004)}px)`;
    ctx.globalCompositeOperation = "screen";
    clipLips();
    const cupidR = width * 0.022;
    const cupidY = b.y0 + (midY - b.y0) * 0.30;
    const cg = ctx.createRadialGradient(c.x, cupidY, 0, c.x, cupidY, cupidR);
    cg.addColorStop(0, rgba("#ffffff", 0.30 * intensity));
    cg.addColorStop(1, rgba("#ffffff", 0));
    ctx.fillStyle = cg;
    ctx.fillRect(c.x - cupidR, cupidY - cupidR, cupidR * 2, cupidR * 2);
    ctx.restore();

    // ── Layer 4: Lower-lip centre shine — small ellipse screen ───────────
    ctx.save();
    ctx.filter = `blur(${Math.round(width * 0.005)}px)`;
    ctx.globalCompositeOperation = "screen";
    clipLips();
    const shineR = width * 0.030;
    const shineY = midY + (b.y1 - midY) * 0.45;
    const sg = ctx.createRadialGradient(c.x, shineY, 0, c.x, shineY, shineR);
    sg.addColorStop(0, rgba("#ffffff", 0.42 * intensity));
    sg.addColorStop(0.5, rgba(colorLight, 0.18 * intensity));
    sg.addColorStop(1, rgba("#ffffff", 0));
    ctx.fillStyle = sg;
    ctx.fillRect(c.x - shineR, shineY - shineR * 0.6, shineR * 2, shineR * 1.2);
    ctx.restore();

    // ── Layer 5: Edge depth — multiply at top + bottom edges ─────────────
    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.globalCompositeOperation = "multiply";
    clipLips();
    const edgeG = ctx.createLinearGradient(c.x, b.y0, c.x, b.y1);
    edgeG.addColorStop(0,    rgba(colorDark, 0.32 * intensity));
    edgeG.addColorStop(0.20, rgba(colorDark, 0));
    edgeG.addColorStop(0.80, rgba(colorDark, 0));
    edgeG.addColorStop(1,    rgba(colorDark, 0.30 * intensity));
    ctx.fillStyle = edgeG;
    fillBox(ctx, lipsOuter, 3);
    ctx.restore();

    // ── Layer 6: Lip liner — smooth bezier outline ───────────────────────
    ctx.save();
    ctx.filter = "blur(0.3px)";
    ctx.globalCompositeOperation = "source-over";
    smoothPath(ctx, lipsOuter, true);
    ctx.strokeStyle = rgba(colorDark, 0.55 * intensity);
    ctx.lineWidth   = Math.max(0.8, width * 0.0011);
    ctx.lineJoin    = "round";
    ctx.stroke();
    ctx.restore();
  }
}
