import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "@workspace/object-storage-web";
import { TopNav } from "@/components/TopNav";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Post } from "@/lib/api";
import { ALL_LOOKS_FLAT, SEASONS, SEASON_LABELS, type Season } from "@/lib/looks";
import { CameraCapture } from "@/components/CameraCapture";
import { Camera, Loader2, ImagePlus, X } from "lucide-react";

// sessionStorage key used by AITryOnModal to deep-link a generated image
// straight into the upload composer. We use sessionStorage (not query
// params) because the image is a base64 dataURL — too big for a URL.
const PREFILL_KEY = "beat:upload:prefill";
interface UploadPrefill {
  dataUrl: string;
  caption?: string;
  lookId?: string;
}

function UploadInner() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [objectPath, setObjectPath] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [lookId, setLookId] = useState<string>("");
  const [season, setSeason] = useState<Season | "">("");
  const [prefilling, setPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  // "camera" opens the in-app capture flow; "uploading" is the brief
  // window between the user accepting a snapped frame and our presigned
  // PUT finishing. We keep these as a single state machine so the UI can
  // never show the live preview and "Posting…" simultaneously.
  const [mode, setMode] = useState<"idle" | "camera" | "uploading">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // On mount: if AITryOnModal stashed a prefill payload, upload it through
  // the same presigned-URL pipeline the manual uploader uses. We clear the
  // payload first so a refresh doesn't re-trigger the upload.
  useEffect(() => {
    let cancelled = false;
    const raw = window.sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return;
    window.sessionStorage.removeItem(PREFILL_KEY);
    let payload: UploadPrefill;
    try { payload = JSON.parse(raw); } catch { return; }
    if (!payload.dataUrl) return;
    setPrefilling(true);
    if (payload.caption) setCaption(payload.caption);
    if (payload.lookId) setLookId(payload.lookId);
    (async () => {
      try {
        const blob = await (await fetch(payload.dataUrl)).blob();
        const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
          "/storage/uploads/request-url",
          { name: `tryon-${Date.now()}.png`, size: blob.size, contentType: blob.type || "image/png" },
        );
        const put = await fetch(presigned.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": blob.type || "image/png" },
          body: blob,
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);
        if (cancelled) return;
        setObjectPath(presigned.objectPath);
        setImageUrl(`/api/storage${presigned.objectPath}`);
      } catch (e) {
        if (!cancelled) setPrefillError((e as Error).message);
      } finally {
        if (!cancelled) setPrefilling(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Shared blob → presigned PUT pipeline. Used by both the AI try-on
  // prefill effect above and the live camera capture below so we have a
  // single source of truth for storage upload behaviour.
  async function uploadBlob(blob: Blob, filenameHint: string) {
    const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
      "/storage/uploads/request-url",
      { name: filenameHint, size: blob.size, contentType: blob.type || "image/jpeg" },
    );
    const put = await fetch(presigned.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });
    if (!put.ok) throw new Error(`Upload failed (${put.status})`);
    return presigned.objectPath;
  }

  async function handleCapture(blob: Blob) {
    setMode("uploading");
    setCameraError(null);
    try {
      const path = await uploadBlob(blob, `camera-${Date.now()}.jpg`);
      setObjectPath(path);
      setImageUrl(`/api/storage${path}`);
      setMode("idle");
    } catch (e) {
      setCameraError((e as Error).message);
      setMode("camera");
    }
  }

  const create = useMutation({
    mutationFn: () =>
      api.post<Post>("/posts", {
        kind: "result",
        imageUrl: imageUrl ?? "",
        caption: caption.trim() || undefined,
        lookId: lookId || undefined,
        season: season || undefined,
        productIds: [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      navigate("/feed");
    },
  });

  return (
    <div className="min-h-screen vanity-bg">
      <TopNav />
      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-serif text-3xl">Share a look</h1>
        <div className="aspect-square w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-muted/30 relative">
          {prefilling || mode === "uploading" ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">{mode === "uploading" ? "Uploading photo…" : "Uploading your AI try-on…"}</p>
            </div>
          ) : mode === "camera" ? (
            <CameraCapture
              onCapture={(blob) => handleCapture(blob)}
              onCancel={() => setMode("idle")}
            />
          ) : imageUrl ? (
            <>
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => { setImageUrl(null); setObjectPath(null); }}
                aria-label="Remove photo"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Camera className="w-12 h-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Snap a fresh photo or pick one from your library</p>
              <div className="flex flex-wrap items-center justify-center gap-2 px-4">
                <Button
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => { setCameraError(null); setMode("camera"); }}
                >
                  <Camera className="w-4 h-4" /> Take photo
                </Button>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={15 * 1024 * 1024}
                  buttonClassName="inline-flex items-center gap-1.5 border border-input bg-background rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted"
                  onGetUploadParameters={async (file) => {
                    const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
                      "/storage/uploads/request-url",
                      { name: file.name, size: file.size, contentType: file.type ?? "application/octet-stream" },
                    );
                    setObjectPath(presigned.objectPath);
                    return { method: "PUT", url: presigned.uploadURL, headers: { "Content-Type": file.type ?? "application/octet-stream" } };
                  }}
                  onComplete={() => {
                    if (objectPath) setImageUrl(`/api/storage${objectPath}`);
                  }}
                >
                  <ImagePlus className="w-4 h-4" /> From library
                </ObjectUploader>
              </div>
              {cameraError && <p className="text-xs text-red-500 mt-3 px-4 text-center">{cameraError}</p>}
            </>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">CAPTION</label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Cherry blossom flush ✨" maxLength={280} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">INSPIRED BY (OPTIONAL)</label>
          <select value={lookId} onChange={(e) => setLookId(e.target.value)} className="w-full bg-background border border-input rounded-md h-10 px-3 text-sm">
            <option value="">— None —</option>
            {ALL_LOOKS_FLAT.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">SEASON</label>
          <div className="flex gap-2 flex-wrap">
            {SEASONS.map((s) => (
              <Button key={s} size="sm" variant={season === s ? "default" : "outline"} className="rounded-full text-xs" onClick={() => setSeason(s)}>{SEASON_LABELS[s]}</Button>
            ))}
          </div>
        </div>
        {prefillError && <p className="text-sm text-red-500">Couldn't auto-upload your AI try-on: {prefillError}. Pick a photo manually instead.</p>}
        {create.isError && <p className="text-sm text-red-500">{(create.error as Error).message}</p>}
        <Button className="w-full rounded-full" disabled={!imageUrl || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "Posting…" : "Post"}
        </Button>
      </main>
    </div>
  );
}

export default function Upload() {
  return (
    <AuthedRoute>
      <UploadInner />
    </AuthedRoute>
  );
}
