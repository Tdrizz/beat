import { useCallback, useRef, useState } from "react";
import type { Look } from "../lib/looks";

interface RunArgs {
  video: HTMLVideoElement | null;
  look: Look;
}

interface Result {
  imageUrl: string;
  mimeType: string;
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

  const run = useCallback(async ({ video, look }: RunArgs) => {
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
          steps,
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
