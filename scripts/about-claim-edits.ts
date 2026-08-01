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

// REMOVED, do not reinstate: an edit that cut "Today it is one of the fastest
// rising dev institutes in Web3" from milestone 9. The owner overruled it — the
// line stays. It is recorded here rather than left in EDITS because leaving it
// executable made every run cut the sentence and then restore it from REPAIRS,
// which converges but churns the live row twice per run. A superseded edit
// belongs in the history, not in the pipeline.

const EDITS: Edit[] = [
  {
    id: 9,
    date: "2026-08-01",
    from:
      "building products across ecosystems like Ethereum, Solana, Cardano, and Fantom.",
    to:
      "building products across ecosystems like Ethereum, Solana, Cardano, Fantom, Flow, and Base.",
    why:
      "Flow and Base added at the owner's direction. Both have filed receipts in " +
      "12-Proof-Library/students/: the $5,000 hackathon was the FLOW bounty on LearnWeb3 " +
      "(publicly verifiable results page), and the $6,000 dev job chat reads 'thanks to those " +
      "projects you shared on base'. The original four stay — they are the owner's own knowledge " +
      "of what his graduates built, which is his to state.",
  },
  {
    id: 9,
    date: "2026-08-01",
    from: "One landed a six thousand dollar dev role and celebrated with an iPhone 14 Pro Max.",
    to: "One landed a dev role paying six thousand dollars a month and celebrated with an iPhone 14 Pro Max.",
    why:
      "The site was underselling this by an order of magnitude. The uncropped receipt " +
      "(12-Proof-Library/students/05-6k-MONTHLY-dev-gig.jpg) reads: 'Thanks to those projects " +
      "you shared on base, I got a $6,000 MONTHLY dev gig.' The original Nov 2023 thread " +
      "compressed it to '$6K Dev Job', so a $72k/year outcome has read as a single payment " +
      "ever since. Confirmed by the owner 2026-08-01.",
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
    id: 9,
    date: "2026-08-01 (owner override)",
    // Anchored on the following line so this cannot match inside the already-
    // restored sentence and double-apply on a replay.
    from: "A crazy idea at the time.\r\n\r\nOver 2,000 students trained.",
    to: "A crazy idea at the time.Today it is one of the fastest rising dev institutes in Web3.\r\n\r\nOver 2,000 students trained.",
    why:
      "RESTORED at the owner's direction. My removal was wrong. I ruled it unprovable on the " +
      "assumption that no ranking of Web3 dev institutes exists — that was my inference, not a " +
      "checked fact, and it is the owner's claim about his own organisation to make. " +
      "Open question logged in claim-verification-requirements.md #8: Ophir is an NGO and is " +
      "NOT currently taking students, so whether the present tense 'Today it is' still holds is " +
      "for the owner to decide. Not changed unilaterally a second time.",
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
    ["fastest rising", true],
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
