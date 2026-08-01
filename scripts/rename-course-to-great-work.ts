/**
 * Rename the course to The Great Work in the database.
 *
 * Second rename: "The Zero-to-Opportunity System" → "Ophir's Codex" (2026-08-01,
 * scripts/rename-course-to-ophirs-codex.ts) → "The Great Work" (same day). The owner
 * dropped the Ophir register entirely; the community is now The Athanor. Seven modules
 * and the core promise are unchanged; only the name moves.
 *
 * Unlike the last script (which updated one known row), this one sweeps every text
 * column in every table, because the previous rename left the name in at least two
 * places (service_options and the /about copy pushed by
 * scripts/about-separate-foundation-and-course.ts). Both apostrophe forms are handled —
 * ASCII (') and typographic (’) — since site copy uses &apos; and DB rows may differ.
 *
 * "Ophir Institute" is a real, separate business and contains no "Codex", so this
 * replacement cannot touch it.
 *
 * Run: npx tsx --env-file=.env.local scripts/rename-course-to-great-work.ts
 */
import { createClient } from "@libsql/client";

const NEW = "The Great Work";
const OLD_VARIANTS = ["Ophir's Codex", "Ophir’s Codex", "Ophirs Codex"];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set (run with --env-file=.env.local)");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  let totalRows = 0;
  for (const t of tables.rows.map((r) => String(r.name))) {
    const cols = await db.execute(`PRAGMA table_info(${t})`);
    for (const c of cols.rows.map((r) => String(r.name))) {
      for (const OLD of OLD_VARIANTS) {
        // Find matches first so the log shows exactly what changed and where.
        const hits = await db.execute({
          sql: `SELECT COUNT(*) AS n FROM ${t} WHERE CAST(${c} AS TEXT) LIKE ?`,
          args: [`%${OLD}%`],
        }).catch(() => null);
        const n = Number(hits?.rows[0]?.n ?? 0);
        if (n === 0) continue;

        const res = await db.execute({
          sql: `UPDATE ${t} SET ${c} = REPLACE(${c}, ?, ?) WHERE CAST(${c} AS TEXT) LIKE ?`,
          args: [OLD, NEW, `%${OLD}%`],
        });
        console.log(`${t}.${c}: ${res.rowsAffected} row(s)  ["${OLD}" → "${NEW}"]`);
        totalRows += res.rowsAffected;
      }
    }
  }
  console.log(`\ntotal rows changed: ${totalRows}`);

  // Verify: no variant of the old name anywhere, and show the service picker.
  console.log("\n=== VERIFY ===");
  const leftovers: string[] = [];
  for (const t of tables.rows.map((r) => String(r.name))) {
    const cols = await db.execute(`PRAGMA table_info(${t})`);
    const where = cols.rows
      .map((c) => `CAST(${String(c.name)} AS TEXT) LIKE '%Codex%'`)
      .join(" OR ");
    if (!where) continue;
    try {
      const hits = await db.execute(`SELECT COUNT(*) AS n FROM ${t} WHERE ${where}`);
      const n = Number(hits.rows[0]?.n ?? 0);
      if (n > 0) leftovers.push(`${t} (${n})`);
    } catch {
      /* not scannable */
    }
  }
  console.log(
    leftovers.length
      ? `  REMAINING 'Codex' rows: ${leftovers.join(", ")}`
      : "  no 'Codex' left anywhere in the database"
  );

  const picker = await db.execute("SELECT id, name FROM service_options ORDER BY sort_order");
  console.log("\nService picker now:");
  picker.rows.forEach((r) => console.log(`  [${r.id}] ${r.name}`));

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
