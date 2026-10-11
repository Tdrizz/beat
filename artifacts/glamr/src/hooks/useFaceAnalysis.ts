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

  // ── Foundation match: sample the NECK, not the face ─────────────────
  // The face often carries makeup, redness, blush, or sun exposure that
  // throws off true skin tone. Foundation should match the neck so the
  // jawline transition is invisible. We synthesise neck sample points
  // by extrapolating ~25–45% of the face length downward from the chin
  // and along the lower jawline. Falls back to cheek samples if the
  // neck pixels are obviously out-of-frame or background-coloured.
  const chin = landmarks[LM.CHIN];
  const forehead = landmarks[LM.FOREHEAD];
  const leftJaw = landmarks[LM.LEFT_JAW];
  const rightJaw = landmarks[LM.RIGHT_JAW];
  const faceLen = Math.abs(chin.y - forehead.y);

  // Three points down the centre of the neck + two along the upper neck/jaw.
  // Use a minimal {x, y} shape — samplePixels only reads x/y. We also drop
  // any point that would land in the bottom 5% of the frame (likely off-frame
  // background, not skin) so we don't sample garbage and pass the lum check.
  const rawNeckPoints: { x: number; y: number }[] = [
    { x: chin.x,                       y: chin.y    + faceLen * 0.18 },
    { x: chin.x,                       y: chin.y    + faceLen * 0.30 },
    { x: (chin.x + leftJaw.x)  / 2,    y: leftJaw.y  + faceLen * 0.18 },
    { x: (chin.x + rightJaw.x) / 2,    y: rightJaw.y + faceLen * 0.18 },
  ];
  const neckPoints = rawNeckPoints.filter(
    p => p.y > 0 && p.y < 0.95 && p.x > 0.02 && p.x < 0.98,
  );

  const neckSamples = neckPoints.map(p => samplePixels(ctx, p as NormalizedLandmark, w, h, 9));

  // Cheek fallbacks (used if neck is occluded by clothing / off-frame)
  const cheekSamples = [
    samplePixels(ctx, landmarks[LM.LEFT_CHEEK],   w, h, 10),
    samplePixels(ctx, landmarks[LM.RIGHT_CHEEK],  w, h, 10),
    samplePixels(ctx, landmarks[LM.LEFT_CHEEK_B], w, h, 8),
    samplePixels(ctx, landmarks[LM.RIGHT_CHEEK_B], w, h, 8),
  ];

  // Reject neck samples that look like clothing or shadow (very low
  // saturation + extreme luminance, or wildly different from cheeks).
  const cheekAvgL = cheekSamples.reduce((s, [r, g, b]) => s + (r + g + b) / 3, 0) / cheekSamples.length;
  const validNeck = neckSamples.filter(([r, g, b]) => {
    const lum = (r + g + b) / 3;
    if (lum < 30 || lum > 240) return false;          // pure shadow / blowout
    if (Math.abs(lum - cheekAvgL) > 70) return false; // likely fabric / background
    return true;
  });

  const samples = validNeck.length >= 2 ? validNeck : cheekSamples;
  const avgR = Math.round(samples.reduce((s, [r]) => s + r, 0) / samples.length);
  const avgG = Math.round(samples.reduce((s, [, g]) => s + g, 0) / samples.length);
  const avgB = Math.round(samples.reduce((s, [, , b]) => s + b, 0) / samples.length);

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
    let activeStream: MediaStream | null = null;

    function describeCameraError(err: any): string {
      const name = err?.name || "";
      if (!navigator.mediaDevices?.getUserMedia) {
        return "Your browser doesn't support camera access. Try Chrome, Safari, or Firefox.";
      }
      if (window.isSecureContext === false) {
        return "Camera requires a secure (HTTPS) connection.";
      }
      switch (name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          return "Camera access was denied. Please allow camera access in your browser and reload.";
        case "NotFoundError":
        case "DevicesNotFoundError":
          return "No camera was found on this device.";
        case "NotReadableError":
        case "TrackStartError":
          return "Your camera is being used by another app. Close it and try again.";
        case "OverconstrainedError":
          return "No camera matches the requested resolution.";
        case "AbortError":
          return "Camera initialization was interrupted. Please retry.";
        default:
          return "Could not start the camera. " + (err?.message || "");
      }
    }

    async function init() {
      try {
        // Pinned to the installed package version: "@latest" would run
        // whatever was published most recently, with camera access.
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        if (!active) return;
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

        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("getUserMedia unsupported"), { name: "NotSupportedError" });
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (err) {
            console.warn("video.play() rejected", err);
          }
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
        setError(describeCameraError(err));
        setState("error");
      }
    }

    init();

    return () => {
      active = false;
      cancelAnimationFrame(detectLoopRef.current);
      const v = videoRef.current;
      if (v?.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        v.srcObject = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
        activeStream = null;
      }
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
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
