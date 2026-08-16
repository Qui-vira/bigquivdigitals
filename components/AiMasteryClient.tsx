"use client";

import { useState } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionWrapper } from "@/components/SectionWrapper";
import { RiseWords } from "@/components/TextMotion";
import { PaymentModal } from "@/components/PaymentModal";

/**
 * AI Mastery sales page. Same section order as /greatwork, which follows the
 * reference page the owner chose (100launchscripts.com).
 *
 * ⚠⚠ PRICE IS A PLACEHOLDER. The owner has not set it. The April 2026 cohort ran
 * $15 / $30 / $50 tiers; that structure is stale and nothing replaced it. This
 * number is NOT a recommendation and NOT researched — it exists so the page
 * renders. Set it before this ever goes live. The page is unlisted and noindexed
 * in the meantime, so nobody can reach it and be misled.
 *
 * The curriculum section describes WHAT YOU WILL BE ABLE TO MAKE, tied to real
 * published pieces, rather than a module list. That is deliberate: there is no
 * written outline for this course the way there is for The Great Work, and
 * inventing seven module names would be fabricating a product. When the outline
 * exists, swap this section for it.
 */

const PRICE_PLACEHOLDER = 25000;
const WAS_PLACEHOLDER = 50000;

const CHANGES = [
  "You can make an ad for a product without hiring a camera, a crew or a location.",
  "You can hold the same character across a whole film instead of one lucky clip.",
  "You can turn one idea into a week of content instead of one post.",
  "You stop paying an editor to wait five days and deliver something you have to fix.",
  "You can show a brand a finished concept instead of describing one.",
  "You have work that looks expensive, which is the only thing that gets you hired to make more of it.",
];

const WORK = [
  {
    t: "Ads for brands that never hired you",
    d: "A burger lit like a diamond in a vault. A fry shot like the last one on earth. A Lexus film that runs 84 seconds. Nine of them in nine days, and every one of them a complete concept rather than a pretty clip.",
    note: "Unofficial fan-made spec work. None of these brands commissioned, approved or paid for any of it.",
  },
  {
    t: "A real ad for a real business",
    d: "My father's pharmacy needed an ad, so I made one. Symptom, hesitation, shopfront, pharmacist, branded bag, locations on screen. Sixteen seconds, and it is the piece I am proudest of in the whole set.",
    note: "Family business, never billed. Shown because it is the only one made to a real brief.",
  },
  {
    t: "Short films that hold a character",
    d: "One three-part film following the same person from a Lagos street to a cockpit. Another that runs three and a half minutes. Most people using these tools cannot hold a face across two shots, let alone three minutes.",
    note: null,
  },
  {
    t: "Content that actually pulls people in",
    d: "One video did 128,000 views and 1,700 comments, and every one of those comments was somebody putting their hand up. That is the part nobody teaches. Making the video is half of it.",
    note: null,
  },
];

const WHO_FOR = [
  "You want to make content and you do not want to be on camera.",
  "You are paying an editor and waiting days for work you end up fixing yourself.",
  "You want to start a YouTube or TikTok channel and have no footage to start from.",
  "You sell something and every photo of it looks cheap.",
  "You want to pitch brands and have nothing finished to show them.",
  "You have played with these tools, got one good clip, and could not do it twice.",
];

const NOT_FOR = [
  "You want a button that makes a finished film. It does not exist.",
  "You want to post AI clips with no idea behind them. The tools are not the hard part.",
  "You want somebody to make the videos for you. That is a service, sold separately.",
];

export function AiMasteryClient() {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  const cta = () => (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <MagneticButton onClick={open}>Get instant access</MagneticButton>
      <span className="text-sm text-text-secondary">
        <span className="line-through opacity-60">₦{WAS_PLACEHOLDER.toLocaleString()}</span>{" "}
        <span className="font-semibold text-text-primary">
          ₦{PRICE_PLACEHOLDER.toLocaleString()}
        </span>{" "}
        · lifetime access
      </span>
    </div>
  );

  return (
    <div>
      {/* ───────── 1. HERO ───────── */}
      <section className="px-6 pt-28 pb-16 md:pt-36">
        <div className="mx-auto max-w-[820px]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">AI Mastery</p>
          <RiseWords
            as="h1"
            className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-6xl"
          >
            No camera. No crew. No budget. Make the ad anyway.
          </RiseWords>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl">
            I spent nine days making ads for brands that never hired me. Gucci. Burger King.
            McDonald&rsquo;s. Nike. Lexus. Then short films with the same character running across
            three minutes.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary md:text-xl">
            All of it on a laptop. No shoot, no location, no team. Every piece is still up and you
            can go and watch it.
          </p>

          <p className="mt-4 text-lg font-semibold leading-relaxed text-text-primary md:text-xl">
            This is how it was done, start to finish.
          </p>

          {cta()}
        </div>
      </section>

      {/* ───────── 2. AUTHORITY ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              I did not read about this. I did it in public.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Between April and May I published thirty pieces of AI video on my own account, in the
              open, with the failures visible. Twenty-one of them are fully generated. Nobody paid
              me to make them and nobody was watching at the start.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              People have already bought this material from me before this page existed. This is
              the first time it has been packaged properly.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 3. WHAT CHANGES ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What changes for you
            </h2>
            <ul className="mt-8 space-y-4">
              {CHANGES.map((c) => (
                <li key={c} className="flex gap-4 leading-relaxed text-text-secondary">
                  <span aria-hidden className="mt-[2px] shrink-0 font-bold text-accent">
                    →
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            {cta()}
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 4. PROBLEM ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              The tools are not the problem
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Everybody has the same tools you have. That is exactly why most AI content looks the
              same and none of it sells anything.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              A clip is not an ad. An ad needs an idea. The vault and the lasers and the sirens are
              not the idea, they are the setup. The idea is the reveal at the end, when you find out
              it was just a burger at 3am.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-text-primary">
              That is the part the tools cannot do for you, and it is most of what this teaches.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 5. WHAT YOU WILL MAKE ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What you will be able to make
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              Every one of these is a real thing I published, not an example I made up for a sales
              page.
            </p>

            <div className="mt-10 space-y-5">
              {WORK.map((w) => (
                <div
                  key={w.t}
                  className="rounded-2xl border border-border p-6 transition-colors hover:border-border-hover"
                >
                  <h3 className="font-bold text-accent">{w.t}</h3>
                  <p className="mt-3 leading-relaxed text-text-secondary">{w.d}</p>
                  {w.note && <p className="mt-3 text-sm text-text-muted">{w.note}</p>}
                </div>
              ))}
            </div>
            {cta()}
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 6. WHO IT IS FOR ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Who this is for
            </h2>
            <ul className="mt-8 space-y-4">
              {WHO_FOR.map((w) => (
                <li key={w} className="flex gap-4 leading-relaxed text-text-secondary">
                  <span aria-hidden className="mt-[2px] shrink-0 font-bold text-accent">
                    →
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-12 text-lg font-bold text-text-primary">And who it is not for</h3>
            <ul className="mt-6 space-y-4">
              {NOT_FOR.map((w) => (
                <li key={w} className="flex gap-4 leading-relaxed text-text-muted">
                  <span aria-hidden className="mt-[2px] shrink-0 font-bold">
                    ✕
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 7. FINAL PRICING ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16 pb-28">
          <div className="mx-auto max-w-[820px]">
            <div className="rounded-3xl border border-accent/40 bg-bg-secondary p-8 md:p-12">
              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                Stop describing what you could make
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                A finished piece of work gets you hired. A description of one does not. You can have
                the first finished piece this week.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "The full workflow, start to finished export",
                  "How to hold one character across a whole film",
                  "The concept work that turns a clip into an ad",
                  "Lifetime access, including everything added later",
                ].map((f) => (
                  <li key={f} className="flex gap-3 text-text-secondary">
                    <span aria-hidden className="font-bold text-accent">
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-2 flex items-baseline gap-3 pt-10">
                <span className="text-2xl text-text-muted line-through">
                  ₦{WAS_PLACEHOLDER.toLocaleString()}
                </span>
                <span className="text-5xl font-extrabold text-accent">
                  ₦{PRICE_PLACEHOLDER.toLocaleString()}
                </span>
              </p>

              <div className="mt-8">
                <MagneticButton onClick={open}>Get instant access</MagneticButton>
              </div>
            </div>
          </div>
        </section>
      </SectionWrapper>

      <PaymentModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        serviceName="AI Mastery"
        amount={PRICE_PLACEHOLDER}
        currency="NGN"
      />
    </div>
  );
}
