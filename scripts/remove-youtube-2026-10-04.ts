/**
 * He has no YouTube channel (owner, 2026-10-04). Two Turso rows said otherwise:
 *
 *   social_links id 5      "YouTube" -> https://youtube.com/@big_quiv, rendered in
 *                          the shared footer by components/FooterServer.tsx.
 *                          Deleted. The full row is printed first so it can be
 *                          re-inserted by hand if ever needed.
 *   about_ecosystem id 1   "Authority content across X, LinkedIn, TikTok,
 *                          Instagram, YouTube, and Facebook." YouTube dropped.
 *
 * Each statement only fires on a row that still holds the old value, so running
 * this twice is a no-op. Rows are printed before and after.
 *
 * Run: npx tsx scripts/remove-youtube-2026-10-04.ts
 */
import { createClient } from "@libsql/client";

const OLD_ECOSYSTEM = "Authority content across X, LinkedIn, TikTok, Instagram, YouTube, and Facebook.";
const NEW_ECOSYSTEM = "Authority content across X, LinkedIn, TikTok, Instagram and Facebook.";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const dump = async (label: string) => {
    const s = await db.execute("select * from social_links order by sort_order");
    const e = await db.execute("select * from about_ecosystem where id = 1");
    console.log(label, "social_links", JSON.stringify(s.rows));
    console.log(label, "about_ecosystem#1", JSON.stringify(e.rows));
  };

  await dump("BEFORE");

  const del = await db.execute({
    sql: "delete from social_links where id = 5 and name = 'YouTube' and href = 'https://youtube.com/@big_quiv'",
    args: [],
  });
  console.log(`social_links id 5: ${del.rowsAffected} deleted`);

  const upd = await db.execute({
    sql: "update about_ecosystem set description = ? where id = 1 and description = ?",
    args: [NEW_ECOSYSTEM, OLD_ECOSYSTEM],
  });
  console.log(`about_ecosystem id 1: ${upd.rowsAffected} updated`);

  await dump("AFTER");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
