import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { addToWaitlistSegment } from "@/lib/resend-contacts";

/**
 * The Great Work waitlist capture.
 *
 * Writes to public.course_waitlist in Supabase, following the same pattern as
 * /api/drone-signup. It does NOT use the existing `waitlist` table: that one
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

  try {
    // Service-role, not anon: course_waitlist has RLS enabled with no
    // policies, so the anon key cannot insert. This route is server-only.
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("course_waitlist")
      .insert({ email: email.toLowerCase(), source });

    // 23505 = unique violation. Already on the list, which is a success here.
    if (error && error.code !== "23505") {
      console.error("waitlist insert failed:", error.message);
      return NextResponse.json(
        { error: "Could not save that. Try again in a moment." },
        { status: 500 }
      );
    }

    // Mirror into Resend so this address is reachable by a broadcast. Deliberately
    // awaited but never allowed to fail the request: Supabase already has the
    // address, and the backfill script picks up anything Resend missed.
    const synced = await addToWaitlistSegment(email.toLowerCase());
    if (!synced) {
      console.warn(`[waitlist] ${email} saved to Supabase but not synced to Resend`);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("waitlist route error:", e);
    return NextResponse.json(
      { error: "Could not save that. Try again in a moment." },
      { status: 500 }
    );
  }
}
