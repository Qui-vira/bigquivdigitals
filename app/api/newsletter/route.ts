import { NextRequest, NextResponse } from "next/server";
import { addToNewsletterSegment } from "@/lib/resend-contacts";

/**
 * The Build Log sign-up (added 2026-11-20).
 *
 * Resend only. The newsletter is sent from Resend, so a contact Resend holds is
 * a reader who can be reached, and that is the whole job. Nothing is written to
 * `course_waitlist`: a newsletter reader is not waiting for a course, and the
 * waitlist counts must not grow because someone wanted the Sunday email.
 *
 * A duplicate email is a success, for the same reason as the waitlist route:
 * telling a visitor "you are already on this list" leaks who is on it.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter an email address we can reach you on." }, { status: 400 });
  }
  const ok = await addToNewsletterSegment(email.toLowerCase());
  if (!ok) {
    console.error(`[newsletter] could not save ${email.toLowerCase()}`);
    return NextResponse.json({ error: "Could not save that. Try again in a moment." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
