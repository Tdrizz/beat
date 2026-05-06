import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Download, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface Props {
  open: boolean;
  state: "idle" | "capturing" | "generating" | "done" | "error";
  imageUrl: string | null;
  error: string | null;
  lookName: string;
  intensity: number;
  onIntensityChange: (value: number) => void;
  onClose: () => void;
  onRetry: () => void;
}

function intensityLabel(v: number) {
  if (v <= 15) return "Barely there";
  if (v <= 35) return "Soft";
  if (v <= 60) return "Balanced";
  if (v <= 85) return "Bold";
  return "Full glam";
}

/**
 * Full-screen AI try-on viewer.
 *
 * Why full-screen: the generated photo is the entire payoff of the app —
 * making the user pinch/zoom inside a small modal undersells it. Filling the
 * viewport also avoids the awkward "card on a black sheet" double-frame look.
 */
export function AITryOnModal({
  open, state, imageUrl, error, lookName,
  intensity, onIntensityChange, onClose, onRetry,
}: Props) {
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `beat-ai-${lookName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isBusy = state === "capturing" || state === "generating";
  const hasImage = state !== "capturing" && state !== "generating" && state !== "error" && !!imageUrl;

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
                <p className="text-[11px] text-white/60 mt-0.5 truncate">Photoreal — {lookName}</p>
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
                key={imageUrl}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={imageUrl!}
                alt={`AI rendering of you wearing ${lookName}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            )}

            {state === "error" && (
              <div className="flex flex-col items-center text-center px-6 text-white/90 max-w-md">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="font-serif text-xl mb-2">Couldn't generate</p>
                <p className="text-sm text-white/60">{error}</p>
              </div>
            )}
          </div>

          {/* Bottom controls — intensity slider + actions */}
          <div className="relative z-20 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/85 to-black/40 text-white space-y-4">

            {/* Intensity slider — hidden while error so it doesn't feel like
                fiddling with it caused the failure. */}
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

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasImage && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={onRetry}
                    disabled={isBusy}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-generate
                  </Button>
                  <div className="flex-1" />
                  <Button
                    className="rounded-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleDownload}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save Photo
                  </Button>
                </>
              )}
              {state === "error" && (
                <>
                  <div className="flex-1" />
                  <Button
                    className="rounded-full gap-1.5 bg-primary text-primary-foreground"
                    onClick={onRetry}
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
