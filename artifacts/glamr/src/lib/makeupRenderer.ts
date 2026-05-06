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

const L_CHEEKBONE = [234, 93, 132, 58];
const R_CHEEKBONE = [454, 323, 361, 288];

const FOREHEAD_CENTER = 10;
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

function smoothPath(ctx: CanvasRenderingContext2D, ps: Pt[], close = false) {
  if (ps.length < 2) return;
  ctx.beginPath();
  appendSmoothPath(ctx, ps, close);
}

function appendSmoothPath(ctx: CanvasRenderingContext2D, ps: Pt[], close = false) {
  if (ps.length < 2) return;
  if (close && ps.length > 2) {
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

function eyeShadowPoly(upper: Pt[], browPts: Pt[], expand: number): Pt[] {
  const browY = Math.min(...browPts.map(p => p.y));
  const lidTopY = Math.min(...upper.map(p => p.y));
  const range = Math.abs(lidTopY - browY);
  const top = upper.map(p => ({ x: p.x, y: p.y - range * expand }));
  return [...upper, ...top.reverse()];
}

// ── Soft-mask buffer ─────────────────────────────────────────────────────────
// To eliminate the "decal / mask" look, we render each region into an offscreen
// canvas where the SHAPE'S OWN ALPHA is heavily blurred. That blurred alpha
// then acts as a soft falloff mask via `source-in`. The result is fed back to
// the main canvas with a blend mode (multiply / screen / soft-light) so the
// makeup melts into skin instead of stamping over it.
//
// One module-level buffer is reused across frames and across regions to avoid
// per-frame allocations. It auto-resizes if the main canvas changes resolution.

type Buffer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };
let _buf: Buffer | null = null;

function getBuffer(w: number, h: number): Buffer {
  if (!_buf || _buf.w !== w || _buf.h !== h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");
    if (!cx) throw new Error("2d context unavailable");
    _buf = { canvas: c, ctx: cx, w, h };
  }
  return _buf!;
}

interface SoftRegionOpts {
  /** Build the region path on the given context (may be a composite even-odd path). */
  buildPath: (c: CanvasRenderingContext2D) => void;
  /** Paint the actual makeup colour into the buffer. The fill will be masked by buildPath's blurred alpha. */
  paint: (c: CanvasRenderingContext2D) => void;
  /** Pixels of feather on the mask edge — bigger = softer/wider falloff. */
  feather: number;
  /** Blend mode used when compositing the buffer back onto the main canvas. */
  blend: GlobalCompositeOperation;
  /** Final opacity of the composited region (0..1). */
  opacity?: number;
  /** even-odd or nonzero (default nonzero). */
  fillRule?: CanvasFillRule;
}

/**
 * Renders a region with a soft, naturally-feathered boundary by using a blurred
 * alpha mask. Eliminates the sharp clip edges that make AR makeup look like a
 * floating decal.
 */
function paintSoftRegion(
  mainCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: SoftRegionOpts
) {
  const { buildPath, paint, feather, blend, opacity = 1, fillRule = "nonzero" } = opts;
  const buf = getBuffer(width, height);
  const bctx = buf.ctx;

  bctx.save();
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.globalCompositeOperation = "source-over";
  bctx.globalAlpha = 1;
  bctx.filter = "none";
  bctx.clearRect(0, 0, width, height);

  // 1) Draw the region as a blurred white silhouette → the alpha channel
  //    has soft edges that fall to zero outside the shape.
  bctx.filter = `blur(${feather}px)`;
  bctx.fillStyle = "#ffffff";
  buildPath(bctx);
  bctx.fill(fillRule);

  // 2) Paint the actual colour, masked to that soft alpha via source-in.
  bctx.filter = "none";
  bctx.globalCompositeOperation = "source-in";
  paint(bctx);
  bctx.restore();

  // 3) Composite the buffer onto the main canvas with the chosen blend.
  mainCtx.save();
  mainCtx.globalCompositeOperation = blend;
  mainCtx.globalAlpha = opacity;
  mainCtx.drawImage(buf.canvas, 0, 0);
  mainCtx.restore();
}

// ── Renderer ─────────────────────────────────────────────────────────────────
//
// Realism principles:
//
//  • Every region is feathered via a blurred alpha mask — no hard clip edges.
//  • multiply is the workhorse: it darkens skin pixels by the makeup colour,
//    preserving every pore and highlight underneath.
//  • screen brightens (highlights, gloss, dewy cheekbones).
//  • soft-light gently shifts hue/saturation without masking.
//  • source-over is used VERY sparingly and always blurred so it never reads
//    as a drawn line.

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  activeSteps: Record<string, number>,
  look: Look
) {
  const P = (idxs: number[]) => pts(idxs, landmarks, width, height);

  const faceOvalPts = P(FACE_OVAL);
  const lEyeUpper = P(L_EYE_UPPER);
  const rEyeUpper = P(R_EYE_UPPER);
  const lEyeLower = P(L_EYE_LOWER);
  const rEyeLower = P(R_EYE_LOWER);
  const lipsOuter = P(LIPS_OUTER);
  const lipsInner = P(LIPS_INNER);
  const lBrow = P(L_BROW);
  const rBrow = P(R_BROW);

  // ── FOUNDATION / SKIN POLISH ─────────────────────────────────────────────
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    const intensity = activeSteps.base;
    const tint = look.steps.base.color;

    paintSoftRegion(ctx, width, height, {
      feather: Math.max(8, width * 0.012),
      blend: "soft-light",
      opacity: 0.85 * intensity,
      fillRule: "evenodd",
      buildPath: (c) => {
        c.beginPath();
        appendSmoothPath(c, faceOvalPts, true);
        // Subtract eyes, brows, lips so foundation doesn't wash out features
        appendSmoothPath(c, [...lEyeUpper, ...lEyeLower.slice(1, -1).reverse()], true);
        appendSmoothPath(c, [...rEyeUpper, ...rEyeLower.slice(1, -1).reverse()], true);
        appendSmoothPath(c, lBrow, true);
        appendSmoothPath(c, rBrow, true);
        appendSmoothPath(c, lipsOuter, true);
      },
      paint: (c) => {
        c.fillStyle = rgba(tint, 0.30);
        c.fillRect(0, 0, width, height);
      },
    });

    // Subtle dewy glow on cheekbones, forehead, nose tip
    const lBoneC = centroid(P(L_CHEEKBONE));
    const rBoneC = centroid(P(R_CHEEKBONE));
    const fHead = lmPt(landmarks, FOREHEAD_CENTER, width, height);
    const nTip = lmPt(landmarks, NOSE_TIP, width, height);

    const glowSpots = [
      { x: lBoneC.x, y: lBoneC.y, r: width * 0.07, a: 0.10 },
      { x: rBoneC.x, y: rBoneC.y, r: width * 0.07, a: 0.10 },
      { x: fHead.x, y: fHead.y + height * 0.025, r: width * 0.09, a: 0.08 },
      { x: nTip.x, y: nTip.y - height * 0.015, r: width * 0.025, a: 0.12 },
    ];

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${Math.round(width * 0.012)}px)`;
    for (const s of glowSpots) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, rgba("#fff4e8", s.a * intensity));
      g.addColorStop(1, rgba("#fff4e8", 0));
      ctx.fillStyle = g;
      ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    ctx.restore();
  }

  // ── EYESHADOW ────────────────────────────────────────────────────────────
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    const intensity = activeSteps.eyes;
    const color = look.steps.eyes.color!;
    const dark  = darken(color, 0.32);
    const light = lighten(color, 0.55);

    const renderEye = (upper: Pt[], browPts: Pt[]) => {
      const lid = eyeShadowPoly(upper, browPts, 0.65);
      const c   = centroid(lid);
      const b   = bbox(lid);
      const outerPt = upper[upper.length - 1];

      // ── Layer 1: broad lid wash, MULTIPLY, vertical fade ──
      paintSoftRegion(ctx, width, height, {
        feather: Math.max(10, width * 0.018),
        blend: "multiply",
        opacity: 0.85 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          appendSmoothPath(cc, lid, true);
        },
        paint: (cc) => {
          const g = cc.createLinearGradient(c.x, b.y1, c.x, b.y0);
          g.addColorStop(0,    rgba(dark,  0.85));
          g.addColorStop(0.30, rgba(color, 0.65));
          g.addColorStop(0.70, rgba(color, 0.30));
          g.addColorStop(1,    rgba(color, 0));
          cc.fillStyle = g;
          cc.fillRect(0, 0, width, height);
        },
      });

      // ── Layer 2: outer-corner crease depth, MULTIPLY ──
      paintSoftRegion(ctx, width, height, {
        feather: Math.max(8, width * 0.014),
        blend: "multiply",
        opacity: 0.7 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          appendSmoothPath(cc, lid, true);
        },
        paint: (cc) => {
          const r = width * 0.05;
          const g = cc.createRadialGradient(outerPt.x, outerPt.y - height * 0.005, 0, outerPt.x, outerPt.y - height * 0.005, r * 2.2);
          g.addColorStop(0,   rgba(dark, 0.90));
          g.addColorStop(0.4, rgba(dark, 0.40));
          g.addColorStop(1,   rgba(dark, 0));
          cc.fillStyle = g;
          cc.fillRect(0, 0, width, height);
        },
      });

      // ── Layer 3: centre-lid shimmer, SCREEN ──
      paintSoftRegion(ctx, width, height, {
        feather: Math.max(5, width * 0.008),
        blend: "screen",
        opacity: 0.65 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          appendSmoothPath(cc, lid, true);
        },
        paint: (cc) => {
          const midPt = upper[Math.floor(upper.length / 2)];
          const r = width * 0.025;
          const g = cc.createRadialGradient(midPt.x, midPt.y - height * 0.008, 0, midPt.x, midPt.y - height * 0.008, r);
          g.addColorStop(0, rgba(light, 0.75));
          g.addColorStop(1, rgba(light, 0));
          cc.fillStyle = g;
          cc.fillRect(0, 0, width, height);
        },
      });
    };

    renderEye(lEyeUpper, lBrow);
    renderEye(rEyeUpper, rBrow);

    // ── EYELINER (soft, never crisp source-over) ──
    // Painted as a SOFT blurred stroke into the buffer, then composited multiply
    // so it darkens skin instead of stamping a black line on top.
    const drawSoftLiner = (upperPts: Pt[]) => {
      const startIdx = Math.floor(upperPts.length * 0.30);
      const linerPts = upperPts.slice(startIdx);
      if (linerPts.length < 2) return;

      const last = linerPts[linerPts.length - 1];
      const prev = linerPts[Math.max(0, linerPts.length - 3)];
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
      const wl = width * 0.020;
      const tip = {
        x: last.x + Math.cos(angle - 0.55) * wl,
        y: last.y + Math.sin(angle - 0.55) * wl - height * 0.010,
      };
      const back = {
        x: last.x + Math.cos(angle + Math.PI) * wl * 0.35,
        y: last.y + Math.sin(angle + Math.PI) * wl * 0.35,
      };

      paintSoftRegion(ctx, width, height, {
        feather: Math.max(1.2, width * 0.0018),
        blend: "multiply",
        opacity: 0.95 * intensity,
        buildPath: (cc) => {
          // Stroke the lid line as the mask shape
          cc.beginPath();
          smoothPath(cc, linerPts, false);
          cc.lineWidth   = Math.max(2.2, width * 0.005);
          cc.lineCap     = "round";
          cc.lineJoin    = "round";
          cc.strokeStyle = "#fff";
          cc.stroke();
          // Wing
          cc.beginPath();
          cc.moveTo(last.x, last.y);
          cc.lineTo(tip.x, tip.y);
          cc.lineTo(back.x, back.y);
          cc.closePath();
          cc.fill();
        },
        paint: (cc) => {
          cc.fillStyle = "#0a0a0a";
          cc.fillRect(0, 0, width, height);
        },
      });
    };

    drawSoftLiner(lEyeUpper);
    drawSoftLiner(rEyeUpper);

    // ── Lower-lash smudge (very soft, outer 60%) ──
    const drawLowerSmudge = (lowerPts: Pt[]) => {
      const startIdx = Math.floor(lowerPts.length * 0.20);
      const endIdx = Math.floor(lowerPts.length * 0.85);
      const smudge = lowerPts.slice(startIdx, endIdx);
      if (smudge.length < 2) return;

      paintSoftRegion(ctx, width, height, {
        feather: Math.max(2.5, width * 0.004),
        blend: "multiply",
        opacity: 0.55 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          smoothPath(cc, smudge, false);
          cc.lineWidth   = Math.max(1.5, width * 0.0038);
          cc.lineCap     = "round";
          cc.strokeStyle = "#fff";
          cc.stroke();
        },
        paint: (cc) => {
          cc.fillStyle = dark;
          cc.fillRect(0, 0, width, height);
        },
      });
    };

    drawLowerSmudge(lEyeLower);
    drawLowerSmudge(rEyeLower);
  }

  // ── BROWS ────────────────────────────────────────────────────────────────
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    const intensity = activeSteps.brows;
    const color     = look.steps.brows.color!;

    const drawBrow = (browPts: Pt[]) => {
      const sortX = [...browPts].sort((a, b) => a.x - b.x);

      // Soft tinted region (preserves natural brow hair underneath)
      paintSoftRegion(ctx, width, height, {
        feather: Math.max(4, width * 0.006),
        blend: "multiply",
        opacity: 0.55 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          appendSmoothPath(cc, browPts, true);
        },
        paint: (cc) => {
          cc.fillStyle = color;
          cc.fillRect(0, 0, width, height);
        },
      });

      // Soft hair-direction stroke (no crisp source-over)
      paintSoftRegion(ctx, width, height, {
        feather: Math.max(1.2, width * 0.0018),
        blend: "multiply",
        opacity: 0.65 * intensity,
        buildPath: (cc) => {
          cc.beginPath();
          smoothPath(cc, sortX, false);
          cc.lineWidth   = Math.max(2.2, height * 0.0065);
          cc.lineCap     = "round";
          cc.strokeStyle = "#fff";
          cc.stroke();
        },
        paint: (cc) => {
          cc.fillStyle = color;
          cc.fillRect(0, 0, width, height);
        },
      });
    };

    drawBrow(lBrow);
    drawBrow(rBrow);

    const drawBrowBone = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c  = centroid(bp);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.filter = `blur(${Math.round(width * 0.010)}px)`;
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

  // ── BLUSH / CHEEKS ───────────────────────────────────────────────────────
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    const intensity = activeSteps.cheeks;
    const color     = look.steps.cheeks.color!;

    const drawBlush = (cheekIdxs: number[]) => {
      const cp = P(cheekIdxs);
      const c  = centroid(cp);
      const cx = c.x;
      const cy = c.y - height * 0.005;
      const rx = width  * 0.105;
      const ry = height * 0.068;

      // Radial blush — already soft by gradient; multiply for natural flush
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.filter = `blur(${Math.round(width * 0.022)}px)`;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      g.addColorStop(0,   rgba(color, 0.55 * intensity));
      g.addColorStop(0.5, rgba(color, 0.28 * intensity));
      g.addColorStop(1,   rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner warmth — soft-light
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.filter = `blur(${Math.round(width * 0.014)}px)`;
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.55);
      g2.addColorStop(0, rgba(lighten(color, 0.35), 0.30 * intensity));
      g2.addColorStop(1, rgba(lighten(color, 0.35), 0));
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.55, ry * 0.55, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlush(L_CHEEK);
    drawBlush(R_CHEEK);

    // Cheekbone highlighter (subtle screen pop)
    const drawCheekboneGlow = (boneIdxs: number[]) => {
      const bp = P(boneIdxs);
      const c  = centroid(bp);
      const r  = width * 0.045;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.filter = `blur(${Math.round(width * 0.011)}px)`;
      const g = ctx.createRadialGradient(c.x, c.y - height * 0.01, 0, c.x, c.y - height * 0.01, r);
      g.addColorStop(0, rgba("#fff4e8", 0.20 * intensity));
      g.addColorStop(1, rgba("#fff4e8", 0));
      ctx.fillStyle = g;
      ctx.fillRect(c.x - r, c.y - r - height * 0.01, r * 2, r * 2);
      ctx.restore();
    };

    drawCheekboneGlow(L_CHEEKBONE);
    drawCheekboneGlow(R_CHEEKBONE);
  }

  // ── LIPS ─────────────────────────────────────────────────────────────────
  // The big realism win: the lip MASK itself is feathered, so the lipstick
  // fades into skin at the edges instead of having a hard stamped border.
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    const intensity  = activeSteps.lips;
    const color      = look.steps.lips.color!;
    const colorDark  = darken(color, 0.25);
    const c          = centroid(lipsOuter);
    const b          = bbox(lipsOuter);
    const midY       = (b.y0 + b.y1) / 2;

    const buildLipPath = (cc: CanvasRenderingContext2D) => {
      cc.beginPath();
      appendSmoothPath(cc, lipsOuter, true);
      appendSmoothPath(cc, lipsInner, true);
    };

    // ── Layer 1: Base colour, MULTIPLY, soft-feathered edges ──
    paintSoftRegion(ctx, width, height, {
      feather: Math.max(2.5, width * 0.0045),
      blend: "multiply",
      opacity: 0.92 * intensity,
      fillRule: "evenodd",
      buildPath: buildLipPath,
      paint: (cc) => {
        cc.fillStyle = rgba(color, 0.78);
        cc.fillRect(0, 0, width, height);
      },
    });

    // ── Layer 2: Soft-light saturation push ──
    paintSoftRegion(ctx, width, height, {
      feather: Math.max(3, width * 0.005),
      blend: "soft-light",
      opacity: 0.55 * intensity,
      fillRule: "evenodd",
      buildPath: buildLipPath,
      paint: (cc) => {
        cc.fillStyle = color;
        cc.fillRect(0, 0, width, height);
      },
    });

    // ── Layer 3: Edge depth via radial gradient inside the soft mask ──
    paintSoftRegion(ctx, width, height, {
      feather: Math.max(2, width * 0.004),
      blend: "multiply",
      opacity: 0.5 * intensity,
      fillRule: "evenodd",
      buildPath: buildLipPath,
      paint: (cc) => {
        const g = cc.createLinearGradient(c.x, b.y0, c.x, b.y1);
        g.addColorStop(0,    rgba(colorDark, 0.45));
        g.addColorStop(0.22, rgba(colorDark, 0));
        g.addColorStop(0.78, rgba(colorDark, 0));
        g.addColorStop(1,    rgba(colorDark, 0.45));
        cc.fillStyle = g;
        cc.fillRect(0, 0, width, height);
      },
    });

    // ── Layer 4: Cupid's-bow highlight, SCREEN ──
    paintSoftRegion(ctx, width, height, {
      feather: Math.max(2, width * 0.003),
      blend: "screen",
      opacity: 0.7 * intensity,
      fillRule: "evenodd",
      buildPath: buildLipPath,
      paint: (cc) => {
        const r = width * 0.022;
        const cy = b.y0 + (midY - b.y0) * 0.30;
        const g = cc.createRadialGradient(c.x, cy, 0, c.x, cy, r);
        g.addColorStop(0, rgba("#ffffff", 0.45));
        g.addColorStop(1, rgba("#ffffff", 0));
        cc.fillStyle = g;
        cc.fillRect(0, 0, width, height);
      },
    });

    // ── Layer 5: Lower-lip centre shine, SCREEN ──
    paintSoftRegion(ctx, width, height, {
      feather: Math.max(2.5, width * 0.0035),
      blend: "screen",
      opacity: 0.85 * intensity,
      fillRule: "evenodd",
      buildPath: buildLipPath,
      paint: (cc) => {
        const r = width * 0.030;
        const cy = midY + (b.y1 - midY) * 0.45;
        const g = cc.createRadialGradient(c.x, cy, 0, c.x, cy, r);
        g.addColorStop(0,   rgba("#ffffff", 0.55));
        g.addColorStop(0.5, rgba(lighten(color, 0.5), 0.22));
        g.addColorStop(1,   rgba("#ffffff", 0));
        cc.fillStyle = g;
        cc.fillRect(0, 0, width, height);
      },
    });
  }
}
