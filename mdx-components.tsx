import type { MDXComponents } from "mdx/types";
import { Evidence } from "@/components/work/Evidence";
import { ChartGrow } from "@/components/v3/fx/ChartGrow";
import {
  BigFigure,
  CaseA,
  CaseH2,
  CaseH3,
  CaseKicker,
  CaseP,
  CaseStrong,
  CaseTitle,
  Lede,
  Pair,
  Part,
  PullQuote,
  StatLine,
  StatRow,
  Stats,
} from "@/components/work/CaseParts";

/**
 * Global MDX component map. The only .mdx pages are the case studies under
 * app/work, so this map IS their typography (v3 rebuild, 19 Oct 2026).
 *
 * `Evidence` is available in every .mdx file without an import, because a case
 * study that renders a claim without its screenshot is the exact failure this
 * site exists to fix. The section wrappers (Lede, Part, Pair, PullQuote) and
 * the figure pieces (StatRow, Stats, StatLine, BigFigure, ChartGrow) group and
 * repeat the article's own words; none of them adds copy. A pull-quote may
 * only repeat a sentence that is already in the article.
 *
 * `h2` must stay the CaseH2 function itself (not a wrapper): <Part> finds its
 * heading by that reference.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Evidence,
    CaseKicker,
    PullQuote,
    Lede,
    Part,
    Pair,
    StatRow,
    Stats,
    StatLine,
    BigFigure,
    ChartGrow,
    h1: CaseTitle,
    h2: CaseH2,
    h3: CaseH3,
    p: CaseP,
    strong: CaseStrong,
    a: CaseA,
    ...components,
  };
}
