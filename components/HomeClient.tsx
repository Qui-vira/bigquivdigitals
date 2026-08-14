"use client";

import { MagneticButton } from "@/components/MagneticButton";
import { TestimonialCard } from "@/components/TestimonialCard";
import { SectionWrapper } from "@/components/SectionWrapper";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { ProofStrip, type ProofStatData } from "@/components/ProofStat";
import { HeroReveal } from "@/components/HeroReveal";
import { RiseWords } from "@/components/TextMotion";

interface Testimonial {
  quote: string;
  attribution: string;
  allImages: string[];
  rating: number;
  avatar: string | null;
}

interface HomeClientProps {
  calendlyUrl: string;
  proofStats: ProofStatData[];
  testimonials: Testimonial[];
}

/**
 * Structure follows the Trust & Authority + Conversion pattern:
 * who -> proof -> cost -> offer -> process -> hire me.
 *
 * Three CTA placements is deliberate. A visitor already sold stops at the
 * hero, one who needs proof converts after the case studies, one who needs
 * process converts after section 6.
 */

const CASE_STUDIES = [
  {
    href: "/work/peaceway",
    tag: "Health",
    claim:
      "A Lagos pharmacy that now takes orders end to end inside Telegram.",
    support:
      "Live at peacewayonline.com. Separate doors for customers, staff and suppliers, and a bot that carries a real order from search to confirmation.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage. Headline reads YOUR LAGOS PHARMACY IS NOW ONLINE, with buttons to order on Telegram or check product availability.",
  },
  {
    href: "/work/alpha-plays",
    tag: "Community and markets",
    claim: "8,874 people get my market calls. Individual posts pull 1.2K to 2.6K views.",
    support:
      "Every result published next to the call that produced it, with the entry, the stop and the target still visible.",
    image: "/proof/quivira/result-eth-setup-85pct.webp",
    imageAlt:
      "Telegram channel showing an ETH buy call with entry, stop loss and take profit, next to the resulting position card.",
  },
  {
    href: "/work/content-engine",
    tag: "Content",
    claim: "One video pulled 128,000 views and 1,700 comments.",
    support:
      "I answered every comment by hand. Behind it sits the pipeline: 13 deployed systems, a lead engine that scored 200 prospects, 25 published articles.",
    image: "/proof/content/web3-video-128k.webp",
    imageAlt:
      "The post's own metrics bar: 8:43 AM, 24 April 2025, 128K views, with 1.7K comments, 267 reposts, 1.4K likes and 598 bookmarks, and the follow-up post delivering the free Web3 guide the next day.",
  },
];

export function HomeClient({ calendlyUrl, proofStats, testimonials }: HomeClientProps) {
  return (
    <div>
      {/* ───────── 1. HERO ─────────
          Written by the owner. Four beats: the reader's failure declared before
          they start, the owner as the contrast, the mechanism, the act-now.

          The figure is the owner's own claim about his own life and is taken as
          given. Two things about it are NOT settled and are flagged to him
          rather than decided here:

          1. Currency resolved by the owner: naira. Stated explicitly rather
             than left to the reader, because this is the only number on a page
             whose whole argument is proof a stranger can check, and unqualified
             "seven figures" reads as naira in Lagos and dollars everywhere
             else. Naming it is what stops the same sentence being a modest,
             credible claim to one reader and an overclaim to another.
          2. The proof library's Block 4 publishes a neighbouring claim with a
             different year and unit: 15 dev jobs worth $50K+ with a $50,000.92
             portfolio screenshot, dated Oct 2023, opening "Started 2023 low on
             liquidity". Both can be true, but a visitor who reads the hero and
             then the case study will notice 2022 against 2023. */}
      <HeroReveal
        headline="Your next skill is going to end exactly like the last one did."
        supporting="Mine stopped ending that way in 2022, when I got my first seven-figure naira dev job."
        mechanism="Now I have built the thing that fixes yours."
        proof="Same skills. One move."
      >
        {/* Block 4. The course name sits ABOVE the button, where it can inform
            the decision rather than arrive after it. Two CTAs, one intent each:
            the waitlist is the primary filled control, hiring is a quiet link
            beside it so the buyer who is not a learner still has a door.

            This was an inline email field until 2026-08-15. It posted straight
            to /api/waitlist, which meant a visitor could join here without ever
            seeing what joining gets them, and without receiving the Opportunity
            Map that /waitlist hands over on signup. Two doors into one list,
            and the shorter one delivered less. The control is now a link, so
            every signup goes through the page carrying the promises and the
            tool, and every signup is attributable to one source. */}
        <div className="w-full">
          <p className="mb-3 text-sm text-text-secondary">
            The Great Work opens soon. The list goes first.
          </p>
          <MagneticButton href="/waitlist">Join the waitlist</MagneticButton>
          <a
            href={calendlyUrl}
            className="mt-4 block text-sm font-medium text-text-secondary underline decoration-border underline-offset-4 transition-colors hover:text-text-primary"
          >
            Hire me
          </a>
        </div>
      </HeroReveal>

      {/* ───────── 2. PROOF STRIP ─────────
          Renders only stats carrying an evidenceRef. */}
      <ProofStrip stats={proofStats} />

      {/* ───────── 3. CASE STUDIES ───────── */}
      <SectionWrapper className="py-16 md:py-24" id="work">
        <div className="mx-auto max-w-[1200px] px-6">
          <RiseWords className="text-center text-3xl font-bold tracking-tight text-text-primary md:text-5xl md:leading-tight">
            Three builds. Go and check them.
          </RiseWords>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {CASE_STUDIES.map((cs) => (
              <CaseStudyCard key={cs.href} {...cs} />
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ───────── 4. THE PROBLEM ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[760px] px-6">
          <RiseWords className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Five freelancers, five invoices, and nobody answering for the result.
          </RiseWords>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            Your designer has never spoken to your writer. Your developer has never read the
            content plan. Everyone delivers exactly what you asked for and the numbers still
            sit where they were.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            That is a systems problem, not a talent problem, and it is why good brands stay
            invisible for years.
          </p>
        </div>
      </SectionWrapper>

      {/* ───────── 5. THE OFFER ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[820px] px-6">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
            The Growth Operating System
          </h2>

          <p className="mt-4 text-lg text-text-secondary">
            One system, one invoice, one person you can shout at.
          </p>

          <ul className="mt-10 space-y-6">
            {[
              "A site that answers a buyer's four questions in five minutes. Most sites lose people who had already decided to hire them.",
              "Content produced on a system. That is what keeps the output going through the months you are too busy to feel creative.",
              "Telegram and WhatsApp infrastructure, because that is where Nigerian buyers actually transact. The Peaceway bot takes real orders end to end, and I can show you it running.",
              "Strategy built on who is already buying in your market, rather than a persona document nobody opens twice.",
              "A written report every sprint. Fire me the week the numbers stop moving instead of finding out in month six.",
            ].map((line) => (
              <li
                key={line}
                className="border-l-2 border-accent pl-5 text-base leading-relaxed text-text-secondary md:text-lg"
              >
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-base leading-relaxed text-text-primary">
            I quote by scope. Tell me what you are trying to move and I will tell you what it
            takes. If you do not need me yet, you will hear that on the call.
          </p>

          <div className="mt-8">
            <MagneticButton href={calendlyUrl}>Book a call</MagneticButton>
            <p className="mt-4 text-sm text-text-muted">
              Thirty minutes, and I will not pitch you. You leave with the plan either way.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* ───────── 6. HOW THE WORK RUNS ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[1000px] px-6">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Seven days to your first report.
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                n: "01",
                t: "Scope call",
                d: "Thirty minutes. What you sell, who buys it, where people drop off. You leave with a plan whether or not you hire me.",
              },
              {
                n: "02",
                t: "Written scope",
                d: "Deliverables and timeline in writing before anything starts, so nothing changes on you halfway through.",
              },
              {
                n: "03",
                t: "Seven-day sprint",
                d: "Payment starts the work. At the end you get a report on what shipped and what moved.",
              },
              {
                n: "04",
                t: "Build out",
                d: "We keep going in sprints, each one reported, until the system runs without me standing over it.",
              },
            ].map((step) => (
              <li key={step.n} className="rounded-xl border border-border bg-bg-secondary p-6">
                <span className="text-sm font-bold tabular-nums text-accent">{step.n}</span>
                <h3 className="mt-3 text-lg font-bold text-text-primary">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </SectionWrapper>

      {/* ───────── TESTIMONIALS ─────────
          Below the case studies on purpose. Real, but role-attributed, so they
          support the proof rather than carry it. */}
      {testimonials.length > 0 && (
        <SectionWrapper className="py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
              What people say
            </h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {testimonials.map((t, i) => (
                // Pass images explicitly. Spreading the row would send the raw
                // `images` column (a JSON string or null) and null defeats the
                // component's `images = []` default.
                <TestimonialCard
                  key={i}
                  quote={t.quote}
                  attribution={t.attribution}
                  images={t.allImages}
                  rating={t.rating}
                  avatar={t.avatar}
                />
              ))}
            </div>
          </div>
        </SectionWrapper>
      )}

      {/* ───────── 7. FINAL CTA ─────────
          The headline and subcopy here used to be "Tell me what you are
          building" / "One call, thirty minutes", which is book-a-call copy —
          verbatim the same block /services still uses, where it correctly sits
          above a call. Here the control underneath it is the waitlist form, so
          the page promised a thirty-minute call and then asked for an email to
          join a course. The copy now matches the action it sits above, and the
          call keeps its own path in the line below. */}
      <SectionWrapper className="py-20 md:py-28">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <RiseWords className="text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
            You have seen the proof. Now go and build your own.
          </RiseWords>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            The Great Work is the loop this page is built on: learn,
            build, show, sell, turned into something you can repeat. It opens soon, and
            the list hears first.
          </p>

          {/* Also a link rather than an inline field, for the same reason as
              the hero: /waitlist is the only door onto the list, so nobody
              joins without the promises or the tool. */}
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center">
            <MagneticButton href="/waitlist">Join the waitlist</MagneticButton>
          </div>

          {/* The consulting path is a button, not a buried inline link. Secondary
              variant so the waitlist above it stays the primary action. */}
          <p className="mx-auto mt-10 max-w-xl text-sm text-text-muted">
            Want the Growth Operating System built for you instead? No price on this page
            because there is no standard job.
          </p>

          <div className="mt-5 flex justify-center">
            {/* No emphasis: the waitlist button directly above it already
                has it, and two pulsing controls in one viewport cancel out. */}
            <MagneticButton href={calendlyUrl} variant="secondary" emphasis={false}>
              Book a call
            </MagneticButton>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
