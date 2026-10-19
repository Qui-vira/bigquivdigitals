#!/usr/bin/env node
/**
 * Run this EVERY TIME TheEditCompanion.zip is rebuilt, right after the build.
 *
 *   node scripts/companion-zip-hash.mjs [path-to-zip]          check only (exit 1 on mismatch)
 *   node scripts/companion-zip-hash.mjs [path-to-zip] --write  also rewrite lib/companion/file-hash.ts
 *
 * Default zip path: D:\motion-studio-pack-build\dist\TheEditCompanion.zip
 *
 * Prints the SHA-256 and byte size of the zip, compares them with the values in
 * lib/companion/file-hash.ts (the hash printed in every delivery email), and prints the
 * SQL that keeps the companion_products row in step. Reads the zip only; it never uploads,
 * deploys or touches a database.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const write = args.includes("--write");
const zip = resolve(args.find((a) => !a.startsWith("--")) ?? "D:\\motion-studio-pack-build\\dist\\TheEditCompanion.zip");
const hashFile = resolve(dirname(fileURLToPath(import.meta.url)), "..", "lib", "companion", "file-hash.ts");

const bytes = statSync(zip).size;
const sha = await new Promise((ok, fail) => {
  const h = createHash("sha256");
  createReadStream(zip).on("data", (c) => h.update(c)).on("error", fail).on("end", () => ok(h.digest("hex")));
});

const src = readFileSync(hashFile, "utf8");
const curSha = /DELIVERY_FILE_SHA256 = "([0-9a-f]{64})"/.exec(src)?.[1] ?? "(not found)";
const curBytes = Number((/DELIVERY_FILE_BYTES = ([\d_]+);/.exec(src)?.[1] ?? "").replace(/_/g, "")) || null;
const match = curSha === sha && curBytes === bytes;

console.log(`zip:     ${zip}`);
console.log(`sha256:  ${sha}`);
console.log(`bytes:   ${bytes}`);
console.log(`file-hash.ts: ${match ? "MATCHES" : `DIFFERS (has ${curSha}, ${curBytes} bytes)`}`);

if (!match && write) {
  const grouped = String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, "_");
  const next = src
    .replace(/DELIVERY_FILE_SHA256 = "[^"]*"/, `DELIVERY_FILE_SHA256 = "${sha}"`)
    .replace(/DELIVERY_FILE_BYTES = [\d_]+;/, `DELIVERY_FILE_BYTES = ${grouped};`);
  writeFileSync(hashFile, next);
  console.log("file-hash.ts updated. Commit it, then re-upload this exact zip to the private Blob store.");
}

console.log("\nKeep the product row in step (run on the right Neon branch, owner approval first):");
console.log(`update companion_products set file_sha256 = '${sha}', file_bytes = ${bytes}, updated_at = now() where slug = 'theeditcompanion';`);

if (!match && !write) {
  console.error("\nMISMATCH: rerun with --write, or the delivery email will print the wrong hash.");
  process.exit(1);
}
