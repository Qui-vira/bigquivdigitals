import { CourseClient } from "@/components/CourseClient";

export const revalidate = 60;

/**
 * /greatwork — The Great Work.
 *
 * ⚠ BUILT UNLISTED, ON PURPOSE. Nothing links here: not the nav, not the footer,
 * not the sitemap, and `robots` below tells crawlers to stay out. The launch arc
 * runs 30 days and the "Available Now" beat is around Day 24. A live priced page
 * before then kills the waitlist it exists to convert — anyone who finds the full
 * offer has no reason to join a list to be told about it later.
 *
 * TO GO LIVE: delete the `robots` block, add /greatwork to app/sitemap.ts, and link
 * it from the nav. Nothing else needs to change.
 *
 * Copy lives in the client component rather than the database, matching /services
 * (the newest page) rather than the older DB-driven pages. There is one offer and
 * one price; a CMS round-trip buys nothing here.
 *
 * CLAIM DISCIPLINE. Everything on this page is either the product itself or a
 * public post with a live link. No testimonials — the one parked for this page
 * (testimonials id=3) needs its attribution reframed off a retired product
 * name first, and its consent flag is unresolved. No win rates, no student counts, no earnings promises.
 * The two student results are attributed to the posts that carried them, with
 * dates, metrics and URLs, so a stranger can check them in one click.
 *
 * NO REFUND COPY ANYWHERE. Owner's decision, 2026-08-16: "don't say anything
 * about refunds, it is unnecessary." Do not helpfully add a guarantee line.
 */
export const metadata = {
  title: "The Great Work | BigQuiv Digitals",
  description:
    "Confusion to skill to proof to visibility to money. A seven-part system for turning what you already know into customers, deals and income.",
  alternates: { canonical: "/greatwork" },
  robots: { index: false, follow: false },
};

export default function CoursePage() {
  return <CourseClient />;
}
