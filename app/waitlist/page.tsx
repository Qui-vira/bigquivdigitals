import type { Metadata } from "next";
import Link from "next/link";
import { FILMS } from "@/lib/films";
import { Stage } from "@/components/v3/stage/Stage";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/waitlist.css";

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
 * V3 REBUILD 2026-10-19 (comp: Waitlist.dc.html). The two doors open the
 * navy stage, where the AI Mastery phone and The Great Work's book stand side
 * by side (scenes/book.ts, preset "pair"), turn toward each other, and take
 * turns stepping forward as the line about the two rooms lands. The doors
 * come back at the end of the stage. Copy unchanged.
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

/** The pair on the stage: the phone shows a poster only, nothing plays here. */
const PAIR_PARAMS = {
  preset: "pair",
  cover: { title: "The Great Work", by: "Big Quiv" },
  phone: {
    label: "AI Mastery",
    films: [{ img: FILMS.burgerking.img, title: FILMS.burgerking.title, runtime: FILMS.burgerking.runtime }],
  },
};

function Doors({ className = "" }: { className?: string }) {
  return (
    <div className={`v3-doors ${className}`}>
      {doors.map((door) => (
        <Link key={door.href} href={door.href} className="v3-door" data-cursor="View" data-flood>
          <h2 className="v3-door__t v3-display">{door.eyebrow}</h2>
          <p className="v3-door__promise">{door.promise}</p>
          <p className="v3-door__detail">{door.detail}</p>
          <span className="v3-door__go">
            Join this waitlist <span aria-hidden="true">&rarr;</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function WaitlistChooserPage() {
  return (
    <div className="v3 v3-course v3-wl-page v3-choose">
      <Stage scene="book" params={PAIR_PARAMS} ground="navy" height={380} heightPhone={340} mark="PICK ONE" label="Join a waitlist">
        <div className="v3-choose__intro">
          <div className="v3-choose__top">
            <h1 id="chooser-title" className="v3-choose__h v3-display" data-lift>
              Pick the one you <span className="mark">came for.</span>
            </h1>
            <p className="v3-choose__p" data-intro-rest>
              They are different rooms. One gives you a skill. The other turns the skill you already have into income.
            </p>
          </div>
          <div className="v3-choose__bottom" data-intro-rest>
            <p className="v3-hand v3-choose__hand" aria-hidden="true">
              one or the other
            </p>
            <Doors />
            <p className="v3-choose__label">Two courses, two lists</p>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.13,0.18,0.36,0.4" data-side="high">
          They are different rooms.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.42,0.47,0.6,0.64" data-side="right">
          One gives you a skill.
        </h2>
        <h2 className="v3-ghost v3-choose__ghost" data-ghost="0.67,0.71,0.84,0.88" data-side="left">
          The other turns the skill you already have into income.
        </h2>
        <div className="v3-endcta v3-choose__end" data-at="0.88,0.92,0.99,1">
          <Doors className="v3-doors--end" />
        </div>
      </Stage>
    </div>
  );
}
