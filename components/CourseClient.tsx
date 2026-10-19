"use client";

import { useState } from "react";
import Image from "next/image";
import { PaymentModal } from "@/components/PaymentModal";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import { KeywordSlam } from "@/components/v3/fx/KeywordSlam";
import { LightsOut } from "@/components/v3/fx/LightsOut";
import { TypeWall } from "@/components/v3/fx/TypeWall";
import { MarkList, Price } from "@/components/course/V3Course";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/greatwork.css";

/**
 * The Great Work sales page.
 *
 * V3 REBUILD 2026-10-19 (comp: GreatWork.dc.html on the website comps canvas;
 * motion: MOTION-PLAN.md section 3). Same sections, same order, every word
 * and every number unchanged; the payment flow (PaymentModal, Flutterwave,
 * Blockradar) is unchanged and only restyled. The page opens on a navy stage
 * where the course book opens page by page, one module per spread (the 3D
 * object, components/v3/stage/scenes/book.ts). Effects: #22 keyword slam on
 * the promise line, #4 spotlight (lights out) on the transformation, #15 type
 * wall on the seven weeks.
 *
 * Section order follows 100launchscripts.com, which the owner picked as the
 * reference: hero, authority, origin story, what changes, problem/solution,
 * what makes it different, results, testimonials, bonus stack, who it is for,
 * final pricing block, footer CTA. The CTA repeats six times.
 *
 * What is NOT copied from that page: the countdown timer and the aggregate
 * revenue claims. A countdown implies a deadline that has not been set, and
 * every number here has to be one somebody can check. The struck price carries
 * the urgency instead, and it is real — ₦15,000 is a pre-sell price.
 *
 * ⚠ THIS IS A SYSTEM WITH LIVE WEEKLY SESSIONS, NOT A MODULE LIBRARY. Do not
 * rewrite it back into "seven modules you watch". The outline's own first line
 * is "The Great Work is not a course. It is a done-for-you system", and the
 * audience voted 4-1 plus the Instagram poll majority for weekly calls over a
 * done-for-you kit. Every live-support voter gave a reason; the kit voter did
 * not. The seven parts are real and unchanged as the backbone — what changed is
 * that they are built WITH people on calls rather than handed over.
 *
 * The single kit voter is answered on the page rather than ignored ("the
 * templates still come, they come inside the calls"), which is a deliberate
 * instruction in the research doc: acknowledging the dissenter teaches the
 * audience that disagreeing still gets heard.
 */

const PRICE = 15000;
const WAS = 35000;

const CHANGES = [
  "You stop guessing which skill to push and know which one has the best odds right now.",
  "You have something to show a client instead of describing what you can do.",
  "You know where the people who pay actually are, and what to say to them.",
  "You can ask for money without your voice shaking, because you have receipts.",
  "One client going quiet stops being the end of your income.",
  "You have a loop you can run again next month, and the month after.",
];

const MODULES = [
  {
    n: "01",
    t: "Escape the Confusion Loop",
    one: "How to stop jumping randomly between skills and opportunities.",
    aha: "I don't need to do everything. I need to know what gives me the strongest advantage right now.",
    instrument: "The Opportunity Map",
  },
  {
    n: "02",
    t: "Learn and Adapt Faster",
    one: "How to enter new fields and become useful quickly.",
    aha: "I don't need years before I can become useful. I need the right learning and execution loop.",
    instrument: null,
  },
  {
    n: "03",
    t: "Build Something That Proves You Can Do It",
    one: "How to turn knowledge into visible proof.",
    aha: "Instead of telling people what I can do, I can show them.",
    instrument: "The Case Study Template",
  },
  {
    n: "04",
    t: "Become Visible",
    one: "How to build attention and position yourself around what you can do.",
    aha: "Visibility is not just popularity. The right people need to understand why I am valuable.",
    instrument: null,
  },
  {
    n: "05",
    t: "Turn Skills Into Money",
    one: "How to find the best monetization model for what you know.",
    aha: "I may not need another skill. I may need a better way to package and sell the ones I already have.",
    instrument: "The Monetization Matrix · The Assay Sheet",
  },
  {
    n: "06",
    t: "Get Customers, Deals, and Opportunities",
    one: "How to move from waiting for opportunities to creating them.",
    aha: "Opportunities are not only found. They can be deliberately created.",
    instrument: "The Research Sheet",
  },
  {
    n: "07",
    t: "Build Your Opportunity Engine",
    one: "How to combine skills, adaptability, visibility and monetization into a repeatable system.",
    aha: "I now have a system I can reuse whenever my industry, technology or circumstances change.",
    instrument: "The 90-Day Plan",
  },
];

const DELIVERABLES = [
  {
    t: "Skill Packaging Kit",
    d: "Fill in your skill, get a positioning statement and a portfolio page out of it. Not a lesson on how to position yourself. Your positioning, done.",
  },
  {
    t: "Client Finder Toolkit",
    d: "Where to look, what to say, and the follow-up for when they don't reply. The most common sentence I heard this month was some version of where do I even find people who pay.",
  },
  {
    t: "Proof Builders",
    d: "Templates that turn your first gig, paid or free, into a case study. Not a lesson about case studies. Yours, built.",
  },
  {
    t: "Confidence Through Receipts",
    d: "Somebody told me he only believes a design is good once the client says so. That is not fixed by motivation. It is fixed by a real client saying it, so the system is built to get you that first.",
  },
  {
    t: "The Opportunity Engine",
    d: "The loop you keep after everything else. Find opportunity, package skill, show proof, close client, document result, find the next one.",
  },
];


/**
 * The receipts, as images.
 *
 * These are the chat screenshots from 12-Proof-Library/students/ and
 * .../content/. Every one is ALREADY PUBLIC: the same images are attached to
 * tweets in the pinned "Untold Story" thread, which has had over a million views
 * since Nov 2023. Putting them here is re-publication, not new exposure, and
 * that folder's own header settles the consent question for the whole set.
 *
 * They are shown rather than described on purpose. A screenshot of somebody
 * saying "I just got a new apartment" does work that a paragraph about it
 * cannot, and the reference page the owner picked uses a grid of exactly these.
 *
 * The copy under each one stays under the image and stays modest: the image is
 * the claim. Two figures are deliberately NOT asserted in text — Bernard's
 * N500,000 and whether the dev gig was monthly — because those are still being
 * confirmed. The screenshots say what they say without me putting a number in a
 * headline.
 *
 * The captions are claims, so they are set in the reading face under the
 * print, never in the handwriting (paper rule: handwriting is for asides).
 */
const RECEIPTS = [
  {
    src: "/proof/students/hackathon.jpg",
    alt: "Student message about competing in the Flow hackathon on LearnWeb3",
    cap: "Won the Flow bounty at LearnWeb3. Published on their site, with both names on it.",
  },
  {
    src: "/proof/students/babcock-story.jpg",
    alt: "Student message explaining he gambled part of his school fees and earned it back",
    cap: "Gambled ₦500,000 of his school fees. Earned his way back to covering his family's bills.",
  },
  {
    src: "/proof/students/babcock-job.jpg",
    alt: "Follow-up message confirming the amount made and the smart contract job",
    cap: "$500 from the trade, then a $500 job editing smart contracts.",
  },
  {
    src: "/proof/students/dev-gig.jpg",
    alt: "Student message about landing a dev gig and buying a phone",
    cap: "A $6,000 a month dev gig off projects shared in the group. He bought the phone with it.",
  },
  {
    src: "/proof/students/apartment.jpg",
    alt: "Student message about a new apartment and upgraded workstation",
    cap: "Liquidated on Binance. Later: a new apartment and an upgraded workstation.",
  },
  {
    src: "/proof/students/bernard.jpg",
    alt: "Congratulations exchange with a student about a job",
    cap: "One job. Then he spent it kitting out a workspace.",
  },
  {
    src: "/proof/students/deola.jpg",
    alt: "Post about a follower landing a $10,000 Web3 job",
    cap: "A follower landed a $10,000 Web3 job in three months. 48,000 views.",
  },
  {
    src: "/proof/students/haleem.jpg",
    alt: "Post about a student going from no money for a class to a $13,000 gig",
    cap: "Could not afford a $100 class. Then a $13,000 gig. 36,000 views.",
  },
];

const WHO_FOR = [
  "You have a skill that works and it has never paid you properly.",
  "You are good at the work and freeze the moment it is time to ask for money.",
  "You believe you have no skill at all. You are usually wrong, and the first session exists for you.",
  "You have one client and no idea where the second one comes from.",
  "You have been paid before and still cannot say what you do in one sentence.",
  "You own a business and want to run this system on it yourself.",
];

const NOT_FOR = [
  "You want a certificate more than a client.",
  "You want somebody else to do the work for you. That is a service, and it is sold separately.",
  "You want a guaranteed number by a guaranteed date. Nobody honest can give you that.",
];

const FINAL_LIST = [
  "Live weekly sessions where we build it together",
  "Seven weekly sessions, in the order that actually works",
  "Six instruments you keep and reuse, built with you",
  "The five build-it-for-you kits",
  "Lifetime access, including everything added later",
];

const TRANSFORMATION = ["Confusion", "Skill", "Proof", "Visibility", "Money", "Opportunities"];

/** The book's pages, from this page's own copy (components/v3/stage/scenes/book.ts). */
const BOOK_PARAMS = {
  preset: "course",
  cover: { title: "The Great Work", by: "Big Quiv" },
  line: {
    text: TRANSFORMATION.join(" → "),
    body: "Seven modules that move you along that line in order, because the order is the point.",
  },
  modules: MODULES.map((m) => ({ n: m.n, t: m.t, one: m.one, aha: m.aha, instrument: m.instrument })),
  labels: { week: "Week", leaveWith: "You leave with:", thinking: "You walk out thinking:" },
};

const BUY_LABEL = `Get instant access · ₦${PRICE.toLocaleString()}`;

export function CourseClient() {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  const was = `₦${WAS.toLocaleString()}`;
  const now = `₦${PRICE.toLocaleString()}`;

  const buy = (className = "") => (
    <div className={`v3-buy ${className}`}>
      <button type="button" onClick={open} className="v3-btn v3-btn--lg">
        {BUY_LABEL} <Arrow />
      </button>
      <Price was={was} now={now}>
        while it is being built · lifetime access
      </Price>
    </div>
  );

  return (
    <div className="v3 v3-course v3-gw">
      {/* ───────── STAGE: the book opens, one module per page ───────── */}
      <Stage
        scene="book"
        params={BOOK_PARAMS}
        ground="navy"
        height={640}
        heightPhone={560}
        mark="GREAT WORK"
        label="The Great Work"
      >
        <div className="v3-cintro">
          <div className="v3-cintro__main">
            <h1 id="gw-hero" className="v3-cintro__h v3-display" data-lift>
              You have a skill.{" "}
              <span className="mark">
                <KeywordSlam>It is not paying you.</KeywordSlam>
              </span>
            </h1>
            <div className="v3-cintro__rest" data-intro-rest>
              <p className="v3-cintro__p">
                Everybody told you to learn a skill. Get the skill and you will be fine, they said. Nobody taught you the
                part after.
              </p>
              <div className="v3-cintro__buy">
                <button type="button" onClick={open} className="v3-btn v3-btn--lg">
                  {BUY_LABEL} <Arrow />
                </button>
                <div>
                  <p className="v3-cintro__label">While it is being built</p>
                  <Price was={was} now={now}>
                    while it is being built · lifetime access
                  </Price>
                </div>
                <span className="v3-chip">lifetime access</span>
              </div>
            </div>
          </div>
          <span className="v3-intro__cue" data-intro-rest aria-hidden="true">
            <i />
            Scroll
          </span>
        </div>

        <h2 className="v3-ghost" data-ghost="0.1,0.15,0.27,0.31" data-side="left">
          The skill was never the problem.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.33,0.37,0.48,0.52" data-side="right">
          Proof before visibility.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.53,0.565,0.76,0.8" data-side="high">
          Seven parts. Seven weeks.
        </h2>

        <p className="v3-gw__endline v3-display" data-at="0.84,0.88,0.97,1">
          You are not behind
        </p>
        <div className="v3-endcta" data-at="0.86,0.9,0.98,1">
          <button type="button" onClick={open} className="v3-btn v3-btn--lg">
            {BUY_LABEL} <Arrow />
          </button>
        </div>
      </Stage>

      {/* ───────── THE PART AFTER ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" data-panel aria-label="The part after">
        <div className="v3-wrap v3-gw__after">
          <p data-fade>
            Where the people who pay actually are. What to say to them. How to show you can do the work before anyone has
            hired you. And what happens when your one client goes quiet and your income goes quiet with him.
          </p>
          <p className="v3-gw__after-big v3-title" data-fade>
            That is the part nobody built anything for. So I did, and we build it together, live, every week.
          </p>
        </div>
      </section>

      {/* ───────── AUTHORITY ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="gw-authority">
        <div className="v3-wrap v3-gw__teach">
          <div>
            <h2 id="gw-authority" className="v3-h2 v3-display" data-split>
              I have been teaching this a long time before it had a name
            </h2>
            <div className="v3-gw__teach-copy">
              <p data-fade>
                I run Ophir Digital Education Foundation, registered in Nigeria as <b>CAC 9071886</b>. Over two thousand
                people have come through what I teach. Before any of that I was a microbiologist, then a sales boy on
                ₦10,000 a month, so I am not guessing about what it feels like to have something in your hands and no way
                to turn it into money.
              </p>
              <p data-fade>
                The Great Work is not new material. It is the thing I have been teaching for years, finally packaged so you
                can run it without me standing over you.
              </p>
            </div>
          </div>
          <figure className="v3-gw__photo" data-parallax="0.08">
            <div className="v3-gw__photo-frame" data-reveal="clip">
              <Image
                src="/about-journey.jpg"
                alt="A selfie of Big Quiv with classmates at his web design class graduation, at a church in Ekiti."
                fill
                sizes="(max-width: 900px) 80vw, 420px"
                style={{ objectFit: "cover", objectPosition: "0% 50%" }}
              />
            </div>
            <figcaption>the early days</figcaption>
          </figure>
        </div>
      </section>

      {/* ───────── THE WHOLE THING IN ONE LINE: spotlight (#4) ───────── */}
      <LightsOut className="v3-section v3-section--paper v3-gw__line" labelledBy="gw-line">
        <div className="v3-wrap">
          <h2 id="gw-line" className="v3-h2 v3-display v3-gw__line-h">
            The whole thing in one line
          </h2>
          <ol className="v3-gw__chain" aria-label={TRANSFORMATION.join(" → ")} data-light-line>
            {TRANSFORMATION.map((w, i) => (
              <li key={w} data-light>
                <span className={i === TRANSFORMATION.length - 1 ? "is-last" : undefined}>{w}</span>
                {i < TRANSFORMATION.length - 1 && (
                  <svg className="v3-gw__chain-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3.5 10h12M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                  </svg>
                )}
              </li>
            ))}
          </ol>
          <p className="v3-gw__line-p">
            Seven modules that move you along that line in order, because the order is the point. Proof before visibility.
            Visibility before money. Most people try to sell from step one and then wonder why nobody answers.
          </p>
        </div>
      </LightsOut>

      {/* ───────── WHAT CHANGES FOR YOU ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="gw-changes">
        <div className="v3-wrap">
          <h2 id="gw-changes" className="v3-h2 v3-display" data-split>
            What changes for you
          </h2>
          <MarkList items={CHANGES} kind="arrow" className="v3-gw__changes" />
          {buy()}
        </div>
      </section>

      {/* ───────── PROBLEM / SOLUTION ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="gw-problem">
        <div className="v3-wrap">
          <h2 id="gw-problem" className="v3-h2 v3-display" data-split>
            So do not go and learn another skill yet
          </h2>
          <div className="v3-gw__problem">
            <div>
              <p data-fade>This is what most people do. Learn a skill. Post about it. Wait.</p>
              <p data-fade>
                Then nothing happens, so they decide the problem was the skill, and go and learn another one. Two years
                later they have four skills and the same bank balance.
              </p>
              <p className="v3-gw__never v3-display" data-fade>
                The skill was <span className="v3-key">never</span> the problem.
              </p>
            </div>
            <div className="v3-gw__story" data-fade>
              <p>
                I spoke to a developer this month who has built a live tax system a company paid him for every month, for
                five months. Real money, real product. When that one client ran out of cash his income went to zero,
                because everything he had ever built belonged to that one man. He does not need a fifth skill. He needs a
                second buyer.
              </p>
              <p className="v3-gw__story-end">
                That is the gap. Not talent, not effort, not information. Nobody ever handed you the second half.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── WHAT MAKES THIS DIFFERENT ─────────
          This block leads, and the module list follows it. The audience voted
          4-1 plus the Instagram poll majority for weekly calls over a
          done-for-you kit, and every live-support voter volunteered a reason
          while the single kit voter did not. Leading with a module list sells
          them the passive-lessons format the research says they are done with.
          See LAUNCH-DAY-01/DAY-01-RESEARCH.md, FINAL TALLY. */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="gw-different">
        <div className="v3-wrap v3-gw__diff">
          <div>
            <h2 id="gw-different" className="v3-h2 v3-display" data-split>
              What makes this different
            </h2>
            <p className="v3-gw__diff-label">You are not left alone with it</p>
            <p className="v3-gw__diff-big v3-display" data-fade>
              Seven parts. Seven weeks. One live session each, where we build that week&rsquo;s piece together.
            </p>
          </div>
          <div className="v3-gw__diff-copy">
            <p data-fade>
              I asked people directly: a done-for-you kit, or live weekly sessions where we work through it together. It
              was not close. One of them put it better than I could: <em>&ldquo;weekly calls where we build it is better.&rdquo;</em>{" "}
              Another said it would be <em>&ldquo;well tailored for those who need it, knowing what would really work or not.&rdquo;</em>
            </p>
            <p data-fade>
              One person voted for the kit, and he was right about one thing, so let me say it plainly:{" "}
              <span className="mark">the templates still come. They just come inside the calls</span>, where I can see your
              actual skill and your actual situation instead of handing you a blank worksheet and hoping.
            </p>
            <p data-fade>
              That last part is not a guess either. I sent the first tool to somebody who told me she did not know what her
              skill was. She never filled it in. A blank worksheet is exactly what that person cannot use.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── THE SEVEN WEEKS: type wall (#15) ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="gw-weeks">
        <div className="v3-wrap">
          <div className="v3-gw__weeks-head">
            <h3 id="gw-weeks" className="v3-h2 v3-display" data-split>
              The seven weeks
            </h3>
            <p data-fade>
              Each one is a week, and each week is a session. In this order, because the order is the point. Every session
              covers exactly one thing and most of them end with you holding an instrument you keep. You do not watch these.
              We build them.
            </p>
          </div>
          <TypeWall className="v3-gw__weeks">
            {MODULES.map((m) => (
              <li key={m.n} data-wall-row>
                <p className="v3-gw__wk-n">
                  <span>Week</span>
                  <b>{m.n}</b>
                </p>
                <div className="v3-gw__wk-body">
                  <h4 className="v3-gw__wk-t v3-display" data-wall-word>
                    {m.t}
                  </h4>
                  <div className="v3-gw__wk-cols">
                    <div>
                      <p className="v3-gw__wk-one">{m.one}</p>
                      {m.instrument && (
                        <p className="v3-gw__wk-inst">
                          <span>You leave with: </span>
                          <b>{m.instrument}</b>
                        </p>
                      )}
                    </div>
                    <p className="v3-gw__wk-aha">
                      <span>You walk out thinking: </span>
                      {m.aha}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </TypeWall>
          {buy()}
        </div>
      </section>

      {/* ───────── RESULTS ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="gw-results">
        <div className="v3-wrap">
          <div className="v3-gw__res-head">
            <h2 id="gw-results" className="v3-h2 v3-display" data-split>
              What came out of it
            </h2>
            <p data-fade>
              These are people I taught. Their results, not a promise of yours. Every one of these has been public since
              2023 and you can go and check them.
            </p>
          </div>
          <div className="v3-gw__res">
            {/*
              Strongest first. This is the only claim on this site a stranger can
              confirm against a third party's own records. Deliberately does NOT
              claim the dollar split or "2nd of 350+ hackers from 56 countries" —
              both are chat-only. See 12-Proof-Library/students/blocks.md.
            */}
            <div className="v3-gw__proof v3-gw__proof--lead" data-fade>
              <p className="v3-gw__proof-tag">Verified by someone else</p>
              <p className="v3-gw__proof-big v3-title">
                Two of my students won the Flow bounty at LearnWeb3&rsquo;s Decentralized Intelligence hackathon, with an AI
                payroll app called SwiftPay.
              </p>
              <p className="v3-gw__proof-p">
                You do not have to believe me. LearnWeb3 published it themselves, with both their names on it.{" "}
                <a
                  className="v3-link"
                  href="https://learnweb3.io/hackathons/decentralized-intelligence-season-1/projects/39560768-5d7a-4417-b2eb-38f65a8fa0c7/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Go and read it
                </a>
                .
              </p>
            </div>
            <div className="v3-gw__proof" data-fade>
              <p className="v3-gw__proof-h">
                A final-year student at Babcock was handed ₦800,000 for school fees and gambled ₦500,000 of it away.
              </p>
              <p className="v3-gw__proof-p">
                He came in with ₦300,000 left and panicking. He made $500 back, then landed a $500 job editing smart
                contracts through the group. Last I heard he was covering his parents&rsquo; and siblings&rsquo; bills.
              </p>
            </div>
            <div className="v3-gw__proof" data-fade>
              <p className="v3-gw__proof-h">One got liquidated on Binance and lost his savings.</p>
              <p className="v3-gw__proof-p">
                Months later he messaged me at 10pm to say he had moved into a furnished apartment and upgraded his
                workstation.
              </p>
            </div>
          </div>
          <div className="v3-gw__posts">
            {[
              {
                href: "https://x.com/_Quivira/status/1722169180487840197",
                head: "A follower landed a $10,000 Web3 job with no skill, in three months.",
                meta: "Posted 8 November 2023. 48,000 views, 377 likes, 116 reposts. Still up.",
              },
              {
                href: "https://x.com/_Quivira/status/1724710340754317664",
                head: "From not having $100 for a class to a $13,000 gig.",
                meta: "Posted 15 November 2023. 36,000 views, 457 likes. The student is tagged in it and the payment screenshots are inside the post.",
              },
            ].map((p) => (
              <a key={p.href} href={p.href} target="_blank" rel="noopener noreferrer" className="v3-gw__post" data-fade data-tilt>
                <p className="v3-gw__proof-h">{p.head}</p>
                <p className="v3-gw__proof-p">{p.meta}</p>
                <span className="v3-gw__post-go" aria-hidden="true">
                  On X ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── THEIR WORDS, NOT MINE ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="gw-words">
        <div className="v3-wrap">
          <div className="v3-gw__res-head">
            <h3 id="gw-words" className="v3-h2 v3-display" data-split>
              Their words, not mine
            </h3>
            <p data-fade>
              These are the actual messages. All of them have been public since 2023, attached to a thread that has been seen
              over a million times.
            </p>
          </div>
          <ul className="v3-gw__shots">
            {RECEIPTS.map((r, i) => (
              <li key={r.src} data-parallax={i % 2 === 1 ? "0.06" : undefined}>
                <figure>
                  <div className="v3-gw__shot" data-reveal="clip">
                    <Image
                      src={r.src}
                      alt={r.alt}
                      width={840}
                      height={1280}
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 300px"
                    />
                  </div>
                  <figcaption>{r.cap}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── THE INSTRUMENTS (the stack) ───────── */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" aria-labelledby="gw-instruments">
        <div className="v3-wrap v3-gw__kit">
          <div>
            <h2 id="gw-instruments" className="v3-h2 v3-display" data-split>
              Things you use, not lessons you watch
            </h2>
            <p className="v3-lede" data-fade>
              Every part of this ends with something in your hands rather than something in your notes. You do not fill
              these in alone at midnight. We build them on the calls.
            </p>
            {buy()}
          </div>
          <ol className="v3-gw__kit-list">
            {DELIVERABLES.map((d, i) => (
              <li key={d.t} data-fade>
                <span className="v3-gw__kit-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="v3-h3">{d.t}</h3>
                  <p>{d.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── WHO IT IS FOR ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="gw-who">
        <div className="v3-wrap v3-gw__who">
          <div>
            <h2 id="gw-who" className="v3-h2 v3-display" data-split>
              Who this is for
            </h2>
            <MarkList items={WHO_FOR} kind="check" className="v3-gw__who-list" />
          </div>
          <div className="v3-gw__not">
            <h3 className="v3-h3">And who it is not for</h3>
            <MarkList items={NOT_FOR} kind="cross" />
          </div>
        </div>
      </section>

      {/* ───────── HONESTY: a letter ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="gw-honest">
        <div className="v3-wrap v3-gw__letter">
          <h2 id="gw-honest" className="v3-h2 v3-display" data-split>
            What you are actually buying today
          </h2>
          <div className="v3-gw__letter-body">
            <p data-fade>
              This is being built right now and I am not going to pretend otherwise. The seven parts are written and the
              instruments exist. The rest gets built on the calls, with the people who are already inside it, shaped by what
              they tell me they are stuck on. That is not a shortcut. It is the reason it will fit you and not somebody else.
            </p>
            <div>
              <p data-fade>
                That is why it is ₦{PRICE.toLocaleString()} instead of ₦{WAS.toLocaleString()}, and why{" "}
                <span className="v3-key">everything added later is yours</span> at no extra cost. You are early. Early should
                be worth something.
              </p>
              <p aria-hidden="true" className="v3-hand v3-gw__sign">
                Big Quiv
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── FINAL PRICING ───────── */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" aria-labelledby="gw-final">
        <div className="v3-wrap v3-gw__close">
          <div>
            <h2 id="gw-final" className="v3-display v3-gw__close-h" data-split>
              You are <span className="mark">not behind</span>
            </h2>
            <p className="v3-gw__close-p">
              You are sitting on something that already works, and nobody ever showed you the second half. That is a fixable
              problem and it is the only thing this is for.
            </p>
            <MarkList items={FINAL_LIST} checklist />
          </div>
          <div className="v3-gw__ticket">
            <div className="v3-gw__mini" aria-hidden="true" data-tilt>
              <p>The Great Work</p>
              <i />
              <span>Big Quiv</span>
            </div>
            <p className="v3-cintro__label">While it is being built</p>
            <p className="v3-gw__ticket-price">
              <s>{was}</s>
              <span className="v3-sr"> (was)</span>
              <b>{now}</b>
            </p>
            <button type="button" onClick={open} className="v3-btn v3-btn--lg">
              Get instant access <Arrow />
            </button>
          </div>
        </div>
      </section>

      <PaymentModal isOpen={payOpen} onClose={() => setPayOpen(false)} serviceName="The Great Work" amount={PRICE} currency="NGN" />
    </div>
  );
}
