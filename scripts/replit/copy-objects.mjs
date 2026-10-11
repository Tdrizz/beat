// Run INSIDE the Replit project shell, from the repo root, so the Replit
// object-storage sidecar credentials work:
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   STORAGE_BUCKET_PRIVATE=glamr-private STORAGE_BUCKET_PUBLIC=glamr-public \
//   NODE_PATH=artifacts/api-server/node_modules node copy-objects.mjs > acl-manifest.jsonl
//
// Copies every object under PRIVATE_OBJECT_DIR to the same relative key in
// the Supabase private bucket (and PUBLIC_OBJECT_SEARCH_PATHS objects to the
// public bucket), preserving content type. For each object with an ACL
// policy it writes one JSON line {objectPath, owner, visibility, aclRules}
// to stdout; load those with `pnpm --filter @workspace/scripts run
// migrate:import-acls acl-manifest.jsonl`. Re-runnable: objects that
// already exist in Supabase are skipped unless FORCE=1.
import { createRequire } from "node:module";
const require = createRequire(process.cwd() + "/artifacts/api-server/package.json");
const { Storage } = require("@google-cloud/storage");

const SIDECAR = "http://127.0.0.1:1106";
const gcs = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: { url: `${SIDECAR}/credential`, format: { type: "json", subject_token_field_name: "access_token" } },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const need = (n) => {
  const v = process.env[n];
  if (!v) throw new Error(`${n} must be set`);
  return v;
};
const SUPABASE_URL = need("SUPABASE_URL").replace(/\/+$/, "");
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const PRIVATE_BUCKET = need("STORAGE_BUCKET_PRIVATE");
const PUBLIC_BUCKET = need("STORAGE_BUCKET_PUBLIC");
const FORCE = process.env.FORCE === "1";

function split(path) {
  const parts = path.replace(/^\/+/, "").split("/");
  return { bucket: parts[0], prefix: parts.slice(1).join("/").replace(/\/?$/, "/") };
}

const encodeKey = (key) => key.split("/").map(encodeURIComponent).join("/");
const auth = { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY };

async function exists(bucket, key) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/info/${bucket}/${encodeKey(key)}`, { headers: auth });
  return res.ok;
}

async function copyPrefix(srcPath, destBucket, onObject) {
  const { bucket, prefix } = split(srcPath);
  const [files] = await gcs.bucket(bucket).getFiles({ prefix });
  let copied = 0, skipped = 0;
  for (const file of files) {
    if (file.name.endsWith("/")) continue;
    const key = file.name.slice(prefix.length);
    const [meta] = await file.getMetadata();
    if (!FORCE && (await exists(destBucket, key))) {
      skipped += 1;
    } else {
      const [buf] = await file.download();
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${destBucket}/${encodeKey(key)}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": meta.contentType || "application/octet-stream", "x-upsert": "true" },
        body: buf,
      });
      if (!res.ok) throw new Error(`Upload ${key} failed: ${res.status} ${await res.text()}`);
      copied += 1;
    }
    await onObject(key, meta);
  }
  process.stderr.write(`${srcPath} -> ${destBucket}: ${copied} copied, ${skipped} already present\n`);
}

const privateDir = need("PRIVATE_OBJECT_DIR");
await copyPrefix(privateDir, PRIVATE_BUCKET, async (key, meta) => {
  const raw = meta.metadata?.["custom:aclPolicy"];
  if (!raw) return; // never finalized: abandoned upload, unreadable today
  const policy = JSON.parse(raw);
  process.stdout.write(JSON.stringify({ objectPath: `/objects/${key}`, ...policy }) + "\n");
});

for (const path of (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map((s) => s.trim()).filter(Boolean)) {
  await copyPrefix(path, PUBLIC_BUCKET, async () => {});
}
