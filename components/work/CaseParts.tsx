import { CheckerStrip } from "@/components/ui-paper/CheckerStrip";
import { HandNote } from "@/components/ui-paper/HandNote";
import { Sticker } from "@/components/ui-paper/Sticker";

/**
 * The case-study pieces the MDX map in mdx-components.tsx hands out.
 * Server components; the animated bits (Sticker, HandNote) are client leaves.
 *
 * Layout contract: app/work/work.css lays the article out as a grid with a
 * reading column ("content", about 68 characters) and a wider "wide" track
 * for prints and the title. Anything with the `case-wide` class takes the
 * wide track; `case-full` spans the viewport.
 */

/** The category above the title, slapped on as a sticker. */
export function CaseKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="case-wide relative z-[1] m-0 pt-6 md:pt-10">
      <Sticker shape="label" tone="gold" tilt={-2} decorative={false} reveal={false}>
        {children}
      </Sticker>
    </p>
  );
}

/**
 * The case-study title. Renders the header band: grid paper behind the
 * breadcrumb, kicker and title, closed by a checker strip, so the long read
 * underneath starts on clean white paper.
 *
 * The grid band is an absolutely positioned layer at z-index -10 that reaches
 * up past the top of the page. The page wrapper clips it (overflow: clip), and
 * because nothing here creates a stacking context, the band paints under the
 * breadcrumb and kicker that sit above it in the DOM.
 */
export function CaseTitle({ children }: { children: React.ReactNode }) {
  return (
    <header className="case-full relative pb-16 pt-7 md:pb-24 md:pt-9">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 top-[-80vh] -z-10 w-screen -translate-x-1/2 bg-grid-paper"
      />
      <div className="relative mx-auto w-full max-w-[1000px]">
        <div className="relative w-fit max-w-full">
          <h1 className="max-w-[17ch] font-didone text-[clamp(2.7rem,7.2vw,5.4rem)] font-semibold leading-[0.97] tracking-[-0.008em] text-ink text-balance">
            {children}
          </h1>
          <Sticker
            shape="starburst"
            tone="gold"
            size={116}
            tilt={12}
            reveal={false}
            className="load-settle absolute -right-36 -top-10 hidden lg:inline-flex"
          >
            case study
          </Sticker>
        </div>
        <HandNote
          load
          delay={500}
          arrow="down-left"
          arrowAt="end"
          tilt={-4}
          className="absolute -bottom-12 right-6 hidden md:inline-flex"
        >
          the receipts are below
        </HandNote>
      </div>
      <CheckerStrip className="absolute bottom-0 left-1/2 w-screen -translate-x-1/2" />
    </header>
  );
}

/**
 * A pull-quote: a sentence lifted, word for word, from the case study around
 * it and set large in the Didone. It repeats text the reader meets in the
 * body, so it is hidden from screen readers to avoid reading it twice.
 * Never put words in here that are not already in the article.
 */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <figure aria-hidden="true" className="case-wide relative mx-0 my-16 md:my-24">
      <div className="relative border-y-[3px] border-ink pb-12 pt-28 md:pb-16 md:pl-[max(12%,7.5rem)] md:pt-16">
        <span className="pointer-events-none absolute -top-[0.3em] left-0 select-none bg-paper pr-4 font-display text-[9rem] font-bold leading-none text-gold [-webkit-text-stroke:2.5px_#111111] md:text-[12rem]">
          &ldquo;
        </span>
        <blockquote className="m-0 max-w-[13em] font-didone text-[clamp(2.2rem,5vw,4.1rem)] font-semibold leading-[1] tracking-[-0.006em] text-ink text-balance">
          {children}
        </blockquote>
        <HandNote tilt={-5} size="sm" arrow="up-left" arrowAt="start" className="absolute -bottom-16 right-8 hidden md:inline-flex">
          read that twice
        </HandNote>
      </div>
    </figure>
  );
}
