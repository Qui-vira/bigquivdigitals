"use client";

import Image from "next/image";
import { useState } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionWrapper } from "@/components/SectionWrapper";
import { RiseWords } from "@/components/TextMotion";
import { PaymentModal } from "@/components/PaymentModal";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ProofFilm, type Film } from "@/components/ProofFilm";

/**
 * The proof films. One closes every section on this page.
 *
 * The reference the owner chose is 100launchscripts.com, where every section
 * ends with a customer screenshot and then the price and the button again. Her
 * proof is other people's results because she sells launch scripts. This product
 * is a visual skill, so the proof is the work itself — a stranger can watch it
 * and decide in four seconds, which no testimonial achieves.
 *
 * Every entry links to the live post. That is the whole point: the claim is
 * checkable in one click, on a public timeline, with a date on it.
 *
 * Poster frames were pulled from the archive masters with ffmpeg, never at 0s
 * because most of these open on a fade from black. Runtimes are read off the
 * files, not off the captions.
 *
 * ⚠ The spec ads are unofficial. Gucci, Burger King, McDonald's, Nike and Lexus
 * commissioned, approved and paid for none of it, and every card that shows one
 * carries that line. Peaceway is the owner's father's pharmacy and is never
 * described as paid client work.
 */
const FILMS: Record<string, Film> = {
  chike: {
    img: "/proof/aimastery/chike.webp",
    file: "chike.mp4",
    aspect: "scope",
    title: "What If Chike Wasn't Born",
    line: "One character, held for three and a half minutes. Most people using these tools cannot hold a face across two shots.",
    runtime: "3:26",
    url: "https://x.com/_Quivira/status/2056757338996924676",
  },
  burgerking: {
    img: "/proof/aimastery/burgerking.webp",
    file: "burgerking.mp4",
    aspect: "wide",
    title: "The Heist",
    line: "A Whopper locked in a vault like a ten million dollar diamond. Lasers, gloves, sirens, slow-motion escape.",
    runtime: "0:30",
    url: "https://x.com/_Quivira/status/2053547582912336233",
    note: "Unofficial. Burger King commissioned, approved and paid for none of it.",
  },
  lexus: {
    img: "/proof/aimastery/lexus.webp",
    file: "lexus.mp4",
    aspect: "vertical",
    title: "The $2M Ad",
    line: "Eighty seconds that looks like a budget nobody gave me.",
    runtime: "1:19",
    url: "https://x.com/_Quivira/status/2055375185889382870",
    note: "Unofficial. Lexus commissioned, approved and paid for none of it.",
  },
  peaceway: {
    img: "/proof/aimastery/peaceway.webp",
    file: "peaceway.mp4",
    aspect: "vertical",
    title: "Peaceway Pharmacy",
    line: "My dad asked me to make an ad for his pharmacy, so I did. Symptom, hesitation, shopfront, pharmacist, branded bag.",
    runtime: "0:16",
    url: "https://x.com/_Quivira/status/2051236382689910875",
    note: "My father's pharmacy. Never billed. The only one made to a real brief.",
  },
  lagos: {
    img: "/proof/aimastery/lagos.webp",
    file: "lagos.mp4",
    aspect: "vertical",
    title: "The Lagos Film",
    line: "The same man followed from a Lagos street to a cockpit, across three parts.",
    runtime: "2:42",
    url: "https://x.com/_Quivira/status/2056297961617801722",
  },
  bridge: {
    img: "/proof/aimastery/bridge.webp",
    file: "bridge.mp4",
    aspect: "scope",
    title: "Third Mainland Bridge",
    line: "Three Nigerians, a door under the bridge, and a box that could set the country free.",
    runtime: "2:59",
    url: "https://x.com/_Quivira/status/2057144836604498108",
  },
  titan: {
    img: "/proof/aimastery/titan.webp",
    file: "titan.mp4",
    aspect: "scope",
    title: "Titan",
    line: "A lone figure, a sea god, one final blast. My own face used as the reference to direct the whole sequence.",
    runtime: "0:20",
    url: "https://x.com/_Quivira/status/2051961250007994792",
  },
  gucci: {
    img: "/proof/aimastery/gucci.webp",
    file: "gucci.mp4",
    aspect: "scope",
    title: "Metamorphosis",
    line: "Leather becomes liquid gold. Gold becomes glass. Glass becomes birds. No talking, no product shot until the end.",
    runtime: "0:25",
    url: "https://x.com/_Quivira/status/2052822783231488379",
    note: "Unofficial. Gucci commissioned, approved and paid for none of it.",
  },
  mcdonalds: {
    img: "/proof/aimastery/mcdonalds.webp",
    file: "mcdonalds.mp4",
    aspect: "wide",
    title: "The Last Fry",
    line: "One fry, shot like it is the last one on earth.",
    runtime: "0:15",
    url: "https://x.com/_Quivira/status/2053878672726311130",
    note: "Unofficial. McDonald's commissioned, approved and paid for none of it.",
  },
  amara: {
    img: "/proof/aimastery/amara.webp",
    file: "amara.mp4",
    aspect: "vertical",
    title: "Amara Wasn't Lazy",
    line: "A whole character carried through a story, on a laptop, with nobody in front of a camera.",
    runtime: "1:43",
    url: "https://x.com/_Quivira/status/2051712953322217553",
  },
};

/**
 * ⚠ THE HERO IS A TRANSFORMATION, NOT A CAPABILITY. It used to open on
 * "No camera. No crew. No budget", which describes what the tool does rather
 * than what changes for the person reading. Owner, 2026-08-19: the page is
 * meant to sell a transformation.
 *
 * ⚠ AND READ THIS BEFORE EDITING IT. An earlier draft of the transformation
 * was "I made spec ads, so an exchange came to me." **That is false and it was
 * caught by asking.** The spec ads are on @_Quivira. The exchange deal came
 * through a separate faceless account whose SUBJECT was trading calls, and
 * which merely used the same AI films as its format. Owner confirmed the
 * distinction on 2026-08-19 after first answering the other way.
 *
 * So the two proofs are deliberately kept as two, joined by the mechanism and
 * never by a "so" or a "then":
 *
 *   1. Forty people paid for this class between 26 Apr and 13 May 2026, with no
 *      sales page in existence. Verified directly against `course_purchases`:
 *      40 rows, all `ai-content-mastery`, all `confirmed`, first 2026-04-26,
 *      last 2026-05-13. This is the strongest claim on the page because it is
 *      about the product being sold and it sits in our own database.
 *   2. A separate faceless account, different subject, same film format, got an
 *      exchange affiliate deal. `12-Proof-Library/faceless-account/`.
 *
 * ⚠ The positioning doc says the earliest purchase was 2026-05-05. It was
 * 2026-04-26. The database is right and the doc is being corrected.
 *
 * ⚠ NEVER NAME THE EXCHANGE. Owner decision, it undercuts the OKX drive in
 * the 60-day campaign. And never pair the $7.4m referral volume with the
 * commission figure on a public page without both in the same frame, per the
 * warning filed in that folder. The volume is not on this page at all.
 *
 * ⚠ $2,070.61 IS CUMULATIVE OVER ROUGHLY FIVE AND A HALF MONTHS. Never write
 * or imply "$2,000 a month". That division is the first thing a sceptic does.
 */

/**
 * AI Mastery sales page. Same section order as /greatwork, which follows the
 * reference page the owner chose (100launchscripts.com).
 *
 * TWO MODES, set by `AIMASTERY_OPEN` in the environment.
 *
 *   open (default) — every CTA is the purchase button and the price is shown.
 *   closed         — every CTA is an email capture and no price renders at all.
 *
 * Open is the default, owner's decision 2026-08-19. Roughly 40 people bought
 * this material with no sales page in existence. Gating a finished page behind a
 * waitlist turns those buyers away and gains nothing.
 *
 * A price is never rendered in closed mode. Showing a number next to a form that
 * cannot take payment is the fastest way to have people quote a price back at you
 * that you have not committed to.
 *
 * ⚠ NEVER LINK THIS PAGE TO /aimastery-waitlist and never repeat the waitlist's
 * free-access promise here. That promise gives anyone who sees both pages a
 * reason to wait 60 days rather than pay today.
 *
 * The curriculum section describes WHAT YOU WILL BE ABLE TO MAKE, tied to real
 * published pieces, rather than a module list. That is deliberate: there is no
 * written outline for this course the way there is for The Great Work, and
 * inventing seven module names would be fabricating a product. When the outline
 * exists, swap this section for it.
 */

/**
 * ₦27,000 is $20 at the official NFEM rate of ₦1,354/$ on 2026-08-18, the day the
 * owner set the price in dollars. Rounded down from ₦27,080.
 *
 * The price is denominated in naira because the buyers are Nigerian, so the
 * dollar figure drifts with FX. Re-check it against a live rate before quoting
 * $20 anywhere. The 60-day revenue model assumes $20.
 *
 * ✅ WAS_PRICE STAYS. Owner ruling, 2026-08-19, asked directly and answered
 * directly. The April 2026 cohort ran $15 / $30 / $50 tiers and ₦50,000 is
 * roughly the $50 tier at an older rate.
 *
 * This was raised as a blocker in two consecutive handoffs and has now been
 * decided by the person who ran the cohort. Do not re-open it, and do not
 * re-file it as "unverified" in the next handoff. If it ever does need a
 * receipt, that is his call to make, not a maintenance task.
 */
const PRICE_NGN = 27000;
const WAS_PRICE_NGN = 50000;

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

export function AiMasteryClient({ isOpen = false }: { isOpen?: boolean }) {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  /**
   * Rendered three times down the page. In closed mode every one of them is the
   * same form posting the same source, which is intentional — `course_waitlist`
   * has a unique index on lower(email) and the route treats a duplicate as
   * success, so a visitor can submit from any of them without seeing an error.
   */
  /**
   * A proof card. Poster frame, one line, runtime, and the work itself.
   *
   * The card plays the film in place when a video bucket is configured, and
   * falls back to opening the live X post when one is not. Both paths always
   * expose the post link, because a claim a stranger can check in one click is
   * worth more than any paragraph describing the same work.
   *
   * See `components/ProofFilm.tsx` for why nothing loads before the click and
   * why the aspect ratio is per film rather than fixed.
   */
  const film = (key: keyof typeof FILMS) => <ProofFilm film={FILMS[key]} />;

  const cta = () =>
    isOpen ? (
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <MagneticButton onClick={open}>Get instant access</MagneticButton>
        <span className="text-sm text-text-secondary">
          <span className="line-through opacity-60">₦{WAS_PRICE_NGN.toLocaleString()}</span>{" "}
          <span className="font-semibold text-text-primary">₦{PRICE_NGN.toLocaleString()}</span>{" "}
          · lifetime access
        </span>
      </div>
    ) : (
      <div className="mt-10">
        <WaitlistForm source="aimastery" />
        <p className="mt-3 text-sm text-text-secondary">
          Not open yet. Join the list and you hear about it before anyone else.
        </p>
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
            Nine ads in nine days. No brand paid me. Forty people did.
          </RiseWords>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl">
            Gucci. Burger King. McDonald&rsquo;s. Nike. Lexus. Not one of them asked me for
            anything. Not one of them paid me. I made the work on a laptop and I put it up
            anyway.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary md:text-xl">
            Between 26 April and 13 May, forty people paid me to teach them how. There was no
            sales page. No launch. No email list. I never sent a single pitch.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary md:text-xl">
            Then I did it again somewhere else. A second account, no face, no name, nobody on it
            who knew me. Different subject entirely, made with the same films. Three months in,
            an exchange came to me with a 70% deal. $2,070.61 in commission from 118 people I
            have never met.
          </p>

          <p className="mt-4 text-lg font-semibold leading-relaxed text-text-primary md:text-xl">
            That is what the skill actually does. You stop chasing people. The work goes out and
            it brings them back.
          </p>

          {film("chike")}
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
            {film("titan")}
            {cta()}
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
            {film("burgerking")}
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
            {film("gucci")}
            {film("mcdonalds")}
            {cta()}
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
            {film("lexus")}
            {film("lagos")}
            {film("peaceway")}
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
            {film("amara")}
            {cta()}
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

              {film("bridge")}

              {isOpen ? (
                <>
                  <p className="mt-2 flex items-baseline gap-3 pt-10">
                    <span className="text-2xl text-text-muted line-through">
                      ₦{WAS_PRICE_NGN.toLocaleString()}
                    </span>
                    <span className="text-5xl font-extrabold text-accent">
                      ₦{PRICE_NGN.toLocaleString()}
                    </span>
                  </p>

                  <div className="mt-8">
                    <MagneticButton onClick={open}>Get instant access</MagneticButton>
                  </div>
                </>
              ) : (
                <div className="pt-10">
                  <WaitlistForm source="aimastery-pricing" />
                  <p className="mt-3 text-sm text-text-secondary">
                    Not open yet. Join the list and you hear about it before anyone else.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/*
        Only mounted when the page is open. In closed mode there is no price on
        the page, so a payment modal has no amount it could honestly charge.
      */}
      {isOpen ? (
        <PaymentModal
          isOpen={payOpen}
          onClose={() => setPayOpen(false)}
          serviceName="AI Mastery"
          amount={PRICE_NGN}
          currency="NGN"
        />
      ) : null}
    </div>
  );
}
