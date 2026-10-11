# AI try-on

`POST /api/ai-tryon` (`artifacts/api-server/src/routes/aiTryon.ts`) sends the user's camera frame and the look's recipe to Gemini's image model, which repaints the frame with the makeup. Each look's recipe lives in `artifacts/glamr/src/lib/*`: per-step shade name, hex and placement instruction. The client side is `artifacts/glamr/src/hooks/useAITryOn.ts`.

## Two prompt modes

| Mode | When | What the model follows |
| --- | --- | --- |
| **Reference** | The look has a clean studio reference image. | The look's thumbnail is the primary source for the makeup's colour, placement and strength; the recipe fills in what isn't visible. |
| **Recipe only** | The look has no image, or its image is a flagged web photo (`webPhotoLookIds` in `lookImageMap.generated.ts`). | The recipe is the whole spec: each hex sets the colour, each instruction sets placement. |

## Why some looks came out wrong

Before this change every look ran in reference mode, and the prompt told the model to treat the thumbnail as more authoritative than the recipe. 134 looks have consistent AI studio portraits, which work well as references. The other 71 (the eras, eye, lip and trend looks) used web photos, and many make bad references:

- **Black-and-white:** 1920s Flapper, 1940s Pin-Up, 1960s Mod, Monochromatic Eye. The model copied grey, colourless makeup.
- **No usable face:** Office Appropriate (a product flat-lay), Orchid Lip (a lipstick bullet), Bridal Glow (a group of bridesmaids), French Blurred Lip (a street-style collage), Goth Glam (a dark scene with small figures).
- **Collages and screenshots:** Ombre Lip (a grid of lips), Graphic Liner (a numbered tutorial collage), 2000s Y2K (a TikTok caption), Double Cat Eye (a magazine page).
- **Crops and poses:** Classic Smoky Eye (two cropped eyes), Popsicle Stain (blurred side profile), Tightline Natural (tiny face).

Those looks now run in recipe mode. Once their images are regenerated (`docs/content-rights.md`), they drop out of `webPhotoLookIds` and switch back to reference mode automatically.

## Checking quality

There's no automated check of output quality. After changing the prompt or `GEMINI_IMAGE_MODEL`, try a handful of looks from both modes on a few skin tones, including a bold one (Killer Clown, Sugar Skull), a natural one (Clean Girl, No-Makeup Makeup) and an era look (1960s Mod).
