import { useCallback, useRef, useState } from "react";
import type { Look } from "../lib/looks";
import type { ArchetypeId } from "../lib/archetypes";
import type { WigStyle, WigColor } from "../lib/wigs";

interface RunArgs {
  video: HTMLVideoElement | null;
  look: Look;
  /** Optional label for this capture, e.g. "Front", "Left ¾". */
  angleLabel?: string;
  /** Optional beauty archetype from the on-device quiz. When present,
   *  the server biases the finish (smokier / glowier / sharper / etc.)
   *  toward the archetype while preserving the look's signature shades. */
  archetype?: ArchetypeId | null;
  /** Optional wig swap. When provided, the AI render also replaces the
   *  subject's hair with the chosen style + colour. */
  wig?: { style: WigStyle; color: WigColor } | null;
}

export interface AngleResult {
  id: string;
  imageUrl: string;
  mimeType: string;
  angleLabel: string;
  createdAt: number;
}

type SkinCategory = "Fair" | "Light" | "Medium Light" | "Medium" | "Tan" | "Deep";
type SkinUndertone = "Warm" | "Cool" | "Neutral";

function canvasToBase64(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode camera frame"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read encoded camera frame"));
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Failed to encode camera frame"));
          return;
        }
        const comma = reader.result.indexOf(",");
        if (comma < 0) {
          reject(new Error("Failed to encode camera frame"));
          return;
        }
        resolve(reader.result.slice(comma + 1));
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.86);
  });
}

/**
 * Sample average skin colour from the central face region of an already-
 * captured frame. We avoid MediaPipe here to keep the try-on flow self-
 * contained; instead we sample three patches likely to land on skin (cheeks
 * and bridge of nose), then filter out non-skin pixels by RGB heuristics.
 *
 * Returns `null` if the captured frame is too small / too dark / not
 * skin-shaped enough to trust.
 */
function sampleSkinTone(
  ctx: CanvasRenderingContext2D, w: number, h: number,
): { hex: string; category: SkinCategory; undertone: SkinUndertone } | null {
  if (w < 160 || h < 160) return null;
  const patches = [
    { cx: w * 0.35, cy: h * 0.55 },
    { cx: w * 0.65, cy: h * 0.55 },
    { cx: w * 0.50, cy: h * 0.45 },
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
      if (pr < 30 && pg < 30 && pb < 30) continue;
      if (pr > 245 && pg > 245 && pb > 245) continue;
      if (pr <= pb) continue;
      r += pr; g += pg; b += pb; n++;
    }
  }
  if (n < 100) return null;
  const ar = Math.round(r / n), ag = Math.round(g / n), ab = Math.round(b / n);
  const hex = "#" + [ar, ag, ab].map(v => v.toString(16).padStart(2, "0")).join("");
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
 * AI try-on hook with multi-angle gallery. Each call to `run()` captures
 * the current camera frame, sends it to gemini-2.5-flash-image, and
 * appends the generated image to a gallery the user can swipe through.
 *
 * This is how we deliver the "see the look from every angle" UX without
 * doing real-time video diffusion (which is neither fast nor cheap):
  * the user turns their head, explicitly taps "capture this angle", and
  * the gallery grows. Skin-tone is re-sampled each capture so lighting
  * changes are still respected.
 */
export function useAITryOn() {
  const [state, setState] = useState<"idle" | "capturing" | "generating" | "done" | "error">("idle");
  const [gallery, setGallery] = useState<AngleResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setState("idle");
    setGallery([]);
    setCurrentIndex(0);
    setError(null);
  }, []);

  // In-flight guard: prevents double-clicks (or stale React closures) from
  // launching overlapping requests that would race on setState.
  const inFlight = useRef(false);

  const run = useCallback(async ({ video, look, angleLabel, archetype, wig }: RunArgs) => {
    if (inFlight.current) return;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera not ready yet — try again in a moment.");
      setState("error");
      return;
    }

    inFlight.current = true;
    setState("capturing");
    setError(null);

    try {
      // 1. Capture the current camera frame, mirrored to match the on-screen preview.
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const scale = Math.min(1, 1024 / Math.max(sourceWidth, sourceHeight));
      const w = Math.max(1, Math.round(sourceWidth * scale));
      const h = Math.max(1, Math.round(sourceHeight * scale));
      const snap = document.createElement("canvas");
      snap.width = w;
      snap.height = h;
      const ctx = snap.getContext("2d");
      if (!ctx) throw new Error("Could not create capture canvas");
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);

      const [imageBase64, skinTone] = await Promise.all([
        canvasToBase64(snap),
        Promise.resolve(sampleSkinTone(ctx, w, h)),
      ]);
      if (!imageBase64) throw new Error("Failed to encode frame");

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
          skinTone,
          archetype: archetype ?? null,
          wig: wig
            ? {
                styleId: wig.style.id,
                styleName: wig.style.name,
                length: wig.style.length,
                texture: wig.style.texture,
                description: wig.style.description,
                colorName: wig.color.name,
                rootHex: wig.color.rootHex,
                tipHex: wig.color.tipHex,
              }
            : null,
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
      // Append + jump to it. Use functional setState so we always pick up
      // the latest gallery, even if multiple captures land near the same
      // tick — and so the default "Angle N" label sequences correctly
      // (the closure-captured `gallery` would always be stale here).
      setGallery((g) => {
        const next: AngleResult = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          imageUrl: `data:${data.mimeType};base64,${data.imageBase64}`,
          mimeType: data.mimeType,
          angleLabel: angleLabel ?? `Angle ${g.length + 1}`,
          createdAt: Date.now(),
        };
        // Cap the gallery so heavy users don't blow up browser memory with
        // accumulating ~1MB base64 data URLs. 12 angles is more than enough
        // and we always preserve the latest captures.
        const MAX_GALLERY = 12;
        const trimmed = g.length >= MAX_GALLERY ? g.slice(g.length - MAX_GALLERY + 1) : g;
        const updated = [...trimmed, next];
        setCurrentIndex(updated.length - 1);
        return updated;
      });
      setState("done");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setState("error");
    } finally {
      inFlight.current = false;
    }
    // We intentionally don't list `gallery` in deps — we read it via the
    // functional setter above, and we want `run`'s identity stable so the
    // caller effects aren't re-triggered on every capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The currently-displayed angle (driven by `currentIndex`).
  const current: AngleResult | null = gallery[currentIndex] ?? null;
  // The most recently-generated angle, regardless of which one the user is
  // currently swiped to. Callers like the FAB / top-bar thumbnail want this
  // (so navigating to an older angle doesn't make the indicator regress).
  const lastGenerated: AngleResult | null =
    gallery.length > 0 ? gallery[gallery.length - 1] : null;

  return {
    state,
    error,
    run,
    reset,
    gallery,
    currentIndex,
    setCurrentIndex,
    current,
    lastGenerated,
  };
}
