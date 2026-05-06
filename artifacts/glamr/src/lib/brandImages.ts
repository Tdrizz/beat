const UNSPLASH_PHOTOS = [
  "photo-1522335789203-aaa27bbf6cf6",
  "photo-1512496015851-a90fb38ba796",
  "photo-1487412947147-5cebf100ffc2",
  "photo-1583241800698-9c2e0395d4d5",
  "photo-1596462502278-27bfdc403348",
  "photo-1503236823255-94609f598e71",
  "photo-1571781926291-c477ebfd024b",
  "photo-1560869713-7d0a29430803",
] as const;

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function getBrandImage(key: string, width = 720): string {
  const photo = UNSPLASH_PHOTOS[hashKey(key) % UNSPLASH_PHOTOS.length];
  return `https://images.unsplash.com/${photo}?w=${width}&q=80&auto=format&fit=crop`;
}

export function brandGradient(palette: string[]): string {
  if (!palette.length) return "linear-gradient(135deg, #f8d8e0, #e8b8c8, #d098a8)";
  const stops = palette.slice(0, 4).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}
