import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// Request body for an AI photorealistic try-on.
//
// The client sends a snapshot of the user from the camera plus a structured
// description of the look (per-step shade name + hex). We ask the
// gemini-2.5-flash-image model to repaint the photo with the look applied,
// preserving the user's face geometry, identity, lighting, and skin texture.
const TryonBody = z.object({
  imageBase64: z.string().min(64),
  mimeType: z.string().default("image/jpeg"),
  lookReferenceBase64: z.string().min(64).max(3_000_000),
  lookName: z.string().min(1).max(120),
  lookDescription: z.string().max(800).optional(),
  steps: z
    .array(
      z.object({
        step: z.string(),     // "base" | "eyes" | "brows" | "lips" | "cheeks"
        name: z.string(),     // "Smoky Charcoal"
        color: z.string(),    // "#2d2d2d"
        instruction: z.string().optional(),
      })
    )
    .min(1)
    .max(10),
  // Optional: client-measured skin tone sampled from the captured frame.
  // When present, the prompt instructs the model to harmonise pigments to
  // this skin so foundation matches and lip/blush undertones flatter the user.
  skinTone: z
    .object({
      hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      // Enum-locked so a malicious client cannot inject newlines or extra
      // instructions into the prompt via these free-text-looking fields.
      category: z.enum(["Fair", "Light", "Medium Light", "Medium", "Tan", "Deep"]),
      undertone: z.enum(["Warm", "Cool", "Neutral"]),
    })
    .nullable()
    .optional(),
  // Optional: the user's beauty archetype from the on-device quiz. We use
  // this to bias the model toward finishes that match the user's stated
  // personality (e.g. siren → smokier, naturalist → softer). Enum-locked
  // for the same prompt-injection reason as skinTone.
  archetype: z
    .enum(["romantic", "siren", "icon", "muse", "rebel", "naturalist"])
    .nullable()
    .optional(),
  // Optional wig swap. When present, the model is also instructed to
  // replace the subject's hair with the described wig style + colour.
  // Free-text fields are length-bounded to keep the final prompt
  // bounded and to limit prompt-injection surface area; texture/length
  // are enum-locked for the same reason.
  wig: z
    .object({
      styleId: z.string().min(1).max(60),
      styleName: z.string().min(1).max(80),
      length: z.enum(["Pixie", "Short", "Bob", "Shoulder", "Long", "Extra Long"]),
      texture: z.enum(["Straight", "Wavy", "Curly", "Coily", "Braided", "Locs"]),
      description: z.string().max(200).optional(),
      colorName: z.string().min(1).max(60),
      rootHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      tipHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .nullable()
    .optional(),
});

// Per-archetype prompt fragments. These are short, finish-focused nudges
// the model layers on top of the look's per-step shades — they bend the
// finish toward the user's personality without overriding the look's
// signature shades or the user's skin tone. Kept short so they don't
// crowd out the more important geometric/identity rules later in the prompt.
const ARCHETYPE_GUIDANCE: Record<string, string> = {
  romantic:
    "User's beauty archetype is THE ROMANTIC: lean dewy and soft. Diffuse every edge. Favour rose/peach/petal undertones in blush and lip. Skin should look glowy, almost lit-from-within. No hard liner.",
  siren:
    "User's beauty archetype is THE SIREN: lean smouldering and high-impact. Push depth in the eye (smoke/aubergine/bronze) and pigment density on the lip. Sculpt cheeks with bronze/terracotta rather than pink. Skin polished and satin, never powdery.",
  icon:
    "User's beauty archetype is THE ICON: lean polished and timeless. Skin should look like couture-tailored second-skin foundation. Brows architectural and defined. Lines crisp. Restraint over invention — every element looks deliberate and editorial.",
  muse:
    "User's beauty archetype is THE MUSE: lean painterly and ethereal. Allow subtle iridescence on lid and high points. Embrace unexpected colour temperatures (lavender, gold, rust) within the look's palette. Skin lit-from-within, brows soft and brushed up.",
  rebel:
    "User's beauty archetype is THE REBEL: lean graphic and high-contrast. Sharper liner edges, punchier pigment, willingness to render lips matte and dark. Skin can be matte rather than dewy to make colour pop. Brushy unconventional brow.",
  naturalist:
    "User's beauty archetype is THE NATURALIST: lean fresh and skin-first. Render every product as the lightest credible interpretation of its shade — think tinted balm, cream stain, sheer wash. Glow comes from skin care, not shimmer. Brows fluffy and undone.",
};

const STEP_LABELS: Record<string, string> = {
  base:   "Complexion coverage / finish",
  eyes:   "Eyes",
  brows:  "Brows",
  lips:   "Lips",
  cheeks: "Cheeks",
};

export function buildPrompt(parsed: z.infer<typeof TryonBody>): string {
  const lines: string[] = [];
  lines.push(
    `You are a professional makeup artist. Edit the first image to apply the exact makeup look shown in the second image to the person in the first image.`,
  );
  lines.push("");
  lines.push("IMAGE ROLES AND REFERENCE PRIORITY:");
  lines.push("- Image 1 is the user's photo and is the only source for identity, face, skin, pose, camera framing, background, and lighting.");
  lines.push("- Image 2 is the selected catalogue thumbnail and is the primary visual source for the makeup. Match its actual colors, placement, shapes, blending, finish, and dramatic strength as closely as the user's facial anatomy allows.");
  lines.push("- Transfer the makeup design only. Do not copy the thumbnail person's face, identity, skin tone, pose, background, or hair. Preserve the user's hair unless a separate wig is explicitly selected.");
  lines.push("- The thumbnail person's complexion is never a target shade. Keep the user's own complexion; only apply an explicitly described full-face theatrical paint as a cosmetic layer, while preserving facial identity and skin texture.");
  lines.push("- The thumbnail may be a close-up, collage, group, product shot, or instructional image. Ignore its layout, text, packaging, and other people; transfer only makeup clearly visible on a face. For areas not shown clearly, follow that area's written step instruction and do not invent details.");
  lines.push("- Treat the thumbnail as more authoritative than text descriptions or shade labels if they differ; use those labels only to clarify details that are hard to see.");
  lines.push(`LOOK NAME: "${parsed.lookName}".`);
  if (parsed.lookDescription) {
    lines.push(`Supporting look description: ${parsed.lookDescription}`);
  }
  lines.push("");
  lines.push("MATCH THE MAKEUP DESIGN, in order, with photoreal cosmetic layers:");
  lines.push("Use the thumbnail to decide which products are actually present. Increase pigment strength and definition only for visible makeup, while respecting any explicit no-product, bare, or minimal instruction; never add a product just because a step exists.");
  for (const s of parsed.steps) {
    const label = STEP_LABELS[s.step] ?? s.step;
    if (s.step === "base") {
      const piece = `• ${label} — use this as a coverage/finish cue, not as a complexion shade.`;
      lines.push(s.instruction ? `${piece} ${s.instruction}` : piece);
    } else {
      const piece = `• ${label} — shade cue "${s.name}" (${s.color})`;
      lines.push(s.instruction ? `${piece}. ${s.instruction}` : piece);
    }
  }
  lines.push("- For ordinary foundation, match the user's own complexion. Only follow an explicit instruction for theatrical face paint as visible makeup; do not infer a different skin tone from words like “porcelain”, a shade label, or a hex value.");
  lines.push("- Preserve every visible makeup hue and its relative strength across skin tones. Do not recolor blush or lips to suit an undertone; make the selected colors readable with realistic layering instead.");
  lines.push("");
  if (parsed.wig) {
    const w = parsed.wig;
    const isSolid = w.rootHex.toLowerCase() === w.tipHex.toLowerCase();
    lines.push("ALSO REPLACE THE SUBJECT'S HAIR WITH A WIG:");
    lines.push(
      `• Style: "${w.styleName}" — ${w.length.toLowerCase()} length, ${w.texture.toLowerCase()} texture.`,
    );
    if (w.description) lines.push(`• Look: ${w.description}`);
    if (isSolid) {
      lines.push(`• Colour: ${w.colorName} (solid ${w.rootHex}) from root to tip.`);
    } else {
      lines.push(
        `• Colour: ${w.colorName} — root ${w.rootHex} blending into ${w.tipHex} at the tips.`,
      );
    }
    lines.push("  Render a natural hairline melt — no obvious wig cap edge, no halo of original hair peeking out.");
    lines.push("  Hair should sit with realistic weight, shadow, and shine for the texture described.");
    lines.push("  Preserve the original lighting on the hair as if it were the person's own.");
    lines.push("");
  }
  if (parsed.archetype) {
    const guidance = ARCHETYPE_GUIDANCE[parsed.archetype];
    if (guidance) {
      lines.push(guidance);
      lines.push("The catalogue thumbnail takes priority over archetype preferences; use archetype guidance only when it does not change the referenced makeup.");
      lines.push("");
    }
  }
  if (parsed.skinTone) {
    lines.push("");
    lines.push(
      `APPROXIMATE SKIN-TONE SAMPLE: ${parsed.skinTone.category}, ${parsed.skinTone.undertone} undertone (approx ${parsed.skinTone.hex}). Treat this as rough guidance only; the user's visible skin in Image 1 overrides the sample if they disagree.`,
    );
    lines.push(
      "Use the sample only to help preserve the user's complexion and render cosmetic layers naturally:",
    );
    lines.push(
      "  • Ordinary foundation/complexion must match the user's visible tone — no unintended lightening, darkening, ashy cast, or orange cast. Follow an explicit theatrical paint instruction only as a cosmetic layer.",
    );
    lines.push(
      "  • Keep the look's named and pictured blush, lip, and eye hues; do not substitute a different color family based on undertone.",
    );
    lines.push(
      "  • Keep the same design and relative pigment strength on every skin tone. Adjust only the realistic layering needed for the selected colors to remain visible, without changing their hue or placement.",
    );
    lines.push(
      "  • Preserve the user's natural skin texture — pores, freckles, fine lines, scars, moles — visible THROUGH the makeup. Foundation should look skin-like, never plastic or heavily airbrushed.",
    );
  }
  lines.push("");
  lines.push("STRICT RULES:");
  lines.push("- Preserve the person's identity, face shape, bone structure, eye shape, nose, lip shape and proportions exactly.");
  lines.push(
    parsed.wig
      ? "- Preserve the original lighting, camera angle, background, clothing and skin texture (pores, freckles, fine lines). Hair IS being replaced per the wig instructions above; everything else stays identical."
      : "- Preserve the original lighting, camera angle, background, hair, clothing and skin texture (pores, freckles, fine lines).",
  );
  lines.push(
    parsed.wig
      ? "- Do NOT change race, age, gender, expression, or skin tone. Hairstyle changes ONLY to match the wig described above."
      : "- Do NOT change race, age, gender, expression, hairstyle, or skin tone.",
  );
  lines.push("- Do NOT smooth or airbrush the skin beyond what real makeup would do — pores and micro-texture must remain visible.");
  lines.push("- Apply makeup precisely to the correct facial regions: eyeshadow only on lids, lipstick only on lips, blush only on cheek apples, etc.");
  lines.push("- Do not invent, omit, or substitute makeup colors, shapes, patterns, or products that are visible in the catalogue thumbnail.");
  lines.push("- Make the makeup one clear step bolder than the thumbnail: richer saturation, stronger pigment payoff, and more defined contrast, without changing its colors, design, or placement.");
  lines.push("- Keep the bolder makeup photorealistic and visible in the final image; do not dilute it into a sheer or barely-there finish.");
  lines.push("- Render makeup as real cosmetic layers that follow facial contours, with natural blending and crisp edges only where the product calls for them.");
  lines.push("- Match the photo's light direction, exposure, and white balance; preserve real highlights and shadows, with no flat painted-on color or mask-like edges.");
  lines.push("- Output a single photorealistic image of the same person wearing the look. No text, no watermark, no border.");
  return lines.join("\n");
}

// SECURITY: requireAuth + rate-limit are mandatory here. The endpoint
// invokes Gemini image generation on every call, which is metered and
// expensive — leaving it open would let anonymous callers burn credits
// at will. The 10/5min/user budget covers a reasonable session of
// iteration on a look without enabling abuse.
router.post("/ai-tryon", requireAuth, rateLimit({ scope: "ai-tryon", max: 10, windowMs: 5 * 60_000 }), async (req, res) => {
  const log = req.log;
  const parseResult = TryonBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request", details: parseResult.error.flatten() });
    return;
  }
  const body = parseResult.data;

  try {
    const prompt = buildPrompt(body);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: body.mimeType,
                data: body.imageBase64,
              },
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: body.lookReferenceBase64,
              },
            },
          ],
        },
      ],
    });

    // Find the first image part in the response
    const candidates = response.candidates ?? [];
    for (const cand of candidates) {
      const parts = cand.content?.parts ?? [];
      for (const part of parts) {
        const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
        if (inline?.data) {
          res.json({
            imageBase64: inline.data,
            mimeType: inline.mimeType ?? "image/png",
          });
          return;
        }
      }
    }

    log.warn({ candidates: candidates.length }, "AI try-on returned no image");
    res.status(502).json({ error: "Model returned no image. Try again or use a clearer photo." });
  } catch (err) {
    log.error({ err }, "AI try-on failed");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `AI try-on failed: ${message}` });
  }
});

export default router;
