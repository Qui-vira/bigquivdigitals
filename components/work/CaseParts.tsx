import Link from "next/link";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { CaseStage } from "./CaseStage";

/**
 * The case-study pieces the MDX map in mdx-components.tsx hands out (v3
 * rebuild, 19 Oct 2026; comps WorkPeaceway, WorkAlphaPlays,
 * WorkNigeriaBusinessCosts, WorkContentEngine).
 *
 * The MDX stays plain prose. Wrappers group it into the comp's sections:
 *   <Lede>      the paragraphs under the title
 *   <Part>      one "## heading" and everything under it; grounds alternate
 *               paper and cloud down the page (app/work/work.css)
 *   <Pair>      a paragraph and the screenshot that proves it, as one card
 *   <PullQuote> a sentence lifted word for word from the article
 * None of them adds a word. Pieces that repeat a figure already in the text
 * (StatRow, BigFigure, ChartGrow) are hidden from screen readers.
 */

/** The breadcrumb and the category, over the top of the stage. */
export function CaseKicker({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Breadcrumb" className="v3-work-crumbs">
      <Link href="/portfolio" className="v3-work-crumbs__back">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M16.5 10h-12M9 5.5 4.5 10 9 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
        All work
      </Link>
      <span className="v3-work-crumbs__rule" aria-hidden="true" />
      <p className="v3-work-crumbs__kicker">{children}</p>
    </nav>
  );
}

/** `# title` in the MDX: the opening stage, with the title as its h1. */
export function CaseTitle({ children }: { children: ReactNode }) {
  return <CaseStage>{children}</CaseStage>;
}

/** `## heading` in the MDX. Part finds it by this function. */
export function CaseH2({ children }: { children?: ReactNode }) {
  return (
    <h2 className="v3-display v3-work-h2" data-split>
      {children}
    </h2>
  );
}

export function CaseH3({ children }: { children?: ReactNode }) {
  return <h3 className="v3-title v3-work-h3">{children}</h3>;
}

/** A paragraph that is one element and nothing else (a bold line, a bare link) is a set line. */
export function CaseP({ children }: { children?: ReactNode }) {
  return <p className={`v3-work-p${isValidElement(children) ? " is-solo" : ""}`}>{children}</p>;
}

/** Bold text; a bold figure on its own ("158.2%") rolls in (#10 Odometer). */
export function CaseStrong({ children }: { children?: ReactNode }) {
  const figure = typeof children === "string" && /^[₦$]?\d[\d,]*(\.\d+)?(%|x)?$/.test(children);
  return (
    <strong className="v3-work-strong" data-odometer={figure ? "" : undefined}>
      {children}
    </strong>
  );
}

export function CaseA({ href, children }: { href?: string; children?: ReactNode }) {
  const external = !!href && /^https?:/.test(href);
  return (
    <a href={href} className="v3-work-a" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <section className="v3-part v3-part--lede" data-nav="cloud">
      <div className="v3-wrap v3-part__grid">
        <div className="v3-part__head" />
        <div className="v3-part__body">{children}</div>
      </div>
    </section>
  );
}

/**
 * One section. `split` (default): the heading holds in a left column while
 * the section reads in the right. `grid`: the heading runs across and the
 * section's <Pair> cards sit two up.
 */
export function Part({ children, layout = "split" }: { children: ReactNode; layout?: "split" | "grid" }) {
  const all = Children.toArray(children);
  const head = all.find((c) => isValidElement(c) && c.type === CaseH2);
  const rest = all.filter((c) => c !== head);
  return (
    <section className={`v3-part v3-part--${layout}`} data-nav="cloud">
      <div className="v3-wrap v3-part__grid">
        <div className="v3-part__head">{head}</div>
        <div className="v3-part__body">{rest}</div>
      </div>
    </section>
  );
}

/** A paragraph and the screenshot that proves it, as one card: print, paragraph, claim. */
export function Pair({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const all = Children.toArray(children);
  const isEvidence = (c: unknown): c is ReactElement<{ src: string; lead?: ReactNode }> =>
    isValidElement(c) && typeof (c.props as { src?: unknown }).src === "string";
  const evidence = all.find(isEvidence);
  const lead = all.filter((c) => c !== evidence);
  if (!evidence) return <div className="v3-pair">{children}</div>;
  return (
    <div className={`v3-pair${wide ? " v3-pair--wide" : ""}`}>
      {cloneElement(evidence, { lead: <div className="v3-pair__lead">{lead}</div> })}
    </div>
  );
}

/**
 * A pull-quote: a sentence lifted, word for word, from the case study and set
 * large. It repeats text the reader meets in the body, so it is hidden from
 * screen readers. `mark` is the closing phrase set in deep gold.
 */
export function PullQuote({ children, mark }: { children: ReactNode; mark?: string }) {
  let body: ReactNode = children;
  if (typeof children === "string" && mark) {
    const at = children.lastIndexOf(mark);
    if (at >= 0)
      body = (
        <>
          {children.slice(0, at)}
          <span className="mark">{mark}</span>
          {children.slice(at + mark.length)}
        </>
      );
  }
  return (
    <section className="v3-part v3-part--quote" data-nav="cloud" aria-hidden="true">
      <div className="v3-wrap v3-work-quote">
        <blockquote className="v3-display v3-work-quote__q" data-split>
          &ldquo;{body}&rdquo;
        </blockquote>
        <p className="v3-hand v3-work-quote__hand">read that twice</p>
      </div>
    </section>
  );
}

/** A row of the post's own figures, each rolling to its value. Repeats the sentence above it. */
export function StatRow({ items }: { items: [string, string][] }) {
  return (
    <dl className="v3-work-stats" aria-hidden="true">
      {items.map(([v, l], i) => (
        <div key={l} className={i === 0 ? "is-key" : undefined}>
          <dt data-odometer>{v}</dt>
          <dd>{l}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Bold figure lines set as a row: <Stats><StatLine n="110">analysis checks passed</StatLine>...</Stats> */
export function Stats({ children }: { children: ReactNode }) {
  return <div className="v3-work-stats v3-work-stats--lines">{children}</div>;
}

export function StatLine({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="v3-work-statline">
      <strong>
        <span className="v3-work-statline__n" data-odometer>
          {n}
        </span>{" "}
        <span className="v3-work-statline__l">{children}</span>
      </strong>
    </p>
  );
}

/** One figure from the paragraph that follows, set large. */
export function BigFigure({ value }: { value: string }) {
  return (
    <p className="v3-work-bigfig" aria-hidden="true">
      <span data-odometer>{value}</span>
    </p>
  );
}
