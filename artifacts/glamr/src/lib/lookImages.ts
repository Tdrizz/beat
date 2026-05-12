export const lookImageMap: Record<string, string> = {
  "1920s-flapper": "1920s-flapper.jpg",
  "1940s-pinup": "1940s-pinup.jpg",
  "1950s-hollywood": "1950s-hollywood.jpg",
  "1960s-mod": "1960s-mod.jpg",
  "1970s-disco": "1970s-disco.jpg",
  "1980s-power": "1980s-power.jpg",
  "1990s-grunge": "1990s-grunge.webp",
  "2000s-y2k": "2000s-y2k.jpg",
  "2010s-contour": "2010s-contour.jpg",
  "2020s-glass": "2020s-glass.jpg",
  "audrey-breakfast": "audrey-breakfast.webp",
  "marilyn-red": "marilyn-red.jpg",
  "twiggy-mod": "twiggy-mod.jpg",
  "diana-70s": "diana-70s.jpg",
  "madonna-rebel": "madonna-rebel.jpg",
  "naomi-90s": "naomi-90s.jpg",
  "jlo-y2k": "jlo-y2k.jpg",
  "rihanna-edgy": "rihanna-edgy.jpg",
  "zendaya-ethereal": "zendaya-ethereal.jpg",
  "beyonce-golden": "beyonce-golden.jpg",
  "eye-smoky-black": "eye-smoky-black.jpg",
  "eye-cut-crease": "eye-cut-crease.jpg",
  "eye-halo": "eye-halo.jpg",
  "eye-sunset": "eye-sunset.jpg",
  "eye-graphic-liner": "eye-graphic-liner.jpg",
  "eye-monochromatic": "eye-monochromatic.jpg",
  "eye-euphoria-glitter": "eye-euphoria-glitter.jpg",
  "eye-doublecat": "eye-doublecat.png",
  "eye-brown-natural": "eye-brown-natural.png",
  "eye-colored-liner": "eye-colored-liner.jpg",
  "lip-classic-red": "lip-classic-red.jpg",
  "lip-ombre": "lip-ombre.jpg",
  "lip-vampy": "lip-vampy.jpg",
  "lip-glossy": "lip-glossy.jpg",
  "lip-overlined": "lip-overlined.png",
  "lip-nude-matte": "lip-nude-matte.jpg",
  "lip-coral": "lip-coral.jpg",
  "lip-stained": "lip-stained.jpg",
  "lip-bitten": "lip-bitten.jpg",
  "lip-two-toned": "lip-two-toned.jpg",
  "trend-clean-girl": "trend-clean-girl.jpg",
  "trend-soft-glam": "trend-soft-glam.png",
  "trend-hard-glam": "trend-hard-glam.jpg",
  "trend-glass-skin": "trend-glass-skin.jpg",
  "trend-mob-wife": "trend-mob-wife.jpg",
  "trend-no-makeup": "trend-no-makeup.jpg",
  "trend-y2k": "trend-y2k.jpg",
  "trend-grunge": "trend-grunge.jpg",
  "trend-dark-academia": "trend-dark-academia.jpg",
  "trend-bridal": "trend-bridal.jpg",
  "trend-festival": "trend-festival.jpg",
  "trend-cottagecore": "trend-cottagecore.jpg",
  "trend-office": "trend-office.jpg",
  "trend-night-out": "trend-night-out.png",
  "trend-mermaid": "trend-mermaid.jpg",
  "trend-balletcore": "trend-balletcore.jpg",
  "trend-indie-softgirl": "trend-indie-softgirl.webp",
  "trend-siren": "trend-siren.webp",
  "trend-goth": "trend-goth.jpg",
  "trend-old-money": "trend-old-money.jpg",
  "trend-avant-garde": "trend-avant-garde.jpg",
  "eye-foxy": "eye-foxy.jpg",
  "eye-doe": "eye-doe.jpg",
  "eye-reverse-cat": "eye-reverse-cat.jpg",
  "eye-arabic-kohl": "eye-arabic-kohl.jpg",
  "eye-butterfly": "eye-butterfly.jpg",
  "eye-siren": "eye-siren.webp",
  "eye-fairy": "eye-fairy.jpg",
  "eye-tightline": "eye-tightline.jpg",
  "eye-chrome": "eye-chrome.jpg",
  "eye-editorial-color": "eye-editorial-color.jpg",
  "lip-french-blurred": "lip-french-blurred.jpg",
  "lip-strawberry": "lip-strawberry.jpg",
  "lip-whisper-pink": "lip-whisper-pink.jpg",
  "lip-popsicle": "lip-popsicle.jpg",
  "lip-bratz": "lip-bratz.jpg",
  "lip-cold-girl": "lip-cold-girl.jpg",
  "lip-warm-brown": "lip-warm-brown.jpg",
  "lip-cherry-bomb": "lip-cherry-bomb.jpg",
  "lip-orchid": "lip-orchid.jpg",
  "lip-soap-brow-nude": "lip-soap-brow-nude.jpg"
};

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
