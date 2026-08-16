"use client";

import { useState } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionWrapper } from "@/components/SectionWrapper";
import { RiseWords } from "@/components/TextMotion";
import { PaymentModal } from "@/components/PaymentModal";

const PRICE = 15000;
const WAS = 35000;

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
    d: "Where to look, what to say, and the follow-up when they don't reply. Because the most common sentence I heard this month was some version of where do I even find people who pay.",
  },
  {
    t: "Proof Builders",
    d: "Templates that turn your first gig, paid or free, into a case study. Not a lesson about case studies. Yours, built.",
  },
  {
    t: "Confidence Through Receipts",
    d: "One person told me he only believes a design is good when the client says so. That is not fixed by motivation. It is fixed by a real client saying it, so the system is built to get you that first.",
  },
  {
    t: "The Opportunity Engine",
    d: "The loop you keep after everything else: find opportunity, package skill, show proof, close client, document result, find the next one.",
  },
];

export function CourseClient() {
  const [payOpen, setPayOpen] = useState(false);

  return (
    <div>
      {/* ───────── HERO ───────── */}
      <section className="px-6 pt-28 pb-12 md:pt-36">
        <div className="mx-auto max-w-[820px]">
          <RiseWords
            as="h1"
            className="text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-5xl"
          >
            You have a skill. It is not paying you.
          </RiseWords>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            Everybody told you to learn a skill. Get the skill and you will be fine, they said.
            Nobody taught you the part after.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            Where the people who pay actually are. What to say to them. How to show that you can
            do the work before anybody has hired you. And what happens when your one client goes
            quiet and your income goes quiet with him.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            That is the part nobody built anything for. So I did.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton onClick={() => setPayOpen(true)}>
              Join for ₦{PRICE.toLocaleString()}
            </MagneticButton>
            <span className="text-sm text-text-secondary">
              <span className="line-through opacity-60">₦{WAS.toLocaleString()}</span>{" "}
              <span className="font-semibold text-text-primary">
                ₦{PRICE.toLocaleString()}
              </span>{" "}
              while it is being built. Lifetime access, updates included.
            </span>
          </div>
        </div>
      </section>

      {/* ───────── THE TRANSFORMATION ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              The whole thing in one line
            </h2>
            <p className="mt-6 text-xl font-semibold leading-relaxed text-text-primary md:text-2xl">
              Confusion → Skill → Proof → Visibility → Money → Opportunities
            </p>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Seven modules that move you along that line in order, because the order is the
              point. Proof before visibility. Visibility before money. Most people try to sell
              from step one and wonder why nobody answers.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── WHO IT IS FOR ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Who this is for
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-6">
                <h3 className="font-bold text-text-primary">You have a skill</h3>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  Design, editing, code, writing, trading, marketing. It works. It just has not
                  turned into money yet, or not into enough of it.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 p-6">
                <h3 className="font-bold text-text-primary">You think you have none</h3>
                <p className="mt-3 leading-relaxed text-text-secondary">
                  You are usually wrong. The most common version of this is somebody who has
                  already been paid for a thing and does not count it, because nobody handed
                  them a job title for it. Module 1 exists for you.
                </p>
              </div>
            </div>
            <p className="mt-6 leading-relaxed text-text-secondary">
              It also runs for business owners who want the same system pointed at a company they
              already own. Same seven modules, different worked example.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── MODULES ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              The seven modules
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              Each one teaches exactly one thing, and most of them hand you an instrument you
              keep and reuse.
            </p>

            <ol className="mt-10 space-y-8">
              {MODULES.map((m) => (
                <li key={m.n} className="border-l-2 border-white/10 pl-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-text-secondary">{m.n}</span>
                    <h3 className="text-lg font-bold text-text-primary">{m.t}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-text-secondary">{m.one}</p>
                  <p className="mt-3 leading-relaxed text-text-primary">
                    <span className="opacity-60">You walk out thinking: </span>
                    <em>{m.aha}</em>
                  </p>
                  {m.instrument && (
                    <p className="mt-3 text-sm text-text-secondary">
                      <span className="opacity-60">You leave with: </span>
                      <span className="font-semibold text-text-primary">{m.instrument}</span>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── DELIVERABLES ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Things you use, not lessons you watch
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              I asked the people who are going to buy this what they actually wanted. They chose
              being walked through it over being handed templates and left alone. So it is built
              that way.
            </p>

            <div className="mt-10 space-y-6">
              {DELIVERABLES.map((d) => (
                <div key={d.t} className="rounded-2xl border border-white/10 p-6">
                  <h3 className="font-bold text-text-primary">{d.t}</h3>
                  <p className="mt-3 leading-relaxed text-text-secondary">{d.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── PROOF ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              This is not the first time I have taught it
            </h2>
            <p className="mt-4 leading-relaxed text-text-secondary">
              Two posts from November 2023. Both are still up. Click them and check the numbers
              yourself, which is the only reason I am showing you posts instead of quotes.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="https://x.com/_Quivira/status/1722169180487840197"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25"
              >
                <p className="font-bold text-text-primary">
                  A follower landed a $10,000 Web3 job with no skill
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Posted 8 November 2023. 48,000 views, 377 likes, 116 reposts, 96 replies.
                </p>
              </a>

              <a
                href="https://x.com/_Quivira/status/1724710340754317664"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25"
              >
                <p className="font-bold text-text-primary">
                  From not having $100 for a class to a $13,000 gig
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Posted 15 November 2023. 36,000 views, 457 likes, 105 reposts. The student is
                  tagged in it and the payment screenshots are in the post.
                </p>
              </a>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-text-secondary">
              Those are their results, not a promise of yours. What they show is that this way of
              teaching has produced people who got paid.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── HONESTY BLOCK ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              What you are actually buying today
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              This is being built right now, and I am not going to pretend otherwise. The seven
              modules are written and the instruments exist. The rest is being built while people
              are already inside it, shaped by what they tell me they are stuck on.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-text-secondary">
              That is why it is ₦{PRICE.toLocaleString()} instead of ₦{WAS.toLocaleString()}, and
              why <span className="font-semibold text-text-primary">everything added later is
              yours</span> at no extra cost. You are early. Early should be worth something.
            </p>
          </div>
        </section>
      </SectionWrapper>

      {/* ───────── CLOSE ───────── */}
      <SectionWrapper>
        <section className="px-6 py-16 pb-28">
          <div className="mx-auto max-w-[820px]">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              You are not behind
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              You are sitting on something that already works and nobody ever showed you the
              second half. That is a fixable problem, and it is the only thing this is for.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton onClick={() => setPayOpen(true)}>
                Join for ₦{PRICE.toLocaleString()}
              </MagneticButton>
              <span className="text-sm text-text-secondary">
                Lifetime access. Updates included.
              </span>
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
