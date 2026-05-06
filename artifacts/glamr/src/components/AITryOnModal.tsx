import { useEffect, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Download, Sparkles, AlertCircle, RefreshCw, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { AngleResult } from "../hooks/useAITryOn";

interface Props {
  open: boolean;
  state: "idle" | "capturing" | "generating" | "done" | "error";
  gallery: AngleResult[];
  currentIndex: number;
  onSelectIndex: (i: number) => void;
  error: string | null;
  lookName: string;
  intensity: number;
  onIntensityChange: (value: number) => void;
  onClose: () => void;
  /** Capture a new angle — TryOn passes the angle label through to `run()`. */
  onCaptureAngle: (angleLabel: string) => void;
  /** Live camera ref so the modal can show a small PiP preview to help
   *  the user frame their next angle without dismissing the modal. */
  videoRef: RefObject<HTMLVideoElement | null>;
}

function intensityLabel(v: number) {
  if (v <= 15) return "Barely there";
  if (v <= 35) return "Soft";
  if (v <= 60) return "Balanced";
  if (v <= 85) return "Bold";
  return "Full glam";
}

// Order chosen so a new user naturally rotates head left → centre → right
// → tilts up → tilts down. We cycle through the un-captured ones first.
const ANGLE_PROMPTS = [
  "Front",
  "Slight left",
  "Slight right",
  "Chin up",
  "Chin down",
] as const;

/**
 * Full-screen AI try-on viewer with a multi-angle gallery.
 *
 * Why full-screen: the generated photo is the entire payoff of the app —
 * making the user pinch/zoom inside a small modal undersells it.
 *
 * Why a gallery (not realtime video): each Gemini render takes ~5–15s and
 * costs money, so we let the user manually capture multiple angles and
 * swipe through them. Skin-tone is re-sampled per capture so changing
 * lighting between angles is still respected.
 */
export function AITryOnModal({
  open, state, gallery, currentIndex, onSelectIndex,
  error, lookName, intensity, onIntensityChange,
  onClose, onCaptureAngle, videoRef,
}: Props) {
  const isBusy = state === "capturing" || state === "generating";
  const current = gallery[currentIndex] ?? null;
  const hasImage = !!current && !isBusy && state !== "error";

  // Suggest the next angle the user hasn't captured yet, falling back to
  // a free-form "New angle" once they've done all five canonical ones.
  const usedLabels = new Set(gallery.map((g) => g.angleLabel));
  const nextSuggested =
    ANGLE_PROMPTS.find((p) => !usedLabels.has(p)) ??
    `Angle ${gallery.length + 1}`;

  // Keep PiP camera muted/playing whenever the modal is open. We share the
  // same MediaStream the underlying TryOn page already started, so this is
  // essentially free — we just clone the srcObject onto a second video tag.
  // We poll briefly so that if the parent stream is replaced (camera
  // restarts, permission re-granted) the PiP picks it up without needing
  // the user to close & reopen the modal.
  const [pipNode, setPipNode] = useState<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!open || !pipNode) return;
    const sync = () => {
      const stream = videoRef.current?.srcObject ?? null;
      if (stream && pipNode.srcObject !== stream) {
        pipNode.srcObject = stream;
        pipNode.play().catch(() => { /* autoplay can reject; harmless */ });
      }
    };
    sync();
    const id = window.setInterval(sync, 1000);
    return () => window.clearInterval(id);
  }, [open, pipNode, videoRef]);

  const handleDownload = () => {
    if (!current?.imageUrl) return;
    const a = document.createElement("a");
    a.href = current.imageUrl;
    a.download = `beat-ai-${lookName.toLowerCase().replace(/\s+/g, "-")}-${current.angleLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const goPrev = () => onSelectIndex(Math.max(0, currentIndex - 1));
  const goNext = () => onSelectIndex(Math.min(gallery.length - 1, currentIndex + 1));

  // Keyboard nav for desktop users browsing angles.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIndex, gallery.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top bar — translucent over image */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/25 flex items-center justify-center shrink-0 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base font-bold leading-none text-white truncate">AI Try-On</h3>
                <p className="text-[11px] text-white/60 mt-0.5 truncate">
                  {current ? `${current.angleLabel} · ${lookName}` : `Photoreal — ${lookName}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image / state body — fills remaining space */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center bg-zinc-950">
            {isBusy && (
              <motion.div
                key="busy"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center text-white/90 px-6 text-center"
              >
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-5" />
                <p className="font-serif text-2xl">
                  {state === "capturing" ? "Capturing frame…" : "Painting your look…"}
                </p>
                <p className="text-sm text-white/50 mt-2">
                  {state === "generating" ? "This usually takes 5–15 seconds" : ""}
                </p>
              </motion.div>
            )}

            {hasImage && (
              <motion.img
                key={current.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={current.imageUrl}
                alt={`AI rendering of you wearing ${lookName} — ${current.angleLabel}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            )}

            {/* Prev/Next chevrons (only when there are multiple angles) */}
            {hasImage && gallery.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous angle"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex === gallery.length - 1}
                  aria-label="Next angle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Live camera PiP — bottom left, mirrored to match the user's
                expected reflection. Helps them frame the next angle without
                closing the modal. */}
            {!isBusy && (
              <div className="absolute left-3 bottom-3 z-10 w-28 sm:w-32 rounded-2xl overflow-hidden ring-2 ring-white/25 shadow-2xl bg-black">
                <div className="relative aspect-[3/4]">
                  <video
                    ref={(el) => setPipNode(el)}
                    muted
                    playsInline
                    autoPlay
                    style={{ transform: "scaleX(-1)" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full bg-black/65 text-[9px] font-bold text-white tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white/85 font-semibold text-center bg-black/45 backdrop-blur-sm rounded-md py-0.5">
                    {nextSuggested}
                  </div>
                </div>
              </div>
            )}

            {state === "error" && (
              <div className="flex flex-col items-center text-center px-6 text-white/90 max-w-md">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="font-serif text-xl mb-2">Couldn't generate</p>
                <p className="text-sm text-white/60">{error}</p>
              </div>
            )}
          </div>

          {/* Thumbnail rail */}
          {gallery.length > 0 && (
            <div className="relative z-20 px-3 pt-2 bg-black/50 backdrop-blur-md">
              <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory">
                {gallery.map((g, i) => (
                  <button
                    key={g.id}
                    onClick={() => onSelectIndex(i)}
                    className={`relative shrink-0 snap-start w-14 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      i === currentIndex ? "border-primary scale-105" : "border-white/15 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Show ${g.angleLabel}`}
                  >
                    <img src={g.imageUrl} alt={g.angleLabel} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-semibold py-0.5 truncate">
                      {g.angleLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom controls — intensity slider + actions */}
          <div className="relative z-20 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/85 to-black/40 text-white space-y-4">

            {state !== "error" && (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-xs uppercase tracking-[0.18em] font-bold text-white/60">
                    Intensity
                  </label>
                  <span className="text-xs font-semibold text-primary">
                    {intensityLabel(intensity)} · {intensity}%
                  </span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={(v) => onIntensityChange(v[0] ?? 60)}
                  min={0}
                  max={100}
                  step={5}
                  disabled={isBusy}
                  aria-label="Makeup intensity"
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5 px-0.5">
                  <span>Barely there</span>
                  <span>Balanced</span>
                  <span>Full glam</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isBusy && state !== "error" && (
                <Button
                  className="rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => onCaptureAngle(nextSuggested)}
                  disabled={isBusy}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture {nextSuggested}
                </Button>
              )}
              {hasImage && (
                <Button
                  variant="outline"
                  className="rounded-full gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={handleDownload}
                  disabled={isBusy}
                >
                  <Download className="w-3.5 h-3.5" />
                  Save
                </Button>
              )}
              {state === "error" && (
                <>
                  <div className="flex-1" />
                  <Button
                    className="rounded-full gap-1.5 bg-primary text-primary-foreground"
                    onClick={() => onCaptureAngle(nextSuggested)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try again
                  </Button>
                </>
              )}
              {isBusy && (
                <p className="text-xs text-white/60 text-center w-full">
                  Hold still and look at the camera while we render.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
