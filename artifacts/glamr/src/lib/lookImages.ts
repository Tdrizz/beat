// The look id -> filename map is AUTO-GENERATED from a scan of public/looks/
// by scripts/regen-look-images.ts (run via `pnpm --filter @workspace/glamr run
// regen:images`). It only ever lists files that actually exist on disk, so a
// look without an image falls through to the gradient placeholder below rather
// than rendering a broken <img>. Do not hand-edit the map.
import { lookImageMap } from "./lookImageMap.generated";

export { lookImageMap };

const svgCache = new Map<string, string>();

function paletteToSvgDataUri(palette: [string, string, string]): string {
  const key = palette.join(",");
  const cached = svgCache.get(key);
  if (cached) return cached;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="50%" stop-color="${palette[1]}"/><stop offset="100%" stop-color="${palette[2]}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  svgCache.set(key, uri);
  return uri;
}

export function getLookImage(
  id: string,
  baseUrl = import.meta.env.BASE_URL,
  palette?: [string, string, string],
): string {
  const file = lookImageMap[id];
  if (file) return baseUrl + "looks/" + file;
  if (palette) return paletteToSvgDataUri(palette);
  return paletteToSvgDataUri(["#e8b4c8", "#c07898", "#884868"]);
}
