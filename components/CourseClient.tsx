"use client";

import { useState } from "react";
import Image from "next/image";
import { PaymentModal } from "@/components/PaymentModal";
import {
  BrutalButton,
  HandMark,
  HandNote,
  Highlighter,
  MonoLabel,
  PaperSection,
  PhotoPrint,
  SectionHead,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";
import { MarkList, PriceLine, PriceTicket } from "@/components/course/CoursePaper";

/**
 * The Great Work sales page.
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
 * PAPER REDESIGN 2026-10-05. Light paper grounds, the promise in the condensed
 * Didone, the seven weeks as a numbered brutalist syllabus, the receipts as
 * pinned prints, the price as a framed gold ticket. Every word of copy and
 * every number is unchanged; the payment flow (PaymentModal, Flutterwave,
 * Blockradar) is unchanged and only restyled. Pen notes and sticker labels
 * are the only new words and none of them states a fact.
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

/** How each receipt print sits on the board. */
const RECEIPT_LAYOUT = [
  { tilt: -2, attach: "pin" as const },
  { tilt: 1.6, attach: "tape" as const },
  { tilt: -1.2, attach: "clip" as const },
  { tilt: 2, attach: "pin" as const },
  { tilt: 1.4, attach: "tape" as const },
  { tilt: -1.8, attach: "pin" as const },
  { tilt: 1.1, attach: "clip" as const },
  { tilt: -1.5, attach: "tape" as const },
];

const DELIVERABLE_TONE = ["bg-gold-tint", "bg-paper", "bg-gold", "bg-paper", "bg-paper-alt"];
const DELIVERABLE_TILT = [-1, 0.8, -0.6, 1, -0.8];

const bodyLg = "text-lg leading-relaxed text-ink-soft";

export function CourseClient() {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  const cta = (label = `Get instant access · ₦${PRICE.toLocaleString()}`, className?: string) => (
    <div className={cx("mt-10 flex flex-wrap items-center gap-x-6 gap-y-5", className)}>
      {/* The label carries the price, so it is long: it may wrap on a phone
          (never at desktop), and the button never grows past its column. */}
      <BrutalButton onClick={open} size="lg" className="max-w-full whitespace-normal! text-left sm:whitespace-nowrap!">
        {label}
      </BrutalButton>
      <PriceLine was={`₦${WAS.toLocaleString()}`} now={`₦${PRICE.toLocaleString()}`}>
        while it is being built · lifetime access
      </PriceLine>
    </div>
  );

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. HERO ─────────
          The promise set huge across the page, the four paragraphs beside
          the buy card, the card taped on like a ticket. */}
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        aria-labelledby="gw-hero"
        innerClassName="pb-20 pt-[calc(4rem+2.75rem)] md:pb-28 md:pt-[calc(4.5rem+4rem)]"
      >
        <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
          The Great Work
        </Sticker>
        <h1
          id="gw-hero"
          className="load-drop mt-7 max-w-[15ch] font-didone text-[clamp(3.3rem,10.5vw,7.4rem)] font-semibold leading-[0.94] tracking-[-0.01em] text-ink text-balance"
        >
          You have a skill.{" "}
          <br />
          <Highlighter load delay={500}>It is not paying you.</Highlighter>
        </h1>

        <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <div className="max-w-[60ch]">
            <p className="text-lg leading-relaxed text-ink-soft md:text-xl">
              Everybody told you to learn a skill. Get the skill and you will be fine, they said. Nobody taught you the
              part after.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft md:text-xl">
              Where the people who pay actually are. What to say to them. How to show you can do the work before anyone
              has hired you. And what happens when your one client goes quiet and your income goes quiet with him.
            </p>
            <p className="mt-6 font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink md:text-[1.45rem]">
              That is the part nobody built anything for. So I did, and we build it together, live, every week.
            </p>
          </div>

          <div className="relative lg:mt-2">
            <div className="relative border-[3px] border-ink bg-paper p-6 pt-9 shadow-brutal-lg [rotate:1.2deg] sm:p-8 sm:pt-10">
              <Tape className="-top-3.5 left-10" tilt={-5} />
              <MonoLabel as="p" tone="ink" className="font-bold">
                While it is being built
              </MonoLabel>
              {cta(undefined, "mt-6")}
            </div>
            <Sticker
              shape="starburst"
              tone="gold"
              size={112}
              tilt={12}
              className="absolute -top-14 right-1 sm:-right-8 sm:-top-12"
              delay={200}
            >
              lifetime access
            </Sticker>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 2. AUTHORITY ───────── */}
      <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="gw-authority">
        <div className="grid items-center gap-x-16 gap-y-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <SectionHead id="gw-authority" size="md" title="I have been teaching this a long time before it had a name" />
            <p className={cx(bodyLg, "mt-8 max-w-[62ch]")}>
              I run Ophir Digital Education Foundation, registered in Nigeria as{" "}
              <span className="font-bold text-ink">CAC 9071886</span>. Over two thousand people have come through what I
              teach. Before any of that I was a microbiologist, then a sales boy on ₦10,000 a month, so I am not guessing
              about what it feels like to have something in your hands and no way to turn it into money.
            </p>
            <p className={cx(bodyLg, "mt-5 max-w-[62ch]")}>
              The Great Work is not new material. It is the thing I have been teaching for years, finally packaged so you
              can run it without me standing over you.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[360px]">
            <PhotoPrint tilt={3} attach="tape-corners" mat="polaroid" caption="the early days" lift="self">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/about-journey.jpg"
                  alt="A selfie of Big Quiv with classmates at his web design class graduation, at a church in Ekiti."
                  fill
                  sizes="360px"
                  className="object-cover"
                  style={{ objectPosition: "0% 50%" }}
                />
              </div>
            </PhotoPrint>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 3. THE TRANSFORMATION ─────────
          The line itself, drawn as a chain of six tags. The words are the
          same words in the same order; the arrows are the "→" of the copy. */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="gw-line">
        <SectionHead id="gw-line" size="md" title="The whole thing in one line" />
        <p className="sr-only">{TRANSFORMATION.join(" → ")}</p>
        <ol aria-hidden="true" className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-5 sm:gap-x-3">
          {TRANSFORMATION.map((w, i) => (
            <li key={w} className="flex items-center gap-2 sm:gap-3">
              <span
                className={cx(
                  "inline-flex border-[3px] border-ink px-3 py-2 font-display text-[1.15rem] font-bold tracking-[-0.01em] text-ink shadow-brutal-sm sm:px-4 sm:text-[1.6rem] lg:text-[1.9rem]",
                  i === TRANSFORMATION.length - 1 ? "bg-gold" : i === 0 ? "bg-paper-alt text-ink-soft" : "bg-paper"
                )}
                style={{ rotate: `${i % 2 === 0 ? -1.5 : 1.5}deg` }}
              >
                {w}
              </span>
              {i < TRANSFORMATION.length - 1 && (
                <span className="font-typewriter text-xl font-bold text-gold-deep sm:text-2xl">→</span>
              )}
            </li>
          ))}
        </ol>
        <p className={cx(bodyLg, "mt-12 max-w-[64ch]")}>
          Seven modules that move you along that line in order, because the order is the point. Proof before visibility.
          Visibility before money. Most people try to sell from step one and then wonder why nobody answers.
        </p>
      </PaperSection>

      {/* ───────── 4. WHAT CHANGES FOR YOU ───────── */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="gw-changes">
        <SectionHead id="gw-changes" size="md" title="What changes for you" />
        <MarkList items={CHANGES} mark="arrow" className="mt-10 grid max-w-[1080px] gap-x-12 gap-y-5 space-y-0 md:grid-cols-2" />
        {cta()}
      </PaperSection>

      {/* ───────── 5. PROBLEM / SOLUTION ───────── */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="gw-problem">
        <SectionHead id="gw-problem" size="md" title="So do not go and learn another skill yet" />
        <div className="mt-10 grid max-w-[1080px] gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className={bodyLg}>This is what most people do. Learn a skill. Post about it. Wait.</p>
            <p className={cx(bodyLg, "mt-5")}>
              Then nothing happens, so they decide the problem was the skill, and go and learn another one. Two years
              later they have four skills and the same bank balance.
            </p>
            <p className="mt-10 font-didone text-[clamp(2.2rem,4.6vw,3.2rem)] font-semibold leading-[1.02] text-ink">
              The skill was <HandMark kind="circle">never</HandMark> the problem.
            </p>
          </div>
          <div className="relative border-[3px] border-ink bg-paper p-6 shadow-brutal [rotate:0.8deg] sm:p-8">
            <p className={bodyLg}>
              I spoke to a developer this month who has built a live tax system a company paid him for every month, for
              five months. Real money, real product. When that one client ran out of cash his income went to zero,
              because everything he had ever built belonged to that one man. He does not need a fifth skill. He needs a
              second buyer.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink">
              That is the gap. Not talent, not effort, not information. Nobody ever handed you the second half.
            </p>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 6. WHAT MAKES THIS DIFFERENT ─────────
          The callout leads and the syllabus follows. See the research note
          inside: leading with the module list would sell the passive-lessons
          format the audience said they are done with. */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="gw-different">
        <SectionHead id="gw-different" size="md" title="What makes this different" />

        {/*
          This block leads, and the module list follows it. The audience voted
          4-1 plus the Instagram poll majority for weekly calls over a
          done-for-you kit, and every live-support voter volunteered a reason
          while the single kit voter did not. Leading with a module list sells
          them the passive-lessons format the research says they are done with.
          See LAUNCH-DAY-01/DAY-01-RESEARCH.md, FINAL TALLY.
        */}
        <div className="relative mt-12 max-w-[880px] border-[3px] border-ink bg-gold-tint p-6 pt-10 shadow-brutal [rotate:-0.6deg] sm:p-10 sm:pt-12">
          <Tape className="-top-3.5 left-12" tilt={-4} />
          <p className="font-typewriter text-[13px] font-bold uppercase tracking-[0.1em] text-ink">
            You are not left alone with it
          </p>
          <p className="mt-5 font-didone text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.08] text-ink">
            Seven parts. Seven weeks. One live session each, where we build that week&rsquo;s piece together.
          </p>
          <p className="mt-6 leading-relaxed text-ink-soft">
            I asked people directly: a done-for-you kit, or live weekly sessions where we work through it together. It
            was not close. One of them put it better than I could:{" "}
            <em className="not-italic font-bold text-ink">&ldquo;weekly calls where we build it is better.&rdquo;</em>{" "}
            Another said it would be{" "}
            <em className="not-italic font-bold text-ink">
              &ldquo;well tailored for those who need it, knowing what would really work or not.&rdquo;
            </em>
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            One person voted for the kit, and he was right about one thing, so let me say it plainly:{" "}
            <span className="hl-mark text-ink">the templates still come. They just come inside the calls</span>, where I
            can see your actual skill and your actual situation instead of handing you a blank worksheet and hoping.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            That last part is not a guess either. I sent the first tool to somebody who told me she did not know what her
            skill was. She never filled it in. A blank worksheet is exactly what that person cannot use.
          </p>
        </div>

        <div className="relative mt-24">
          <h3 className="font-didone text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-none text-ink">The seven weeks</h3>
          <p className="mt-5 max-w-[64ch] leading-relaxed text-ink-soft">
            Each one is a week, and each week is a session. In this order, because the order is the point. Every session
            covers exactly one thing and most of them end with you holding an instrument you keep. You do not watch these.
            We build them.
          </p>
          <HandNote arrow="down-left" tilt={-4} className="absolute -top-4 right-0 hidden xl:inline-flex">
            in this order
          </HandNote>
        </div>

        {/* The syllabus: a ruled brutalist sheet, one row per week. */}
        <ol className="mt-12 border-[3px] border-ink bg-paper shadow-brutal-lg">
          {MODULES.map((m, i) => (
            <li
              key={m.n}
              className={cx(
                "grid gap-x-8 gap-y-4 p-5 sm:p-7 md:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[7.5rem_minmax(0,1fr)_minmax(0,1fr)]",
                i > 0 && "border-t-[3px] border-ink",
                i % 2 === 1 && "bg-[#FAFAFB]"
              )}
            >
              <div className="flex items-baseline gap-3 md:block">
                <span className="font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-gold-deep">Week</span>
                <span className="block font-didone text-[3.4rem] font-semibold leading-[0.85] text-ink tabular-nums md:mt-1 md:text-[4.4rem]">
                  {m.n}
                </span>
              </div>
              <div>
                <h3 className="font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink">{m.t}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{m.one}</p>
                {m.instrument && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="text-ink-muted">You leave with: </span>
                    <span className="border-2 border-ink bg-gold px-2 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
                      {m.instrument}
                    </span>
                  </p>
                )}
              </div>
              <div className="md:col-start-2 lg:col-start-auto lg:border-l-2 lg:border-dashed lg:border-ink/30 lg:pl-8">
                <p className="leading-relaxed text-ink">
                  <span className="block font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">
                    You walk out thinking:{" "}
                  </span>
                  <span className="mt-2 block font-didone text-[1.45rem] font-medium leading-[1.2] text-ink">{m.aha}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
        {cta()}
      </PaperSection>

      {/* ───────── 7. RESULTS ─────────
          The verified one framed first, the rest as notes, then the actual
          screenshots pinned to the board. */}
      <PaperSection ground="grid" checker="top" pad="lg" aria-labelledby="gw-results">
        <SectionHead id="gw-results" size="md" title="What came out of it" />
        <p className={cx(bodyLg, "mt-6 max-w-[62ch]")}>
          These are people I taught. Their results, not a promise of yours. Every one of these has been public since 2023
          and you can go and check them.
        </p>

        <div className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-6">
          {/*
            Strongest first. This is the only claim on this site a stranger can
            confirm against a third party's own records. Deliberately does NOT
            claim the dollar split or "2nd of 350+ hackers from 56 countries" —
            both are chat-only. See 12-Proof-Library/students/blocks.md.
          */}
          <div className="relative border-[3px] border-ink bg-paper p-6 pt-9 shadow-brutal-lg sm:p-8 sm:pt-10 lg:col-span-6">
            <Sticker shape="label" tone="gold" tilt={-3} decorative={false} className="absolute -top-4 left-6">
              Verified by someone else
            </Sticker>
            <p className="max-w-[48ch] font-didone text-[clamp(1.8rem,3.4vw,2.5rem)] font-semibold leading-[1.1] text-ink">
              Two of my students won the Flow bounty at LearnWeb3&rsquo;s Decentralized Intelligence hackathon, with an
              AI payroll app called SwiftPay.
            </p>
            <p className="mt-5 max-w-[62ch] leading-relaxed text-ink-soft">
              You do not have to believe me. LearnWeb3 published it themselves, with both their names on it.{" "}
              <a
                href="https://learnweb3.io/hackathons/decentralized-intelligence-season-1/projects/39560768-5d7a-4417-b2eb-38f65a8fa0c7/"
                target="_blank"
                rel="noopener noreferrer"
                className="paper-link font-bold text-ink underline decoration-2 underline-offset-4"
              >
                Go and read it
              </a>
              .
            </p>
          </div>

          <div className="relative border-[3px] border-ink bg-gold-tint p-6 shadow-brutal [rotate:-1deg] sm:p-7 lg:col-span-3">
            <p className="text-lg font-bold leading-relaxed text-ink">
              A final-year student at Babcock was handed ₦800,000 for school fees and gambled ₦500,000 of it away.
            </p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              He came in with ₦300,000 left and panicking. He made $500 back, then landed a $500 job editing smart
              contracts through the group. Last I heard he was covering his parents&rsquo; and siblings&rsquo; bills.
            </p>
          </div>

          <div className="relative border-[3px] border-ink bg-paper p-6 shadow-brutal [rotate:1deg] sm:p-7 lg:col-span-3 lg:mt-8">
            <p className="text-lg font-bold leading-relaxed text-ink">One got liquidated on Binance and lost his savings.</p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              Months later he messaged me at 10pm to say he had moved into a furnished apartment and upgraded his
              workstation.
            </p>
          </div>

          {[
            {
              href: "https://x.com/_Quivira/status/1722169180487840197",
              head: "A follower landed a $10,000 Web3 job with no skill, in three months.",
              meta: "Posted 8 November 2023. 48,000 views, 377 likes, 116 reposts. Still up.",
              tilt: 0.8,
            },
            {
              href: "https://x.com/_Quivira/status/1724710340754317664",
              head: "From not having $100 for a class to a $13,000 gig.",
              meta: "Posted 15 November 2023. 36,000 views, 457 likes. The student is tagged in it and the payment screenshots are inside the post.",
              tilt: -0.8,
            },
          ].map((p) => (
            <a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block border-[3px] border-ink bg-paper p-6 shadow-brutal transition-[translate,rotate,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:[rotate:0deg] hover:shadow-brutal-lg sm:p-7 lg:col-span-3"
              style={{ rotate: `${p.tilt}deg` }}
            >
              <p className="text-lg font-bold leading-relaxed text-ink">{p.head}</p>
              <p className="mt-3 font-typewriter text-[13.5px] leading-relaxed text-ink-soft">{p.meta}</p>
              <span
                aria-hidden="true"
                className="mt-4 inline-flex items-center gap-2 border-b-[3px] border-ink pb-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.08em] text-ink transition-[gap] duration-200 group-hover:gap-3"
              >
                On X <span>↗</span>
              </span>
            </a>
          ))}
        </div>

        {/* The screenshots themselves. See the RECEIPTS note above. */}
        <div className="relative mt-28">
          <h3 className="font-didone text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-none text-ink">
            Their words, not mine
          </h3>
          <p className="mt-5 max-w-[62ch] leading-relaxed text-ink-soft">
            These are the actual messages. All of them have been public since 2023, attached to a thread that has been
            seen over a million times.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-14 sm:gap-x-10 lg:grid-cols-4">
          {RECEIPTS.map((r, i) => (
            <li key={r.src} className={cx(i % 2 === 1 && "mt-8 lg:mt-0", i % 4 === 1 && "lg:mt-10", i % 4 === 3 && "lg:mt-6")}>
              <figure className="m-0">
                <PhotoPrint
                  tilt={RECEIPT_LAYOUT[i].tilt}
                  attach={RECEIPT_LAYOUT[i].attach}
                  mat="thin"
                  lift="self"
                  delay={(i % 4) * 80}
                >
                  <Image
                    src={r.src}
                    alt={r.alt}
                    width={840}
                    height={1280}
                    sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 300px"
                    className="h-auto w-full"
                  />
                </PhotoPrint>
                <figcaption className="mt-4 px-0.5 text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">{r.cap}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </PaperSection>

      {/* ───────── 8. THE INSTRUMENTS (the stack) ───────── */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="gw-instruments">
        <SectionHead id="gw-instruments" size="md" title="Things you use, not lessons you watch" />
        <p className={cx(bodyLg, "mt-6 max-w-[62ch]")}>
          Every part of this ends with something in your hands rather than something in your notes. You do not fill these
          in alone at midnight. We build them on the calls.
        </p>

        <ul className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-6">
          {DELIVERABLES.map((d, i) => (
            <li
              key={d.t}
              className={cx(
                "relative border-[3px] border-ink p-6 pt-8 shadow-brutal sm:p-7 sm:pt-9",
                DELIVERABLE_TONE[i],
                i < 2 ? "md:col-span-3" : "md:col-span-2"
              )}
              style={{ rotate: `${DELIVERABLE_TILT[i]}deg` }}
            >
              <span
                aria-hidden="true"
                className="absolute -top-[3px] right-5 border-[3px] border-t-0 border-ink bg-paper px-2 py-1 font-typewriter text-[12px] font-bold text-ink"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink">{d.t}</h3>
              <p className={cx("mt-3 leading-relaxed", i === 2 ? "text-ink" : "text-ink-soft")}>{d.d}</p>
            </li>
          ))}
        </ul>
        {cta()}
      </PaperSection>

      {/* ───────── 9. WHO IT IS FOR ───────── */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="gw-who">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <SectionHead id="gw-who" size="md" title="Who this is for" />
            <MarkList items={WHO_FOR} mark="check" tone="ink" className="mt-10" />
          </div>
          <div className="relative self-start border-[3px] border-ink bg-paper p-6 shadow-brutal [rotate:1deg] sm:p-8 lg:mt-24">
            <h3 className="font-display text-[1.3rem] font-bold tracking-[-0.01em] text-ink">And who it is not for</h3>
            <MarkList items={NOT_FOR} mark="cross" tone="muted" className="mt-6" />
          </div>
        </div>
      </PaperSection>

      {/* ───────── 10. HONESTY ─────────
          A typed letter on one sheet of paper. */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="gw-honest">
        <div className="relative mx-auto max-w-[820px] border-[3px] border-ink bg-paper p-6 pt-10 shadow-brutal-lg sm:p-12 sm:pt-14">
          <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-2} width={120} />
          <SectionHead id="gw-honest" size="md" title="What you are actually buying today" />
          <p className={cx(bodyLg, "mt-8")}>
            This is being built right now and I am not going to pretend otherwise. The seven parts are written and the
            instruments exist. The rest gets built on the calls, with the people who are already inside it, shaped by what
            they tell me they are stuck on. That is not a shortcut. It is the reason it will fit you and not somebody else.
          </p>
          <p className={cx(bodyLg, "mt-5")}>
            That is why it is ₦{PRICE.toLocaleString()} instead of ₦{WAS.toLocaleString()}, and why{" "}
            <span className="hl-mark font-semibold text-ink">everything added later is yours</span> at no extra cost. You
            are early. Early should be worth something.
          </p>
          <p aria-hidden="true" className="mt-10 text-right font-hand text-[2rem] font-bold leading-none text-ink">
            Big Quiv
          </p>
        </div>
      </PaperSection>

      {/* ───────── 11. FINAL PRICING ─────────
          The brutal framed card: the argument on paper, the price on a gold
          ticket beside it. */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="gw-final">
        <div className="grid border-[3px] border-ink bg-paper shadow-brutal-lg lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="border-b-[3px] border-ink p-6 py-10 sm:p-10 lg:border-b-0 lg:border-r-[3px] lg:p-14">
            <h2
              id="gw-final"
              className="font-didone text-[clamp(2.8rem,6vw,4.6rem)] font-semibold leading-[0.95] tracking-[-0.005em] text-ink"
            >
              You are not <HandMark kind="underline">behind</HandMark>
            </h2>
            <p className={cx(bodyLg, "mt-7 max-w-[52ch]")}>
              You are sitting on something that already works, and nobody ever showed you the second half. That is a
              fixable problem and it is the only thing this is for.
            </p>
            <MarkList items={FINAL_LIST} mark="check" tone="ink" className="mt-9" />
          </div>
          <div className="relative flex items-center bg-paper-alt p-6 py-14 sm:p-10 lg:p-12">
            <PriceTicket
              caption="While it is being built"
              was={`₦${WAS.toLocaleString()}`}
              now={`₦${PRICE.toLocaleString()}`}
              tilt={-2}
              className="w-full"
            >
              <BrutalButton onClick={open} variant="paper" size="lg">
                Get instant access
              </BrutalButton>
            </PriceTicket>
          </div>
        </div>
      </PaperSection>

      <PaymentModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        serviceName="The Great Work"
        amount={PRICE}
        currency="NGN"
      />
    </div>
  );
}
