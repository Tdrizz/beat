import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Download, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  state: "idle" | "capturing" | "generating" | "done" | "error";
  imageUrl: string | null;
  error: string | null;
  lookName: string;
  onClose: () => void;
  onRetry: () => void;
}

export function AITryOnModal({ open, state, imageUrl, error, lookName, onClose, onRetry }: Props) {
  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `beat-ai-${lookName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-border bg-gradient-to-br from-primary/10 to-accent/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold leading-none">AI Try-On</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Photoreal — {lookName}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="aspect-square w-full bg-zinc-950 relative flex items-center justify-center">
              {(state === "capturing" || state === "generating") && (
                <div className="flex flex-col items-center text-white/90">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="font-serif text-lg">
                    {state === "capturing" ? "Capturing frame…" : "Painting your look…"}
                  </p>
                  <p className="text-xs text-white/50 mt-1.5">
                    {state === "generating" ? "This usually takes 5–15 seconds" : ""}
                  </p>
                </div>
              )}

              {state === "done" && imageUrl && (
                <img
                  src={imageUrl}
                  alt={`AI rendering of you wearing ${lookName}`}
                  className="w-full h-full object-cover"
                />
              )}

              {state === "error" && (
                <div className="flex flex-col items-center text-center px-6 text-white/90">
                  <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                  <p className="font-serif text-base mb-1">Couldn't generate</p>
                  <p className="text-xs text-white/60 max-w-xs">{error}</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-4 flex items-center gap-2">
              {state === "done" && (
                <>
                  <Button variant="outline" className="rounded-full gap-1.5" onClick={onRetry}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-generate
                  </Button>
                  <div className="flex-1" />
                  <Button className="rounded-full gap-1.5" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5" />
                    Save Photo
                  </Button>
                </>
              )}
              {state === "error" && (
                <>
                  <div className="flex-1" />
                  <Button className="rounded-full gap-1.5" onClick={onRetry}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try again
                  </Button>
                </>
              )}
              {(state === "capturing" || state === "generating") && (
                <p className="text-xs text-muted-foreground">
                  Hold still and look at the camera while we render.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
