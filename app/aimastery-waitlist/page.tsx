import type { Metadata } from "next";
import { AiMasteryWaitlistClient } from "./AiMasteryWaitlistClient";

/**
 * The AI Mastery waitlist. Sibling of /greatwork-waitlist, added 2026-08-18.
 *
 * Two courses are sold, so there are two lists and two links. The old /waitlist
 * path was renamed to /greatwork-waitlist on the same day and 308s there, so
 * every link already sitting in a bio keeps working.
 *
 * WHY THIS EXISTS SEPARATELY FROM /aimastery. The sales page argues the case at
 * length and, once AIMASTERY_OPEN is true, sells. This is the short link that
 * goes in a bio, a Story or a DM during the 60-day challenge. Someone arriving
 * from a video about a $300 ad does not need the full page to leave an email.
 *
 * WHAT IT COMMITS TO. Exactly two things, both of which the owner has actually
 * said out loud: first access, and the free-access promise if the 60-day target
 * is missed. There is no lead magnet here. The Great Work's list hands over the
 * Opportunity Map on signup; no equivalent asset exists for this course yet, and
 * inventing one to fill the slot would be promising something that does not
 * exist. When one is built, add it and say so.
 *
 * SIGNUPS land in `course_waitlist` with source `aimastery-waitlist`, and in the
 * AI Mastery Resend segment rather than The Great Work's. See lib/resend-contacts.
 *
 * VISIBLE since 2026-08-20 (owner's instruction, night the 60-day challenge
 * teaser posted): indexed, in the sitemap, linked from the footer. The promise
 * video's stake points people at "my waitlist" — this page has to be findable.
 * The /aimastery SALES page stays unlisted; only the waitlist went public.
 */
export const metadata: Metadata = {
  title: "AI Mastery waitlist | BigQuiv Digitals",
  description:
    "A small private list. First access when it opens, and free access to the first 100 if the 60-day target is missed.",
  alternates: { canonical: "/aimastery-waitlist" },
  openGraph: {
    title: "AI Mastery waitlist",
    description: "Make ads, films and content with AI. No camera, no crew, no budget.",
    type: "website",
    url: "/aimastery-waitlist",
  },
};

export default function AiMasteryWaitlistPage() {
  /**
   * The cap is read from the environment rather than hardcoded because it is a
   * public promise with a real cost attached. If it ever changes it must change
   * in one place, and it must never be possible for the page to say 100 while a
   * video says something else.
   *
   * Falls back to 100, which is the number in the launch scripts.
   */
  const cap = Number(process.env.AIMASTERY_FREE_CAP?.trim() || "100");

  return <AiMasteryWaitlistClient cap={Number.isFinite(cap) && cap > 0 ? cap : 100} />;
}
