import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import { FilmReel } from "@/components/FilmReel";

export const metadata: Metadata = {
  title: "Proof of Work | BigQuiv Digitals",
  description:
    "Four public, checkable engineering projects and six films that play in the page. Empty disciplines stay marked coming soon until the proof exists.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <div className="px-6 pb-28 pt-28 md:pt-40">
      <header className="mx-auto max-w-[1200px] border-b border-border pb-14 md:pb-20">
        <p className="text-sm font-semibold text-accent">Proof of Work / 04 builds / 06 films</p>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <h1 className="max-w-[850px] text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-text-primary md:text-7xl lg:text-[5.5rem]">
            Work a buyer can inspect before the call.
          </h1>
          <div className="max-w-[560px] lg:pb-2">
            <p className="text-lg leading-relaxed text-text-secondary">
              Four builds selected for public proof and commercial usefulness, not because they
              are my favourites, and six films you can watch without leaving this page. If a
              discipline has no qualifying case yet, it says coming soon.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Spec work and family work are labeled plainly. Nothing here is presented as paid
              client work unless it was.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] py-14 md:py-20" aria-label="Portfolio projects">
        <PortfolioShowcase />
      </section>

      <section
        className="mx-auto max-w-[1200px] border-t border-border py-16 md:py-20"
        aria-label="Film reel"
      >
        <FilmReel />
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

