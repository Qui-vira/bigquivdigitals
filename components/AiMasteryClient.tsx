"use client";

import { useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { WaitlistForm } from "@/components/WaitlistForm";
import { VIDEO_BASE } from "@/components/ProofFilm";
import { FILMS } from "@/lib/films";
import { AI_MASTERY_PRICE_NGN } from "@/lib/course-prices";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import { CrossOff } from "@/components/v3/fx/CrossOff";
import { MarkList, Price } from "@/components/course/V3Course";
import { V3Film } from "@/components/course/V3Film";
import { PhoneReel } from "@/components/course/PhoneReel";
import { Viewfinder } from "@/components/course/Viewfinder";
import { PromptTypeIn } from "@/components/course/PromptTypeIn";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/aimastery.css";

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

/**
 * V3 REBUILD 2026-10-19 (comp: AIMastery.dc.html on the website comps canvas;
 * motion: MOTION-PLAN.md section 3). Same sections, same copy, same two modes,
 * same payment flow, restyled. The page opens on a navy stage where a phone
 * plays his AI ads (components/v3/stage/scenes/phone.ts): The Heist, then
 * Metamorphosis, then Peaceway on its side, the real files muted in the screen
 * on a desktop. Effects: #27 objection cross-off, #30 prompt type-in (the
 * page's own line for The Heist, then the film it made), #8 phone mockups for
 * the film list, #34 viewfinder frame on the showreel (Chike).
 */

const video = (key: keyof typeof FILMS) => (VIDEO_BASE ? `${VIDEO_BASE}/${FILMS[key].file}` : undefined);
const screenFilm = (key: keyof typeof FILMS) => ({
  img: FILMS[key].img,
  title: FILMS[key].title,
  runtime: FILMS[key].runtime,
  video: video(key),
});

/** What the phone on the stage plays, beat by beat (see scenes/phone.ts). */
const PHONE_PARAMS = {
  preset: "hero",
  label: "AI Mastery",
  video: true,
  films: [screenFilm("burgerking"), screenFilm("gucci"), screenFilm("peaceway"), screenFilm("burgerking")],
  at: [0, 0.34, 0.56, 0.82],
  landAt: [0.58, 0.8],
};

export function AiMasteryClient({ isOpen = false }: { isOpen?: boolean }) {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  const was = `₦${WAS_PRICE_NGN.toLocaleString()}`;
  const now = `₦${PRICE_NGN.toLocaleString()}`;

  /**
   * Rendered several times down the page. In closed mode every one of them is
   * the same form posting the same source, which is intentional —
   * `course_waitlist` has a unique index on lower(email) and the route treats a
   * duplicate as success, so a visitor can submit from any of them without
   * seeing an error.
   */
  const cta = (className = "") =>
    isOpen ? (
      <div className={`v3-buy ${className}`}>
        <button type="button" onClick={open} className="v3-btn v3-btn--lg">
          Get instant access <Arrow />
        </button>
        <Price was={was} now={now}>
          · lifetime access
        </Price>
      </div>
    ) : (
      <div className={`v3-aim__form ${className}`}>
        <WaitlistForm source="aimastery" />
        <p className="v3-formnote">Not open yet. Join the list and you hear about it before anyone else.</p>
      </div>
    );

  return (
    <div className="v3 v3-course v3-aim">
      {/* ───────── STAGE: the phone playing his AI ads ───────── */}
      <Stage scene="phone" params={PHONE_PARAMS} ground="navy" height={620} heightPhone={540} mark="NINE ADS" label="AI Mastery">
        <div className="v3-cintro">
          <div className="v3-cintro__main">
            <h1 id="aim-hero" className="v3-cintro__h v3-aim__h v3-display" data-lift>
              Nine ads in nine days. No brand paid me. <span className="mark">Forty people did.</span>
            </h1>
            <div className="v3-cintro__rest" data-intro-rest>
              {cta("v3-aim__herocta")}
            </div>
          </div>
          <span className="v3-intro__cue" data-intro-rest aria-hidden="true">
            <i />
            Scroll
          </span>
        </div>

        <h2 className="v3-ghost" data-ghost="0.1,0.15,0.29,0.33" data-side="left">
          A clip is not an ad.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.35,0.39,0.51,0.55" data-side="right">
          An ad needs an idea.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.57,0.61,0.76,0.8" data-side="high">
          A real ad for a real business
        </h2>

        <p className="v3-aim__endline v3-display" data-at="0.84,0.88,0.97,1">
          Stop describing what you could make
        </p>
        <div className="v3-endcta" data-at="0.86,0.9,0.98,1">
          {isOpen ? (
            <button type="button" onClick={open} className="v3-btn v3-btn--lg">
              Get instant access <Arrow />
            </button>
          ) : (
            <a href="#aim-final" className="v3-btn v3-btn--lg">
              Join the waitlist <Arrow />
            </a>
          )}
        </div>
      </Stage>

      {/* ───────── THE STORY ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" data-panel aria-label="The story">
        <div className="v3-wrap v3-aim__story">
          <div>
            <p data-fade>
              Gucci. Burger King. McDonald&rsquo;s. Nike. Lexus. Not one of them asked me for anything. Not one of them
              paid me. I made the work on a laptop and I put it up anyway.
            </p>
            <p data-fade>
              Between 26 April and 13 May, forty people paid me to teach them how. There was no sales page. No launch. No
              email list. I never sent a single pitch.
            </p>
          </div>
          <div>
            <p data-fade>
              Then I did it again somewhere else. A second account, no face, no name, nobody on it who knew me. Different
              subject entirely, made with the same films. Three months in, an exchange came to me with a 70% deal.
              $2,070.61 in commission from 118 people I have never met.
            </p>
            <p className="v3-aim__story-big v3-title" data-fade>
              That is what the skill actually does. You stop chasing people. The work goes out and it brings them back.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── THE SHOWREEL: viewfinder (#34) ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-label={FILMS.chike.title}>
        <div className="v3-wrap v3-aim__reel">
          <div className="v3-aim__reel-film">
            <p className="v3-hand v3-aim__hand" aria-hidden="true">
              press play
            </p>
            <V3Film film={FILMS.chike} frame={(screen) => <Viewfinder>{screen}</Viewfinder>} sizes="(max-width: 900px) 92vw, 900px" />
          </div>
          <div className="v3-aim__reel-buy">{cta("v3-aim__cta-tight")}</div>
        </div>
      </section>

      {/* ───────── AUTHORITY ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="aim-authority">
        <div className="v3-wrap v3-aim__two">
          <div>
            <h2 id="aim-authority" className="v3-h2 v3-display" data-split>
              I did not read about this. I did it in public.
            </h2>
            <div className="v3-aim__copy">
              <p data-fade>
                Between April and May I published thirty pieces of AI video on my own account, in the open, with the
                failures visible. Twenty-one of them are fully generated. Nobody paid me to make them and nobody was
                watching at the start.
              </p>
              <p data-fade>
                People have already bought this material from me before this page existed. This is the first time it has
                been packaged properly.
              </p>
            </div>
          </div>
          <div className="v3-aim__side">
            <V3Film film={FILMS.titan} sizes="(max-width: 900px) 92vw, 640px" />
            {cta()}
          </div>
        </div>
      </section>

      {/* ───────── WHAT CHANGES: prompt type-in (#30) ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="aim-changes">
        <div className="v3-wrap v3-aim__two">
          <div>
            <h2 id="aim-changes" className="v3-h2 v3-display" data-split>
              What changes for you
            </h2>
            <MarkList items={CHANGES} kind="arrow" className="v3-aim__list" />
          </div>
          <div className="v3-aim__side">
            <PromptTypeIn prompt={FILMS.burgerking.line} label={FILMS.burgerking.line}>
              <V3Film film={FILMS.burgerking} showLine={false} sizes="(max-width: 900px) 92vw, 640px" />
            </PromptTypeIn>
            {cta()}
          </div>
        </div>
      </section>

      {/* ───────── THE PROBLEM: objection cross-off (#27) ───────── */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="aim-problem">
        <div className="v3-wrap">
          <div className="v3-aim__problem">
            <div>
              <h2 id="aim-problem" className="v3-h2 v3-display" data-split>
                The tools are not the problem
              </h2>
              <div className="v3-aim__copy">
                <p data-fade>
                  Everybody has the same tools you have. That is exactly why most AI content looks the same and none of it
                  sells anything.
                </p>
                <p data-fade>
                  A clip is not an ad. An ad needs an idea. The vault and the lasers and the sirens are not the idea, they
                  are the setup. The idea is the reveal at the end, when you find out it was just a burger at 3am.
                </p>
                <p className="v3-aim__problem-big v3-title" data-fade>
                  That is the part the tools <span className="mark">cannot do for you</span>, and it is most of what this
                  teaches.
                </p>
              </div>
            </div>
            <CrossOff
              className="v3-aim__cross"
              items={[{ text: "a camera" }, { text: "a crew" }, { text: "An ad needs an idea.", ok: true }]}
            />
          </div>
          <div className="v3-aim__pair">
            <V3Film film={FILMS.gucci} sizes="(max-width: 900px) 92vw, 640px" />
            <V3Film film={FILMS.mcdonalds} className="v3-aim__pair-low" sizes="(max-width: 900px) 92vw, 640px" />
          </div>
          {cta()}
        </div>
      </section>

      {/* ───────── WHAT YOU WILL MAKE: phone mockups (#8) ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="aim-make">
        <div className="v3-wrap">
          <div className="v3-aim__make-head">
            <h2 id="aim-make" className="v3-h2 v3-display" data-split>
              What you will be able to make
            </h2>
            <p data-fade>Every one of these is a real thing I published, not an example I made up for a sales page.</p>
          </div>
          <ol className="v3-aim__work">
            {WORK.map((w, i) => (
              <li key={w.t} data-fade>
                <span className="v3-aim__work-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="v3-h3">{w.t}</h3>
                  <p>{w.d}</p>
                  {w.note && <p className="v3-aim__work-note">{w.note}</p>}
                </div>
              </li>
            ))}
          </ol>
          <PhoneReel films={[FILMS.lexus, FILMS.lagos, FILMS.peaceway]} className="v3-aim__phones" />
          {cta()}
        </div>
      </section>

      {/* ───────── WHO IT IS FOR ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="aim-who">
        <div className="v3-wrap v3-aim__who">
          <div>
            <h2 id="aim-who" className="v3-h2 v3-display" data-split>
              Who this is for
            </h2>
            <MarkList items={WHO_FOR} kind="check" className="v3-aim__list" />
            <div className="v3-aim__not">
              <h3 className="v3-h3">And who it is not for</h3>
              <MarkList items={NOT_FOR} kind="cross" />
            </div>
          </div>
          <div className="v3-aim__who-film">
            <PhoneReel films={[FILMS.amara]} />
            {cta()}
          </div>
        </div>
      </section>

      {/* ───────── FINAL PRICING ─────────
          Open: the price. Closed: the form, and no price anywhere. */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" aria-labelledby="aim-final">
        <div className="v3-wrap v3-aim__close">
          <div>
            <h2 id="aim-final" className="v3-display v3-aim__close-h" data-split>
              Stop describing <span className="mark">what you could make</span>
            </h2>
            <p className="v3-aim__close-p">
              A finished piece of work gets you hired. A description of one does not. You can have the first finished piece
              this week.
            </p>
            <MarkList items={FINAL_LIST} checklist />
            <V3Film film={FILMS.bridge} className="v3-aim__bridge" sizes="(max-width: 900px) 92vw, 720px" />
          </div>
          <div className="v3-aim__ticket">
            <div className="v3-aim__mini" aria-hidden="true" data-tilt>
              <div className="v3-phone">
                <div className="v3-phone__screen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={FILMS.lexus.img} alt="" loading="lazy" />
                  <span className="v3-phone__notch" />
                </div>
              </div>
            </div>
            {isOpen ? (
              <>
                <p className="v3-cintro__label">AI Mastery</p>
                <p className="v3-aim__ticket-price">
                  <s>{was}</s>
                  <span className="v3-sr"> (was)</span>
                  <b>{now}</b>
                </p>
                <button type="button" onClick={open} className="v3-btn v3-btn--lg">
                  Get instant access <Arrow />
                </button>
              </>
            ) : (
              <>
                <WaitlistForm source="aimastery-pricing" />
                <p className="v3-formnote">Not open yet. Join the list and you hear about it before anyone else.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/*
        Only mounted when the page is open. In closed mode there is no price on
        the page, so a payment modal has no amount it could honestly charge.
      */}
      {isOpen ? (
        <PaymentModal isOpen={payOpen} onClose={() => setPayOpen(false)} serviceName="AI Mastery" amount={PRICE_NGN} currency="NGN" />
      ) : null}
    </div>
  );
}
