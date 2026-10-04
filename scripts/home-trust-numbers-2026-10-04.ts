/**
 * Homepage proof strip: correct two numbers in the Turso `stats` rows.
 *
 * Owner-confirmed 2026-10-04:
 *   - Big_Quiv Alpha plays has 3,485 subscribers (t.me/Quivira_hub1 read the
 *     same day: "3 485 subscribers"). The row said 8,874+.
 *   - Only 6 production systems run (the 6 Vercel projects). The 4 Railway
 *     projects are stopped. The row said 13.
 *
 * These rows are hand-edited through /admin/homepage and are what the live
 * page reads. Editing lib/seed.ts alone changes nothing on the site.
 *
 * Idempotent: each update only fires when the row still holds the old value.
 * The rows are printed before and after.
 *
 * Run: npx tsx scripts/home-trust-numbers-2026-10-04.ts
 */
import { createClient } from "@libsql/client";

const EDITS = [
  { id: 9, label: "Subscribers on a channel I built", fromValue: 8874, toValue: 3485, toSuffix: "" },
  { id: 10, label: "Production systems running", fromValue: 13, toValue: 6, toSuffix: "" },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const before = await db.execute("select * from stats where page = 'home_trust' order by sort_order");
  console.log("BEFORE", JSON.stringify(before.rows, null, 1));

  for (const e of EDITS) {
    const r = await db.execute({
      sql: "update stats set value = ?, suffix = ? where id = ? and page = 'home_trust' and label = ? and value = ?",
      args: [e.toValue, e.toSuffix, e.id, e.label, e.fromValue],
    });
    console.log(`row ${e.id}: ${r.rowsAffected} updated`);
  }

  const after = await db.execute("select * from stats where page = 'home_trust' order by sort_order");
  console.log("AFTER", JSON.stringify(after.rows, null, 1));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
