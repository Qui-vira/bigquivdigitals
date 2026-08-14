import { Resend } from "resend";

/**
 * Mirrors waitlist signups into Resend so broadcasts can be sent to them.
 *
 * Supabase stays the source of truth. Resend is a copy that exists only so the
 * owner can write an email in the Resend dashboard, pick a segment and press
 * send — without a developer in the loop twice a week.
 *
 * Resend's Audiences API is deprecated in favour of Segments (checked against
 * the docs 2026-08-12). Contacts now live at the account level and segments
 * group them, so `segments: [id]` on create is what places a contact on a list.
 */

/**
 * Trimmed deliberately. `vercel env add` reading from a heredoc or `<<<`
 * appends a trailing newline to the stored value, and Resend then rejects the
 * segment with "The `id` must be a valid UUID" — a failure that only shows up
 * in production runtime logs, never locally or at build time. Set values with
 * `printf '%s'` and trim on read, so neither mistake can break a signup.
 */
const SEGMENT_ID = () => (process.env.RESEND_WAITLIST_SEGMENT_ID || "").trim();

/**
 * Add someone to the waitlist segment.
 *
 * Never throws. A signup must succeed even if Resend is down — losing a
 * subscriber to a third-party outage is a far worse outcome than a contact
 * that has to be picked up later by the backfill script.
 *
 * Returns true only when Resend confirmed the write, so callers can log the
 * difference between "synced" and "left for the backfill".
 */
export async function addToWaitlistSegment(
  email: string,
  firstName?: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const segmentId = SEGMENT_ID();

  if (!apiKey || !segmentId) {
    console.warn("[resend] RESEND_API_KEY or RESEND_WAITLIST_SEGMENT_ID not set — contact not synced");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    // Resend treats a repeat email as an update rather than an error, so this
    // is safe to call on every signup and safe to re-run in bulk.
    //
    // `segments` takes objects, not bare id strings — verified against the
    // resend@6.12.4 typings (`segments?: { id: string }[]`). An earlier version
    // of this file passed `[segmentId]` and silenced the resulting type error
    // with a cast, so every write failed at runtime with
    // "Invalid input: expected object, received string". Do not reintroduce
    // the cast; it is what hid the bug.
    const { error } = await resend.contacts.create({
      email: email.toLowerCase(),
      firstName,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });

    if (error) {
      console.error(`[resend] contact sync failed for ${email}:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[resend] contact sync threw for ${email}:`, e);
    return false;
  }
}
