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
 * ⚠ THE PRICE IS A PLACEHOLDER AND MUST BE SET BEFORE THIS GOES LIVE.
 * See the constant in the client component. The April 2026 cohort ran $15 / $30 /
 * $50 tiers, that structure is stale, and nothing has replaced it. It is not
 * guessed here.
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
  return <AiMasteryClient />;
}
