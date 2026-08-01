/**
 * Rename the course to Ophir's Codex in the database.
 *
 * The course was renamed from "The Zero-to-Opportunity System" to "Ophir's
 * Codex" on 2026-08-01. Seven modules and the core promise are unchanged; only
 * the name moved. All 100 sales scripts already use the new name, and /about now
 * names it too, so the site had two names live for the same product.
 *
 * The code strings are in components/HomeClient.tsx and are committed alongside
 * this. This script covers the one database row: the /contact service picker.
 *
 * Run: npx tsx scripts/rename-course-to-ophirs-codex.ts
 */
import { createClient } from "@libsql/client";

const OLD = "The Zero-to-Opportunity course";
const NEW = "Ophir's Codex";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const before = await db.execute("SELECT id, name, sort_order FROM service_options ORDER BY sort_order");
  console.log("Service picker options before:");
  before.rows.forEach((r) => console.log(`  [${r.id}] ${r.name}`));

  const res = await db.execute({
    sql: "UPDATE service_options SET name = ? WHERE name = ?",
    args: [NEW, OLD],
  });
  console.log(`\nrows changed: ${res.rowsAffected}`);

  const after = await db.execute("SELECT id, name, sort_order FROM service_options ORDER BY sort_order");
  console.log("\nAfter:");
  after.rows.forEach((r) => console.log(`  [${r.id}] ${r.name}`));

  // Nothing else in the database should carry the old name.
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
  const leftovers: string[] = [];
  for (const t of tables.rows.map((r) => String(r.name))) {
    const cols = await db.execute(`PRAGMA table_info(${t})`);
    const where = cols.rows
      .map((c) => `CAST(${String(c.name)} AS TEXT) LIKE '%Zero-to-Opportunity%'`)
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
  console.log("\n=== VERIFY ===");
  console.log(leftovers.length ? `  REMAINING old-name rows: ${leftovers.join(", ")}` : "  no 'Zero-to-Opportunity' left anywhere in the database");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
