import { isValidElement } from "react";
import type { MDXComponents } from "mdx/types";
import { CheckerStrip } from "@/components/ui-paper/CheckerStrip";
import { Evidence } from "@/components/Evidence";
import { CaseKicker, CaseTitle, PullQuote } from "@/components/work/CaseParts";

/**
 * Global MDX component map. `Evidence` is available in every .mdx file without
 * an import, because a case study that renders a claim without its screenshot
 * is the exact failure this rebuild exists to fix.
 *
 * Paper redesign (2026-10): the only .mdx pages are the case studies under
 * app/work, so this map IS their typography. The layout grid, the numbered
 * section heads and the lede live in app/work/work.css. `CaseKicker` and
 * `PullQuote` are available without an import too; a pull-quote may only
 * repeat a sentence that is already in the article.
 *
 * Reading text is Karla (font-sans) at 17-18px in ink-soft. The Didone only
 * appears at display sizes: the title, the part heads and the pull-quotes.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Evidence,
    CaseKicker,
    PullQuote,
    h1: ({ children }) => <CaseTitle>{children}</CaseTitle>,
    h2: ({ children }) => <h2 className="case-h2">{children}</h2>,
    h3: ({ children }) => (
      <h3 className="mt-12 font-display text-[1.45rem] font-bold leading-[1.2] tracking-[-0.015em] text-ink text-balance md:text-[1.6rem]">
        {children}
      </h3>
    ),
    // A paragraph that is one element and nothing else (a bold line on its
    // own, a bare link) gets the `case-solo` treatment in work.css. Checked
    // here because CSS cannot see text nodes: :only-child would also match
    // a sentence with one bold phrase inside it.
    p: ({ children }) => (
      <p
        className={`${isValidElement(children) ? "case-solo " : ""}mt-6 text-[1.0625rem] leading-[1.75] text-ink-soft text-pretty md:text-[1.125rem]`}
      >
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mt-6 space-y-3 text-[1.0625rem] leading-[1.7] text-ink-soft md:text-[1.125rem]">{children}</ul>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="paper-link font-medium text-ink underline decoration-gold-deep decoration-2 underline-offset-[5px] hover:decoration-ink"
      >
        {children}
      </a>
    ),
    hr: () => <CheckerStrip className="case-wide my-16" />,
    ...components,
  };
}
