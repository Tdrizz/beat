// Generates studio reference images for every look in
// .local/state/look-prompts.json (written by `gen:prompts`) that still has no
// image in public/looks/. Each image is saved as an 800x800 JPEG, the same as
// the existing studio references, and its look is removed from
// content/flagged-images.txt so try-on uses it as a reference again.
//
//   GEMINI_API_KEY=... pnpm --filter @workspace/glamr run gen:images [--limit N] [--only id,id]
//
// Typical run to replace the flagged web photos:
//   pnpm --filter @workspace/glamr run images:quarantine
//   pnpm --filter @workspace/glamr run gen:prompts
//   GEMINI_API_KEY=... pnpm --filter @workspace/glamr run gen:images
// then review the new files in public/looks/ before committing.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { ai, GEMINI_IMAGE_MODEL } from "@workspace/integrations-gemini-ai";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const looksDir = join(here, "..", "public", "looks");
const promptsFile = join(repoRoot, ".local", "state", "look-prompts.json");
const flaggedFile = join(repoRoot, "content", "flagged-images.txt");

type PromptEntry = { id: string; prompt: string; negativePrompt: string };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (!existsSync(promptsFile)) {
  console.error(`No ${promptsFile}. Run \`pnpm --filter @workspace/glamr run gen:prompts\` first.`);
  process.exit(1);
}

const only = arg("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const limit = Number(arg("--limit") ?? Infinity);
const onDisk = new Set(readdirSync(looksDir).map((f) => f.replace(/\.[^.]+$/, "")));
const todo = (JSON.parse(readFileSync(promptsFile, "utf8")) as PromptEntry[])
  .filter((e) => !onDisk.has(e.id))
  .filter((e) => !only || only.includes(e.id))
  .slice(0, limit);

console.log(`Generating ${todo.length} image(s) with ${GEMINI_IMAGE_MODEL}`);

async function generate(entry: PromptEntry): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: `${entry.prompt}\n\nSquare 1:1 framing. Avoid: ${entry.negativePrompt}.`,
  });
  for (const cand of response.candidates ?? []) {
    for (const part of cand.content?.parts ?? []) {
      if (part.inlineData?.data) return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error("model returned no image");
}

const done: string[] = [];
const failed: string[] = [];
for (const entry of todo) {
  let saved = false;
  for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
    try {
      const raw = await generate(entry);
      const out = join(looksDir, `${entry.id}.jpg`);
      await sharp(raw).resize(800, 800, { fit: "cover", position: "attention" }).jpeg({ quality: 86 }).toFile(out);
      saved = true;
      done.push(entry.id);
      console.log(`  ✓ ${entry.id}`);
    } catch (err) {
      console.warn(`  ! ${entry.id} attempt ${attempt}: ${err instanceof Error ? err.message : err}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  if (!saved) failed.push(entry.id);
}

// A regenerated look is no longer a flagged web photo.
if (done.length) {
  const generated = new Set(done);
  const lines = readFileSync(flaggedFile, "utf8").split("\n");
  const kept = lines.filter((l) => {
    const t = l.trim();
    if (!t || t.startsWith("#")) return true;
    return !generated.has(t.replace(/\.[^.]+$/, ""));
  });
  writeFileSync(flaggedFile, kept.join("\n"));
}

execFileSync("pnpm", ["run", "regen:images"], { cwd: join(here, ".."), stdio: "inherit" });
console.log(`\nGenerated ${done.length}, failed ${failed.length}${failed.length ? `: ${failed.join(", ")}` : ""}`);
if (failed.length) process.exitCode = 1;
