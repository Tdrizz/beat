import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";

// ── Types ──────────────────────────────────────────────────────────────────

export type SkinToneCategory = "Fair" | "Light" | "Medium Light" | "Medium" | "Tan" | "Deep";
export type Undertone = "Warm" | "Cool" | "Neutral";
export type EyeShapeType = "Almond" | "Round" | "Hooded" | "Monolid" | "Upturned" | "Downturned";
export type FaceShapeType = "Oval" | "Round" | "Square" | "Heart" | "Diamond" | "Oblong";

export interface SkinTone {
  category: SkinToneCategory;
  undertone: Undertone;
  hex: string;
  description: string;
}

export interface EyeShape {
  type: EyeShapeType;
  description: string;
}

export interface FaceShape {
  type: FaceShapeType;
  description: string;
}

export interface FaceAnalysis {
  skinTone: SkinTone;
  eyeShape: EyeShape;
  faceShape: FaceShape;
}

export type AnalysisState = "loading" | "ready" | "scanning" | "done" | "error";

// ── Landmark indices (MediaPipe 478-point mesh) ────────────────────────────

const LM = {
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOT: 145,
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_INNER: 263,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOT: 374,
  LEFT_CHEEK: 50,
  RIGHT_CHEEK: 280,
  LEFT_CHEEK_B: 36,
  RIGHT_CHEEK_B: 266,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_TEMPLE: 127,
  RIGHT_TEMPLE: 356,
  LEFT_JAW: 172,
  RIGHT_JAW: 397,
  LEFT_CHEEKBONE: 234,
  RIGHT_CHEEKBONE: 454,
  LEFT_EYELID_TOP_OUTER: 33,
  RIGHT_EYELID_TOP_OUTER: 362,
};

// ── Analysis helpers ───────────────────────────────────────────────────────

function dist(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function samplePixels(
  ctx: CanvasRenderingContext2D,
  lm: NormalizedLandmark,
  w: number,
  h: number,
  radius = 8
): [number, number, number] {
  const cx = Math.round(lm.x * w);
  const cy = Math.round(lm.y * h);
  const x = Math.max(0, cx - radius);
  const y = Math.max(0, cy - radius);
  const size = radius * 2;
  const data = ctx.getImageData(x, y, size, size).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 10) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  }
  if (!n) return [200, 160, 130];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
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

function classifySkinTone(r: number, g: number, b: number): SkinTone {
  const [, , l] = rgbToHsl(r, g, b);
  const hex = rgbToHex(r, g, b);

  // Undertone: compare warm (red-yellow) vs cool (blue-pink) channels
  const warmBias = r - b;
  let undertone: Undertone = "Neutral";
  if (warmBias > 25) undertone = "Warm";
  else if (warmBias < -10) undertone = "Cool";

  let category: SkinToneCategory;
  let description: string;

  if (l > 73) {
    category = "Fair";
    description = "Porcelain-light skin with delicate undertones.";
  } else if (l > 62) {
    category = "Light";
    description = "Light skin that flushes easily and shows soft contrast.";
  } else if (l > 52) {
    category = "Medium Light";
    description = "Balanced complexion between light and medium.";
  } else if (l > 42) {
    category = "Medium";
    description = "Versatile medium tone that suits a wide range of palettes.";
  } else if (l > 30) {
    category = "Tan";
    description = "A rich, warm tan that makes bold colours sing.";
  } else {
    category = "Deep";
    description = "Deep, luminous skin that carries any shade with power.";
  }

  return { category, undertone, hex, description };
}

function classifyEyeShape(lm: NormalizedLandmark[]): EyeShape {
  // Right eye (facing camera) = landmarks 33-side (our left on screen after mirror)
  const outerL = lm[LM.LEFT_EYE_OUTER];
  const innerL = lm[LM.LEFT_EYE_INNER];
  const topL = lm[LM.LEFT_EYE_TOP];
  const botL = lm[LM.LEFT_EYE_BOT];

  const outerR = lm[LM.RIGHT_EYE_OUTER];
  const innerR = lm[LM.RIGHT_EYE_INNER];
  const topR = lm[LM.RIGHT_EYE_TOP];
  const botR = lm[LM.RIGHT_EYE_BOT];

  const widthL = dist(outerL, innerL);
  const heightL = dist(topL, botL);
  const widthR = dist(outerR, innerR);
  const heightR = dist(topR, botR);

  const ratio = ((widthL / heightL) + (widthR / heightR)) / 2;

  // Vertical offset: if outer corner is higher than inner → upturned, lower → downturned
  const tiltL = (innerL.y - outerL.y); // positive = outer lower = downturned
  const tiltR = (innerR.y - outerR.y);
  const avgTilt = (tiltL + tiltR) / 2;

  let type: EyeShapeType;
  let description: string;

  if (ratio < 2.3) {
    type = "Round";
    description = "Large, open and circular — maximise the doe-eye effect or go bold with centre drama.";
  } else if (avgTilt < -0.015) {
    type = "Upturned";
    description = "Corners naturally lift at the outer edge — perfect for siren or reverse cat-eye styles.";
  } else if (avgTilt > 0.015) {
    type = "Downturned";
    description = "Outer corners slope softly downward — lift with an upswept wing or foxy technique.";
  } else if (heightL < 0.025 || heightR < 0.025) {
    type = "Hooded";
    description = "The lid dips under the brow bone — tight-lining and above-crease colour create the most impact.";
  } else if (ratio > 3.5) {
    type = "Almond";
    description = "The most versatile eye shape — symmetrical and slightly pointed at each corner.";
  } else {
    type = "Monolid";
    description = "A smooth lid with a minimal crease — graphic liner and duochrome shadows create instant drama.";
  }

  return { type, description };
}

function classifyFaceShape(lm: NormalizedLandmark[]): FaceShape {
  const foreheadW = dist(lm[LM.LEFT_TEMPLE], lm[LM.RIGHT_TEMPLE]);
  const cheekW = dist(lm[LM.LEFT_CHEEKBONE], lm[LM.RIGHT_CHEEKBONE]);
  const jawW = dist(lm[LM.LEFT_JAW], lm[LM.RIGHT_JAW]);
  const faceLen = dist(lm[LM.FOREHEAD], lm[LM.CHIN]);

  // Normalised ratios
  const fwRatio = foreheadW / cheekW;  // forehead vs cheekbones
  const jwRatio = jawW / cheekW;       // jaw vs cheekbones
  const lrRatio = faceLen / cheekW;    // length vs width (elongation)

  let type: FaceShapeType;
  let description: string;

  if (lrRatio > 1.6) {
    type = "Oblong";
    description = "A long, narrow face — horizontal emphasis on cheeks and lips adds perfect balance.";
  } else if (fwRatio > 0.95 && jwRatio > 0.85 && lrRatio < 1.2) {
    type = "Round";
    description = "Soft, equal width and length — contouring and lengthening looks add beautiful definition.";
  } else if (fwRatio > 0.92 && jwRatio > 0.90 && lrRatio > 1.2) {
    type = "Square";
    description = "Strong, balanced proportions with an angular jaw — soft and romantic looks create contrast.";
  } else if (fwRatio > 1.05 && jwRatio < 0.75) {
    type = "Heart";
    description = "A wide forehead tapering to a narrow chin — let the lips shine as the focal point.";
  } else if (fwRatio < 0.88 && jwRatio < 0.80) {
    type = "Diamond";
    description = "Wide, prominent cheekbones with a narrow forehead and jaw — a rare, striking structure.";
  } else {
    type = "Oval";
    description = "Gently balanced proportions slightly longer than wide — the most versatile face shape.";
  }

  return { type, description };
}

function analyzeFrame(
  videoEl: HTMLVideoElement,
  landmarks: NormalizedLandmark[]
): FaceAnalysis {
  // Draw the raw (unmirrored) frame onto an offscreen canvas for pixel sampling
  const offscreen = document.createElement("canvas");
  offscreen.width = videoEl.videoWidth;
  offscreen.height = videoEl.videoHeight;
  const ctx = offscreen.getContext("2d")!;
  ctx.drawImage(videoEl, 0, 0);

  const w = offscreen.width;
  const h = offscreen.height;

  // Sample from both cheeks and average
  const [r1, g1, b1] = samplePixels(ctx, landmarks[LM.LEFT_CHEEK], w, h, 10);
  const [r2, g2, b2] = samplePixels(ctx, landmarks[LM.RIGHT_CHEEK], w, h, 10);
  const [r3, g3, b3] = samplePixels(ctx, landmarks[LM.LEFT_CHEEK_B], w, h, 8);
  const [r4, g4, b4] = samplePixels(ctx, landmarks[LM.RIGHT_CHEEK_B], w, h, 8);
  const avgR = Math.round((r1 + r2 + r3 + r4) / 4);
  const avgG = Math.round((g1 + g2 + g3 + g4) / 4);
  const avgB = Math.round((b1 + b2 + b3 + b4) / 4);

  return {
    skinTone: classifySkinTone(avgR, avgG, avgB),
    eyeShape: classifyEyeShape(landmarks),
    faceShape: classifyFaceShape(landmarks),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useFaceAnalysis() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<AnalysisState>("loading");
  const [faceDetected, setFaceDetected] = useState(false);
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectLoopRef = useRef<number>(0);
  const latestLandmarksRef = useRef<NormalizedLandmark[] | null>(null);

  useEffect(() => {
    let active = true;
    let lastTs = 0;

    async function init() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
        });
        if (!active) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (active) setState("ready");

        function detectLoop(ts: number) {
          if (!active || !videoRef.current || !landmarkerRef.current) return;
          if (ts - lastTs < 100) { detectLoopRef.current = requestAnimationFrame(detectLoop); return; }
          lastTs = ts;
          const vid = videoRef.current;
          if (vid.readyState >= 2) {
            const result = landmarkerRef.current.detectForVideo(vid, ts);
            if (result.faceLandmarks && result.faceLandmarks.length > 0) {
              latestLandmarksRef.current = result.faceLandmarks[0];
              setFaceDetected(true);
            } else {
              latestLandmarksRef.current = null;
              setFaceDetected(false);
            }
          }
          detectLoopRef.current = requestAnimationFrame(detectLoop);
        }
        detectLoopRef.current = requestAnimationFrame(detectLoop);
      } catch (err: any) {
        if (!active) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Camera access was denied. Please allow camera access and try again.");
        } else {
          setError("Could not start the camera. " + (err.message || ""));
        }
        setState("error");
      }
    }

    init();

    return () => {
      active = false;
      cancelAnimationFrame(detectLoopRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      landmarkerRef.current?.close();
    };
  }, []);

  const scan = async (): Promise<void> => {
    if (!videoRef.current || !latestLandmarksRef.current) return;
    setState("scanning");
    // Brief pause so the scanning animation renders
    await new Promise(r => setTimeout(r, 1800));
    try {
      const result = analyzeFrame(videoRef.current, latestLandmarksRef.current);
      setAnalysis(result);
      setState("done");
    } catch {
      setState("ready");
    }
  };

  return { videoRef, state, faceDetected, analysis, error, scan };
}
