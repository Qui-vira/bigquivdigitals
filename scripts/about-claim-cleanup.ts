/**
 * /about claim cleanup — the two items that are not evidence problems.
 *
 * See C:\Projects\bigquiv-execution\claim-verification-requirements.md #8 and #9.
 *
 * 1. "one of the fastest rising dev institutes in Web3" is a world-ranking claim
 *    with no possible artifact — there is no ranking of Web3 dev institutes to be
 *    near the top of. It cannot be filed, so it is rewritten, not chased.
 *
 * 2. "including Bybit and Adashe" names two companies as clients with no recorded
 *    permission. This is the only /about item with legal rather than credibility
 *    exposure, so it is paraphrased rather than left pending an artifact hunt.
 *    (Weex was already removed from this sentence on 2026-07-27.)
 *
 * Targeted REPLACE() on the two sentences — the surrounding milestone copy, which
 * is the owner's own account of his own life, is left byte-identical.
 *
 * Run: npx tsx scripts/about-claim-cleanup.ts
 */
import { createClient } from "@libsql/client";

const EDITS = [
  {
    id: 9,
    label: "2021 — Ophir Institute",
    from: "A crazy idea at the time.Today it is one of the fastest rising dev institutes in Web3.",
    to: "A crazy idea at the time.It is still running today.",
  },
  {
    id: 11,
    label: "Now — Building Quivira",
    from: "I have worked with some of the most respected projects in the space including Bybit and Adashe.",
    to: "I have worked with established exchanges and Web3 projects in the space.",
  },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  // Backup first — these rows are hand-edited through /admin and not reproducible
  // from lib/seed.ts.
  const backup = await db.execute("SELECT id, year, title, text FROM milestones ORDER BY sort_order");
  console.log("=== BACKUP (paste somewhere safe before continuing) ===");
  console.log(JSON.stringify(backup.rows, null, 2));

  for (const e of EDITS) {
    const [row] = (await db.execute({
      sql: "SELECT text FROM milestones WHERE id = ?",
      args: [e.id],
    })).rows;

    if (!row) {
      console.log(`\n[${e.id}] ${e.label}: row not found — skipped`);
      continue;
    }
    if (!String(row.text).includes(e.from)) {
      console.log(`\n[${e.id}] ${e.label}: sentence already changed — skipped`);
      continue;
    }

    await db.execute({
      sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
      args: [e.from, e.to, e.id],
    });
    console.log(`\n[${e.id}] ${e.label}`);
    console.log(`  - ${e.from}`);
    console.log(`  + ${e.to}`);
  }

  console.log("\n=== VERIFY ===");
  for (const e of EDITS) {
    const [row] = (await db.execute({
      sql: "SELECT text FROM milestones WHERE id = ?",
      args: [e.id],
    })).rows;
    const t = String(row?.text ?? "");
    console.log(`[${e.id}] old sentence present: ${t.includes(e.from)} | new sentence present: ${t.includes(e.to)}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
