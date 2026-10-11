# Content rights audit

Scope: every image shipped in `artifacts/glamr/public/` and `attached_assets/`, every brand logo/image source, and look names and descriptions in `artifacts/glamr/src/lib/*`. Nothing was deleted: removed files were moved to `content/quarantine/`, which isn't deployed.

**I'm not a lawyer. This is a risk triage to take to counsel and the owner, not legal advice.**

## How images were classified

- **AI-generated (134 look images):** listed as generated in the Replit agent's asset log (`.agents/agent_assets_metadata.toml` on `main`). They're consistent studio-style AI portraits. Lowest risk; keep them.
- **Unknown provenance (104 look images):** everything else. I reviewed every one visually. They appear to be photos collected from the web: press and red-carpet photos, magazine scans, brand ads, TikTok/Instagram content (some with watermarks or captions), and a painting reproduction. **Assume none are licensed.**

## Done in this PR

### Moved out of the deployed site (33 files)

These are now in `content/quarantine/looks/`. The 11 depicting or named after real people:

| File | Why |
| --- | --- |
| `audrey-breakfast.webp` | Audrey Hepburn film still |
| `beyonce-golden.jpg` | Filename names Beyoncé; source unknown (was the Trending tab hero) |
| `diana-70s.jpg` | Photos of Diana Ross |
| `jlo-y2k.jpg` | Press photo of Jennifer Lopez (was the By Era tab hero) |
| `madonna-rebel.jpg` | Filename names Madonna; vintage photo, source unknown |
| `marilyn-red.jpg` | Photo of Marilyn Monroe + a web tutorial collage |
| `mexico-frida.jpg` | Reproduction of a Frida Kahlo painting (still under copyright in Mexico; name/likeness also trademarked) (was the Halloween tab hero) |
| `naomi-90s.jpg` | Filename names Naomi Campbell; runway photo |
| `rihanna-edgy.jpg` | Press photo of Rihanna (was the Drag tab hero) |
| `twiggy-mod.jpg` | Photo of Twiggy + tutorial collage |
| `zendaya-ethereal.jpg` | Red-carpet photo of Zendaya (was the All tab hero) |

The other 22 are country-themed web photos that weren't used by any page or look (some show branded ad copy):
`australia-beach.jpg`, `brazil-carnaval.jpg`, `brazil-natural.jpg`, `china-cbeauty.jpg`, `colombia-vibrant.jpg`, `egypt-cleopatra.jpg`, `ethiopia-traditional.jpg`, `france-parisienne.jpg`, `ghana-natural.jpg`, `india-bollywood.jpg`, `iran-persian.jpg`, `italy-dolce-vita.jpg`, `japan-gyaru.jpg`, `japan-jbeauty.jpg`, `korea-kbeauty.jpg`, `morocco-hammam.jpg`, `nigeria-afrobeats.jpg`, `philippines-morena.jpg`, `saudi-gulf-glam.jpg`, `thailand-classical.jpg`, `uk-brit-punk.jpg`, `usa-hollywood.jpg`.

### Home page hero images

All 11 hero images on the Home tabs pointed at web photos, including four of the celebrity photos. Each one now uses an AI-generated look image from the same category. The alt text was also wrong ("Black model in golden glam" for a Beyoncé-named file, etc.) and now describes the actual image. The search placeholder no longer suggests searching by celebrity.

### Look names and copy

| Before | After | Reason |
| --- | --- | --- |
| Maleficent | Dark Sorceress | Disney character |
| Cruella | Monochrome Villainess | Disney character |
| Cat Woman | Cat Burglar | DC trademark |
| Euphoria Glitter | Glitter Graphic Eye | HBO show title |
| Bratz Doll Lip | Fashion Doll Lip | MGA trademark |
| Miss Universe Glam | Universal Crown Glam | Miss Universe Organization trademark |

I also removed references to real people and franchises from descriptions and shade names: Marilyn, Twiggy, Kim K, Kardashian, Hailey Bieber, Jean Harlow, Joan Crawford, HBO, Disney, Sailor Moon, Buffy, "Maleficent Red" and others. I removed dead celebrity look IDs from the season map and the Look Match recommender. The recommender also had 8 stale look IDs that silently did nothing; they now point at the current looks.

**Look IDs are unchanged** (`hw-maleficent`, `hw-cruella`, `hw-cat-woman`, `eye-euphoria-glitter`, `lip-bratz`, `miss-universe`). They're stored in users' posts and saved combos, and they appear in URLs. Renaming them needs a data migration plus redirects. That's a small follow-up, worth doing if counsel considers the URL slugs a risk.

## Still live: needs replacing before launch (71 look images)

These are the remaining web photos in use as look thumbnails. They're listed in `content/flagged-images.txt`.

They also hurt AI try-on: many are black-and-white, collages, product shots or group photos, so they make poor makeup references. Try-on no longer sends them to the model and builds those looks from their written recipe instead (see `docs/tryon.md`).

**Recommended: regenerate them** as studio references, the same style as the other 134 (about 70 Gemini image calls):

```bash
pnpm --filter @workspace/glamr run images:quarantine    # move the web photos out
pnpm --filter @workspace/glamr run gen:prompts          # prompts for every look now missing an image
GEMINI_API_KEY=... pnpm --filter @workspace/glamr run gen:images   # generate 800x800 JPEGs
```

`gen:images` skips looks that already have an image, retries failures, removes each regenerated look from `content/flagged-images.txt`, and rebuilds the image map. Use `--only id,id` to redo specific looks. Review every new image before committing.

If you'd rather not regenerate yet, run only `images:quarantine`. Those looks then show their palette gradient, and try-on still works from the recipe. Nothing is deleted.

| File | Notes |
| --- | --- |
| `1920s-flapper.jpg` |  |
| `1940s-pinup.jpg` |  |
| `1950s-hollywood.jpg` |  |
| `1960s-mod.jpg` |  |
| `1970s-disco.jpg` |  |
| `1980s-power.jpg` |  |
| `1990s-grunge.webp` |  |
| `2000s-y2k.jpg` | TikTok screenshot with on-screen caption |
| `2010s-contour.jpg` |  |
| `2020s-glass.jpg` |  |
| `eye-arabic-kohl.jpg` |  |
| `eye-brown-natural.png` |  |
| `eye-butterfly.jpg` |  |
| `eye-chrome.jpg` |  |
| `eye-colored-liner.jpg` |  |
| `eye-cut-crease.jpg` |  |
| `eye-doe.jpg` |  |
| `eye-doublecat.png` | Magazine page scan |
| `eye-editorial-color.jpg` |  |
| `eye-euphoria-glitter.jpg` |  |
| `eye-fairy.jpg` |  |
| `eye-foxy.jpg` |  |
| `eye-graphic-liner.jpg` | Tutorial collage with step badges |
| `eye-halo.jpg` |  |
| `eye-monochromatic.jpg` |  |
| `eye-reverse-cat.jpg` |  |
| `eye-siren.webp` |  |
| `eye-smoky-black.jpg` |  |
| `eye-sunset.jpg` |  |
| `eye-tightline.jpg` |  |
| `lip-bitten.jpg` |  |
| `lip-bratz.jpg` |  |
| `lip-cherry-bomb.jpg` |  |
| `lip-classic-red.jpg` |  |
| `lip-cold-girl.jpg` |  |
| `lip-coral.jpg` |  |
| `lip-french-blurred.jpg` | Mood-board collage |
| `lip-glossy.jpg` | Visible watermark |
| `lip-nude-matte.jpg` |  |
| `lip-ombre.jpg` | Visible creator watermark |
| `lip-orchid.jpg` |  |
| `lip-overlined.png` |  |
| `lip-popsicle.jpg` |  |
| `lip-soap-brow-nude.jpg` |  |
| `lip-stained.jpg` |  |
| `lip-strawberry.jpg` |  |
| `lip-two-toned.jpg` |  |
| `lip-vampy.jpg` |  |
| `lip-warm-brown.jpg` |  |
| `lip-whisper-pink.jpg` |  |
| `trend-avant-garde.jpg` |  |
| `trend-balletcore.jpg` |  |
| `trend-bridal.jpg` |  |
| `trend-clean-girl.jpg` |  |
| `trend-cottagecore.jpg` |  |
| `trend-dark-academia.jpg` |  |
| `trend-festival.jpg` |  |
| `trend-glass-skin.jpg` |  |
| `trend-goth.jpg` | Appears to be a film/TV production still |
| `trend-grunge.jpg` |  |
| `trend-hard-glam.jpg` |  |
| `trend-indie-softgirl.webp` |  |
| `trend-mermaid.jpg` |  |
| `trend-mob-wife.jpg` | Visible creator handle watermark |
| `trend-night-out.png` |  |
| `trend-no-makeup.jpg` |  |
| `trend-office.jpg` | Branded products (Too Faced, NARS) as the subject |
| `trend-old-money.jpg` |  |
| `trend-siren.webp` |  |
| `trend-soft-glam.png` |  |
| `trend-y2k.jpg` |  |

## Other images

- **`public/tools/` (38 files):** product photos of branded tools (MAC, Morphe, Real Techniques, Fenty, Huda, Charlotte Tilbury, NuFace, Foreo…). They were probably taken from retailer sites. Brand product photography is copyrighted. Use the brands' press-kit or affiliate-program images (affiliate programs usually license them), or your own photos.
- **`public/nutrition/` (29 files):** food and supplement photos of unknown source. Lower risk, but replace them with licensed stock or AI images.
- **`public/opengraph.jpg`, `favicon.svg`:** app branding. Confirm the owner created them.
- **`attached_assets/` (3 files):** catrina reference renders used in development; not deployed.

## Brands

- **`lib/brandLogos.ts`** maps 46 brand names to domains and hot-links `https://logo.clearbit.com/<domain>`. Two problems:
  - Clearbit announced the shutdown of the free Logo API in 2025, so these probably already fail (the component falls back to initials).
  - Displaying brand logos needs the brands' permission. Hot-linking also sends every viewer's IP to a third party.
  - **Recommendation:** use initials (already the fallback) until each brand's affiliate program grants logo use. Then host the approved files yourself.
- **`lib/brandImages.ts`** hot-links 8 Unsplash photos. The Unsplash license allows commercial use, but their API guidelines ask hot-linked images to go through the API with attribution. Simplest fix: download and self-host them, credited on an attributions page.
- **Brand and product names in the catalogue** (`brands.ts`, `productRecommendations.ts`, `lashes.ts`, `palettes.ts`, `specialProducts.ts`): naming real products to recommend or link to them is generally nominative use. Avoid implying endorsement or partnership, and keep affiliate disclosure ("we may earn a commission") visible near shop links. Superlative marketing copy ("the most iconic red lipstick in the world") should be your own opinion, not quoted brand claims.

## Open questions for the owner

1. Where did the 104 non-generated look images come from? A licence for any of them would take them off the list.
2. Should the 71 still-live images be pulled before launch (gradients until replaced), or replaced first?
3. Which brands have affiliate agreements that cover logo and product image use?
