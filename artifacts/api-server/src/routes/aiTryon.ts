import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { z } from "zod";

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
  lines.push("STRICT RULES:");
  lines.push("- Preserve the person's identity, face shape, bone structure, eye shape, nose, lip shape and proportions exactly.");
  lines.push("- Preserve the original lighting, camera angle, background, hair, clothing and skin texture (pores, freckles, fine lines).");
  lines.push("- Do NOT change race, age, gender, expression, or hairstyle.");
  lines.push("- Do NOT smooth or airbrush the skin beyond what real makeup would do.");
  lines.push("- Apply makeup precisely to the correct facial regions: eyeshadow only on lids, lipstick only on lips, blush only on cheek apples, etc.");
  lines.push("- Output a single photorealistic image of the same person wearing the look. No text, no watermark, no border.");
  return lines.join("\n");
}

router.post("/ai-tryon", async (req, res) => {
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
