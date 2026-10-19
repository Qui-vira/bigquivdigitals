// Upload the TheEditCompanion zip to the PRIVATE Blob store (companion-private).
//
// Usage (from the repo root):
//   node scripts/companion-upload-zip.mjs <path-to-TheEditCompanion.zip>
//
// The store's read-write token is asked for at a hidden prompt (or read from COMPANION_BLOB_TOKEN if it is
// already set in this shell). It is never printed or written to disk. Before uploading, the zip's sha256 and
// size are checked against lib/companion/file-hash.ts; a mismatch stops the upload (run
// scripts/companion-zip-hash.mjs <zip> --write first). After uploading, head() confirms the stored size.
import { createReadStream, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createInterface } from "node:readline";
import { put, head } from "@vercel/blob";

const KEY = process.env.COMPANION_FILE_KEY || "companion/TheEditCompanion.zip";
const zip = process.argv[2];
if (!zip) {
  console.error("usage: node scripts/companion-upload-zip.mjs <path-to-zip>");
  process.exit(2);
}

const src = readFileSync(new URL("../lib/companion/file-hash.ts", import.meta.url), "utf8");
const wantSha = src.match(/DELIVERY_FILE_SHA256\s*=\s*"([0-9a-f]{64})"/)?.[1];
const wantBytes = Number(src.match(/DELIVERY_FILE_BYTES\s*=\s*([0-9_]+)/)?.[1]?.replace(/_/g, ""));
const bytes = statSync(zip).size;
const sha = createHash("sha256").update(readFileSync(zip)).digest("hex");
console.log(`zip:   ${zip}\nsha256 ${sha}\nbytes  ${bytes}`);
if (sha !== wantSha || bytes !== wantBytes) {
  console.error(`STOP: file-hash.ts expects ${wantSha} / ${wantBytes} bytes. Run companion-zip-hash.mjs --write first.`);
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer.trim()); });
  });
}

const raw = (process.env.COMPANION_BLOB_TOKEN || "").trim() || (await askHidden("Paste the companion-private read-write token (hidden), then Enter: "));
// Accept a pasted .env line too: BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..." -> vercel_blob_rw_...
const token = raw.replace(/^[A-Z_]+\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
if (token !== raw) console.log("note: removed a NAME= prefix or quotes from the pasted text");
if (!token.startsWith("vercel_blob_rw_")) {
  const shape = raw.length === 0 ? "nothing (empty paste)" : `${raw.length} characters starting with "${raw.slice(0, 5)}"`;
  console.error(`STOP: that does not look like a Blob read-write token (it should start with vercel_blob_rw_). Got ${shape}.`);
  process.exit(1);
}

// Token shape: vercel_blob_rw_<storeId>_<secret>. The store id is not secret; print it so the right store is used.
console.log(`token store id: ${token.split("_")[3] || "?"} (companion-private is store_tgqqLe3KkPqcZVou), length ${token.length}`);
console.log(`uploading to ${KEY} (private) ...`);
const res = await put(KEY, createReadStream(zip), {
  access: "private",
  addRandomSuffix: false,
  allowOverwrite: true,
  multipart: bytes > 50 * 1024 * 1024,
  contentType: "application/zip",
  token,
});
const meta = await head(res.pathname, { token });
console.log(`uploaded: ${res.pathname}, stored size ${meta.size} bytes`);
if (meta.size !== bytes) {
  console.error("STOP: stored size differs from the local zip.");
  process.exit(1);
}
console.log("OK: the private store holds the exact zip file-hash.ts expects.");
