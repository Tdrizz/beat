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

/** Lighten a hex color by mixing toward white */
function lighten(hex: string, amount = 0.4): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/** Darken a hex color */
function darken(hex: string, amount = 0.35): string {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.round(r * (1 - amount));
  const dg = Math.round(g * (1 - amount));
  const db = Math.round(b * (1 - amount));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

// ── MediaPipe 478-point landmark regions ──────────────────────────────────────

// Full eye contour (upper lid, inner→outer corner)
const L_EYE_UPPER  = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const R_EYE_UPPER  = [362, 398, 384, 385, 386, 387, 388, 466, 263];
const L_EYE_LOWER  = [133, 155, 154, 153, 145, 144, 163, 7, 33];
const R_EYE_LOWER  = [263, 249, 390, 373, 374, 380, 381, 382, 362];

// Eyebrow (full region contour)
const L_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const R_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];

// Outer brow bone (highlight area)
const L_BROW_BONE = [46, 53, 52, 65, 55, 107, 66, 105, 63, 70, 156, 124, 35, 31, 226, 247];
const R_BROW_BONE = [276, 283, 282, 295, 285, 336, 296, 334, 293, 300, 383, 353, 265, 261, 446, 467];

// Lip outer / inner  
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82];
const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

// Upper / lower lip split for highlight
const UPPER_LIP   = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78];
const LOWER_LIP   = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// Cheek blush zone (high on cheekbone)
const L_CHEEK = [116, 123, 147, 213, 192, 187, 207, 206, 203, 142, 126, 217, 174, 196, 197];
const R_CHEEK = [345, 352, 376, 433, 416, 411, 427, 426, 423, 371, 355, 437, 399, 420, 421];

// Face oval for foundation
const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

// ── Geometry helpers ──────────────────────────────────────────────────────────

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

/** Smooth quadratic-bezier path (does NOT close) */
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

/** Straight-line closed polygon */
function polygon(ctx: CanvasRenderingContext2D, ps: Pt[]) {
  if (ps.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(ps[0].x, ps[0].y);
  ps.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
}

// ── Eye socket shape builder ──────────────────────────────────────────────────
// Builds a polygon covering the lid up to ~65% of the way to the brow bone.

function eyeSocketPoly(
  upper: Pt[], lower: Pt[], browPts: Pt[], expand: number
): Pt[] {
  const browY = Math.min(...browPts.map(p => p.y));
  const lidTopY = Math.min(...upper.map(p => p.y));
  const range = lidTopY - browY;
  // Push upper edge upward by `expand` fraction of brow-to-lid distance
  const top = upper.map(p => ({
    x: p.x,
    y: p.y - Math.abs(range) * expand,
  }));
  return [...lower, ...top.reverse()];
}

// ── Main renderer ─────────────────────────────────────────────────────────────

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
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    const intensity = activeSteps.base;
    ctx.save();
    ctx.filter = "blur(12px)";
    ctx.globalCompositeOperation = "soft-light";
    polygon(ctx, P(FACE_OVAL));
    ctx.fillStyle = rgba(look.steps.base.color, 0.25 * intensity);
    ctx.fill();
    ctx.restore();
  }

  // ── EYESHADOW ─────────────────────────────────────────────────────────────
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    const intensity = activeSteps.eyes;
    const color = look.steps.eyes.color!;
    const dark = darken(color, 0.3);
    const light = lighten(color, 0.55);

    const renderEye = (
      upperIdxs: number[], lowerIdxs: number[], browIdxs: number[]
    ) => {
      const upper = P(upperIdxs);
      const lower = P(lowerIdxs);
      const browPts = P(browIdxs);
      const socket = eyeSocketPoly(upper, lower, browPts, 0.7);
      const c = centroid(socket);
      const topY = Math.min(...socket.map(p => p.y));
      const botY = Math.max(...socket.map(p => p.y));

      // ── Layer 1: Dense lid color (lash line region) ──────────────────────
      ctx.save();
      ctx.filter = "blur(3px)";
      ctx.globalCompositeOperation = "source-over";

      // Clip to socket
      polygon(ctx, socket);
      ctx.clip();

      // Gradient: opaque at lash line, fades to transparent halfway up
      const g1 = ctx.createLinearGradient(c.x, botY, c.x, topY);
      g1.addColorStop(0,    rgba(dark,  0.92 * intensity));
      g1.addColorStop(0.35, rgba(color, 0.78 * intensity));
      g1.addColorStop(0.65, rgba(color, 0.42 * intensity));
      g1.addColorStop(1,    rgba(color, 0));

      ctx.fillStyle = g1;
      ctx.fillRect(
        Math.min(...socket.map(p => p.x)) - 4,
        topY - 4,
        Math.max(...socket.map(p => p.x)) - Math.min(...socket.map(p => p.x)) + 8,
        botY - topY + 8
      );
      ctx.restore();

      // ── Layer 2: Deep crease at outer corner ─────────────────────────────
      ctx.save();
      ctx.filter = "blur(4px)";
      ctx.globalCompositeOperation = "multiply";
      polygon(ctx, socket);
      ctx.clip();

      const outerPt = upper[upper.length - 1];
      const creaseR = width * 0.04;
      const cg = ctx.createRadialGradient(
        outerPt.x, outerPt.y, 0,
        outerPt.x, outerPt.y, creaseR * 2
      );
      cg.addColorStop(0, rgba(dark, 0.55 * intensity));
      cg.addColorStop(1, rgba(dark, 0));
      ctx.fillStyle = cg;
      ctx.fillRect(outerPt.x - creaseR * 2, outerPt.y - creaseR * 2, creaseR * 4, creaseR * 4);
      ctx.restore();

      // ── Layer 3: Shimmer highlight on center lid ──────────────────────────
      ctx.save();
      ctx.filter = "blur(3px)";
      ctx.globalCompositeOperation = "screen";
      polygon(ctx, socket);
      ctx.clip();

      const midPt = upper[Math.floor(upper.length / 2)];
      const shimmerR = width * 0.025;
      const sg = ctx.createRadialGradient(midPt.x, midPt.y, 0, midPt.x, midPt.y, shimmerR);
      sg.addColorStop(0, rgba(light, 0.5 * intensity));
      sg.addColorStop(1, rgba(light, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(midPt.x - shimmerR, midPt.y - shimmerR, shimmerR * 2, shimmerR * 2);
      ctx.restore();
    };

    renderEye(L_EYE_UPPER, L_EYE_LOWER, L_BROW);
    renderEye(R_EYE_UPPER, R_EYE_LOWER, R_BROW);

    // ── LINER ────────────────────────────────────────────────────────────────
    const drawLiner = (upperIdxs: number[]) => {
      const up = P(upperIdxs);
      ctx.save();
      ctx.filter = "blur(0.5px)";
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = Math.max(2, width * 0.004);
      ctx.strokeStyle = rgba("#0d0d0d", 0.96 * intensity);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      smoothPath(ctx, up, false);
      ctx.stroke();

      // Wing from outer corner
      const last  = up[up.length - 1];
      const prev  = up[up.length - 3];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const wl    = width * 0.018;
      const tip   = {
        x: last.x + Math.cos(angle - 0.45) * wl,
        y: last.y + Math.sin(angle - 0.45) * wl - height * 0.008,
      };
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = rgba("#0d0d0d", 0.92 * intensity);
      ctx.lineWidth = Math.max(1.5, width * 0.003);
      ctx.stroke();
      ctx.restore();
    };

    drawLiner(L_EYE_UPPER);
    drawLiner(R_EYE_UPPER);

    // ── LOWER LASH LINER ─────────────────────────────────────────────────────
    const drawLowerLiner = (lowerIdxs: number[]) => {
      const lo = P(lowerIdxs);
      ctx.save();
      ctx.filter = "blur(1px)";
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = Math.max(1, width * 0.002);
      ctx.strokeStyle = rgba("#0d0d0d", 0.55 * intensity);
      ctx.lineCap = "round";
      smoothPath(ctx, lo, false);
      ctx.stroke();
      ctx.restore();
    };

    drawLowerLiner(L_EYE_LOWER);
    drawLowerLiner(R_EYE_LOWER);
  }

  // ── BROWS ─────────────────────────────────────────────────────────────────
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    const intensity = activeSteps.brows;
    const color = look.steps.brows.color!;

    const drawBrow = (browIdxs: number[]) => {
      const bp = P(browIdxs);
      const sortX = [...bp].sort((a, b) => a.x - b.x);

      // Soft filled region
      ctx.save();
      ctx.filter = "blur(3px)";
      ctx.globalCompositeOperation = "source-over";
      polygon(ctx, bp);
      ctx.fillStyle = rgba(color, 0.55 * intensity);
      ctx.fill();
      ctx.restore();

      // Crisp hair-stroke over the top
      ctx.save();
      ctx.filter = "blur(0.8px)";
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = Math.max(2.5, height * 0.007);
      ctx.strokeStyle = rgba(color, 0.88 * intensity);
      ctx.lineCap = "round";
      smoothPath(ctx, sortX, false);
      ctx.stroke();
      ctx.restore();
    };

    drawBrow(L_BROW);
    drawBrow(R_BROW);

    // Brow-bone subtle highlight
    const drawBrowBone = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c = centroid(bp);
      ctx.save();
      ctx.filter = "blur(8px)";
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, width * 0.05);
      g.addColorStop(0, rgba("#ffffff", 0.18 * intensity));
      g.addColorStop(1, rgba("#ffffff", 0));
      ctx.fillStyle = g;
      ctx.fillRect(c.x - width * 0.06, c.y - height * 0.04, width * 0.12, height * 0.08);
      ctx.restore();
    };

    drawBrowBone(L_BROW_BONE);
    drawBrowBone(R_BROW_BONE);
  }

  // ── BLUSH / CHEEKS ────────────────────────────────────────────────────────
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    const intensity = activeSteps.cheeks;
    const color = look.steps.cheeks.color!;

    const drawBlush = (cheekIdxs: number[]) => {
      const cp = P(cheekIdxs);
      const c = centroid(cp);
      // Sit high on the cheekbone, slightly toward the nose/eye
      const cx = c.x;
      const cy = c.y - height * 0.012;
      const rx = width * 0.11;
      const ry = height * 0.07;

      ctx.save();
      ctx.filter = "blur(16px)";
      ctx.globalCompositeOperation = "multiply";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0,   rgba(color, 0.72 * intensity));
      g.addColorStop(0.5, rgba(color, 0.40 * intensity));
      g.addColorStop(1,   rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlush(L_CHEEK);
    drawBlush(R_CHEEK);
  }

  // ── LIPS ──────────────────────────────────────────────────────────────────
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    const intensity = activeSteps.lips;
    const color = look.steps.lips.color!;
    const light = lighten(color, 0.5);
    const outerPts = P(LIPS_OUTER);
    const innerPts = P(LIPS_INNER);
    const c = centroid(outerPts);
    const minY = Math.min(...outerPts.map(p => p.y));
    const maxY = Math.max(...outerPts.map(p => p.y));
    const midY = (minY + maxY) / 2;

    // ── Layer 1: Full-coverage base color ─────────────────────────────────
    ctx.save();
    ctx.filter = "blur(0.8px)";
    ctx.globalCompositeOperation = "source-over";

    // Build path with evenodd winding to exclude teeth
    ctx.beginPath();
    polygon(ctx, outerPts);
    polygon(ctx, innerPts);
    ctx.clip("evenodd");

    ctx.fillStyle = rgba(color, 0.90 * intensity);
    ctx.fillRect(
      Math.min(...outerPts.map(p => p.x)) - 2,
      minY - 2,
      Math.max(...outerPts.map(p => p.x)) - Math.min(...outerPts.map(p => p.x)) + 4,
      maxY - minY + 4
    );
    ctx.restore();

    // ── Layer 2: Lip volume highlight (center shine) ──────────────────────
    ctx.save();
    ctx.filter = "blur(4px)";
    ctx.globalCompositeOperation = "screen";

    ctx.beginPath();
    polygon(ctx, outerPts);
    polygon(ctx, innerPts);
    ctx.clip("evenodd");

    // Upper lip cupid's bow highlight
    const upperG = ctx.createLinearGradient(c.x, minY, c.x, midY);
    upperG.addColorStop(0,   rgba(light, 0));
    upperG.addColorStop(0.4, rgba(light, 0));
    upperG.addColorStop(0.6, rgba("#ffffff", 0.28 * intensity));
    upperG.addColorStop(1,   rgba("#ffffff", 0));
    ctx.fillStyle = upperG;
    ctx.fillRect(
      Math.min(...outerPts.map(p => p.x)) - 2,
      minY - 2,
      Math.max(...outerPts.map(p => p.x)) - Math.min(...outerPts.map(p => p.x)) + 4,
      midY - minY + 4
    );

    // Lower lip center shine
    const lowerG = ctx.createLinearGradient(c.x, midY, c.x, maxY);
    lowerG.addColorStop(0,   rgba("#ffffff", 0));
    lowerG.addColorStop(0.35, rgba("#ffffff", 0.32 * intensity));
    lowerG.addColorStop(0.6, rgba("#ffffff", 0.18 * intensity));
    lowerG.addColorStop(1,   rgba("#ffffff", 0));
    ctx.fillStyle = lowerG;
    ctx.fillRect(
      Math.min(...outerPts.map(p => p.x)) - 2,
      midY - 2,
      Math.max(...outerPts.map(p => p.x)) - Math.min(...outerPts.map(p => p.x)) + 4,
      maxY - midY + 4
    );
    ctx.restore();

    // ── Layer 3: Subtle lip contour shadow at outer edges ─────────────────
    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.globalCompositeOperation = "multiply";

    ctx.beginPath();
    polygon(ctx, outerPts);
    polygon(ctx, innerPts);
    ctx.clip("evenodd");

    const edgeG = ctx.createLinearGradient(c.x, minY, c.x, maxY);
    edgeG.addColorStop(0,   rgba(darken(color, 0.2), 0.35 * intensity));
    edgeG.addColorStop(0.3, rgba(color, 0));
    edgeG.addColorStop(0.7, rgba(color, 0));
    edgeG.addColorStop(1,   rgba(darken(color, 0.2), 0.35 * intensity));
    ctx.fillStyle = edgeG;
    ctx.fillRect(
      Math.min(...outerPts.map(p => p.x)) - 2,
      minY - 2,
      Math.max(...outerPts.map(p => p.x)) - Math.min(...outerPts.map(p => p.x)) + 4,
      maxY - minY + 4
    );
    ctx.restore();

    // ── Layer 4: Crisp lip liner edge ─────────────────────────────────────
    ctx.save();
    ctx.filter = "blur(0.5px)";
    ctx.globalCompositeOperation = "source-over";
    smoothPath(ctx, outerPts, true);
    ctx.strokeStyle = rgba(darken(color, 0.15), 0.65 * intensity);
    ctx.lineWidth = Math.max(1, width * 0.0015);
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }
}
