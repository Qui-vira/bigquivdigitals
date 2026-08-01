/**
 * /about — say plainly that the non-profit and the paid course are different things.
 *
 * The Ophir milestone now carries the foundation's CAC registration. The owner
 * sells The Great Work (formerly Ophir's Codex) himself, through BigQuiv Digitals — the foundation does
 * not sell it and does not receive the money. Without a line saying so, a reader
 * can reasonably assume a registered non-profit is selling a paid course, which
 * is the one misreading worth spending a sentence to prevent.
 *
 * Nothing here is a legal control. It is a clarity fix. The governance side
 * (trustee conflict disclosure, any name licence between the foundation and the
 * company) is a question for a Nigerian corporate lawyer and is not addressed by
 * website copy.
 *
 * Run: npx tsx scripts/about-separate-foundation-and-course.ts
 */
import { createClient } from "@libsql/client";

const MILESTONE_ID = 9;

const FROM = "Registered in Nigeria as Ophir Digital Education Foundation, CAC 9071886.";
const TO =
  "Registered in Nigeria as Ophir Digital Education Foundation, CAC 9071886.\r\n" +
  "The foundation is a non-profit. The Great Work, my paid course, is a separate BigQuiv Digitals product.";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const [row] = (await db.execute({
    sql: "SELECT text FROM milestones WHERE id = ?",
    args: [MILESTONE_ID],
  })).rows;
  if (!row) throw new Error(`milestone ${MILESTONE_ID} not found`);

  const text = String(row.text);
  if (text.includes("separate BigQuiv Digitals product")) {
    console.log("already present, nothing to do");
  } else if (!text.includes(FROM)) {
    console.log("anchor line not found — skipped, nothing changed");
  } else {
    await db.execute({
      sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
      args: [FROM, TO, MILESTONE_ID],
    });
    console.log("separation line added");
  }

  const [after] = (await db.execute({
    sql: "SELECT text FROM milestones WHERE id = ?",
    args: [MILESTONE_ID],
  })).rows;
  const t = String(after?.text ?? "");
  console.log("\n=== VERIFY ===");
  console.log("  CAC number present:", t.includes("CAC 9071886"));
  console.log("  separation line present:", t.includes("separate BigQuiv Digitals product"));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
