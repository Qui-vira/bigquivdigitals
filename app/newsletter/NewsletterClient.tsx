"use client";

import { useState } from "react";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/waitlist.css";
import "./newsletter.css";

/**
 * Form first, on the navy stage, like the v3 waitlists. The 3D stack of sheets
 * (scenes/docStack.ts) carries the first issues' real subjects from the plan.
 */
const SHEETS = {
  sheets: [
    { k: "Issue 1", t: "Claude Code = your video editor" },
    { k: "Issue 2", t: "Your logo in 3D, in 10 minutes" },
    { k: "Issue 3", t: "5 free AI tools I use every day" },
  ],
};

export function NewsletterClient() {
  const [joined, setJoined] = useState(false);

  return (
    <div className="v3 v3-course v3-wl-page v3-nl-page">
      <Stage
        scene="docStack"
        params={SHEETS}
        ground="navy"
        height={300}
        heightPhone={260}
        mark="SUNDAY"
        fallback="/v3/stills/docStack.webp"
        label="The Build Log newsletter"
      >
        <div className="v3-cintro">
          <div className="v3-cintro__main v3-aimw">
            <h1 id="nl-title" className="v3-cintro__h v3-aimw__h v3-display" data-lift>
              One AI build. Every Sunday.
            </h1>
            <div className="v3-aimw__rest" data-intro-rest>
              <div className="v3-aimw__copy">
                <p>
                  Every week I build something real with AI: a reel, a 3D graphic, a trading tool, a website.
                </p>
                <p>
                  On Sunday you get <span className="mark">the exact prompts</span>, the real result and what broke.
                  Copy it the same day.
                </p>
              </div>
              <div className="v3-aimw__form">
                <WaitlistForm source="newsletter" endpoint="/api/newsletter" buttonLabel="Get the Sunday email" onSuccess={() => setJoined(true)} compact />
                {joined ? (
                  <p role="status" className="v3-wl__done">
                    <span aria-hidden="true" className="v3-wl__tick">
                      <svg viewBox="0 0 20 20" fill="none">
                        <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
                      </svg>
                    </span>
                    <span>
                      You are in. Your first email comes on Sunday. While you wait:{" "}
                      <Link href="/doc/five-free-ai-tools">the 5 free AI tools I use every day</Link>.
                    </span>
                  </p>
                ) : (
                  <p className="v3-formnote">Free. One email a week. Leave any time with one click.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.17,0.22,0.38,0.42" data-side="left">
          The exact prompts.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.45,0.5,0.65,0.69" data-side="right">
          What broke, too.
        </h2>
        <p className="v3-wl-page__endline v3-display" data-at="0.8,0.85,0.97,1">
          The Build Log by Big Quiv.
        </p>
        <div className="v3-endcta" data-at="0.82,0.87,0.98,1">
          <a href="#top" className="v3-btn v3-btn--lg">
            Get the Sunday email <Arrow />
          </a>
        </div>
      </Stage>

      <section className="v3-section v3-section--paper v3-wl-page__day" data-nav="cloud" data-panel aria-label="What you get">
        <div className="v3-wrap">
          <p className="v3-wl-page__day-p v3-title" data-fade>
            Every prompt in it is one I ran myself that week. Every number has its source. If it did not work, I say so.
          </p>
        </div>
      </section>
    </div>
  );
}
