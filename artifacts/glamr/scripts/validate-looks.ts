// Validate that every look in ALL_LOOKS_FLAT is try-on-able and has an image.
//
//   pnpm --filter @workspace/glamr run validate:looks
//   pnpm --filter @workspace/glamr run validate:looks -- --allow-missing-images
//
// "Try-on-able" mirrors the server zod TryonBody + the useAITryOn payload
// builder: at least one step with a non-transparent color, lookName 1..120
// chars, lookDescription <= 800 chars, and a unique id. A missing image file
// is a warning unless --allow-missing-images is passed (used while the image
// set is still being generated).
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_LOOKS_FLAT } from "../src/lib/looks";

const here = dirname(fileURLToPath(import.meta.url));
const looksDir = join(here, "..", "public", "looks");
const EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const files = new Set(readdirSync(looksDir));
const hasImage = (id: string) => EXTS.some((e) => files.has(id + e));

const STEP_KEYS = ["base", "brows", "eyes", "cheeks", "lips"] as const;
const allowMissingImages = process.argv.includes("--allow-missing-images");

type Problem = { id: string; blockers: string[]; warnings: string[] };
const problems: Problem[] = [];
const idCounts = new Map<string, number>();

for (const look of ALL_LOOKS_FLAT) {
  idCounts.set(look.id, (idCounts.get(look.id) ?? 0) + 1);
  const blockers: string[] = [];
  const warnings: string[] = [];

  const colored = STEP_KEYS.filter((k) => {
    const c = look.steps[k]?.color;
    return !!c && c !== "transparent";
  });
  if (colored.length === 0)
    blockers.push("no non-transparent colored step (try-on payload would be empty)");
  if (!look.name || look.name.length < 1 || look.name.length > 120)
    blockers.push(`name length ${look.name?.length ?? 0} (must be 1..120)`);
  if (look.description && look.description.length > 800)
    blockers.push(`description length ${look.description.length} (must be <= 800)`);
  if (!hasImage(look.id)) warnings.push("no image file in public/looks");

  if (blockers.length || warnings.length) problems.push({ id: look.id, blockers, warnings });
}

const dups = [...idCounts.entries()].filter(([, n]) => n > 1).map(([id]) => id);

let blockerCount = 0;
let missingCount = 0;
console.log(`Validated ${ALL_LOOKS_FLAT.length} looks.\n`);
for (const p of problems) {
  blockerCount += p.blockers.length;
  missingCount += p.warnings.length;
  const parts = [
    ...p.blockers.map((b) => `BLOCKER: ${b}`),
    ...p.warnings.map((w) => `missing-image: ${w}`),
  ];
  console.log(`- ${p.id}: ${parts.join("; ")}`);
}
if (dups.length) {
  blockerCount += dups.length;
  console.log(`\nDUPLICATE ids: ${dups.join(", ")}`);
}

console.log(
  `\nSummary: ${blockerCount} try-on blocker(s), ${missingCount} look(s) missing an image.`,
);
const fail = blockerCount > 0 || (!allowMissingImages && missingCount > 0);
console.log(`RESULT: ${fail ? "FAIL" : "PASS"}`);
process.exit(fail ? 1 : 0);
