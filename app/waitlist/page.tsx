import type { Metadata } from "next";
import Link from "next/link";
import { HandNote, PaperSection, Sticker } from "@/components/ui-paper";

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
 *
 * PAPER REDESIGN 2026-10-05: the two doors are two framed tickets side by side.
 * Copy unchanged.
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
      "The 60-day challenge list. The first 100 on it get the class free.",
  },
  {
    href: "/greatwork-waitlist",
    eyebrow: "The Great Work",
    promise: "You already have the skill. Nobody showed you where the money is.",
    detail: "Seven weeks. One session a week. We build your thing together.",
  },
];

const DOOR_STYLE = [
  { tilt: -1.4, tone: "bg-paper", tag: "gold" as const },
  { tilt: 1.2, tone: "bg-gold-tint", tag: "paper" as const },
];

export default function WaitlistChooserPage() {
  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        aria-labelledby="chooser-title"
        innerClassName="pb-24 pt-[calc(4rem+2.75rem)] md:pb-32 md:pt-[calc(4.5rem+4.5rem)]"
      >
        <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
          Two courses, two lists
        </Sticker>
        <h1
          id="chooser-title"
          className="load-drop mt-7 font-didone text-[clamp(3.2rem,9vw,6.4rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance"
        >
          Pick the one you came for.
        </h1>
        <p className="mt-7 max-w-[52ch] text-lg leading-relaxed text-ink-soft md:text-xl">
          They are different rooms. One gives you a skill. The other turns the skill you already have into income.
        </p>

        <div className="relative mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2">
          <HandNote
            arrow="down"
            arrowAt="below"
            tilt={-4}
            className="absolute -top-16 left-1/2 hidden -translate-x-1/2 lg:inline-flex"
            arrowClassName="ml-8 !w-[40px]"
          >
            one or the other
          </HandNote>
          {doors.map((door, i) => (
            <Link
              key={door.href}
              href={door.href}
              className={`group relative block border-[3px] border-ink p-7 pt-12 shadow-brutal transition-[translate,rotate,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:[rotate:0deg] hover:shadow-brutal-lg sm:p-9 sm:pt-14 ${DOOR_STYLE[i].tone}`}
              style={{ rotate: `${DOOR_STYLE[i].tilt}deg` }}
            >
              <Sticker
                shape="label"
                tone={DOOR_STYLE[i].tag}
                tilt={i === 0 ? -3 : 3}
                decorative={false}
                className="absolute -top-4 left-6"
              >
                {door.eyebrow}
              </Sticker>
              <p className="font-didone text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.08] text-ink">
                {door.promise}
              </p>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">{door.detail}</p>
              <p className="mt-8 inline-flex items-center gap-2 border-b-[3px] border-ink pb-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink transition-[gap] duration-200 group-hover:gap-3.5">
                Join this waitlist <span aria-hidden="true">&rarr;</span>
              </p>
            </Link>
          ))}
        </div>
      </PaperSection>
    </div>
  );
}
