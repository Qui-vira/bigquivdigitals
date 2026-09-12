/**
 * Waitlist signups per day, so a content day can be checked against real signups.
 *
 * `waitlist-counts.mjs` gives totals. This gives the curve, which is what answers
 * "did anybody join between Day 3 and Day 5".
 *
 *   node scripts/waitlist-by-day.mjs
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
    to_char(created_at, 'YYYY-MM-DD')                AS day,
    CASE WHEN source ILIKE 'aimastery%' THEN 'AI class' ELSE 'Great Work' END AS list,
    COUNT(*)::int                                    AS n
  FROM course_waitlist
  GROUP BY 1, 2
  ORDER BY 1
`;

// Great Work launch-arc day map, from the execution files and handoff
const ARC = {
  "2026-08-11": "Day 1", "2026-08-13": "Day 2", "2026-08-14": "Day 2A",
  "2026-08-16": "Day 3", "2026-08-22": "Day 4",
  "2026-08-28": "Day 5 · Video 1", "2026-08-31": "Day 5 · Video 2",
  "2026-09-01": "Day 5 · Video 3",
};

const byDay = new Map();
for (const r of rows) {
  if (!byDay.has(r.day)) byDay.set(r.day, { gw: 0, ai: 0 });
  byDay.get(r.day)[r.list === "AI class" ? "ai" : "gw"] += r.n;
}

console.log("date         GreatWork  AIclass   arc day");
console.log("-".repeat(56));
let gwRun = 0, aiRun = 0;
const days = [...byDay.keys()].sort();
const first = new Date(days[0]), last = new Date(days[days.length - 1]);
for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
  const key = d.toISOString().slice(0, 10);
  const v = byDay.get(key) || { gw: 0, ai: 0 };
  gwRun += v.gw; aiRun += v.ai;
  const mark = ARC[key] ? "   <- " + ARC[key] : "";
  const line = `${key}   ${String(v.gw).padStart(5)}      ${String(v.ai).padStart(4)}${mark}`;
  if (v.gw || v.ai || ARC[key]) console.log(line);
}
console.log("-".repeat(56));
console.log(`totals       ${String(gwRun).padStart(5)}      ${String(aiRun).padStart(4)}`);

// ---- channel breakdown -------------------------------------------------
// Source is written as `base:channel` from 2026-09-02, e.g. waitlist-page:whatsapp.
// Rows written before that have no colon and report as "untagged (pre-2026-09-02)".
const chan = await sql`
  SELECT
    CASE WHEN source ILIKE 'aimastery%' THEN 'AI class' ELSE 'Great Work' END AS list,
    COALESCE(NULLIF(split_part(source, ':', 2), ''), 'untagged (pre-2026-09-02)') AS channel,
    COUNT(*)::int AS n
  FROM course_waitlist
  GROUP BY 1, 2
  ORDER BY 1, 3 DESC
`;

console.log("\nBY CHANNEL");
console.log("-".repeat(56));
let list = null;
for (const r of chan) {
  if (r.list !== list) { list = r.list; console.log(`\n${list}`); }
  console.log(`  ${r.channel.padEnd(30)} ${String(r.n).padStart(4)}`);
}
console.log("\nTag a link with ?src=whatsapp | ig-story | ig-bio | tiktok | x");
