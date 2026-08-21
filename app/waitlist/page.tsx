import type { Metadata } from "next";
import Link from "next/link";

/**
 * /waitlist — the chooser.
 *
 * Until 2026-08-20 this path 308-redirected to /greatwork-waitlist ("it points
 * at The Great Work because that is what it always was"). The owner killed the
 * redirect the night the 60-day challenge launched: two courses share the word
 * "waitlist", and sending a bare /waitlist click silently to either one puts
 * half the arrivals in the wrong room. Now the path names the choice instead of
 * making it for them.
 *
 * ⚠ The old redirect was permanent (308), and browsers cache those. Anyone who
 * clicked /waitlist before tonight may keep landing on /greatwork-waitlist
 * until their cache expires. Nothing to do about that; fresh clicks get this.
 */
export const metadata: Metadata = {
  title: "Join a waitlist | BigQuiv Digitals",
  description:
    "Two courses, two waitlists. AI Mastery for building a paying skill with AI. The Great Work for turning the skill you have into income.",
  alternates: { canonical: "/waitlist" },
};

const doors = [
  {
    href: "/aimastery-waitlist",
    eyebrow: "AI Mastery",
    promise: "Make ads, films and content with AI. No camera, no crew, no budget.",
    detail:
      "The 60-day challenge list. First 100 on it get the class free if I miss my target.",
  },
  {
    href: "/greatwork-waitlist",
    eyebrow: "The Great Work",
    promise: "You already have the skill. Nobody showed you where the money is.",
    detail: "Seven weeks. One session a week. We build your thing together.",
  },
];

export default function WaitlistChooserPage() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-20 md:py-28">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Two courses, two lists
      </p>
      <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary md:text-5xl">
        Pick the one you came for.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-text-secondary">
        They are different rooms. One gives you a skill. The other turns the
        skill you already have into income.
      </p>

      <div className="mt-10 grid gap-6">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="group block rounded-lg border border-border bg-bg-secondary p-7 transition-colors hover:border-accent/60"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              {door.eyebrow}
            </p>
            <p className="mt-3 text-xl font-bold leading-snug text-text-primary">
              {door.promise}
            </p>
            <p className="mt-3 text-base leading-relaxed text-text-secondary">
              {door.detail}
            </p>
            <p className="mt-5 text-sm font-semibold text-accent">
              Join this waitlist{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
