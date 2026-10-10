import { useRef, useState } from "react";
import { Loader2, Trash2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Curator-only inline uploader for a single tutorial step's demo clip. Handles
// client-side guard rails (mp4, ≤8 MB, 10–30 s), uploads the clip through the
// existing presigned-URL storage flow, best-effort captures a poster frame, and
// writes the resulting object paths back to the step via the curator API.
//
// Keep these limits aligned with the server (artifacts/api-server/src/routes/
// tutorials.ts) and the authoring guidance in docs/ARCHITECTURE.md.
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_SECONDS = 10;
const MAX_SECONDS = 30;

interface Props {
  tutorialId: string;
  stepIndex: number;
  /** Whether a curator clip is already attached to this step (enables Remove). */
  hasClip: boolean;
  onChanged: () => void;
}

// Upload a blob through the shared presigned-URL flow, returning its canonical
// object path (e.g. "/objects/uploads/<id>").
async function uploadBlob(blob: Blob, filename: string): Promise<string> {
  const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
    "/storage/uploads/request-url",
    { name: filename, size: blob.size, contentType: blob.type || "application/octet-stream" },
  );
  const put = await fetch(presigned.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": blob.type || "application/octet-stream" },
    body: blob,
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return presigned.objectPath;
}

// Read a video file's duration (seconds) from its metadata. Resolves NaN if the
// browser can't decode it — the caller then defers to the server's checks.
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(NaN);
    };
    video.src = url;
  });
}

// Best-effort grab of a representative frame as a JPEG poster. Returns null on
// any failure (e.g. Safari first-frame quirks) so upload can proceed without it.
function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      } catch {
        finish(null);
      }
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.8);
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    window.setTimeout(() => finish(null), 5000);
    video.src = url;
  });
}

export function TutorialStepVideoUploader({ tutorialId, stepIndex, hasClip, onChanged }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "Pick a video file", description: "Step clips must be an .mp4 video.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Clip is too large", description: "Keep it to 8 MB or smaller.", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const duration = await readDuration(file);
      if (Number.isFinite(duration) && (duration < MIN_SECONDS - 0.5 || duration > MAX_SECONDS + 0.5)) {
        toast({
          title: "Clip length out of range",
          description: `Clips should be ${MIN_SECONDS}–${MAX_SECONDS} seconds (this one is ${Math.round(duration)}s).`,
          variant: "destructive",
        });
        return;
      }

      const videoUrl = await uploadBlob(file, file.name || `step-${stepIndex + 1}.mp4`);

      let videoPoster: string | undefined;
      const posterBlob = await capturePoster(file);
      if (posterBlob) {
        try {
          videoPoster = await uploadBlob(posterBlob, `step-${stepIndex + 1}-poster.jpg`);
        } catch {
          videoPoster = undefined; // poster is optional — never block the clip
        }
      }

      await api.put(`/tutorials/${tutorialId}/steps/${stepIndex}/video`, { videoUrl, videoPoster });
      toast({ title: hasClip ? "Clip replaced" : "Clip added" });
      onChanged();
    } catch (err) {
      toast({ title: "Couldn't upload clip", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await api.del(`/tutorials/${tutorialId}/steps/${stepIndex}/video`);
      toast({ title: "Clip removed" });
      onChanged();
    } catch (err) {
      toast({ title: "Couldn't remove clip", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2">
      <Video className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary mr-auto">
        Curator
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/*"
        className="hidden"
        onChange={handleFile}
        disabled={busy || removing}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs"
        disabled={busy || removing}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {busy ? "Uploading…" : hasClip ? "Replace clip" : "Add clip"}
      </Button>
      {hasClip && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
          disabled={busy || removing}
          onClick={handleRemove}
        >
          {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Remove
        </Button>
      )}
    </div>
  );
}
