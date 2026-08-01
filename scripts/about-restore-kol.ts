/**
 * /about — restore Bybit, and stop the Ophir line undercutting the number below it.
 *
 * Reverses two edits from scripts/about-claim-cleanup.ts.
 *
 * WHY THE FIRST EDIT WAS WRONG: it treated "no recorded permission" as a legal
 * restriction. The owner has since confirmed the Bybit relationship was a KOL /
 * affiliate arrangement — no NDA, no contract. There was never anything to be
 * permitted. Naming the platform you were a KOL for is standard practice and
 * carries no confidentiality obligation.
 *
 * But the ORIGINAL sentence does not come back either. "I have worked with some
 * of the most respected projects in the space including Bybit and Adashe" frames
 * an affiliate arrangement as a client engagement, which is the one version an
 * exchange would actually object to. Stating the real relationship is both safer
 * and stronger: it names the mechanism and it carries a number.
 *
 * It also merges two claims into one, and one artifact — the affiliate dashboard
 * — now evidences both the volume and the relationship.
 *
 * Both names are restored: the owner confirmed the same KOL / affiliate terms for
 * Bybit and for Adashe — no NDA, no contract on either.
 *
 * "platforms", not "exchanges" — Adashe has not been described as an exchange and
 * there is no reason to assert a category that was never stated.
 *
 * SECOND EDIT: "It is still running today" was added by the previous pass to
 * replace the unprovable "one of the fastest rising dev institutes in Web3".
 * It is a survival claim standing where an energy claim used to be, and it sits
 * directly on top of "Over 2,000 students trained" — the line that actually
 * converts. Removing it lets the number land immediately. The owner's own
 * "A crazy idea at the time." is kept untouched. The unprovable ranking does
 * NOT come back.
 *
 * Run: npx tsx scripts/about-restore-kol.ts
 */
import { createClient } from "@libsql/client";

const EDITS = [
  {
    id: 9,
    label: "2021 — Ophir Institute",
    from: "A crazy idea at the time.It is still running today.",
    to: "A crazy idea at the time.",
    why: "drop the flat survival line; let the student count land",
  },
  {
    id: 11,
    label: "Now — Building Quivira",
    from:
      "I have driven over one hundred million dollars in trading volume for exchanges. \r\nI have worked with established exchanges and Web3 projects in the space. ",
    to:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for platforms including Bybit and Adashe. ",
    why: "name both in the relationship that actually existed, with the number attached",
  },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const backup = await db.execute("SELECT id, year, title, text FROM milestones ORDER BY sort_order");
  console.log("=== BACKUP ===");
  console.log(JSON.stringify(backup.rows, null, 2));

  for (const e of EDITS) {
    const [row] = (await db.execute({
      sql: "SELECT text FROM milestones WHERE id = ?",
      args: [e.id],
    })).rows;

    if (!row || !String(row.text).includes(e.from)) {
      console.log(`\n[${e.id}] ${e.label}: target text not found — skipped`);
      continue;
    }

    await db.execute({
      sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
      args: [e.from, e.to, e.id],
    });
    console.log(`\n[${e.id}] ${e.label}  (${e.why})`);
    console.log(`  - ${JSON.stringify(e.from)}`);
    console.log(`  + ${JSON.stringify(e.to)}`);
  }

  console.log("\n=== VERIFY ===");
  for (const e of EDITS) {
    const [row] = (await db.execute({
      sql: "SELECT text FROM milestones WHERE id = ?",
      args: [e.id],
    })).rows;
    const t = String(row?.text ?? "");
    console.log(`[${e.id}] new text present: ${t.includes(e.to)} | old text gone: ${!t.includes(e.from)}`);
  }

  const [m11] = (await db.execute("SELECT text FROM milestones WHERE id = 11")).rows;
  const t = String(m11?.text ?? "");
  console.log(`\nBybit named: ${t.includes("Bybit")}`);
  console.log(`Adashe named: ${t.includes("Adashe")}`);

  const [m9] = (await db.execute("SELECT text FROM milestones WHERE id = 9")).rows;
  console.log(`"fastest rising" restored: ${String(m9?.text ?? "").includes("fastest rising")}  (expected false)`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
