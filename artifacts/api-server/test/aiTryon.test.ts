import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, createUser, useServer } from "./helpers";

const generateContent = vi.hoisted(() => vi.fn());
vi.mock("@workspace/integrations-gemini-ai", () => ({
  ai: { models: { generateContent } },
  GEMINI_CHAT_MODEL: "chat-model",
  GEMINI_IMAGE_MODEL: "image-model",
}));

useServer();

const photo = "A".repeat(100);
const body = {
  imageBase64: photo,
  lookName: "1960s Mod",
  steps: [{ step: "eyes", name: "Graphic Crease", color: "#111111", instruction: "Draw a bold crease line." }],
};

beforeEach(() => {
  generateContent.mockReset();
  generateContent.mockResolvedValue({
    candidates: [{ content: { parts: [{ inlineData: { data: "out", mimeType: "image/png" } }] } }],
  });
});

function sentParts() {
  return generateContent.mock.calls[0][0].contents[0].parts as Array<{ text?: string; inlineData?: unknown }>;
}

describe("AI try-on", () => {
  it("builds the look from the recipe when no reference image is sent", async () => {
    const user = await createUser();
    const res = await api("POST", "/ai-tryon", { user, body });
    expect(res.status).toBe(200);
    const parts = sentParts();
    expect(parts).toHaveLength(2); // prompt + user photo only
    expect(parts[0].text).toContain("THE WRITTEN RECIPE IS THE ONLY MAKEUP REFERENCE");
    expect(parts[0].text).not.toMatch(/thumbnail|Image 2/);
    expect(parts[0].text).toContain('"Graphic Crease" (#111111)');
  });

  it("uses the reference image as the makeup source when one is sent", async () => {
    const user = await createUser();
    const res = await api("POST", "/ai-tryon", { user, body: { ...body, lookReferenceBase64: "B".repeat(100) } });
    expect(res.status).toBe(200);
    const parts = sentParts();
    expect(parts).toHaveLength(3);
    expect(parts[0].text).toContain("Image 2 is the selected catalogue thumbnail");
  });
});
