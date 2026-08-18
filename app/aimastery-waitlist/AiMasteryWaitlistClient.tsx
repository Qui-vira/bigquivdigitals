"use client";

import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { RiseWords } from "@/components/TextMotion";

/**
 * One job: take an email. Everything on the page either earns that or is cut.
 *
 * Three rules were applied and are worth keeping if this page is ever edited.
 *
 * 1. NOTHING IS PROMISED THAT DOES NOT EXIST. The Great Work's waitlist hands
 *    over the Opportunity Map on signup. There is no equivalent asset for this
 *    course, so this page promises first access and the free-access cap, and
 *    nothing else. A third bullet invented to balance the layout would be a
 *    promise nobody has made.
 *
 * 2. THE WORK IS THE ARGUMENT. The counts below are of real published pieces:
 *    21 verified AI-generated videos from the run between 27 April and 20 May
 *    2026, of which the longest holds a single character across 206 seconds.
 *    Both numbers come from a frame-by-frame verification of the archive, not
 *    from captions. Do not round them up.
 *
 * 3. NO BRAND IS IMPLIED. The spec ads in that run were unofficial. Gucci,
 *    Burger King, McDonald's, Nike and Lexus commissioned, approved and paid for
 *    nothing, and no page may suggest otherwise.
 *
 * NO PRICE APPEARS HERE. The class is not open. A number on a page that cannot
 * take payment gets quoted back at you later, and the owner has not committed to
 * a public price.
 */
export function AiMasteryWaitlistClient({ cap }: { cap: number }) {
  const [joined, setJoined] = useState(false);

  return (
    <main className="px-6 pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-[640px]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">AI Mastery</p>

        <RiseWords
          as="h1"
          className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-5xl"
        >
          No camera. No crew. No budget. Make the ad anyway.
        </RiseWords>

        <p className="mt-6 text-lg leading-relaxed text-text-secondary">
          21 films made with AI between April and May 2026. Ads, short films, one character held
          across 206 seconds. All of it on a laptop, and every piece is still up where you can watch
          it.
        </p>

        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          This is how it was done, start to finish. It is not open yet.
        </p>

        {/* ── what joining actually gets you ────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-text-primary">
            Two things, and that is all
          </p>

          <ul className="mt-5 space-y-4 text-text-secondary">
            <li className="flex gap-3">
              <span aria-hidden className="mt-1 text-accent">
                1
              </span>
              <span>
                <span className="font-semibold text-text-primary">You hear first.</span> When it
                opens, this list is told before anything is posted publicly.
              </span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-1 text-accent">
                2
              </span>
              <span>
                <span className="font-semibold text-text-primary">
                  If I miss the 60-day target, the first {cap} people here get it free.
                </span>{" "}
                I said I would earn $10,000 in 60 days using this skill. If I do not, the first {cap}{" "}
                on this list pay nothing, because I will have just proved the skill did not work.
              </span>
            </li>
          </ul>
        </div>

        {/* ── the form ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <WaitlistForm source="aimastery-waitlist" onSuccess={() => setJoined(true)} />

          {joined ? (
            <p className="mt-4 text-text-secondary">
              You are on the list. Nothing else to do. You will hear from me before anyone else does.
            </p>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              Email only. No price yet, because it is not open yet.
            </p>
          )}
        </div>

        <p className="mt-12 text-sm leading-relaxed text-text-muted">
          The brand work in that run was unofficial. Gucci, Burger King, McDonald&rsquo;s, Nike and
          Lexus did not commission, approve or pay for any of it. It was made to find out whether it
          could be, and it is shown here for that reason and no other.
        </p>
      </div>
    </main>
  );
}
