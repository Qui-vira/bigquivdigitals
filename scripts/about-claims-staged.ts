/**
 * /about — the four claims still waiting on an artifact.
 *
 * These are NOT rewrites. Each one is either true and unfiled, or false and
 * should be cut; only the artifact decides which. So each is staged here with
 * both outcomes written out, and NOTHING runs without an explicit argument.
 *
 * Source of truth for what each needs:
 *   C:\Projects\bigquiv-execution\claim-verification-requirements.md #4 to #7
 *
 *   npx tsx scripts/about-claims-staged.ts                 # list, changes nothing
 *   npx tsx scripts/about-claims-staged.ts volume --cut    # apply the cut variant
 *   npx tsx scripts/about-claims-staged.ts students --keep # mark filed, leave text
 *
 * `--keep` exists so the register can record "artifact filed, wording stands"
 * without a text edit. It prints what to add to the proof library; it does not
 * touch the database.
 */
import { createClient } from "@libsql/client";

type Staged = {
  key: string;
  claim: string;
  milestoneId: number;
  /** Exact live sentence. Verified against production 2026-08-01. */
  from: string;
  /** What ships if the artifact never turns up. */
  cutTo: string;
  /** What has to exist in 12-Proof-Library/ for `from` to stay. */
  artifact: string;
};

const STAGED: Staged[] = [
  {
    key: "volume",
    claim: "$100M trading volume as a KOL for Bybit and Adashe — FILE THIS, DO NOT CUT",
    milestoneId: 11,
    from:
      "I have driven over one hundred million dollars in trading volume as a KOL and affiliate for Bybit. ",
    // Cutting this would also remove the Bybit KOL relationship, which is
    // independently true. If the dashboard shows a smaller number, edit the
    // number by hand — do not run --cut on this one.
    cutTo: "I was a KOL and affiliate for Bybit. ",
    artifact:
      "The BYBIT affiliate dashboard: cumulative referred volume against his own account, " +
      "identity and date range visible. Highest-value artifact on the list — it closes this " +
      "claim AND backs the Bybit relationship in one screenshot. Tier: Personal. " +
      "The $100M is Bybit ONLY — it has nothing to do with Adashe, which was a separate " +
      "marketing manager role. Never merge the two.",
  },
  {
    key: "students",
    claim: "Over 2,000 students trained",
    milestoneId: 9,
    from: "Over 2,000 students trained.",
    cutTo: "",
    artifact:
      "Enrolment export: cohort list or platform export with a total row and a date range. " +
      "Names redacted, count and date range visible. If the export supports a smaller number, " +
      "state that number instead of cutting.",
  },
  {
    key: "deal",
    claim: "a thirteen thousand dollar marketing deal",
    milestoneId: 11,
    from: "I have closed a thirteen thousand dollar marketing deal. ",
    cutTo: "",
    artifact:
      "The contract or invoice with amount and date; counterparty may be redacted. " +
      "NOTE: content Block 6 is a $13,000 STUDENT result (Haleem) — different claim, " +
      "same number. Block 6 does not evidence this.",
  },
  {
    key: "ecosystems",
    claim: "graduate outcomes across Ethereum, Solana, Cardano and Fantom",
    milestoneId: 9,
    from:
      "Graduates landing high value jobs, winning hackathons, and building products across ecosystems like Ethereum, Solana, Cardano, and Fantom.",
    cutTo: "Graduates landing jobs, winning hackathons, and shipping products.",
    artifact:
      "One verifiable instance PER NAMED ECOSYSTEM — a hackathon result page, a public repo, " +
      "or a named graduate's offer with permission. Four names means four artifacts. " +
      "The cut variant keeps the outcome and drops only the four names.",
  },
];

function list() {
  console.log("/about — claims staged, nothing applied\n");
  for (const s of STAGED) {
    console.log(`  ${s.key.padEnd(11)} milestone ${s.milestoneId}  ${s.claim}`);
    console.log(`  ${"".padEnd(11)} needs: ${s.artifact}\n`);
  }
  console.log("Run with a key and --cut to remove one, or --keep to print its filing note.");
}

async function main() {
  const [key, mode] = process.argv.slice(2);
  if (!key) return list();

  const staged = STAGED.find((s) => s.key === key);
  if (!staged) {
    console.error(`Unknown claim "${key}". Known: ${STAGED.map((s) => s.key).join(", ")}`);
    process.exit(1);
  }

  if (mode === "--keep") {
    console.log(`KEEPING: ${staged.claim}`);
    console.log(`\nFile this in 12-Proof-Library/ as a 5-field proof block:\n  ${staged.artifact}`);
    console.log("\nNo database change. Update claim-verification-requirements.md to match.");
    return;
  }

  if (mode !== "--cut") {
    console.error("Pass --cut to remove the claim, or --keep to print the filing note.");
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const [row] = (await db.execute({
    sql: "SELECT text FROM milestones WHERE id = ?",
    args: [staged.milestoneId],
  })).rows;

  if (!row) {
    console.error(`Milestone ${staged.milestoneId} not found.`);
    process.exit(1);
  }
  if (!String(row.text).includes(staged.from)) {
    console.log("Sentence not present — already cut or reworded. Nothing to do.");
    return;
  }

  console.log("=== BACKUP ===");
  console.log(JSON.stringify({ id: staged.milestoneId, text: row.text }, null, 2));

  await db.execute({
    sql: "UPDATE milestones SET text = REPLACE(text, ?, ?) WHERE id = ?",
    args: [staged.from, staged.cutTo, staged.milestoneId],
  });

  const [after] = (await db.execute({
    sql: "SELECT text FROM milestones WHERE id = ?",
    args: [staged.milestoneId],
  })).rows;
  console.log(`\nCut: ${staged.claim}`);
  console.log(`Old sentence still present: ${String(after?.text ?? "").includes(staged.from)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
