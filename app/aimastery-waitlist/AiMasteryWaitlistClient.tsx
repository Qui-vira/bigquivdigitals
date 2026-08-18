"use client";

import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { RiseWords } from "@/components/TextMotion";

/**
 * One question, answered: why join.
 *
 * Rewritten 2026-08-19 on the owner's instruction. The first version described
 * the course, the films, the archive and the brand-work disclaimer. None of that
 * answers why a stranger should hand over an email today, so all of it is gone.
 *
 * WHAT IS LEFT IS THE BET, AND IT LEADS. He has said publicly that he will earn
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
 */
export function AiMasteryWaitlistClient({ cap }: { cap: number }) {
  const [joined, setJoined] = useState(false);

  return (
    <main className="px-6 pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-[620px]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">AI Mastery</p>

        <RiseWords
          as="h1"
          className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-5xl"
        >
          If I fail, you get it free.
        </RiseWords>

        <p className="mt-8 text-lg leading-relaxed text-text-secondary">
          I said I would earn <span className="font-semibold text-text-primary">$10,000 in 60 days</span>{" "}
          using nothing but this skill. In public. Starting from zero.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          If I miss it, the first{" "}
          <span className="font-semibold text-text-primary">{cap} people on this list</span> get the
          course free. Not a discount. Free.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          Because I will have just proved the skill does not work, and I am not charging you for
          that.
        </p>

        <div className="mt-10">
          <WaitlistForm source="aimastery-waitlist" onSuccess={() => setJoined(true)} />

          {joined ? (
            <p className="mt-4 text-text-secondary">
              You are in. Nothing else to do. Whichever way it goes on day 60, you hear from me
              first.
            </p>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Email only. It is not open yet, so there is nothing to pay.
            </p>
          )}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-text-muted">
          Day 60 is 22 October 2026. You will know either way, because I am posting the number every
          week until then.
        </p>
      </div>
    </main>
  );
}
