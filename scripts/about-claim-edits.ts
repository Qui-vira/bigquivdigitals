/**
 * /about — the full ordered edit log for the `milestones` rows.
 *
 * Replaces about-claim-cleanup.ts, about-restore-kol.ts and the ad-hoc scripts
 * that preceded them. One file, applied in order, each step skipped if its `from`
 * text is not present — so running it twice is safe and running it on a fresh
 * restore replays the whole history.
 *
 * These rows are hand-edited through /admin and are NOT reproducible from
 * lib/seed.ts. The table is backed up to stdout before anything is written.
 *
 * Run: npx tsx scripts/about-claim-edits.ts
 */
import { createClient } from "@libsql/client";

type Edit = {
  id: number;
  date: string;
  from: string;
  to: string;
  why: string;
};

const EDITS: Edit[] = [
  {
    id: 9,
    date: "2026-08-01",
    from: "A crazy idea at the time.Today it is one of the fastest rising dev institutes in Web3.",
    to: "A crazy idea at the time.",
    why:
      "'one of the fastest rising dev institutes in Web3' is a world-ranking claim with no " +
      "possible artifact — there is no such ranking to be near the top of. Cut, not replaced: " +
      "an interim 'It is still running today' was tried and reverted because a survival claim " +
      "sitting on top of 'Over 2,000 students trained' steps on the line that actually converts. " +
      "The owner's own 'A crazy idea at the time.' is kept.",
  },
  {
    id: 11,
    date: "2026-08-01",
    from:
      "I have driven over one hundred million dollars in trading volume for exchanges. \r\nI have worked with some of the most respected projects in the space including Bybit and Adashe. ",
    to:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for Bybit. \r\nI was the marketing manager for Adashe. ",
    why:
      "Two DIFFERENT relationships that the original sentence blurred into one vague claim. " +
      "Bybit was KOL / affiliate — that is where the $100M volume comes from, so the number and " +
      "the relationship belong in the same sentence and share one artifact (the affiliate " +
      "dashboard). Adashe was a MARKETING MANAGER role — a job title, and a stronger credential " +
      "than either 'affiliate' or the original 'worked with'. " +
      "No NDA and no contract on either, confirmed by the owner, so nothing here needed " +
      "permitting. An interim pass removed both names on a 'no recorded permission' reading; " +
      "that was wrong — see claim-verification-requirements.md #9.",
  },
];

/** Intermediate states from superseded passes, so a replay converges. */
const REPAIRS: Edit[] = [
  {
    id: 9,
    date: "2026-08-01",
    from: "A crazy idea at the time.It is still running today.",
    to: "A crazy idea at the time.",
    why: "interim wording from the superseded pass",
  },
  {
    id: 11,
    date: "2026-08-01",
    from:
      "I have driven over one hundred million dollars in trading volume for exchanges. \r\nI have worked with established exchanges and Web3 projects in the space. ",
    to:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for Bybit. \r\nI was the marketing manager for Adashe. ",
    why: "interim paraphrase from the superseded pass",
  },
  {
    id: 11,
    date: "2026-08-01",
    from:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for platforms including Bybit and Adashe. ",
    to:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for Bybit. \r\nI was the marketing manager for Adashe. ",
    why: "Adashe was wrongly folded into Bybit's KOL framing; it was a marketing manager role",
  },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const backup = await db.execute("SELECT id, year, title, text FROM milestones ORDER BY sort_order");
  console.log("=== BACKUP ===");
  console.log(JSON.stringify(backup.rows, null, 2));
  console.log("\n=== APPLYING ===");

  let applied = 0;
  for (const e of [...EDITS, ...REPAIRS]) {
    const [row] = (await db.execute({
      sql: "SELECT text FROM milestones WHERE id = ?",
      args: [e.id],
    })).rows;

    if (!row || !String(row.text).includes(e.from)) continue;

    await db.execute({
      sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
      args: [e.from, e.to, e.id],
    });
    applied++;
    console.log(`\n[${e.id}] ${e.date}`);
    console.log(`  - ${JSON.stringify(e.from)}`);
    console.log(`  + ${JSON.stringify(e.to)}`);
  }

  console.log(applied === 0 ? "\nAlready up to date — nothing to apply." : `\n${applied} edit(s) applied.`);

  const after = await db.execute("SELECT id, text FROM milestones WHERE id IN (9, 11)");
  const all = after.rows.map((r) => String(r.text)).join("\n");
  console.log("\n=== VERIFY ===");
  for (const [label, expected] of [
    ["Bybit named", true],
    ["Adashe named", true],
    ["marketing manager for Adashe", true],
    ["KOL and affiliate for Bybit", true],
    ["fastest rising", false],
    ["It is still running today", false],
    ["most respected projects", false],
    ["established exchanges and Web3 projects", false],
  ] as const) {
    const needle = label === "Bybit named" ? "Bybit" : label === "Adashe named" ? "Adashe" : label;
    const got = all.includes(needle);
    console.log(`  ${got === expected ? "ok  " : "FAIL"} ${label}: ${got} (expected ${expected})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
