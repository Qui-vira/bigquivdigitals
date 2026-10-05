"use client";

import { useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FILMS } from "@/lib/films";
import { AI_MASTERY_PRICE_NGN } from "@/lib/course-prices";
import {
  BrutalButton,
  HandMark,
  HandNote,
  Highlighter,
  PaperSection,
  SectionHead,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";
import { MarkList, PriceLine, PriceTicket } from "@/components/course/CoursePaper";
import { PaperFilm } from "@/components/course/PaperFilm";

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
/**
 * Imported, not declared. The server decides what counts as paid
 * (lib/course-prices.ts), and a page that hardcodes its own number can drift
 * away from the minimum the payment routes enforce, which would take real
 * buyers' money and then refuse to confirm them.
 */
const PRICE_NGN = AI_MASTERY_PRICE_NGN;
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

const FINAL_LIST = [
  "The full workflow, start to finished export",
  "How to hold one character across a whole film",
  "The concept work that turns a clip into an ad",
  "Lifetime access, including everything added later",
];

const WORK_TONE = ["bg-gold-tint", "bg-paper", "bg-paper", "bg-gold-tint"];
const WORK_TILT = [-1.2, 0.9, 1.1, -0.8];

const bodyLg = "text-lg leading-relaxed text-ink-soft";

/**
 * Paper redesign, 2026-10-05. Same sections, same copy, same two modes. The
 * films are PaperFilm (components/course/PaperFilm.tsx): vertical films sit in
 * a phone, wide ones in a taped print, and every one still plays in place and
 * still links to its live post. The price, when open, sits on a gold ticket.
 */
export function AiMasteryClient({ isOpen = false }: { isOpen?: boolean }) {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  /**
   * Rendered several times down the page. In closed mode every one of them is
   * the same form posting the same source, which is intentional —
   * `course_waitlist` has a unique index on lower(email) and the route treats a
   * duplicate as success, so a visitor can submit from any of them without
   * seeing an error.
   */
  const cta = (className?: string) =>
    isOpen ? (
      <div className={cx("mt-10 flex flex-wrap items-center gap-x-6 gap-y-5", className)}>
        <BrutalButton onClick={open} size="lg">
          Get instant access
        </BrutalButton>
        <PriceLine was={`₦${WAS_PRICE_NGN.toLocaleString()}`} now={`₦${PRICE_NGN.toLocaleString()}`}>
          · lifetime access
        </PriceLine>
      </div>
    ) : (
      <div className={cx("mt-10", className)}>
        <WaitlistForm source="aimastery" />
        <p className="mt-4 font-typewriter text-[14px] leading-relaxed text-ink-soft">
          Not open yet. Join the list and you hear about it before anyone else.
        </p>
      </div>
    );

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
  const film = (key: keyof typeof FILMS, tilt = 0, className?: string) => (
    <PaperFilm film={FILMS[key]} tilt={tilt} className={className} />
  );

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. HERO ───────── */}
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        aria-labelledby="aim-hero"
        innerClassName="pb-20 pt-[calc(4rem+2.75rem)] md:pb-28 md:pt-[calc(4.5rem+4rem)]"
      >
        <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
          AI Mastery
        </Sticker>
        <h1
          id="aim-hero"
          className="load-drop mt-7 max-w-[17ch] font-didone text-[clamp(3.1rem,9.6vw,7rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance"
        >
          Nine ads in nine days. No brand paid me. <Highlighter load delay={500}>Forty people did.</Highlighter>
        </h1>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="max-w-[60ch] lg:col-start-1 lg:row-start-1">
            <p className="text-lg leading-relaxed text-ink-soft md:text-xl">
              Gucci. Burger King. McDonald&rsquo;s. Nike. Lexus. Not one of them asked me for anything. Not one of them
              paid me. I made the work on a laptop and I put it up anyway.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft md:text-xl">
              Between 26 April and 13 May, forty people paid me to teach them how. There was no sales page. No launch.
              No email list. I never sent a single pitch.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft md:text-xl">
              Then I did it again somewhere else. A second account, no face, no name, nobody on it who knew me.
              Different subject entirely, made with the same films. Three months in, an exchange came to me with a 70%
              deal. $2,070.61 in commission from 118 people I have never met.
            </p>
            <p className="mt-6 font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink md:text-[1.45rem]">
              That is what the skill actually does. You stop chasing people. The work goes out and it brings them back.
            </p>
          </div>
          <div className="relative lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-4">
            {film("chike", -1.5)}
            <HandNote
              arrow="down-left"
              arrowAt="above"
              tilt={-5}
              className="absolute -top-20 right-4 hidden xl:inline-flex"
              arrowClassName="ml-10 !w-[64px]"
            >
              press play
            </HandNote>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">{cta("mt-0")}</div>
        </div>
      </PaperSection>

      {/* ───────── 2. AUTHORITY ───────── */}
      <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="aim-authority">
        <div className="grid items-start gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <SectionHead id="aim-authority" size="md" title="I did not read about this. I did it in public." />
            <p className={cx(bodyLg, "mt-8 max-w-[60ch]")}>
              Between April and May I published thirty pieces of AI video on my own account, in the open, with the
              failures visible. Twenty-one of them are fully generated. Nobody paid me to make them and nobody was
              watching at the start.
            </p>
            <p className={cx(bodyLg, "mt-5 max-w-[60ch]")}>
              People have already bought this material from me before this page existed. This is the first time it has
              been packaged properly.
            </p>
          </div>
          <div className="lg:pt-6">{film("titan", 1.5)}</div>
        </div>
        {cta()}
      </PaperSection>

      {/* ───────── 3. WHAT CHANGES ───────── */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="aim-changes">
        <div className="grid items-start gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <SectionHead id="aim-changes" size="md" title="What changes for you" />
            <MarkList items={CHANGES} mark="arrow" className="mt-10" />
          </div>
          <div className="lg:pt-24">{film("burgerking", -1.2)}</div>
        </div>
        {cta()}
      </PaperSection>

      {/* ───────── 4. PROBLEM ───────── */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="aim-problem">
        <div className="max-w-[820px]">
          <SectionHead id="aim-problem" size="md" title="The tools are not the problem" />
          <p className={cx(bodyLg, "mt-8")}>
            Everybody has the same tools you have. That is exactly why most AI content looks the same and none of it sells
            anything.
          </p>
          <p className={cx(bodyLg, "mt-5")}>
            A clip is not an ad. An ad needs an idea. The vault and the lasers and the sirens are not the idea, they are
            the setup. The idea is the reveal at the end, when you find out it was just a burger at 3am.
          </p>
          <p className="mt-8 font-didone text-[clamp(1.9rem,3.8vw,2.7rem)] font-semibold leading-[1.08] text-ink">
            That is the part the tools <HandMark kind="underline">cannot do for you</HandMark>, and it is most of what this
            teaches.
          </p>
        </div>
        <div className="mt-16 grid gap-x-12 gap-y-14 lg:grid-cols-2">
          {film("gucci", -1.4)}
          <div className="lg:mt-16">{film("mcdonalds", 1.2)}</div>
        </div>
        {cta()}
      </PaperSection>

      {/* ───────── 5. WHAT YOU WILL MAKE ───────── */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="aim-make">
        <SectionHead id="aim-make" size="md" title="What you will be able to make" />
        <p className={cx(bodyLg, "mt-6 max-w-[60ch]")}>
          Every one of these is a real thing I published, not an example I made up for a sales page.
        </p>

        <ul className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {WORK.map((w, i) => (
            <li
              key={w.t}
              className={cx(
                "relative border-[3px] border-ink p-6 pt-8 shadow-brutal sm:p-8 sm:pt-10",
                WORK_TONE[i],
                i % 2 === 1 && "md:mt-10"
              )}
              style={{ rotate: `${WORK_TILT[i]}deg` }}
            >
              <span
                aria-hidden="true"
                className="absolute -top-[3px] right-5 border-[3px] border-t-0 border-ink bg-paper px-2 py-1 font-typewriter text-[12px] font-bold text-ink"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink">{w.t}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{w.d}</p>
              {w.note && (
                <p className="mt-4 border-t-2 border-dashed border-ink/35 pt-3 font-typewriter text-[13px] leading-relaxed text-ink-soft">
                  {w.note}
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-24 grid gap-x-10 gap-y-16 md:grid-cols-3">
          {film("lexus", -2)}
          <div className="md:mt-14">{film("lagos", 1.6)}</div>
          {film("peaceway", -1)}
        </div>
        {cta()}
      </PaperSection>

      {/* ───────── 6. WHO IT IS FOR ───────── */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="aim-who">
        <div className="grid gap-x-16 gap-y-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <div>
            <SectionHead id="aim-who" size="md" title="Who this is for" />
            <MarkList items={WHO_FOR} mark="check" tone="ink" className="mt-10" />

            <div className="relative mt-14 border-[3px] border-ink bg-paper p-6 shadow-brutal [rotate:-0.8deg] sm:p-8">
              <h3 className="font-display text-[1.3rem] font-bold tracking-[-0.01em] text-ink">And who it is not for</h3>
              <MarkList items={NOT_FOR} mark="cross" tone="muted" className="mt-6" />
            </div>
          </div>
          <div className="lg:pt-6">{film("amara", 2)}</div>
        </div>
        {cta()}
      </PaperSection>

      {/* ───────── 7. FINAL PRICING ─────────
          The brutal framed card. Open: the price on a gold ticket. Closed:
          the form, and no price anywhere. */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="aim-final">
        <div className="grid border-[3px] border-ink bg-paper shadow-brutal-lg lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="border-b-[3px] border-ink p-6 py-10 sm:p-10 lg:border-b-0 lg:border-r-[3px] lg:p-14">
            <h2
              id="aim-final"
              className="font-didone text-[clamp(2.6rem,5.4vw,4.2rem)] font-semibold leading-[0.96] tracking-[-0.005em] text-ink text-balance"
            >
              Stop describing what you could make
            </h2>
            <p className={cx(bodyLg, "mt-7 max-w-[52ch]")}>
              A finished piece of work gets you hired. A description of one does not. You can have the first finished
              piece this week.
            </p>
            <MarkList items={FINAL_LIST} mark="check" tone="ink" className="mt-9" />
            <div className="mt-14">{film("bridge", -1)}</div>
          </div>

          <div className="relative flex items-center bg-paper-alt p-6 py-14 sm:p-10 lg:p-12">
            {isOpen ? (
              <div className="w-full">
                <PriceTicket
                  caption="AI Mastery"
                  was={`₦${WAS_PRICE_NGN.toLocaleString()}`}
                  now={`₦${PRICE_NGN.toLocaleString()}`}
                  tilt={-2}
                >
                  <BrutalButton onClick={open} variant="paper" size="lg">
                    Get instant access
                  </BrutalButton>
                </PriceTicket>
              </div>
            ) : (
              <div className="relative border-[3px] border-ink bg-gold-tint p-6 pt-9 shadow-brutal [rotate:-1deg] sm:p-8 sm:pt-10 w-full">
                <Tape className="-top-3.5 left-8" tilt={-5} />
                <WaitlistForm source="aimastery-pricing" />
                <p className="mt-4 font-typewriter text-[14px] leading-relaxed text-ink-soft">
                  Not open yet. Join the list and you hear about it before anyone else.
                </p>
              </div>
            )}
          </div>
        </div>
      </PaperSection>

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
