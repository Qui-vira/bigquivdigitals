/**
 * Waitlist signup counts, broken out by which course the source maps to.
 *
 * The site has no analytics package installed, so CLICKS on the two waitlist
 * URLs are not recorded anywhere. Signups are the only number that exists.
 *
 * Segment rule is copied from app/api/waitlist/route.ts: a source beginning
 * "aimastery" belongs to the AI class, everything else to The Great Work.
 *
 *   node scripts/waitlist-counts.mjs
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT
    CASE WHEN source ILIKE 'aimastery%' THEN 'AI class' ELSE 'The Great Work' END AS list,
    source,
    COUNT(*)::int                                   AS signups,
    MIN(created_at)                                 AS first_signup,
    MAX(created_at)                                 AS latest_signup
  FROM course_waitlist
  GROUP BY 1, 2
  ORDER BY 1, 3 DESC
`;

if (!rows.length) {
  console.log("course_waitlist is empty.");
} else {
  const w = Math.max(...rows.map(r => r.source.length), 6);
  let list = null;
  for (const r of rows) {
    if (r.list !== list) {
      list = r.list;
      const total = rows.filter(x => x.list === list).reduce((a, b) => a + b.signups, 0);
      console.log(`\n${list}  —  ${total} signup${total === 1 ? "" : "s"}`);
      console.log("  " + "source".padEnd(w) + "  count  first        latest");
    }
    const d = x => (x ? new Date(x).toISOString().slice(0, 10) : "-");
    console.log(
      "  " + r.source.padEnd(w) +
      "  " + String(r.signups).padStart(5) +
      "  " + d(r.first_signup) + "   " + d(r.latest_signup)
    );
  }
  const grand = rows.reduce((a, b) => a + b.signups, 0);
  console.log(`\nTOTAL: ${grand}`);
}
