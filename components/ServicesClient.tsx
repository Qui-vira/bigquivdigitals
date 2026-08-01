"use client";

import Link from "next/link";
import { MagneticButton } from "@/components/MagneticButton";
import { SectionWrapper } from "@/components/SectionWrapper";

interface ServicesClientProps {
  calendlyUrl: string;
}

const INCLUDES = [
  {
    t: "Website and conversion",
    d: "The pages a buyer actually reads before deciding. Built to answer who you are, what you solve, why they should trust you, and how to hire you, all inside five minutes.",
  },
  {
    t: "AI content production",
    d: "Video, hooks and campaign angles produced on a repeatable system. I run the same engine on my own accounts. One post on it did a million views.",
  },
  {
    t: "Community and bot infrastructure",
    d: "Telegram and WhatsApp are where Nigerian buyers actually transact. I build the bots that take orders, capture emails, and hand a question to a human when the answer matters.",
  },
  {
    t: "Growth strategy and market intelligence",
    d: "Who to target and what they respond to. I run a lead engine that scraped, scored and match-explained 200 prospects, each with the reason it matched. That is the same machinery pointed at your market.",
  },
  {
    t: "Reporting",
    d: "What shipped, what it moved, what happens next. Every sprint, in writing. You are never guessing whether this is working, and you can end it the moment it is not.",
  },
];

const ENTRY_POINTS = [
  {
    t: "Health brands",
    d: "Pharmacies, clinics, labs and diagnostic centres. Trust first, then a journey that ends in an order.",
    href: "/work/peaceway",
    linkText: "See the Peaceway build",
  },
  {
    t: "Crypto exchanges entering Africa",
    d: "Acquisition, community activation and local reporting, rather than a KOL posting a banner.",
    href: "/work/alpha-plays",
    linkText: "See the community build",
  },
  {
    t: "AI, fintech and Web3 launches",
    d: "Video, landing page and a CTA system that catches the attention your launch generates.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
  {
    t: "Founders with scattered growth",
    d: "A site that sells, content that compounds, one person accountable for both.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
];

export function ServicesClient({ calendlyUrl }: ServicesClientProps) {
  return (
    <div>
      {/* ───────── HERO ───────── */}
      <section className="px-6 pt-28 pb-12 md:pt-36">
        <div className="mx-auto max-w-[820px]">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-text-primary md:text-5xl">
            You are paying five people and none of them own the result.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            The designer never speaks to the writer. The developer has never read the content
            plan. Every one of them delivers what you asked for, and the numbers still do not
            move.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-text-secondary">
            That is the real cost of buying growth in pieces, and it is not the invoices. It is
            the six months you spend before anyone admits the pieces were never going to add up.
          </p>

          <p className="mt-6 text-lg font-semibold text-text-primary">
            I sell one system and I own the outcome.
          </p>
        </div>
      </section>

      {/* ───────── WHAT IT INCLUDES ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[820px] px-6">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            What the Growth Operating System includes
          </h2>

          <div className="mt-12 space-y-10">
            {INCLUDES.map((item) => (
              <div key={item.t} className="border-l-2 border-accent pl-6">
                <h3 className="text-lg font-bold text-text-primary md:text-xl">{item.t}</h3>
                <p className="mt-3 text-base leading-relaxed text-text-secondary md:text-lg">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ───────── ENTRY POINTS ───────── */}
      <SectionWrapper className="py-16 md:py-24">
        <div className="mx-auto max-w-[1000px] px-6">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Where people usually start
          </h2>

          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Nobody needs the whole system on day one. These are the common front doors, and
            each one leads into the same engine.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {ENTRY_POINTS.map((e) => (
              <div
                key={e.t}
                className="rounded-xl border border-border bg-bg-secondary p-6"
              >
                <h3 className="text-lg font-bold text-text-primary">{e.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{e.d}</p>
                <Link
                  href={e.href}
                  className="mt-4 inline-block text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover"
                >
                  {e.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ───────── CTA ───────── */}
      <SectionWrapper className="py-20 md:py-28">
        <div className="mx-auto max-w-[760px] px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Tell me what you are building.
          </h2>
          <div className="mt-8">
            <MagneticButton href={calendlyUrl}>Book a call</MagneticButton>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-sm text-text-muted">
            I quote by scope. If you do not need me yet, you will hear that on the call.
          </p>
        </div>
      </SectionWrapper>
    </div>
  );
}
