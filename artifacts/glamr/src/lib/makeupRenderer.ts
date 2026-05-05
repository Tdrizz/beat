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

function smoothPath(ctx: CanvasRenderingContext2D, ps: Pt[], close = false) {
  if (ps.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(ps[0].x, ps[0].y);
  for (let i = 1; i < ps.length - 1; i++) {
    const mx = (ps[i].x + ps[i + 1].x) / 2;
    const my = (ps[i].y + ps[i + 1].y) / 2;
    ctx.quadraticCurveTo(ps[i].x, ps[i].y, mx, my);
  }
  ctx.lineTo(ps[ps.length - 1].x, ps[ps.length - 1].y);
  if (close) ctx.closePath();
}

function polygon(ctx: CanvasRenderingContext2D, ps: Pt[]) {
  if (ps.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(ps[0].x, ps[0].y);
  ps.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
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

function eyeSocketPoly(upper: Pt[], lower: Pt[], browPts: Pt[], expand: number): Pt[] {
  const browY = Math.min(...browPts.map(p => p.y));
  const lidTopY = Math.min(...upper.map(p => p.y));
  const range = lidTopY - browY;
  const top = upper.map(p => ({ x: p.x, y: p.y - Math.abs(range) * expand }));
  return [...lower, ...top.reverse()];
}

// ── Renderer ──────────────────────────────────────────────────────────────────
//
// Philosophy: makeup should BLEND with skin, never cover it.
//
//  • multiply  — darkens by multiplying pixel values. Dark shadow on skin = depth.
//                Light color on dark skin = nearly invisible. Preserves texture.
//  • screen    — lightens. Used for highlights, gloss, shimmer.
//  • soft-light — gentle contrast / saturation push. Good for tints.
//
// Rule: source-over is ONLY allowed for liner (which must be crisp & opaque).
// Everything else uses multiply / screen / soft-light at low opacity.

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  activeSteps: Record<string, number>,
  look: Look
) {
  const P = (idxs: number[]) => pts(idxs, landmarks, width, height);

  // ── FOUNDATION / BASE ─────────────────────────────────────────────────────
  // Very subtle skin-tint: soft-light just nudges hue/saturation without masking.
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    const intensity = activeSteps.base;
    ctx.save();
    ctx.filter = `blur(20px)`;
    ctx.globalCompositeOperation = "soft-light";
    polygon(ctx, P(FACE_OVAL));
    ctx.fillStyle = rgba(look.steps.base.color, 0.18 * intensity);
    ctx.fill();
    ctx.restore();
  }

  // ── EYESHADOW ─────────────────────────────────────────────────────────────
  // Three soft multiply layers — skin texture fully visible, colour is a wash.
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    const intensity = activeSteps.eyes;
    const color = look.steps.eyes.color!;
    const dark  = darken(color, 0.28);
    const light = lighten(color, 0.55);

    const renderEye = (
      upperIdxs: number[],
      lowerIdxs: number[],
      browIdxs: number[]
    ) => {
      const upper   = P(upperIdxs);
      const lower   = P(lowerIdxs);
      const browPts = P(browIdxs);
      const socket  = eyeSocketPoly(upper, lower, browPts, 0.72);
      const c       = centroid(socket);
      const b       = bbox(socket);

      // ── Layer 1: Broad base shadow — multiply, heavily blurred ──────────
      // This is the soft powder wash. Very low opacity so skin shows through.
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.012)}px)`;
      ctx.globalCompositeOperation = "multiply";
      polygon(ctx, socket);
      ctx.clip();

      const g1 = ctx.createLinearGradient(c.x, b.y1, c.x, b.y0);
      g1.addColorStop(0,    rgba(dark,  0.52 * intensity));
      g1.addColorStop(0.30, rgba(color, 0.38 * intensity));
      g1.addColorStop(0.65, rgba(color, 0.18 * intensity));
      g1.addColorStop(1,    rgba(color, 0));
      ctx.fillStyle = g1;
      fillBox(ctx, socket, 6);
      ctx.restore();

      // ── Layer 2: Crease depth at outer corner — multiply ─────────────────
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.008)}px)`;
      ctx.globalCompositeOperation = "multiply";
      polygon(ctx, socket);
      ctx.clip();

      const outerPt  = upper[upper.length - 1];
      const creaseR  = width * 0.045;
      const cg = ctx.createRadialGradient(
        outerPt.x, outerPt.y, 0,
        outerPt.x, outerPt.y, creaseR * 2.2
      );
      cg.addColorStop(0, rgba(dark, 0.45 * intensity));
      cg.addColorStop(1, rgba(dark, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(outerPt.x - creaseR * 2.2, outerPt.y - creaseR * 2.2, creaseR * 4.4, creaseR * 4.4);
      ctx.restore();

      // ── Layer 3: Center-lid shimmer highlight — screen ────────────────────
      // Screen never hides skin; it only brightens. Safe at moderate values.
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.005)}px)`;
      ctx.globalCompositeOperation = "screen";
      polygon(ctx, socket);
      ctx.clip();

      const midPt   = upper[Math.floor(upper.length / 2)];
      const shimmerR = width * 0.028;
      const sg = ctx.createRadialGradient(midPt.x, midPt.y, 0, midPt.x, midPt.y, shimmerR);
      sg.addColorStop(0, rgba(light, 0.38 * intensity));
      sg.addColorStop(1, rgba(light, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(midPt.x - shimmerR, midPt.y - shimmerR, shimmerR * 2, shimmerR * 2);
      ctx.restore();
    };

    renderEye(L_EYE_UPPER, L_EYE_LOWER, L_BROW);
    renderEye(R_EYE_UPPER, R_EYE_LOWER, R_BROW);

    // ── LINER ────────────────────────────────────────────────────────────────
    // Liner is the ONE place we allow source-over — it must be precise.
    const drawLiner = (upperIdxs: number[]) => {
      const up = P(upperIdxs);
      ctx.save();
      ctx.filter = "blur(0.4px)";
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth  = Math.max(1.5, width * 0.0035);
      ctx.strokeStyle = rgba("#0a0a0a", 0.82 * intensity);
      ctx.lineCap  = "round";
      ctx.lineJoin = "round";
      smoothPath(ctx, up, false);
      ctx.stroke();

      // Wing
      const last  = up[up.length - 1];
      const prev  = up[up.length - 3];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const wl    = width * 0.016;
      const tip   = {
        x: last.x + Math.cos(angle - 0.42) * wl,
        y: last.y + Math.sin(angle - 0.42) * wl - height * 0.007,
      };
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = rgba("#0a0a0a", 0.78 * intensity);
      ctx.lineWidth   = Math.max(1.2, width * 0.0025);
      ctx.stroke();
      ctx.restore();
    };

    drawLiner(L_EYE_UPPER);
    drawLiner(R_EYE_UPPER);

    // ── LOWER LASH SMUDGE — multiply ──────────────────────────────────────
    const drawLowerLiner = (lowerIdxs: number[]) => {
      const lo = P(lowerIdxs);
      ctx.save();
      ctx.filter = "blur(1.5px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth   = Math.max(1, width * 0.0022);
      ctx.strokeStyle = rgba(dark, 0.50 * intensity);
      ctx.lineCap     = "round";
      smoothPath(ctx, lo, false);
      ctx.stroke();
      ctx.restore();
    };

    drawLowerLiner(L_EYE_LOWER);
    drawLowerLiner(R_EYE_LOWER);
  }

  // ── BROWS ─────────────────────────────────────────────────────────────────
  // multiply keeps the natural brow hair — we darken/tint it, not replace it.
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    const intensity = activeSteps.brows;
    const color     = look.steps.brows.color!;

    const drawBrow = (browIdxs: number[]) => {
      const bp    = P(browIdxs);
      const sortX = [...bp].sort((a, b) => a.x - b.x);

      // Soft filled region — multiply at low opacity
      ctx.save();
      ctx.filter = "blur(4px)";
      ctx.globalCompositeOperation = "multiply";
      polygon(ctx, bp);
      ctx.fillStyle = rgba(color, 0.35 * intensity);
      ctx.fill();
      ctx.restore();

      // Hair strokes — slightly more defined, still multiply
      ctx.save();
      ctx.filter = "blur(0.8px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.lineWidth   = Math.max(2, height * 0.006);
      ctx.strokeStyle = rgba(color, 0.65 * intensity);
      ctx.lineCap     = "round";
      smoothPath(ctx, sortX, false);
      ctx.stroke();
      ctx.restore();
    };

    drawBrow(L_BROW);
    drawBrow(R_BROW);

    // Brow-bone highlight — screen keeps it light without masking
    const drawBrowBone = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c  = centroid(bp);
      ctx.save();
      ctx.filter = "blur(10px)";
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, width * 0.05);
      g.addColorStop(0, rgba("#ffffff", 0.14 * intensity));
      g.addColorStop(1, rgba("#ffffff", 0));
      ctx.fillStyle = g;
      ctx.fillRect(c.x - width * 0.06, c.y - height * 0.04, width * 0.12, height * 0.08);
      ctx.restore();
    };

    drawBrowBone(L_BROW_BONE);
    drawBrowBone(R_BROW_BONE);
  }

  // ── BLUSH / CHEEKS ────────────────────────────────────────────────────────
  // multiply + heavy blur = a completely natural-looking flush on skin.
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    const intensity = activeSteps.cheeks;
    const color     = look.steps.cheeks.color!;

    const drawBlush = (cheekIdxs: number[]) => {
      const cp = P(cheekIdxs);
      const c  = centroid(cp);
      const cx = c.x;
      const cy = c.y - height * 0.01;
      const rx = width  * 0.10;
      const ry = height * 0.065;

      // Main flush — multiply
      ctx.save();
      ctx.filter = `blur(${Math.round(width * 0.022)}px)`;
      ctx.globalCompositeOperation = "multiply";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0,   rgba(color, 0.55 * intensity));
      g.addColorStop(0.5, rgba(color, 0.28 * intensity));
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
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.6);
      g2.addColorStop(0, rgba(lighten(color, 0.3), 0.30 * intensity));
      g2.addColorStop(1, rgba(lighten(color, 0.3), 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlush(L_CHEEK);
    drawBlush(R_CHEEK);
  }

  // ── LIPS ──────────────────────────────────────────────────────────────────
  // multiply tints the lips toward the chosen colour while skin texture shows.
  // screen adds gloss/volume. source-over only for the very thin lip liner.
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    const intensity  = activeSteps.lips;
    const color      = look.steps.lips.color!;
    const colorDark  = darken(color, 0.22);
    const colorLight = lighten(color, 0.45);
    const outerPts   = P(LIPS_OUTER);
    const innerPts   = P(LIPS_INNER);
    const c          = centroid(outerPts);
    const b          = bbox(outerPts);
    const midY       = (b.y0 + b.y1) / 2;

    // Helper: clip to lip shape (outer minus inner = exclude teeth gap)
    const clipLips = () => {
      ctx.beginPath();
      polygon(ctx, outerPts);
      polygon(ctx, innerPts);
      ctx.clip("evenodd");
    };

    // ── Layer 1: Base colour — multiply at moderate opacity ───────────────
    // multiply(lipColor, skinPixel) → a darkened version that reads as the
    // lip colour while the skin's own texture (creases, highlights) shines through.
    ctx.save();
    ctx.filter = "blur(1px)";
    ctx.globalCompositeOperation = "multiply";
    clipLips();
    ctx.fillStyle = rgba(color, 0.55 * intensity);
    fillBox(ctx, outerPts, 3);
    ctx.restore();

    // ── Layer 2: Soft-light colour boost ─────────────────────────────────
    // Nudges the saturation and depth of the lip colour on skin tones where
    // multiply alone is too subtle (lighter lips).
    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.globalCompositeOperation = "soft-light";
    clipLips();
    ctx.fillStyle = rgba(color, 0.30 * intensity);
    fillBox(ctx, outerPts, 3);
    ctx.restore();

    // ── Layer 3: Volume/gloss highlight — screen ──────────────────────────
    ctx.save();
    ctx.filter = "blur(4px)";
    ctx.globalCompositeOperation = "screen";
    clipLips();

    // Upper lip highlight
    const ug = ctx.createLinearGradient(c.x, b.y0, c.x, midY);
    ug.addColorStop(0,    rgba("#ffffff", 0));
    ug.addColorStop(0.55, rgba("#ffffff", 0.22 * intensity));
    ug.addColorStop(1,    rgba("#ffffff", 0));
    ctx.fillStyle = ug;
    ctx.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, midY - b.y0 + 4);

    // Lower lip centre shine
    const lg = ctx.createLinearGradient(c.x, midY, c.x, b.y1);
    lg.addColorStop(0,    rgba("#ffffff", 0));
    lg.addColorStop(0.3,  rgba("#ffffff", 0.28 * intensity));
    lg.addColorStop(0.6,  rgba("#ffffff", 0.16 * intensity));
    lg.addColorStop(1,    rgba("#ffffff", 0));
    ctx.fillStyle = lg;
    ctx.fillRect(b.x0 - 2, midY - 2, b.w + 4, b.y1 - midY + 4);
    ctx.restore();

    // ── Layer 4: Edge depth — multiply at edges ───────────────────────────
    ctx.save();
    ctx.filter = "blur(2.5px)";
    ctx.globalCompositeOperation = "multiply";
    clipLips();
    const edgeG = ctx.createLinearGradient(c.x, b.y0, c.x, b.y1);
    edgeG.addColorStop(0,   rgba(colorDark, 0.28 * intensity));
    edgeG.addColorStop(0.25, rgba(colorDark, 0));
    edgeG.addColorStop(0.75, rgba(colorDark, 0));
    edgeG.addColorStop(1,   rgba(colorDark, 0.28 * intensity));
    ctx.fillStyle = edgeG;
    fillBox(ctx, outerPts, 3);
    ctx.restore();

    // ── Layer 5: Lip liner — source-over, very thin ───────────────────────
    // This is the ONE crisp line we allow — it defines the shape without masking.
    ctx.save();
    ctx.filter = "blur(0.3px)";
    ctx.globalCompositeOperation = "source-over";
    smoothPath(ctx, outerPts, true);
    ctx.strokeStyle = rgba(colorDark, 0.50 * intensity);
    ctx.lineWidth   = Math.max(0.8, width * 0.001);
    ctx.lineJoin    = "round";
    ctx.stroke();
    ctx.restore();
  }
}
