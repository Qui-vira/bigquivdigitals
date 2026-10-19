/**
 * The SHA-256 of the product zip, printed in the delivery email so the buyer can
 * verify the download.
 *
 * !! EVERY TIME TheEditCompanion.zip IS REBUILT, run right after the build:
 *      node scripts/companion-zip-hash.mjs <path-to-zip> --write
 *    It prints the new SHA-256 and byte size, rewrites BOTH values below, and prints the SQL
 *    that updates companion_products.file_sha256 / file_bytes. Then upload THAT exact zip to the
 *    private Blob store. Without --write it only checks and exits 1 on a mismatch.
 *    (Manual check: certutil -hashfile TheEditCompanion.zip SHA256.)
 * Last verified 2026-10-19 against D:\motion-studio-pack-build\dist\TheEditCompanion.zip.
 * A test fails if the hash is not 64 hex chars.
 */
export const DELIVERY_FILE_SHA256 = "db8e28c30292b1a68562b72bf7ca60cf35ee660717cd44ce6a68c1b6f3d6f802";
export const DELIVERY_FILE_BYTES = 11_773_338;
