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
 *   unset / anything but "true"  — closed. Every CTA is a waitlist form and no
 *                                  price is rendered anywhere on the page.
 *   "true"                       — open. CTAs sell and the price shows.
 *
 * Closed is the default on purpose. The 60-day challenge driving traffic here
 * runs 24 Aug to 22 Oct 2026 and this opens partway through it, around day 20 to
 * 30. The stake in the launch videos is "the first hundred people on my waitlist
 * get the class free", so the list has to exist and be filling before any price
 * appears. Signups land in `course_waitlist` with source `aimastery`, and in
 * their own Resend segment so they never receive a Great Work broadcast.
 *
 * TO OPEN IT: set AIMASTERY_OPEN=true in Vercel AND remove robots.index:false
 * below, in the same change. One without the other gives you either a sales page
 * nobody can find or a findable page that cannot sell.
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
   * Read server-side rather than as NEXT_PUBLIC_*, so opening the class is a
   * dashboard toggle plus a redeploy and never a code change. Strict equality
   * against "true" so a stray value cannot accidentally put a price on the page.
   */
  const isOpen = process.env.AIMASTERY_OPEN?.trim() === "true";

  return <AiMasteryClient isOpen={isOpen} />;
}
