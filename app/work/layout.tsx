import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrutalButton, HandArrow, PaperSection, Sticker } from "@/components/ui-paper";
import { ReadingProgress } from "@/components/longread/ReadingProgress";
import "./work.css";

/**
 * Case-study shell on paper (redesign 2026-10).
 *
 * The MDX page renders inside `.case-article`, a long-read grid (see
 * work.css). Its own `# title` becomes the grid-paper header band (CaseTitle),
 * so the breadcrumb here sits on the same grid paper. The closing call to
 * action keeps its copy and its /contact target exactly.
 *
 * `overflow-clip` on the wrapper clips the title band where it reaches above
 * the page and the full-bleed strips at the sides; `isolate` gives the band's
 * negative z-index a floor at this wrapper's white ground.
 */
export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-scope relative isolate overflow-clip bg-paper pt-[67px] text-ink md:pt-[75px]">
      <ReadingProgress />

      <div className="mx-auto w-full max-w-[1320px] px-4 pb-24 sm:px-6 md:pb-32 lg:px-10">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-[1000px] pt-6 md:pt-8">
          <Link
            href="/#work"
            className="paper-link inline-flex min-h-[44px] items-center gap-2 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            All work
          </Link>
        </nav>

        <article className="case-article">{children}</article>
      </div>

      <PaperSection ground="grid" checker="top" pad="lg" aria-labelledby="case-cta-heading">
        <div className="relative mx-auto max-w-[1000px]">
          <div className="grid border-[3px] border-ink bg-paper shadow-brutal-lg md:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 sm:p-10 md:p-12">
              <h2
                id="case-cta-heading"
                className="max-w-[14ch] font-didone text-[clamp(2.5rem,5.4vw,4rem)] font-semibold leading-[0.97] tracking-[-0.008em] text-ink text-balance"
              >
                Want this built for your brand?
              </h2>
              <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-ink-soft">
                Thirty minutes. No deck, no pitch. You leave with the plan whether you hire me or not.
              </p>
            </div>
            <div className="relative flex flex-col items-start justify-end gap-6 border-t-[3px] border-ink bg-gold p-7 sm:p-10 md:border-l-[3px] md:border-t-0 md:p-12">
              <HandArrow kind="down" className="ml-6 hidden w-12 md:block" />
              <BrutalButton href="/contact" variant="paper" size="lg">
                Book a call
              </BrutalButton>
            </div>
          </div>
          <Sticker shape="starburst" tone="paper" size={104} tilt={-12} className="absolute -right-3 -top-12 sm:-right-8">
            your move
          </Sticker>
        </div>
      </PaperSection>
    </div>
  );
}
