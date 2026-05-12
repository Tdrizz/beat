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
  lookName: z.string().min(1).max(120),
  lookDescription: z.string().max(800).optional(),
  // 0–100. The client sends a percentage; 50 = "as written", <50 softens
  // pigment / coverage, >50 amplifies them. Default mirrors the slider's
  // initial position.
  intensity: z.number().min(0).max(100).default(60),
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
});

// Translate a 0–100 intensity into a short natural-language descriptor that
// the image model interprets reliably. Numbers alone tend to be ignored.
function intensityDescriptor(i: number): { label: string; guidance: string } {
  if (i <= 15)  return { label: "barely-there",  guidance: "Apply each product as a whisper — sheer wash of colour, almost no-makeup-makeup. Pigment ~15% of full strength." };
  if (i <= 35)  return { label: "soft / natural", guidance: "Apply each product softly and naturally — diffused, low-pigment, daytime intensity. Pigment ~35% of full strength." };
  if (i <= 60)  return { label: "balanced",      guidance: "Apply each product at standard editorial intensity — pigments clearly visible but blended and skin-like." };
  if (i <= 85)  return { label: "bold",          guidance: "Apply each product with bold saturation — rich pigment payoff, opaque coverage, strong but still photoreal." };
  return        { label: "full glam",            guidance: "Apply each product at maximum runway intensity — fully opaque, highly saturated pigment, dramatic high-impact finish." };
}

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
  base:   "Foundation / complexion",
  eyes:   "Eyeshadow & eyeliner",
  brows:  "Brows",
  lips:   "Lipstick",
  cheeks: "Blush",
};

function buildPrompt(parsed: z.infer<typeof TryonBody>): string {
  const lines: string[] = [];
  const intensity = intensityDescriptor(parsed.intensity);
  lines.push(
    `You are a professional makeup artist. Edit this photograph to apply a complete makeup look called "${parsed.lookName}" to the person in the image.`,
  );
  if (parsed.lookDescription) {
    lines.push(`LOOK STORY: ${parsed.lookDescription}`);
  }
  lines.push("");
  lines.push(`INTENSITY: ${intensity.label}. ${intensity.guidance}`);
  lines.push("");
  lines.push("APPLY THESE PRODUCTS, in order, with photoreal pigment:");
  for (const s of parsed.steps) {
    const label = STEP_LABELS[s.step] ?? s.step;
    const piece = `• ${label} — shade "${s.name}" (${s.color})`;
    lines.push(s.instruction ? `${piece}. ${s.instruction}` : piece);
  }
  lines.push("");
  if (parsed.archetype) {
    const guidance = ARCHETYPE_GUIDANCE[parsed.archetype];
    if (guidance) {
      lines.push(guidance);
      lines.push("");
    }
  }
  if (parsed.skinTone) {
    lines.push("");
    lines.push(
      `USER SKIN TONE (measured from the photo): ${parsed.skinTone.category} with ${parsed.skinTone.undertone} undertone (approx ${parsed.skinTone.hex}).`,
    );
    lines.push(
      "Adapt every product to this skin so the result looks custom-mixed for this person:",
    );
    lines.push(
      "  • Foundation/complexion must match the measured tone exactly — no lightening, darkening, ashy cast, or orange cast.",
    );
    lines.push(
      "  • Translate blush and lip shades through the user's undertone — warm undertones lean peach/coral/terracotta, cool undertones lean rose/berry/mauve, neutral can wear either.",
    );
    lines.push(
      "  • Eyeshadow and eyeliner pigments should keep their hue identity but render with the depth and translucency that flatters this skin (deeper skin → richer pigment payoff; fairer skin → softer wash).",
    );
    lines.push(
      "  • Preserve the user's natural skin texture — pores, freckles, fine lines, scars, moles — visible THROUGH the makeup. Foundation should look skin-like, never plastic or heavily airbrushed.",
    );
  }
  lines.push("");
  lines.push("STRICT RULES:");
  lines.push("- Preserve the person's identity, face shape, bone structure, eye shape, nose, lip shape and proportions exactly.");
  lines.push("- Preserve the original lighting, camera angle, background, hair, clothing and skin texture (pores, freckles, fine lines).");
  lines.push("- Do NOT change race, age, gender, expression, hairstyle, or skin tone.");
  lines.push("- Do NOT smooth or airbrush the skin beyond what real makeup would do — pores and micro-texture must remain visible.");
  lines.push("- Apply makeup precisely to the correct facial regions: eyeshadow only on lids, lipstick only on lips, blush only on cheek apples, etc.");
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
