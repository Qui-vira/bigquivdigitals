/**
 * /about — add the CAC registration to the Ophir milestone, with the redacted
 * certificate as an image.
 *
 * Ophir Institute operates as OPHIR DIGITAL EDUCATION FOUNDATION, CAC
 * registration number 9071886, incorporated 12 Dec 2025. A stranger can verify
 * that against Nigeria's public CAC register. Nothing on the site said so.
 *
 * The image is a REDACTED render: the Tax Identification Number and all five
 * trustee names are removed from the text layer (PyMuPDF apply_redactions, not a
 * drawn box) and the page is rasterised, so the published file carries no
 * extractable text at all. The unredacted PDF stays in
 * 12-Proof-Library/ophir/ and must never be published.
 *
 * Served as a static asset rather than a base64 data URL. The existing milestone
 * images are base64 because the admin uploader falls back to that when no blob
 * token is present; a 282KB certificate does not belong in a database row.
 *
 * Run: npx tsx scripts/about-add-cac-proof.ts
 */
import { createClient } from "@libsql/client";

const MILESTONE_ID = 9;
const CERT = "/proof/ophir-cac-certificate.webp";

const FROM = "A crazy idea at the time.Today it is one of the fastest rising dev institutes in Web3.";
const TO =
  "A crazy idea at the time.Today it is one of the fastest rising dev institutes in Web3.\r\n" +
  "Registered in Nigeria as Ophir Digital Education Foundation, CAC 9071886.";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const [row] = (await db.execute({
    sql: "SELECT text, image, images FROM milestones WHERE id = ?",
    args: [MILESTONE_ID],
  })).rows;
  if (!row) throw new Error(`milestone ${MILESTONE_ID} not found`);

  // --- the copy ---
  const text = String(row.text);
  if (text.includes("CAC 9071886")) {
    console.log("copy: already present, skipped");
  } else if (!text.includes(FROM)) {
    console.log("copy: anchor sentence not found, skipped");
  } else {
    await db.execute({
      sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
      args: [FROM, TO, MILESTONE_ID],
    });
    console.log("copy: CAC registration line added");
  }

  // --- the image ---
  let images: string[] = [];
  try {
    images = row.images ? JSON.parse(String(row.images)) : [];
  } catch {
    images = [];
  }
  if (images.length === 0 && row.image) images = [String(row.image)];

  const existing = images.length;
  if (images.includes(CERT)) {
    console.log(`image: already attached (${existing} image(s) on this milestone)`);
  } else {
    images.push(CERT);
    await db.execute({
      sql: "UPDATE milestones SET images = ? WHERE id = ?",
      args: [JSON.stringify(images), MILESTONE_ID],
    });
    console.log(`image: appended. ${existing} existing image(s) preserved, now ${images.length}`);
  }

  const [after] = (await db.execute({
    sql: "SELECT text, images FROM milestones WHERE id = ?",
    args: [MILESTONE_ID],
  })).rows;
  const finalImages: string[] = JSON.parse(String(after?.images ?? "[]"));
  console.log("\n=== VERIFY ===");
  console.log("  CAC line present:", String(after?.text).includes("CAC 9071886"));
  console.log("  certificate attached:", finalImages.includes(CERT));
  console.log("  total images:", finalImages.length);
  console.log("  no base64 was destroyed:", finalImages.filter((i) => i.startsWith("data:")).length, "data URLs still present");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
