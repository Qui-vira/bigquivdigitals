import type { Metadata } from "next";
import Image from "next/image";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import { BrutalButton, HandMark, HandNote, MonoLabel, PaperSection, PhotoPrint, Sticker } from "@/components/ui-paper";

export const metadata: Metadata = {
  title: "Proof of Work | BigQuiv Digitals",
  description:
    "Three things I built and six films I made. Every one has a public link you can open, and the films play here without leaving the page.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      <PaperSection ground="grid" pad="none" innerClassName="pb-20 pt-28 md:pb-28 md:pt-36" aria-labelledby="portfolio-heading">
        <div className="relative">
          <MonoLabel
            as="p"
            className="inline-flex border-[3px] border-ink bg-paper px-3 py-1.5 shadow-brutal-sm"
          >
            Proof of Work / 04 builds / 06 films
          </MonoLabel>
          {/*
            ⚠ NO EXPLAINER PARAGRAPH HERE. One listed the four builds and the six
            films, which the cards directly below already show, and a second
            described the page's own standards. His ruling on both, 2026-09-12:
            "this is not needed". The headline carries it and the work answers it.

            The cut line also claimed "nothing is behind a login", which stopped
            being true the moment the PharmaOS card started pointing at its
            sign-in screen. Do not reinstate that sentence.
          */}
          <h1
            id="portfolio-heading"
            className="mt-9 max-w-[13ch] font-didone text-[clamp(3.3rem,8.6vw,6rem)] font-semibold leading-[0.92] tracking-[-0.012em] text-ink text-balance"
          >
            I built these. <HandMark kind="underline" load delay={500}>Open any one</HandMark> of them.
          </h1>

          {/* The scrapbook corner: three of the real captures from the cards
              below, pinned in a pile, with a tag and a burst. Decorative
              (the same images carry their alt text on the cards). */}
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 hidden w-[44%] max-w-[520px] lg:block">
            <div className="relative aspect-[1.25/1]">
              <PhotoPrint tilt={-7} attach="tape" mat="thin" reveal={false} className="load-drop absolute left-[2%] top-[14%] w-[58%]">
                <div className="relative aspect-[16/10]">
                  <Image src="/proof/portfolio/pharmaos.webp" alt="" fill sizes="300px" className="object-cover object-top" />
                </div>
              </PhotoPrint>
              <PhotoPrint tilt={5} attach="pin" mat="thin" reveal={false} className="load-drop absolute right-[2%] top-[2%] w-[56%]">
                <div className="relative aspect-[16/10]">
                  <Image src="/proof/portfolio/medband.webp" alt="" fill sizes="300px" className="object-cover object-top" />
                </div>
              </PhotoPrint>
              <PhotoPrint tilt={-2} attach="clip" mat="thin" reveal={false} className="load-drop absolute bottom-[4%] left-[24%] w-[60%]">
                <div className="relative aspect-[16/10]">
                  <Image src="/proof/peaceway/00-homepage-hero.webp" alt="" fill sizes="320px" className="object-cover object-top" />
                </div>
              </PhotoPrint>
              <Sticker shape="starburst" tone="gold" size={118} tilt={12} reveal={false} className="load-settle absolute -right-6 bottom-[16%]" />
              <Sticker shape="wavy" tone="soft" size={48} tilt={-9} reveal={false} className="load-settle absolute -left-8 bottom-[6%]" textClassName="text-[13px]">
                my work!
              </Sticker>
            </div>
          </div>
          <HandNote load delay={800} arrow="down-left" arrowAt="below" tilt={-5} size="lg" className="absolute bottom-[-5rem] left-[40%] hidden lg:inline-flex" arrowClassName="ml-10">
            pick a tab
          </HandNote>
        </div>
      </PaperSection>

      <PaperSection ground="paper" checker="top" pad="lg" aria-label="Portfolio projects">
        <PortfolioShowcase />
      </PaperSection>

      <PaperSection ground="grid" pad="lg" aria-labelledby="portfolio-cta-heading">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end md:gap-14">
          <div>
            <MonoLabel as="p" tone="gold-deep">
              Have a similar problem?
            </MonoLabel>
            <h2
              id="portfolio-cta-heading"
              className="mt-5 max-w-[18ch] font-didone text-[clamp(2.4rem,5.4vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink text-balance"
            >
              Bring me the outcome. I will tell you what it takes to build it.
            </h2>
          </div>
          <BrutalButton href="/contact" size="lg" className="w-fit">
            Start a project
          </BrutalButton>
        </div>
      </PaperSection>
    </div>
  );
}
