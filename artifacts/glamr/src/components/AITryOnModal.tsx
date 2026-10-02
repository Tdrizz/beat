import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Download, Sparkles, AlertCircle, RefreshCw, Send, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveWigTryOn } from "../lib/saveWigTryOn";
import type { TryOnResult } from "../hooks/useAITryOn";

/** When a wig is active in the try-on, this metadata lets the modal offer a
 *  "Save to My Wigs" action that uploads the render + records the pairing. */
export interface WigSaveContext {
  styleId: string;
  styleName: string;
  colorId: string;
  colorName: string;
}

interface Props {
  open: boolean;
  state: "idle" | "capturing" | "generating" | "done" | "error";
  result: TryOnResult | null;
  error: string | null;
  lookName: string;
  /** Optional look id, used so a "Post to feed" deep-link can prefill
   *  the catalogue dropdown on the upload composer. */
  lookId?: string;
  onClose: () => void;
  onRegenerate: () => void;
  /** Present when a wig is active — enables the "Save to My Wigs" action. */
  wigSave?: WigSaveContext | null;
}

/**
 * Full-screen AI try-on viewer showing one current result.
 *
 * Why full-screen: the generated photo is the entire payoff of the app —
 * making the user pinch/zoom inside a small modal undersells it.
 *
 * Regenerating replaces the current result rather than retaining earlier
 * renders. Skin tone is re-sampled for each explicit capture.
 */
export function AITryOnModal({
  open, state, result,
  error, lookName, lookId,
  onClose, onRegenerate, wigSave,
}: Props) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  // Hand the current generated frame off to the Upload composer via
  // sessionStorage. We can't pass the dataURL through a query string
  // (URLs would be 1MB+) and we don't want to round-trip through the
  // server twice. Upload reads the key on mount and uploads the blob.
  const handlePostToFeed = () => {
    if (!result) return;
    try {
      window.sessionStorage.setItem(
        "beat:upload:prefill",
        JSON.stringify({
          dataUrl: result.imageUrl,
          caption: `${lookName} · AI try-on`,
          lookId: lookId ?? "",
        }),
      );
      navigate("/upload");
    } catch {
      // sessionStorage quota / private mode — just bail; the user can
      // still save the image and re-upload manually.
    }
  };

  const isBusy = state === "capturing" || state === "generating";
  const hasImage = !!result && !isBusy && state !== "error";

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `beat-ai-${lookName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveWig = async () => {
    if (!result?.imageUrl || !wigSave || savingId) return;
    setSavingId(result.id);
    try {
      await saveWigTryOn({
        dataUrl: result.imageUrl,
        wigId: wigSave.styleId,
        wigName: wigSave.styleName,
        colorId: wigSave.colorId,
        colorName: wigSave.colorName,
      });
      setSavedId(result.id);
      toast({
        title: "Saved to My Wigs",
        description: `${wigSave.styleName} · ${wigSave.colorName}`,
      });
    } catch (err) {
      toast({
        title: "Couldn't save",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const isSaved = result ? savedId === result.id : false;
  const isSaving = result ? savingId === result.id : false;

  // Escape closes the full-screen preview.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
                  {result ? `Preview · ${lookName}` : `Photoreal — ${lookName}`}
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
                key={result!.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={result!.imageUrl}
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

          {/* Bottom actions */}
          <div className="relative z-20 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/85 to-black/40 text-white">
            <div className="flex flex-wrap items-center gap-2">
              {hasImage && (
                <Button
                  variant="outline"
                  className="rounded-full gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
              )}
              {hasImage && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={handleDownload}
                    disabled={isBusy}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save
                  </Button>
                  {wigSave && (
                    <Button
                      variant="outline"
                      className="rounded-full gap-1.5 border-pink-300/60 bg-pink-400/20 text-white hover:bg-pink-400/30 hover:text-white"
                      onClick={handleSaveWig}
                      disabled={isBusy || isSaving || isSaved}
                      title="Save this render to your My Wigs gallery"
                    >
                      {isSaving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
                      ) : isSaved ? (
                        <><Check className="w-3.5 h-3.5" />Saved</>
                      ) : (
                        <><Heart className="w-3.5 h-3.5" />My Wigs</>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="rounded-full gap-1.5 border-primary/60 bg-primary/20 text-white hover:bg-primary/30 hover:text-white"
                    onClick={handlePostToFeed}
                    disabled={isBusy}
                    title="Open the upload composer with this image prefilled"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post to feed
                  </Button>
                </>
              )}
              {state === "error" && (
                <>
                  <div className="flex-1" />
                  <Button
                    className="rounded-full gap-1.5 bg-primary text-primary-foreground"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try again
                  </Button>
                </>
              )}
              {isBusy && (
                <p className="text-xs text-white/60 text-center w-full">
                  Hold still and look at the camera while we render one preview.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
