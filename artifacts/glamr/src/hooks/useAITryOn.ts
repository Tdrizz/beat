import { useCallback, useRef, useState } from "react";
import type { Look } from "../lib/looks";

interface RunArgs {
  video: HTMLVideoElement | null;
  look: Look;
  /** 0–100 — controls how strongly the model paints the look. Default 60. */
  intensity?: number;
}

interface Result {
  imageUrl: string;
  mimeType: string;
}

/**
 * Sample average skin colour from the central face region of an already-
 * captured frame. We avoid MediaPipe here to keep the try-on flow self-
 * contained; instead we sample two patches likely to land on cheek skin
 * (left and right of centre, slightly below the vertical midpoint), then
 * filter out non-skin-ish pixels by HSL bounds before averaging.
 *
 * Returns `null` if the captured frame is too dark / too small / not
 * skin-shaped enough to trust.
 */
type SkinCategory = "Fair" | "Light" | "Medium Light" | "Medium" | "Tan" | "Deep";
type SkinUndertone = "Warm" | "Cool" | "Neutral";

function sampleSkinTone(
  ctx: CanvasRenderingContext2D, w: number, h: number,
): { hex: string; category: SkinCategory; undertone: SkinUndertone } | null {
  // Guard against tiny / unusable frames where sampling would just be noise.
  if (w < 160 || h < 160) return null;
  const patches = [
    { cx: w * 0.35, cy: h * 0.55 }, // left cheek-ish
    { cx: w * 0.65, cy: h * 0.55 }, // right cheek-ish
    { cx: w * 0.50, cy: h * 0.45 }, // bridge of nose / mid-face
  ];
  const radius = Math.max(8, Math.floor(Math.min(w, h) * 0.04));
  let r = 0, g = 0, b = 0, n = 0;
  for (const p of patches) {
    const x = Math.max(0, Math.floor(p.cx - radius));
    const y = Math.max(0, Math.floor(p.cy - radius));
    const size = radius * 2;
    let img: ImageData;
    try { img = ctx.getImageData(x, y, size, size); } catch { return null; }
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const pr = d[i], pg = d[i + 1], pb = d[i + 2];
      // crude skin-ish gate: red dominant, not pure black/white, not blue
      if (pr < 30 && pg < 30 && pb < 30) continue;
      if (pr > 245 && pg > 245 && pb > 245) continue;
      if (pr <= pb) continue;
      r += pr; g += pg; b += pb; n++;
    }
  }
  if (n < 100) return null;
  const ar = Math.round(r / n), ag = Math.round(g / n), ab = Math.round(b / n);
  const hex = "#" + [ar, ag, ab].map(v => v.toString(16).padStart(2, "0")).join("");
  // crude lightness for category
  const max = Math.max(ar, ag, ab), min = Math.min(ar, ag, ab);
  const l = ((max + min) / 2) / 255 * 100;
  let category: SkinCategory = "Medium";
  if (l > 73) category = "Fair";
  else if (l > 62) category = "Light";
  else if (l > 52) category = "Medium Light";
  else if (l > 42) category = "Medium";
  else if (l > 30) category = "Tan";
  else category = "Deep";
  const warmBias = ar - ab;
  const undertone: SkinUndertone = warmBias > 25 ? "Warm" : warmBias < -10 ? "Cool" : "Neutral";
  return { hex, category, undertone };
}

/**
 * Captures the current camera frame, sends it to the AI try-on endpoint along
 * with a structured description of the chosen look, and returns a photoreal
 * generated image of the user wearing the makeup.
 *
 * Uses gemini-2.5-flash-image (nano banana) on the backend — billed via
 * Replit AI integrations, no API key required from the user.
 */
export function useAITryOn() {
  const [state, setState] = useState<"idle" | "capturing" | "generating" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  // In-flight guard: prevents double-clicks (or stale React closures) from
  // launching overlapping requests that would race on setState.
  const inFlight = useRef(false);

  const run = useCallback(async ({ video, look, intensity = 60 }: RunArgs) => {
    if (inFlight.current) return;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera not ready yet — try again in a moment.");
      setState("error");
      return;
    }

    inFlight.current = true;
    setState("capturing");
    setError(null);
    setResult(null);

    try {
      // 1. Capture the current camera frame, mirrored to match the on-screen preview.
      const w = video.videoWidth;
      const h = video.videoHeight;
      const snap = document.createElement("canvas");
      snap.width = w;
      snap.height = h;
      const ctx = snap.getContext("2d");
      if (!ctx) throw new Error("Could not create capture canvas");
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = snap.toDataURL("image/jpeg", 0.9);
      const imageBase64 = dataUrl.split(",")[1];
      if (!imageBase64) throw new Error("Failed to encode frame");

      // 1b. Sample skin tone from the captured frame so the model can
      //     adapt foundation match, blush undertone, and lipstick translucency
      //     to the actual user instead of painting a generic shade.
      const skinTone = sampleSkinTone(ctx, w, h);

      // 2. Build the look payload — only steps that have a real shade.
      const stepKeys = ["base", "brows", "eyes", "cheeks", "lips"] as const;
      const steps = stepKeys
        .map((k) => {
          const s = look.steps[k];
          if (!s.color || s.color === "transparent") return null;
          return {
            step: k,
            name: s.colorName ?? s.name,
            color: s.color,
            instruction: s.instruction,
          };
        })
        .filter(Boolean) as Array<{ step: string; name: string; color: string; instruction?: string }>;

      // 3. Call the backend.
      setState("generating");
      const resp = await fetch("/api/ai-tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
          lookName: look.name,
          lookDescription: look.description,
          intensity,
          steps,
          skinTone,
        }),
      });

      if (!resp.ok) {
        let message = `Request failed (${resp.status})`;
        try {
          const data = await resp.json();
          if (typeof data?.error === "string") message = data.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      const data = (await resp.json()) as { imageBase64: string; mimeType: string };
      setResult({
        imageUrl: `data:${data.mimeType};base64,${data.imageBase64}`,
        mimeType: data.mimeType,
      });
      setState("done");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setState("error");
    } finally {
      inFlight.current = false;
    }
  }, []);

  return { state, result, error, run, reset };
}
