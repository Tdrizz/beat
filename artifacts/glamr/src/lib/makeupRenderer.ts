import { Look } from "./looks";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map(c => c + c).join("");
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const c = hexToRgb(hex);
  if (!c) return `rgba(0,0,0,${alpha})`;
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

// ── MediaPipe 478-point landmark groups ──────────────────────────────────────

// Full eye socket — upper contour from inner to outer corner
const LEFT_EYE_LID_TOP = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const RIGHT_EYE_LID_TOP = [362, 398, 384, 385, 386, 387, 388, 466, 263];

// Lower eye contour
const LEFT_EYE_LID_BOT = [133, 155, 154, 153, 145, 144, 163, 7, 33];
const RIGHT_EYE_LID_BOT = [263, 249, 390, 373, 374, 380, 381, 382, 362];

// Eyebrow area — outer contour
const LEFT_BROW = [46, 53, 52, 65, 55, 107, 66, 105, 63, 70, 156, 124];
const RIGHT_BROW = [276, 283, 282, 295, 285, 336, 296, 334, 293, 300, 383, 353];

// Lid eyeshadow coverage area (from lash line, extending up toward brow)
const LEFT_LID_SHADOW = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_LID_SHADOW = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];

// Lip outer / inner contours
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82];
const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

// Cheekbone blush zones
const LEFT_CHEEKBONE = [116, 123, 147, 213, 192, 187, 207, 206, 203, 142, 126, 217, 174, 196, 197];
const RIGHT_CHEEKBONE = [345, 352, 376, 433, 416, 411, 427, 426, 423, 371, 355, 437, 399, 420, 421];

// Face oval for base
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

// ── Drawing helpers ───────────────────────────────────────────────────────────

function getPoints(indices: number[], landmarks: NormalizedLandmark[], w: number, h: number) {
  return indices.map(i => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
}

function centroid(pts: { x: number; y: number }[]) {
  const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}

function tracePath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], smooth = false) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (smooth) {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  } else {
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  }
  ctx.closePath();
}

// ── Main export ───────────────────────────────────────────────────────────────

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  activeSteps: Record<string, number>,
  look: Look
) {
  const lm = (i: number) => ({ x: landmarks[i].x * width, y: landmarks[i].y * height });
  const pts = (idxs: number[]) => getPoints(idxs, landmarks, width, height);

  // ── BASE ─────────────────────────────────────────────────────────────────
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    ctx.save();
    ctx.filter = "blur(10px)";
    ctx.globalCompositeOperation = "soft-light";
    const facePoints = pts(FACE_OVAL);
    tracePath(ctx, facePoints, true);
    ctx.fillStyle = rgba(look.steps.base.color, 0.18 * activeSteps.base);
    ctx.fill();
    ctx.restore();
  }

  // ── EYESHADOW ─────────────────────────────────────────────────────────────
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    const intensity = activeSteps.eyes;
    const eyeColor = look.steps.eyes.color!;

    const drawEyeShadow = (lidShadow: number[], browPts: number[], isLeft: boolean) => {
      const lidPts = pts(lidShadow);
      const browCenter = centroid(pts(browPts));
      const lidCenter = centroid(lidPts);

      // Crease / lid gradient from lash line to just below brow
      ctx.save();
      ctx.filter = "blur(6px)";
      ctx.globalCompositeOperation = "multiply";

      const topY = Math.min(browCenter.y, lidCenter.y - height * 0.03);
      const botY = Math.max(...lidPts.map(p => p.y));
      const grad = ctx.createLinearGradient(lidCenter.x, botY, lidCenter.x, topY);
      grad.addColorStop(0, rgba(eyeColor, 0.75 * intensity));
      grad.addColorStop(0.45, rgba(eyeColor, 0.45 * intensity));
      grad.addColorStop(1, rgba(eyeColor, 0));

      // Expanded shadow region — push points upward toward brow
      const expanded = lidPts.map(p => ({ x: p.x, y: p.y - height * 0.035 }));
      const shadow = [...lidPts, ...expanded.reverse()];
      tracePath(ctx, shadow, true);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Deep color at lash line for dimension
      ctx.save();
      ctx.filter = "blur(3px)";
      ctx.globalCompositeOperation = "multiply";
      tracePath(ctx, lidPts, true);
      ctx.fillStyle = rgba(eyeColor, 0.55 * intensity);
      ctx.fill();
      ctx.restore();
    };

    drawEyeShadow(LEFT_LID_SHADOW, LEFT_BROW, true);
    drawEyeShadow(RIGHT_LID_SHADOW, RIGHT_BROW, false);

    // ── LINER ──────────────────────────────────────────────────────────────
    const drawLiner = (lidTop: number[]) => {
      const linePts = pts(lidTop);
      ctx.save();
      ctx.filter = "blur(0.8px)";
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(linePts[0].x, linePts[0].y);
      for (let i = 1; i < linePts.length - 1; i++) {
        const mx = (linePts[i].x + linePts[i + 1].x) / 2;
        const my = (linePts[i].y + linePts[i + 1].y) / 2;
        ctx.quadraticCurveTo(linePts[i].x, linePts[i].y, mx, my);
      }
      ctx.lineTo(linePts[linePts.length - 1].x, linePts[linePts.length - 1].y);
      ctx.strokeStyle = rgba("#111111", 0.85 * intensity);
      ctx.lineWidth = Math.max(1.5, width * 0.003);
      ctx.lineCap = "round";
      ctx.stroke();

      // Wing: extend from outer corner upward
      const outer = linePts[linePts.length - 1];
      const inner = linePts[0];
      const dx = outer.x - inner.x;
      const wingLen = width * 0.016;
      // Wing direction: outward + slightly upward
      const angle = Math.atan2(outer.y - linePts[linePts.length - 3].y, outer.x - linePts[linePts.length - 3].x);
      const wingTip = {
        x: outer.x + Math.cos(angle - 0.4) * wingLen,
        y: outer.y + Math.sin(angle - 0.4) * wingLen - height * 0.01,
      };
      ctx.beginPath();
      ctx.moveTo(outer.x, outer.y);
      ctx.lineTo(wingTip.x, wingTip.y);
      ctx.strokeStyle = rgba("#111111", 0.8 * intensity);
      ctx.lineWidth = Math.max(1, width * 0.002);
      ctx.stroke();
      ctx.restore();
    };

    drawLiner(LEFT_EYE_LID_TOP);
    drawLiner(RIGHT_EYE_LID_TOP);
  }

  // ── BROWS ─────────────────────────────────────────────────────────────────
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    const intensity = activeSteps.brows;

    const drawBrow = (browIdxs: number[]) => {
      const browPts = pts(browIdxs);
      const c = centroid(browPts);

      // Outer soft brow shape
      ctx.save();
      ctx.filter = "blur(4px)";
      ctx.globalCompositeOperation = "multiply";
      tracePath(ctx, browPts, true);
      ctx.fillStyle = rgba(look.steps.brows.color!, 0.6 * intensity);
      ctx.fill();
      ctx.restore();

      // Inner crisp stroke for definition
      const sorted = [...browPts].sort((a, b) => a.x - b.x);
      ctx.save();
      ctx.filter = "blur(1px)";
      ctx.globalCompositeOperation = "multiply";
      ctx.beginPath();
      ctx.moveTo(sorted[0].x, sorted[0].y);
      for (let i = 1; i < sorted.length - 1; i++) {
        const mx = (sorted[i].x + sorted[i + 1].x) / 2;
        const my = (sorted[i].y + sorted[i + 1].y) / 2;
        ctx.quadraticCurveTo(sorted[i].x, sorted[i].y, mx, my);
      }
      ctx.lineTo(sorted[sorted.length - 1].x, sorted[sorted.length - 1].y);
      ctx.strokeStyle = rgba(look.steps.brows.color!, 0.7 * intensity);
      ctx.lineWidth = Math.max(2, height * 0.006);
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    };

    drawBrow(LEFT_BROW);
    drawBrow(RIGHT_BROW);
  }

  // ── CHEEKS / BLUSH ────────────────────────────────────────────────────────
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    const intensity = activeSteps.cheeks;

    const drawBlush = (cheekIdxs: number[]) => {
      const cheekPts = pts(cheekIdxs);
      const c = centroid(cheekPts);
      // Blush sits on the upper cheekbone — push it slightly up and out
      const blushCx = c.x;
      const blushCy = c.y - height * 0.01;
      const radius = width * 0.12;

      ctx.save();
      ctx.filter = "blur(14px)";
      ctx.globalCompositeOperation = "multiply";
      const grad = ctx.createRadialGradient(blushCx, blushCy, 0, blushCx, blushCy, radius);
      grad.addColorStop(0, rgba(look.steps.cheeks.color!, 0.55 * intensity));
      grad.addColorStop(0.5, rgba(look.steps.cheeks.color!, 0.25 * intensity));
      grad.addColorStop(1, rgba(look.steps.cheeks.color!, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(blushCx, blushCy, radius, radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlush(LEFT_CHEEKBONE);
    drawBlush(RIGHT_CHEEKBONE);
  }

  // ── LIPS ──────────────────────────────────────────────────────────────────
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    const intensity = activeSteps.lips;
    const lipColor = look.steps.lips.color!;
    const lipPts = pts(LIPS_OUTER);
    const innerPts = pts(LIPS_INNER);
    const lipCenter = centroid(lipPts);

    ctx.save();
    ctx.filter = "blur(1.5px)";
    ctx.globalCompositeOperation = "multiply";

    // Draw outer lip shape minus inner mouth opening (even-odd)
    ctx.beginPath();
    lipPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    innerPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = rgba(lipColor, 0.75 * intensity);
    ctx.fill("evenodd");
    ctx.restore();

    // Subtle volume highlight — lighter center of upper and lower lip
    ctx.save();
    ctx.filter = "blur(4px)";
    ctx.globalCompositeOperation = "screen";
    const topY = Math.min(...lipPts.map(p => p.y));
    const botY = Math.max(...lipPts.map(p => p.y));
    const highlightGrad = ctx.createLinearGradient(lipCenter.x, topY, lipCenter.x, botY);
    highlightGrad.addColorStop(0, rgba("#ffffff", 0));
    highlightGrad.addColorStop(0.35, rgba("#ffffff", 0.18 * intensity));
    highlightGrad.addColorStop(0.5, rgba("#ffffff", 0.12 * intensity));
    highlightGrad.addColorStop(0.65, rgba("#ffffff", 0.18 * intensity));
    highlightGrad.addColorStop(1, rgba("#ffffff", 0));

    ctx.beginPath();
    lipPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    innerPts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = highlightGrad;
    ctx.fill("evenodd");
    ctx.restore();
  }
}
