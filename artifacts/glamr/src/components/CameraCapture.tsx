import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { Camera, RefreshCw, RotateCcw, Loader2, X } from "lucide-react";

interface Props {
  /** Called once the user accepts a captured frame. The Blob is a JPEG. */
  onCapture: (blob: Blob, dataUrl: string) => void;
  /** Optional cancel — when provided, an X close button is rendered. */
  onCancel?: () => void;
}

/**
 * In-app camera capture flow used by the Upload composer. Steps:
 *   1) Live preview via `useCamera` (user-facing by default; can flip).
 *   2) "Capture" draws the current frame to an offscreen canvas →
 *      previews the still so the user can retake.
 *   3) "Use this photo" hands the JPEG blob + dataURL back to the parent
 *      so it can run through the standard presigned-PUT pipeline. We
 *      keep this component dumb about uploading so the parent stays the
 *      single source of truth for `imageUrl` / `objectPath`.
 */
export function CameraCapture({ onCapture, onCancel }: Props) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const { videoRef, isReady, error } = useCamera({ facingMode });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Mirror the front-facing preview only — selfies feel right when
  // mirrored, but rear-camera shots should not be flipped.
  const mirror = facingMode === "user";

  async function snap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isReady) return;
    setBusy(true);
    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");
      // Reset any transform left from a previous snap — translate/scale
      // is cumulative on the same context, so without this the canvas
      // would double-flip on the second capture and so on.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Mirror selfies on capture so the saved image matches what the
      // user sees in the preview (otherwise text/letters look reversed).
      if (mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to encode photo"))),
          "image/jpeg",
          0.92,
        );
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreview({ blob, dataUrl });
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
        <Camera className="w-8 h-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">{error}</p>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>Back</Button>
        )}
      </div>
    );
  }

  if (preview) {
    return (
      <div className="relative w-full h-full bg-black">
        <img src={preview.dataUrl} alt="Captured" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setPreview(null)}
          >
            <RotateCcw className="w-4 h-4" /> Retake
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => onCapture(preview.blob, preview.dataUrl)}
          >
            Use this photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover ${mirror ? "scale-x-[-1]" : ""}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {onCancel && (
        <button
          onClick={onCancel}
          aria-label="Close camera"
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-white hover:bg-white/10"
          onClick={() => setFacingMode((f) => (f === "user" ? "environment" : "user"))}
          aria-label="Flip camera"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
        <button
          onClick={snap}
          disabled={!isReady || busy}
          aria-label="Take photo"
          className="w-16 h-16 rounded-full bg-white border-4 border-white/30 ring-2 ring-white/50 disabled:opacity-50 active:scale-95 transition-transform"
        />
        <div className="w-10" aria-hidden />
      </div>
    </div>
  );
}
