import { api } from "@/lib/api";

export interface WigTryon {
  id: string;
  userId: string;
  wigId: string;
  wigName: string;
  colorId: string;
  colorName: string;
  imagePath: string;
  angleLabel: string;
  createdAt: string;
}

export interface SaveWigTryOnInput {
  dataUrl: string;
  wigId: string;
  wigName: string;
  colorId: string;
  colorName: string;
  angleLabel?: string;
}

/**
 * Persist an AI wig try-on render to the user's "My Wigs" gallery.
 *
 * The generated frame lives only as an in-memory data URL, so we first push
 * it to object storage via the presigned-URL flow (finalized as `private` so
 * only the uploader can read it back through the ACL-gated objects route),
 * then record the canonical `/objects/<id>` path + wig metadata server-side.
 */
export async function saveWigTryOn(input: SaveWigTryOnInput): Promise<WigTryon> {
  const blob = await (await fetch(input.dataUrl)).blob();

  const presigned = await api.post<{ uploadURL: string; objectPath: string }>(
    "/storage/uploads/request-url",
    {
      name: `wig-${input.wigId}-${Date.now()}.png`,
      size: blob.size,
      contentType: blob.type || "image/png",
    },
  );

  const put = await fetch(presigned.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": blob.type || "image/png" },
    body: blob,
  });
  if (!put.ok) throw new Error("Upload failed");

  await api.post("/storage/uploads/finalize", {
    objectPath: presigned.objectPath,
    visibility: "private",
  });

  const { tryon } = await api.post<{ tryon: WigTryon }>("/wig-tryons", {
    wigId: input.wigId,
    wigName: input.wigName,
    colorId: input.colorId,
    colorName: input.colorName,
    imagePath: presigned.objectPath,
    angleLabel: input.angleLabel ?? "Front",
  });
  return tryon;
}

export function listWigTryons(): Promise<{ tryons: WigTryon[] }> {
  return api.get<{ tryons: WigTryon[] }>("/wig-tryons");
}

export function deleteWigTryon(id: string): Promise<void> {
  return api.del(`/wig-tryons/${id}`).then(() => undefined);
}

/** Resolve a stored `/objects/<id>` entity path to its served URL. */
export function resolveWigImageUrl(path: string): string {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path;
}
