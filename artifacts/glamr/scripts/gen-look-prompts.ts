// Generate image prompts for every look that is still missing an image file.
//
//   pnpm --filter @workspace/glamr run gen:prompts
//
// Emits .local/state/look-prompts.json — an array of { id, ethnicity, outPath,
// aspectRatio, prompt, negativePrompt } consumed by the image-generation step
// (run in the code-execution sandbox via generateImage). Also prints a
// representation tally so the model mix can be reviewed before spending credits.
//
// Representation: an explicit override map handles looks that are intrinsically
// tied to a culture, then the rest are assigned by a deterministic weighted
// cycle over the alphabetically-sorted remaining ids — targeting roughly
// 30% African American / 20% European / 30% Latina / 10% East Asian /
// 10% Polynesian across the catalogue.
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_LOOKS_FLAT, type Look } from "../src/lib/looks";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const looksDir = join(here, "..", "public", "looks");
const outJson = join(repoRoot, ".local", "state", "look-prompts.json");

const EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const onDisk = new Set(readdirSync(looksDir));
const hasImage = (id: string) => EXTS.some((e) => onDisk.has(id + e));

type Ethnicity =
  | "African American"
  | "European"
  | "Latina"
  | "East Asian"
  | "Polynesian";

// Subject phrase for a non-drag look.
const PERSON: Record<Ethnicity, string> = {
  "African American": "a Black African-American woman with rich brown skin",
  European: "a fair-skinned European woman",
  Latina: "a Latina woman with warm golden-tan skin",
  "East Asian": "an East Asian woman with light warm skin",
  Polynesian: "a Polynesian Pacific-Islander woman with warm bronze skin",
};

// Short complexion word used in the authoritative "keep her natural tone" line
// and for drag subjects.
const SKIN: Record<Ethnicity, string> = {
  "African American": "deep rich brown",
  European: "fair",
  Latina: "warm golden-tan",
  "East Asian": "light warm",
  Polynesian: "warm bronze",
};

// Looks whose ethnicity is intrinsic to the look's identity/culture.
const OVERRIDE: Record<string, Ethnicity> = {
  "pag-latina-heat": "Latina",
  "style-douyin": "East Asian",
  "mediterranean-bronze": "European",
};

// Deterministic 10-slot weighted cycle: 3 AA / 3 Latina / 2 European /
// 1 East Asian / 1 Polynesian. Combined with the overrides this lands close
// to the 30/20/30/10/10 target across the whole missing set.
const CYCLE: Ethnicity[] = [
  "African American",
  "Latina",
  "European",
  "African American",
  "Latina",
  "East Asian",
  "African American",
  "Latina",
  "European",
  "Polynesian",
];

const STYLE =
  "Professional high-resolution beauty editorial photograph. Head-and-shoulders close-up centered on the face, looking straight at camera with a calm, confident expression. Soft, even studio beauty lighting, smooth seamless light-grey studio backdrop. Flawless skin with realistic natural texture and visible pores, sharp focus on the eyes, shallow depth of field. One single subject only, no props.";

const NEGATIVE =
  "text, words, letters, watermark, logo, signature, border, frame, collage, split image, multiple people, extra faces, deformed face, asymmetric eyes, extra fingers, blurry, low quality, cartoon, anime, illustration, 3d render, plastic waxy skin, oversaturated, ashy grey foundation";

function buildPrompt(look: Look, eth: Ethnicity): string {
  const isDrag = look.id.startsWith("drag-");
  const subject = isDrag
    ? `a glamorous drag queen with ${SKIN[eth]} skin`
    : PERSON[eth];
  const s = look.steps;
  const makeup =
    `Eyes: ${s.eyes.colorName ?? s.eyes.name}. ` +
    `Lips: ${s.lips.colorName ?? s.lips.name}. ` +
    `Cheeks: ${s.cheeks.colorName ?? s.cheeks.name}. ` +
    `Brows: ${s.brows.colorName ?? s.brows.name}.`;
  return [
    `${subject} wearing a complete "${look.name}" makeup look.`,
    look.description,
    `Makeup — ${makeup} Overall mood: ${look.mood}.`,
    `IMPORTANT: render her natural ${SKIN[eth]} complexion — do not lighten or whiten the skin; the foundation matches her own tone and the makeup colours adapt to it.`,
    STYLE,
  ].join(" ");
}

const missing = ALL_LOOKS_FLAT.filter((l) => !hasImage(l.id)).sort((a, b) =>
  a.id.localeCompare(b.id),
);

const tally: Record<Ethnicity, number> = {
  "African American": 0,
  European: 0,
  Latina: 0,
  "East Asian": 0,
  Polynesian: 0,
};

let cycleIdx = 0;
const out = missing.map((look) => {
  let eth = OVERRIDE[look.id];
  if (!eth) {
    eth = CYCLE[cycleIdx % CYCLE.length];
    cycleIdx++;
  }
  tally[eth]++;
  return {
    id: look.id,
    ethnicity: eth,
    outPath: `artifacts/glamr/public/looks/${look.id}.png`,
    aspectRatio: "1:1" as const,
    prompt: buildPrompt(look, eth),
    negativePrompt: NEGATIVE,
  };
});

mkdirSync(dirname(outJson), { recursive: true });
writeFileSync(outJson, JSON.stringify(out, null, 2) + "\n");

console.log(`Wrote ${out.length} prompts -> ${outJson}\n`);
const total = out.length || 1;
console.log("Representation tally:");
for (const [eth, n] of Object.entries(tally)) {
  console.log(`  ${eth.padEnd(18)} ${String(n).padStart(3)}  (${Math.round((n / total) * 100)}%)`);
}
console.log("\nSample prompt:");
console.log(JSON.stringify(out[0], null, 2));
