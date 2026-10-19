"use client";

import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FILMS } from "@/lib/films";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/waitlist.css";

/**
 * One question, answered: why join.
 *
 * Rewritten 2026-08-19 on the owner's instruction. The first version described
 * the course, the films, the archive and the brand-work disclaimer. None of that
 * answers why a stranger should hand over an email today, so all of it is gone.
 *
 * 2026-09-29, owner: the class is free for the first 100 on this list, with no condition
 * (Script 2 "Show, DON'T PROMPT" says "free for the first 100 people"). The headline and
 * the promise below were changed from the earlier bet ("If I fail, you get it free").
 *
 * WHAT WAS HERE BEFORE: THE BET. He has said publicly that he will earn
 * $10,000 in 60 days using this skill. If he misses, the first N people on this
 * list get the course free. That is a specific, dated, costly promise, and it is
 * the only thing on this page that a stranger cannot get anywhere else.
 *
 * WHAT IS DELIBERATELY ABSENT
 *
 *   Testimonials. Seven exist in the database and not one is about this course.
 *   They cover signals, content strategy, consulting, community and a retired
 *   dev accelerator. Borrowing one would be worse than having none.
 *
 *   The films. They belong on /aimastery, which is the page that argues the
 *   case. This page is a door, not an argument.
 *
 *   A price. The class is not open. A number on a page that cannot take payment
 *   gets quoted back at you later.
 *
 *   A founding-price promise. The Great Work's waitlist commits to one. Nothing
 *   equivalent has been committed to here, so nothing is claimed. Add it the day
 *   it is decided and it becomes the third reason.
 *
 * V3 REBUILD 2026-10-19 (comp: AIMasteryWaitlist.dc.html). Form first: the
 * statement and the form sit on the navy stage before any scroll, the AI
 * Mastery phone small beside them (scenes/phone.ts, preset "small", posters
 * only so nothing slows the sign-up). The cap still comes from the server
 * (AIMASTERY_FREE_CAP) and appears only where the copy already put it.
 * Rendered inside the layout's <main>, so the root here is a div.
 */

/** The phone shows posters only: a waitlist never waits on a video. */
const PHONE_PARAMS = {
  preset: "small",
  label: "AI Mastery",
  films: [FILMS.burgerking, FILMS.gucci, FILMS.lexus].map((f) => ({ img: f.img, title: f.title, runtime: f.runtime })),
  at: [0, 0.4, 0.7],
};

export function AiMasteryWaitlistClient({ cap }: { cap: number }) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="v3 v3-course v3-wl-page">
      <Stage scene="phone" params={PHONE_PARAMS} ground="navy" height={400} heightPhone={360} mark="FREE" label="AI Mastery waitlist">
        <div className="v3-cintro">
          <div className="v3-cintro__main v3-aimw">
            <h1 id="aimw-title" className="v3-cintro__h v3-aimw__h v3-display" data-lift>
              {`Free for the first ${cap}.`}
            </h1>
            <div className="v3-aimw__rest" data-intro-rest>
              <div className="v3-aimw__copy">
                <p>
                  I said I would earn <span className="mark">$10,000 in 60 days</span> using nothing but this skill. In
                  public. Starting from zero.
                </p>
                <p>
                  The first <b>{cap} people on this list</b> get the class free. Not a discount. Free.
                </p>
              </div>
              <div className="v3-aimw__form">
                <WaitlistForm source="aimastery-waitlist" onSuccess={() => setJoined(true)} compact />
                {joined ? (
                  <p role="status" className="v3-wl__done">
                    <span aria-hidden="true" className="v3-wl__tick">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
                      </svg>
                    </span>
                    You are in. Nothing else to do. When it opens, you hear from me first.
                  </p>
                ) : (
                  <p className="v3-formnote">Email only. It is not open yet, so there is nothing to pay.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.17,0.22,0.38,0.42" data-side="left">
          In public. Starting from zero.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.45,0.5,0.65,0.69" data-side="right">
          Not a discount. Free.
        </h2>
        <p className="v3-wl-page__endline v3-display" data-at="0.8,0.85,0.97,1">
          Day 60 is 22 October 2026.
        </p>
        <div className="v3-endcta" data-at="0.82,0.87,0.98,1">
          <a href="#top" className="v3-btn v3-btn--lg">
            Join the waitlist <Arrow />
          </a>
        </div>
      </Stage>

      {/* ───────── DAY 60, and the form again ───────── */}
      <section className="v3-section v3-section--paper v3-wl-page__day" data-nav="cloud" data-panel aria-label="Day 60">
        <div className="v3-wrap">
          <p className="v3-wl-page__day-p v3-title" data-fade>
            Day 60 is 22 October 2026. You will know either way, because I am posting the number every week until then.
          </p>
        </div>
      </section>
    </div>
  );
}
