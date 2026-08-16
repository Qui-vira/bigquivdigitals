"use client";

import { useState } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionWrapper } from "@/components/SectionWrapper";
import { RiseWords } from "@/components/TextMotion";
import { PaymentModal } from "@/components/PaymentModal";

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
 * Brand tokens only: bg-primary black, accent #E8A33D gold, text-primary warm
 * off-white. No new colours.
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

export function CourseClient() {
  const [payOpen, setPayOpen] = useState(false);
  const open = () => setPayOpen(true);

  const cta = (label = `Get instant access · ₦${PRICE.toLocaleString()}`) => (
    <div className="mt-10 flex flex-wrap items-center gap-4">
      <MagneticButton onClick={open}>{label}</MagneticButton>
      <span className="text-sm text-text-secondary">
        <span className="line-through opacity-60">₦{WAS.toLocaleString()}</span>{" "}
        <span className="font-semibold text-text-primary">₦{PRICE.toLocaleString()}</span> while
        it is being built · lifetime access
      </span>
    </div>
  );

  return (
    <div>
      {/* ───────── 1. HERO ───────── */}
      <section className="px-6 pt-28 pb-16 md:pt-36">
        <div className="mx-auto max-w-[820px]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            The Great Work
          </p>
          <RiseWords
            as="h1"
            className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-6xl"
          >
            You have a skill. It is not paying you.
          </RiseWords>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary md:text-xl">
            Everybody told you to learn a skill. Get the skill and you will be fine, they said.
            Nobody taught you the part after.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary md:text-xl">
            Where the people who pay actually are. What to say to them. How to show you can do
            the work before anyone has hired you. And what happens when your one client goes
            quiet and your income goes quiet with him.
          </p>

          <p className="mt-4 text-lg font-semibold leading-relaxed text-text-primary md:text-xl">
            That is the part nobody built anything for. So I did, and we build it together, live,
            every week.
          </p>

          {cta()}
        </div>
      </section>

      {/* ───────── 2. AUTHORITY ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              I have been teaching this a long time before it had a name
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              I run Ophir Digital Education Foundation, registered in Nigeria as CAC 9071886.
              Over two thousand people have come through what I teach. Before any of that I was a
              microbiologist, then a sales boy on ₦10,000 a month, so I am not guessing about
              what it feels like to have something in your hands and no way to turn it into
              money.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              The Great Work is not new material. It is the thing I have been teaching for years,
              finally packaged so you can run it without me standing over you.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 3. THE TRANSFORMATION ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              The whole thing in one line
            </h2>
            <p className="mt-8 text-xl font-extrabold leading-relaxed text-accent md:text-3xl">
              Confusion → Skill → Proof → Visibility → Money → Opportunities
            </p>
            <p className="mt-8 text-lg leading-relaxed text-text-secondary">
              Seven modules that move you along that line in order, because the order is the
              point. Proof before visibility. Visibility before money. Most people try to sell
              from step one and then wonder why nobody answers.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 4. WHAT CHANGES FOR YOU ───────── */}
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

      {/* ───────── 5. PROBLEM / SOLUTION ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              So do not go and learn another skill yet
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              This is what most people do. Learn a skill. Post about it. Wait.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              Then nothing happens, so they decide the problem was the skill, and go and learn
              another one. Two years later they have four skills and the same bank balance.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-text-primary">
              The skill was never the problem.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              I spoke to a developer this month who has built a live tax system a company paid
              him for every month, for five months. Real money, real product. When that one
              client ran out of cash his income went to zero, because everything he had ever
              built belonged to that one man. He does not need a fifth skill. He needs a second
              buyer.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              That is the gap. Not talent, not effort, not information. Nobody ever handed you
              the second half.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 6. WHAT MAKES THIS DIFFERENT ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What makes this different
            </h2>

            {/*
              This block leads, and the module list follows it. The audience voted
              4-1 plus the Instagram poll majority for weekly calls over a
              done-for-you kit, and every live-support voter volunteered a reason
              while the single kit voter did not. Leading with a module list sells
              them the passive-lessons format the research says they are done with.
              See LAUNCH-DAY-01/DAY-01-RESEARCH.md, FINAL TALLY.
            */}
            <div className="mt-8 rounded-2xl border border-accent/40 bg-bg-tertiary p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                You are not left alone with it
              </p>
              <p className="mt-4 text-lg leading-relaxed text-text-primary">
                We meet every week and build it together, live.
              </p>
              <p className="mt-4 leading-relaxed text-text-secondary">
                I asked people directly: a done-for-you kit, or live weekly sessions where we work
                through it together. It was not close. One of them put it better than I could:{" "}
                <em className="text-text-primary">
                  &ldquo;weekly calls where we build it is better.&rdquo;
                </em>{" "}
                Another said it would be{" "}
                <em className="text-text-primary">
                  &ldquo;well tailored for those who need it, knowing what would really work or
                  not.&rdquo;
                </em>
              </p>
              <p className="mt-4 leading-relaxed text-text-secondary">
                One person voted for the kit, and he was right about one thing, so let me say it
                plainly:{" "}
                <span className="text-text-primary">
                  the templates still come. They just come inside the calls
                </span>
                , where I can see your actual skill and your actual situation instead of handing
                you a blank worksheet and hoping.
              </p>
              <p className="mt-4 leading-relaxed text-text-secondary">
                That last part is not a guess either. I sent the first tool to somebody who told me
                she did not know what her skill was. She never filled it in. A blank worksheet is
                exactly what that person cannot use.
              </p>
            </div>

            <h3 className="mt-14 text-xl font-bold text-text-primary">
              What we cover across the seven weeks
            </h3>
            <p className="mt-4 leading-relaxed text-text-secondary">
              Seven parts, in this order, because the order is the point. Each one covers exactly
              one thing, and most of them end with you holding an instrument you keep and reuse.
              You do not watch these. We build them.
            </p>

            <ol className="mt-10 space-y-8">
              {MODULES.map((m) => (
                <li key={m.n} className="border-l-2 border-border pl-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-accent">{m.n}</span>
                    <h3 className="text-lg font-bold text-text-primary">{m.t}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-text-secondary">{m.one}</p>
                  <p className="mt-3 leading-relaxed text-text-primary">
                    <span className="text-text-muted">You walk out thinking: </span>
                    <em>{m.aha}</em>
                  </p>
                  {m.instrument && (
                    <p className="mt-3 text-sm">
                      <span className="text-text-muted">You leave with: </span>
                      <span className="font-semibold text-accent">{m.instrument}</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
            {cta()}
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 7. RESULTS ───────── */}
      <SectionWrapper>
        <section className="border-y border-border bg-bg-secondary px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What came out of it
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              These are people I taught. Their results, not a promise of yours. Every one of
              these has been public since 2023 and you can go and check them.
            </p>

            <div className="mt-10 space-y-5">
              {/*
                Strongest first. This is the only claim on this site a stranger can
                confirm against a third party's own records. Deliberately does NOT
                claim the dollar split or "2nd of 350+ hackers from 56 countries" —
                both are chat-only. See 12-Proof-Library/students/blocks.md.
              */}
              <div className="rounded-2xl border border-border p-6 transition-colors hover:border-border-hover">
                <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                  Verified by someone else
                </p>
                <p className="mt-3 text-lg leading-relaxed text-text-primary">
                  Two of my students won the Flow bounty at LearnWeb3&rsquo;s Decentralized
                  Intelligence hackathon, with an AI payroll app called SwiftPay.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  You do not have to believe me. LearnWeb3 published it themselves, with both
                  their names on it.{" "}
                  <a
                    href="https://learnweb3.io/hackathons/decentralized-intelligence-season-1/projects/39560768-5d7a-4417-b2eb-38f65a8fa0c7/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    Go and read it
                  </a>
                  .
                </p>
              </div>

              <div className="rounded-2xl border border-border p-6 transition-colors hover:border-border-hover">
                <p className="text-lg leading-relaxed text-text-primary">
                  A final-year student at Babcock was handed ₦800,000 for school fees and
                  gambled ₦500,000 of it away.
                </p>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  He came in with ₦300,000 left and panicking. He made $500 back, then landed a
                  $500 job editing smart contracts through the group. Last I heard he was
                  covering his parents&rsquo; and siblings&rsquo; bills.
                </p>
              </div>

              <div className="rounded-2xl border border-border p-6 transition-colors hover:border-border-hover">
                <p className="text-lg leading-relaxed text-text-primary">
                  One got liquidated on Binance and lost his savings.
                </p>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  Months later he messaged me at 10pm to say he had moved into a furnished
                  apartment and upgraded his workstation.
                </p>
              </div>

              <a
                href="https://x.com/_Quivira/status/1722169180487840197"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-border p-6 transition-colors hover:border-border-hover"
              >
                <p className="text-lg leading-relaxed text-text-primary">
                  A follower landed a $10,000 Web3 job with no skill, in three months.
                </p>
                <p className="mt-3 text-sm text-text-secondary">
                  Posted 8 November 2023. 48,000 views, 377 likes, 116 reposts. Still up.
                </p>
              </a>

              <a
                href="https://x.com/_Quivira/status/1724710340754317664"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-border p-6 transition-colors hover:border-border-hover"
              >
                <p className="text-lg leading-relaxed text-text-primary">
                  From not having $100 for a class to a $13,000 gig.
                </p>
                <p className="mt-3 text-sm text-text-secondary">
                  Posted 15 November 2023. 36,000 views, 457 likes. The student is tagged in it
                  and the payment screenshots are inside the post.
                </p>
              </a>
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 8. THE INSTRUMENTS (the stack) ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Things you use, not lessons you watch
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              Every part of this ends with something in your hands rather than something in your
              notes. You do not fill these in alone at midnight. We build them on the calls.
            </p>

            <div className="mt-10 space-y-5">
              {DELIVERABLES.map((d) => (
                <div
                  key={d.t}
                  className="rounded-2xl border border-border p-6 transition-colors hover:border-border-hover"
                >
                  <h3 className="font-bold text-accent">{d.t}</h3>
                  <p className="mt-3 leading-relaxed text-text-secondary">{d.d}</p>
                </div>
              ))}
            </div>
            {cta()}
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 9. WHO IT IS FOR ───────── */}
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

      {/* ───────── 10. HONESTY ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What you are actually buying today
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              This is being built right now and I am not going to pretend otherwise. The seven
              parts are written and the instruments exist. The rest gets built on the calls, with
              the people who are already inside it, shaped by what they tell me they are stuck on.
              That is not a shortcut. It is the reason it will fit you and not somebody else.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              That is why it is ₦{PRICE.toLocaleString()} instead of ₦{WAS.toLocaleString()}, and
              why{" "}
              <span className="font-semibold text-text-primary">
                everything added later is yours
              </span>{" "}
              at no extra cost. You are early. Early should be worth something.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── 11. FINAL PRICING ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16 pb-28">
          <div className="mx-auto max-w-[820px]">
            <div className="rounded-3xl border border-accent/40 bg-bg-secondary p-8 md:p-12">
              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                You are not behind
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                You are sitting on something that already works, and nobody ever showed you the
                second half. That is a fixable problem and it is the only thing this is for.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  "Live weekly sessions where we build it together",
                  "Seven parts, in the order that actually works",
                  "Six instruments you keep and reuse, built with you",
                  "The five build-it-for-you kits",
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

              <p className="mt-10 text-sm uppercase tracking-widest text-text-muted">
                While it is being built
              </p>
              <p className="mt-2 flex items-baseline gap-3">
                <span className="text-2xl text-text-muted line-through">
                  ₦{WAS.toLocaleString()}
                </span>
                <span className="text-5xl font-extrabold text-accent">
                  ₦{PRICE.toLocaleString()}
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
        serviceName="The Great Work"
        amount={PRICE}
        currency="NGN"
      />
    </div>
  );
}
