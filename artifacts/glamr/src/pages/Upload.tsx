import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ObjectUploader } from "@workspace/object-storage-web";
import { TopNav } from "@/components/TopNav";
import { AuthedRoute } from "@/components/AuthedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type Post } from "@/lib/api";
import { ALL_LOOKS_FLAT, SEASONS, SEASON_LABELS, type Season } from "@/lib/looks";
import { Camera } from "lucide-react";

function UploadInner() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [objectPath, setObjectPath] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [lookId, setLookId] = useState<string>("");
  const [season, setSeason] = useState<Season | "">("");

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
        <div className="aspect-square w-full border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-muted/30">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-12 h-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Pick a photo to share</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={15 * 1024 * 1024}
                buttonClassName="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold"
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
                Choose photo
              </ObjectUploader>
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
