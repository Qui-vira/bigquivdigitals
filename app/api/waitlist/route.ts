import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { addToWaitlistSegment } from "@/lib/resend-contacts";

/**
 * The Great Work waitlist capture.
 *
 * ORDER MATTERS: Resend first, Supabase second.
 *
 * Resend is the only one of the two that can actually reach a subscriber, so
 * it is the write that decides whether this request succeeded. Supabase is the
 * durable record and is written second, best-effort.
 *
 * This was the other way round until 2026-08-14, when Supabase started
 * returning HTTP 402 `exceed_egress_quota` at the organisation level — 11.3 GB
 * against a 5 GB monthly allowance, burned by an unrelated trading bot sharing
 * the org. Egress is cumulative per billing cycle, so it cannot be freed by
 * deleting rows; the project stays restricted until the cycle resets. With the
 * old order, every signup during that window would have been rejected and lost
 * even though Resend was healthy the whole time.
 *
 * A signup is therefore accepted if EITHER store took it. Losing a subscriber
 * to someone else's quota is the worst outcome available here.
 *
 * `course_waitlist` is used rather than the existing `waitlist` table: that one
 * requires telegram_user_id NOT NULL because it belongs to the bot, so an
 * email-only web form cannot write to it.
 *
 * A duplicate email is treated as success. Telling a visitor "you are already
 * on this list" leaks who is on it, and re-submitting is not an error from
 * their side.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const source = typeof body.source === "string" ? body.source.slice(0, 40) : "homepage";

  if (!email || !EMAIL.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Enter an email address we can reach you on." },
      { status: 400 }
    );
  }

  const clean = email.toLowerCase();

  // 1 · Resend. The only store that can actually reach this person, so it is
  //     what decides success. addToWaitlistSegment never throws.
  const inResend = await addToWaitlistSegment(clean);

  // 2 · Supabase, best-effort. Cannot fail the request on its own.
  //     Service-role, not anon: course_waitlist has RLS enabled with no
  //     policies, so the anon key cannot insert. This route is server-only.
  let inSupabase = false;
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("course_waitlist")
      .insert({ email: clean, source });

    // 23505 = unique violation. Already on the list, which is a success here.
    if (!error || error.code === "23505") {
      inSupabase = true;
    } else {
      console.error(`[waitlist] supabase insert failed for ${clean}:`, error.message);
    }
  } catch (e) {
    console.error(`[waitlist] supabase threw for ${clean}:`, e);
  }

  // Only a real failure when BOTH stores refused it.
  if (!inResend && !inSupabase) {
    console.error(`[waitlist] TOTAL FAILURE, ${clean} saved nowhere`);
    return NextResponse.json(
      { error: "Could not save that. Try again in a moment." },
      { status: 500 }
    );
  }

  // Half-failures are logged so the reconcile job knows there is work to do.
  if (!inResend) console.warn(`[waitlist] ${clean} in Supabase but NOT reachable by email`);
  if (!inSupabase) console.warn(`[waitlist] ${clean} in Resend but NOT in Supabase`);

  return NextResponse.json({ ok: true });
}
