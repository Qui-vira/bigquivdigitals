import type { Metadata } from "next";
import { NewsletterClient } from "./NewsletterClient";

/**
 * The Build Log, Big Quiv's weekly newsletter (added 2026-11-20 on the owner's
 * instruction: "I need to start building my email list ... very educational,
 * authoritative and informative").
 *
 * WHAT IT PROMISES. Only what the plan in ContentBrain/06-Drafts/2026-11-20-email-list-plan.md
 * commits to: one email every Sunday with one thing he built that week, the
 * exact prompts, the real result and what broke. The sign-up gift is the
 * 5 free AI tools page, which already exists at /doc/five-free-ai-tools.
 *
 * A SEPARATE LIST. Sign-ups go to the Resend segment "The Build Log newsletter"
 * through /api/newsletter, never to a course waitlist (owner: "It's not the same
 * thing").
 */
export const metadata: Metadata = {
  title: "The Build Log newsletter | BigQuiv Digitals",
  description:
    "One email every Sunday: one thing I built with AI that week, the exact prompts, the real result and what broke.",
  alternates: { canonical: "/newsletter" },
  openGraph: {
    title: "The Build Log by Big Quiv",
    description: "One AI build every Sunday, with the exact prompts. Free.",
    type: "website",
    url: "/newsletter",
  },
};

export default function NewsletterPage() {
  return <NewsletterClient />;
}
