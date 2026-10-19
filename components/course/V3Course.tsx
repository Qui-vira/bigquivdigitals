/**
 * Small pieces shared by the course pages in the v3 rebuild (/greatwork,
 * /aimastery and the three waitlists). No state, no copy of their own: every
 * word arrives from the page. Styles: components/v3/pages/course.css.
 */
import type { ReactNode } from "react";

/** Drawn marks for lists: one stroke weight, authored SVG, never glyphs. */
export function Mark({ kind }: { kind: "arrow" | "check" | "cross" }) {
  if (kind === "check")
    return (
      <svg className="v3-mark v3-mark--check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      </svg>
    );
  if (kind === "cross")
    return (
      <svg className="v3-mark v3-mark--cross" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5 5 15 15M15 5 5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
      </svg>
    );
  return (
    <svg className="v3-mark v3-mark--arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 10h12M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function MarkList({
  items,
  kind = "arrow",
  className = "",
  checklist = false,
}: {
  items: string[];
  kind?: "arrow" | "check" | "cross";
  className?: string;
  /** tick as the list passes the middle of the screen (#5, Motion's data-checklist) */
  checklist?: boolean;
}) {
  if (checklist)
    return (
      <ul className={`v3-ticks ${className}`} data-checklist>
        {items.map((item) => (
          <li key={item} data-check>
            {item}
          </li>
        ))}
      </ul>
    );
  return (
    <ul className={`v3-marks v3-marks--${kind} ${className}`}>
      {items.map((item) => (
        <li key={item}>
          <Mark kind={kind} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** The old price struck, the live price set heavy, then the page's own words. */
export function Price({ was, now, children, className = "" }: { was: string; now: string; children?: ReactNode; className?: string }) {
  return (
    <p className={`v3-price ${className}`}>
      <s>{was}</s>
      <span className="v3-sr"> (was)</span> <b>{now}</b>
      {children ? <> {children}</> : null}
    </p>
  );
}
