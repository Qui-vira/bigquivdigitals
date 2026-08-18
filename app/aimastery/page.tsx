import { AiMasteryClient } from "@/components/AiMasteryClient";

export const revalidate = 60;

/**
 * /aimastery — AI Mastery. The second of two courses.
 *
 * Named by the owner on 2026-08-16. Before that it had no locked public name and
 * was referred to internally as "the AI course", which is also why the other
 * route was renamed from /course to /greatwork on the same day: two courses are
 * sold and "course" said nothing about which.
 *
 * ⚠ UNLISTED, same as /greatwork. No nav, no footer, no sitemap, robots
 * index:false. This one is a re-open rather than a launch — roughly 40 people
 * have already paid for this material with no sales page ever existing — but it
 * must not go live in the middle of The Great Work's 30-day arc. One launch at a
 * time on one audience.
 *
 * PRICE SET 2026-08-18 by the owner: $20, which is ₦27,000 at the official NFEM
 * rate of ₦1,354/$ that day. The constant lives in the client component. The
 * struck-through ₦50,000 is still unverified — see the warning beside it.
 *
 * OPEN OR CLOSED, decided by `AIMASTERY_OPEN`.
 *
 *   unset / anything but "false"  — OPEN. This is a sales page. Price shows,
 *                                   CTAs sell, the payment modal is mounted.
 *   "false"                       — closed. Every CTA becomes an email form and
 *                                   no price renders anywhere.
 *
 * OPEN IS THE DEFAULT, owner's decision 2026-08-19: "aimastery should show
 * pricing". Roughly 40 people bought this material with no sales page in
 * existence, so gating a finished page behind a waitlist turns buyers away for
 * no gain. Anyone who wants it now can have it now.
 *
 * The waitlist still exists at /aimastery-waitlist for people who are not ready
 * to buy. It is a different door for a different person, not a gate on this one.
 *
 * ⚠ THE TWO PAGES CONFLICT AND THE OWNER HAS BEEN TOLD. The waitlist promises
 * free access to the first 100 if the 60-day target is missed. Anyone who sees
 * both pages is better off joining the list and waiting than paying today. Do
 * not link this page to the waitlist, and do not repeat the free-access promise
 * here. If it ever needs resolving properly, the clean version is that buyers
 * are refunded on a miss rather than non-buyers getting it free — that rewards
 * buying instead of waiting.
 *
 * STILL UNLISTED. robots.index:false below, no nav, no footer, no sitemap. It
 * sells to anyone handed the link; it is not yet competing in search. Remove
 * that line when this is meant to be discoverable.
 *
 * CLAIM DISCIPLINE. Every piece of work referenced is a real published post with
 * a live link and a date. The spec ads are unofficial fan work — Gucci, Burger
 * King, McDonald's, Nike and Lexus did not commission, approve or pay for any of
 * it, and the page says so. Peaceway is the owner's father's pharmacy and is
 * never described as paid client work.
 */
export const metadata = {
  title: "AI Mastery | BigQuiv Digitals",
  description:
    "Make ads, films and content with AI. No camera, no crew, no budget. Built from a real body of published work.",
  alternates: { canonical: "/aimastery" },
  robots: { index: false, follow: false },
};

export default function AiMasteryPage() {
  /**
   * Open unless explicitly closed. Read server-side rather than as
   * NEXT_PUBLIC_*, so closing the class is a dashboard toggle plus a redeploy
   * and never a code change.
   *
   * The comparison is against "false" rather than "true" so that an unset or
   * mistyped variable leaves the page selling, which is the state the owner
   * asked for. A typo should not silently take the price off a sales page.
   */
  const isOpen = process.env.AIMASTERY_OPEN?.trim().toLowerCase() !== "false";

  return <AiMasteryClient isOpen={isOpen} />;
}
