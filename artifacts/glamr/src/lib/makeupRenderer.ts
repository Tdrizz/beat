import { Look } from "./looks";
import { NormalizedLandmark } from "@mediapipe/tasks-vision";

// Helpers
function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// MediaPipe 478 Landmark Indices
const LEFT_EYE_UPPER = [246, 161, 160, 159, 158, 157, 173];
const RIGHT_EYE_UPPER = [466, 388, 387, 386, 385, 384, 398];
const LEFT_EYE_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const RIGHT_EYE_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];
const LEFT_EYEBROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const RIGHT_EYEBROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82];
const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
const LEFT_CHEEK = [116, 117, 118, 119, 120, 121, 126, 142, 203, 206, 207, 213];
const RIGHT_CHEEK = [345, 346, 347, 348, 349, 350, 355, 371, 423, 426, 427, 433];
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export function drawMakeup(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  activeSteps: Record<string, number>,
  look: Look
) {
  const lm = (idx: number) => ({ x: landmarks[idx].x * width, y: landmarks[idx].y * height });

  function drawPolygon(indices: number[], fillStyle?: string, strokeStyle?: string, lineWidth = 1) {
    ctx.beginPath();
    const start = lm(indices[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < indices.length; i++) {
      const p = lm(indices[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  // BASE
  if (activeSteps.base > 0 && look.steps.base.color && look.steps.base.color !== "transparent") {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    drawPolygon(FACE_OVAL, hexToRgba(look.steps.base.color, 0.2 * activeSteps.base));
    ctx.restore();
  }

  // BROWS
  if (activeSteps.brows > 0 && look.steps.brows.color && look.steps.brows.color !== "transparent") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const alpha = 0.5 * activeSteps.brows;
    drawPolygon(LEFT_EYEBROW, hexToRgba(look.steps.brows.color, alpha));
    drawPolygon(RIGHT_EYEBROW, hexToRgba(look.steps.brows.color, alpha));
    ctx.restore();
  }

  // CHEEKS
  if (activeSteps.cheeks > 0 && look.steps.cheeks.color && look.steps.cheeks.color !== "transparent") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const drawBlush = (indices: number[]) => {
      // Find center
      let cx = 0, cy = 0;
      indices.forEach(idx => {
        const p = lm(idx);
        cx += p.x;
        cy += p.y;
      });
      cx /= indices.length;
      cy /= indices.length;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.08);
      gradient.addColorStop(0, hexToRgba(look.steps.cheeks.color!, 0.4 * activeSteps.cheeks));
      gradient.addColorStop(1, hexToRgba(look.steps.cheeks.color!, 0));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, width * 0.08, 0, Math.PI * 2);
      ctx.fill();
    };
    drawBlush(LEFT_CHEEK);
    drawBlush(RIGHT_CHEEK);
    ctx.restore();
  }

  // EYES
  if (activeSteps.eyes > 0 && look.steps.eyes.color && look.steps.eyes.color !== "transparent") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const alpha = 0.4 * activeSteps.eyes;
    
    // Simple shadow above upper eye
    const drawEyeShadow = (upper: number[]) => {
      ctx.beginPath();
      const p0 = lm(upper[0]);
      ctx.moveTo(p0.x, p0.y);
      upper.forEach(idx => {
        const p = lm(idx);
        ctx.lineTo(p.x, p.y - height * 0.02); // extend upwards
      });
      ctx.lineTo(lm(upper[upper.length-1]).x, lm(upper[upper.length-1]).y);
      ctx.fillStyle = hexToRgba(look.steps.eyes.color!, alpha);
      ctx.fill();
    };

    drawEyeShadow(LEFT_EYE_UPPER);
    drawEyeShadow(RIGHT_EYE_UPPER);
    
    // Liner
    ctx.globalCompositeOperation = "source-over";
    const linerColor = look.steps.eyes.color === "#000000" ? "#000000" : "#1a1a1a";
    drawPolygon(LEFT_EYE_UPPER, undefined, hexToRgba(linerColor, 0.8 * activeSteps.eyes), 2);
    drawPolygon(RIGHT_EYE_UPPER, undefined, hexToRgba(linerColor, 0.8 * activeSteps.eyes), 2);
    ctx.restore();
  }

  // LIPS
  if (activeSteps.lips > 0 && look.steps.lips.color && look.steps.lips.color !== "transparent") {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    
    // Outer lips polygon
    ctx.beginPath();
    let start = lm(LIPS_OUTER[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < LIPS_OUTER.length; i++) {
      const p = lm(LIPS_OUTER[i]);
      ctx.lineTo(p.x, p.y);
    }
    // Inner lips hole to not paint teeth
    for (let i = 0; i < LIPS_INNER.length; i++) {
      const p = lm(LIPS_INNER[i]);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    
    ctx.fillStyle = hexToRgba(look.steps.lips.color, 0.6 * activeSteps.lips);
    ctx.fill("evenodd");
    ctx.restore();
  }
}
