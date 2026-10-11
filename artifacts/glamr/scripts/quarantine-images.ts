// Moves every image listed in content/flagged-images.txt out of public/looks/
// (so it is no longer deployed) into content/quarantine/looks/, then
// regenerates the look -> image map so those looks fall back to their
// palette gradient. Nothing is deleted; move a file back to restore it.
//
//   pnpm --filter @workspace/glamr run images:quarantine
import { existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..");
const looksDir = join(here, "..", "public", "looks");
const quarantine = join(repo, "content", "quarantine", "looks");
const list = readFileSync(join(repo, "content", "flagged-images.txt"), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

mkdirSync(quarantine, { recursive: true });
let moved = 0;
for (const file of list) {
  const from = join(looksDir, file);
  if (!existsSync(from)) continue;
  renameSync(from, join(quarantine, file));
  moved += 1;
}
console.log(`Moved ${moved} of ${list.length} flagged images to content/quarantine/looks/`);
execFileSync("pnpm", ["run", "regen:images"], { cwd: join(here, ".."), stdio: "inherit" });
