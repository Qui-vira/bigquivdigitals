"use client";

import { MagneticButton } from "@/components/MagneticButton";
import { TestimonialCard } from "@/components/TestimonialCard";
import { SectionWrapper } from "@/components/SectionWrapper";
import { CaseStudyCard } from "@/components/CaseStudyCard";
import { ProofStrip, type ProofStatData } from "@/components/ProofStat";

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
      "A Lagos pharmacy with no digital presence now takes orders inside Telegram, end to end.",
    support:
      "Live at peacewayonline.com. Customer, staff and supplier portals. A bot that carries a real order from search to confirmation.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage. Headline reads YOUR LAGOS PHARMACY IS NOW ONLINE, with buttons to order on Telegram or check product availability.",
  },
  {
    href: "/work/alpha-plays",
    tag: "Community and markets",
    claim: "8,874 people get my market calls. Individual posts pull 1.2K to 2.6K views each.",
    support:
      "Every result posted next to the original call that produced it. Entry, stop loss, target, outcome.",
    image: "/proof/quivira/result-eth-setup-85pct.webp",
    imageAlt:
      "Telegram channel showing an ETH buy call with entry, stop loss and take profit, next to the resulting position card.",
  },
  {
    href: "/work/content-engine",
    tag: "Technical",
    claim: "One video pulled 128,000 views and 1,700 comments.",
    support:
      "Every comment was a lead I answered by hand. Plus the pipeline behind it: 13 deployed systems, a lead engine that scored 200 prospects, 25 published articles.",
    image: "/proof/technical/admin-leads-blurred.webp",
    imageAlt:
      "Admin lead pipeline showing 200 of 200 leads scored, with target, score, matched keywords and match reason columns. Identities blurred.",
  },
];

export function HomeClient({ calendlyUrl, proofStats, testimonials }: HomeClientProps) {
  return (
    <main>
      {/* ───────── 1. HERO ───────── */}
      <section className="px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            BigQuiv Digitals
          </p>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
            Your brand is not invisible. It is scattered.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
            A site nobody reads, content nobody saves, and a community nobody owns. I build
            all three as one system, so the attention you already have turns into revenue you
            can count.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton href={calendlyUrl}>Book a call</MagneticButton>
            <MagneticButton href="#work" variant="secondary">
              See the work
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ───────── 2. PROOF STRIP ─────────
          Renders only stats carrying an evidenceRef. */}
      <ProofStrip stats={proofStats} />

      {/* ───────── 3. CASE STUDIES ───────── */}
      <SectionWrapper className="py-16 md:py-24" id="work">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-text-primary md:text-5xl md:leading-tight">
            Three builds. All live. Go and check.
          </h2>

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
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            You do not need five freelancers.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            You have a designer who does not talk to the writer. A developer who has never
            seen the content plan. Five invoices, five timelines, and nobody who owns whether
            any of it made money.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            That is not a talent problem. That is a systems problem, and it is the reason good
            brands stay invisible.
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
            One system that covers the whole path from attention to revenue.
          </p>

          <ul className="mt-10 space-y-6">
            {[
              "A site that answers a buyer's four questions in five minutes, so you stop losing people who had already decided to hire you.",
              "Video and content produced on a system, so your output survives the months you are too busy to feel creative.",
              "Telegram and WhatsApp infrastructure, because that is where Nigerian buyers actually transact. The Peaceway bot takes real orders end to end, and I can show you it running.",
              "Strategy built on who is already buying in your market, not on a persona document nobody opens twice.",
              "A report every sprint, so you can fire me the week the numbers stop moving instead of finding out in month six.",
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
            Priced by scope, not from a menu. Tell me what you are trying to move and I will
            tell you what it takes. If the honest answer is that you do not need me yet, you
            will get that answer on the call.
          </p>

          <div className="mt-8">
            <MagneticButton href={calendlyUrl}>Book a call</MagneticButton>
            <p className="mt-4 text-sm text-text-muted">
              Thirty minutes. No deck, no pitch. You leave with the plan whether you hire me
              or not.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* ───────── 6. HOW THE WORK RUNS ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[1000px] px-6">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            You see progress in seven days, not seven weeks.
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-2">
            {[
              {
                n: "01",
                t: "Scope call",
                d: "Thirty minutes. What you sell, who buys it, where the drop-off is. You leave with the plan whether or not you hire me.",
              },
              {
                n: "02",
                t: "Written scope",
                d: "Deliverables, timeline, and what you should expect in the first sprint. No surprises later.",
              },
              {
                n: "03",
                t: "Seven-day sprint",
                d: "Payment starts the work. At the end of it you get a progress report with what shipped and what it moved.",
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

      {/* ───────── 7. FINAL CTA ───────── */}
      <SectionWrapper className="py-20 md:py-28">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
            Tell me what you are building.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-text-secondary">
            One call. Thirty minutes. You leave with a plan you can execute yourself if you
            want to.
          </p>

          <div className="mt-10">
            <MagneticButton href={calendlyUrl}>Book a call</MagneticButton>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-sm text-text-muted">
            There is no price on this page because there is no standard job. Tell me the scope
            on the call and you get the number on the call.
          </p>
        </div>
      </SectionWrapper>
    </main>
  );
}
