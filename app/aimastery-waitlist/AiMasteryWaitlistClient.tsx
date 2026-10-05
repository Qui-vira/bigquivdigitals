"use client";

import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { HandMark, MonoLabel, PaperSection, Sticker, Tape } from "@/components/ui-paper";

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
 * PAPER REDESIGN 2026-10-05: one statement and one framed form on grid paper.
 * The cap still comes from the server (AIMASTERY_FREE_CAP) and appears only
 * where the copy already put it. Rendered inside the layout's <main>, so the
 * root here is a div (it was a nested <main>).
 */
export function AiMasteryWaitlistClient({ cap }: { cap: number }) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        width="mid"
        aria-labelledby="aimw-title"
        innerClassName="pb-24 pt-[calc(4rem+2.75rem)] md:pb-32 md:pt-[calc(4.5rem+4.5rem)]"
      >
        <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
          AI Mastery
        </Sticker>

        <h1
          id="aimw-title"
          className="load-drop relative mt-8 font-didone text-[clamp(3.6rem,13vw,8.6rem)] font-semibold leading-[0.9] tracking-[-0.01em] text-ink"
        >
          {`Free for the first ${cap}.`}
          <Sticker
            shape="starburst"
            tone="gold"
            size={110}
            tilt={14}
            reveal={false}
            className="load-settle ml-[0.1em] size-[0.6em]! align-top"
          />
        </h1>

        <div className="mt-12 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="text-lg leading-relaxed text-ink-soft md:text-xl">
              I said I would earn{" "}
              <span className="font-semibold text-ink">
                <HandMark kind="underline" load delay={900}>
                  $10,000 in 60 days
                </HandMark>
              </span>{" "}
              using nothing but this skill. In public. Starting from zero.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft md:text-xl">
              The first <span className="hl-mark font-semibold text-ink">{cap} people on this list</span> get the class
              free. Not a discount. Free.
            </p>
          </div>

          <div className="relative border-[3px] border-ink bg-paper p-6 pt-10 shadow-brutal-lg [rotate:-0.8deg] sm:p-8 sm:pt-11">
            <Tape className="-top-3.5 left-10" tilt={-5} />
            <WaitlistForm source="aimastery-waitlist" onSuccess={() => setJoined(true)} compact />

            {joined ? (
              <p
                role="status"
                className="flex items-start gap-3 border-[3px] border-ink bg-gold-tint px-4 py-3 font-semibold leading-relaxed text-ink shadow-brutal-sm"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-gold text-sm font-bold"
                >
                  ✓
                </span>
                You are in. Nothing else to do. When it opens, you hear from me first.
              </p>
            ) : (
              <MonoLabel as="p" caps={false} tone="soft" className="mt-5 text-[14px] leading-relaxed">
                Email only. It is not open yet, so there is nothing to pay.
              </MonoLabel>
            )}
          </div>
        </div>

        <p className="mt-16 max-w-[62ch] border-t-[3px] border-ink pt-6 font-typewriter text-[14px] leading-relaxed text-ink-soft">
          Day 60 is 22 October 2026. You will know either way, because I am posting the number every week until then.
        </p>
      </PaperSection>
    </div>
  );
}
