import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";

export const metadata: Metadata = {
  title: "Proof of Work | BigQuiv Digitals",
  description:
    "Four things I built and six films I made. Every one has a public link you can open, and the films play here without leaving the page.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <div className="px-6 pb-28 pt-28 md:pt-40">
      <header className="mx-auto max-w-[1200px] border-b border-border pb-14 md:pb-20">
        <p className="text-sm font-semibold text-accent">Proof of Work / 04 builds / 06 films</p>
        {/*
          ⚠ NO EXPLAINER PARAGRAPH HERE. One listed the four builds and the six
          films, which the cards directly below already show, and a second
          described the page's own standards. His ruling on both, 2026-09-12:
          "this is not needed". The headline carries it and the work answers it.

          The cut line also claimed "nothing is behind a login", which stopped
          being true the moment the PharmaOS card started pointing at its
          sign-in screen. Do not reinstate that sentence.
        */}
        <h1 className="mt-7 max-w-[900px] text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-text-primary md:text-7xl lg:text-[5.5rem]">
          I built these. Open any one of them.
        </h1>
      </header>

      <section className="mx-auto max-w-[1200px] py-14 md:py-20" aria-label="Portfolio projects">
        <PortfolioShowcase />
      </section>

      <section className="mx-auto max-w-[1200px] border-t border-border pt-16 md:pt-20">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Have a similar problem?
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
              Bring me the outcome. I will tell you what it takes to build it.
            </h2>
          </div>
          <Link
            href="/contact"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-black transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Start a project
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

