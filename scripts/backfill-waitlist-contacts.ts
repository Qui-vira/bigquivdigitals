/**
 * Push existing email addresses into the Resend waitlist segment.
 *
 * Two sources, deliberately kept apart:
 *   course_waitlist   — people who asked to hear about The Great Work
 *   course_purchases  — the 40 who bought AI Content Mastery (Apr–May 2026)
 *
 * The buyers opted in to a purchase, not to marketing. They are tagged
 * `source: purchase` so they can be addressed separately, and the first email
 * that reaches them should say plainly that they bought the AI course. Do not
 * silently fold them into a cold list.
 *
 * Idempotent: Resend treats a repeat email as an update, so re-running is safe
 * and is the intended way to catch anything the live signup path missed.
 *
 * Run: npx tsx --env-file=.env.local scripts/backfill-waitlist-contacts.ts
 *      npx tsx --env-file=.env.local scripts/backfill-waitlist-contacts.ts --dry
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const DRY = process.argv.includes("--dry");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SEGMENT_ID = process.env.RESEND_WAITLIST_SEGMENT_ID;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY,
  RESEND_API_KEY,
  RESEND_WAITLIST_SEGMENT_ID: SEGMENT_ID,
})) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
const resend = new Resend(RESEND_API_KEY!);

type Row = { email: string; source: "waitlist" | "purchase"; firstName?: string };

async function collect(): Promise<Row[]> {
  const rows = new Map<string, Row>();

  const { data: waitlist, error: wErr } = await supabase
    .from("course_waitlist")
    .select("email");
  if (wErr) throw new Error(`course_waitlist read failed: ${wErr.message}`);

  for (const r of waitlist ?? []) {
    const email = String(r.email || "").trim().toLowerCase();
    if (email) rows.set(email, { email, source: "waitlist" });
  }

  const { data: buyers, error: bErr } = await supabase
    .from("course_purchases")
    .select("email, first_name, status")
    .eq("status", "confirmed");
  if (bErr) throw new Error(`course_purchases read failed: ${bErr.message}`);

  for (const r of buyers ?? []) {
    const email = String(r.email || "").trim().toLowerCase();
    if (!email) continue;
    // Someone on both lists stays a waitlist contact — the softer of the two.
    if (rows.has(email)) continue;
    rows.set(email, {
      email,
      source: "purchase",
      firstName: r.first_name ? String(r.first_name) : undefined,
    });
  }

  return [...rows.values()];
}

async function main() {
  const rows = await collect();
  const waitlistCount = rows.filter((r) => r.source === "waitlist").length;
  const buyerCount = rows.filter((r) => r.source === "purchase").length;

  console.log(`${rows.length} unique addresses — ${waitlistCount} waitlist, ${buyerCount} buyers`);
  if (DRY) {
    console.log("dry run, nothing written");
    for (const r of rows) console.log(`  ${r.source.padEnd(8)} ${r.email}`);
    return;
  }

  let ok = 0;
  const failed: string[] = [];

  for (const row of rows) {
    // `segments` takes objects, not bare id strings — resend@6.12.4 types it as
    // `{ id: string }[]`. This previously passed `[SEGMENT_ID]` with a cast
    // silencing the type error, and every write failed at runtime with
    // "Invalid input: expected object, received string". Do not reintroduce
    // the cast; it is what hid the bug.
    const { error } = await resend.contacts.create({
      email: row.email,
      firstName: row.firstName,
      unsubscribed: false,
      segments: [{ id: SEGMENT_ID! }],
      properties: { source: row.source },
    });

    if (error) {
      failed.push(`${row.email}: ${error.message}`);
    } else {
      ok++;
    }
    // Resend's default rate limit is modest; this keeps well under it.
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`synced ${ok}/${rows.length}`);
  if (failed.length) {
    console.log(`failed ${failed.length}:`);
    for (const f of failed) console.log("  " + f);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
