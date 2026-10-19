"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type ChartBar = {
  /** words lifted from the case study */
  label: string;
  value: number;
  /** the figure exactly as the page states it, e.g. "158.2%" */
  display: string;
  key?: boolean;
};

/** "158.2%" -> 158.2, 1 decimal, prefix "", suffix "%" */
function parse(display: string) {
  const m = display.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
  if (!m) return { pre: "", n: 0, dec: 0, suf: display };
  const num = m[2].replace(/,/g, "");
  return { pre: m[1], n: Number(num), dec: (num.split(".")[1] || "").length, suf: m[3] };
}

/**
 * #11 Chart Grow (research/EFFECTS-CATALOGUE.md). Horizontal bars draw
 * themselves as the chart scrolls through, each with a readout riding the
 * bar's head and counting to the figure the page states. Scrubbed, so
 * scrolling back plays it in reverse. Only figures already in the text above
 * the chart; the chart repeats them, so it is hidden from screen readers.
 * Reduced motion: the finished chart, static.
 */
export function ChartGrow({ bars, max, caption }: { bars: ChartBar[]; max?: number; caption?: string }) {
  const ref = useRef<HTMLElement>(null);
  const top = max ?? Math.max(...bars.map((b) => b.value));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = [...el.querySelectorAll<HTMLElement>("[data-bar]")];
      const state = rows.map(() => ({ g: 0 }));
      const paint = () =>
        rows.forEach((row, i) => {
          const g = state[i].g;
          row.style.setProperty("--g", g.toFixed(4));
          const read = row.querySelector<HTMLElement>("[data-read]");
          if (!read) return;
          const p = parse(read.dataset.final || "");
          const v = p.n * g;
          read.textContent = `${p.pre}${v.toLocaleString("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec })}${p.suf}`;
        });
      paint();
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 82%", end: "top 30%", scrub: 0.5 },
        onUpdate: paint,
      });
      state.forEach((s, i) => tl.to(s, { g: 1, duration: 1, ease: "power2.out" }, i * 0.18));
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        rows.forEach((row) => {
          row.style.removeProperty("--g");
          const read = row.querySelector<HTMLElement>("[data-read]");
          if (read) read.textContent = read.dataset.final || "";
        });
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <figure ref={ref} className="v3-chart" aria-hidden="true">
      {caption && <figcaption className="v3-chart__cap">{caption}</figcaption>}
      <ul className="v3-chart__rows">
        {bars.map((b) => (
          <li key={b.label} className={b.key ? "is-key" : undefined} data-bar style={{ ["--v" as string]: (b.value / top).toFixed(4) }}>
            <span className="v3-chart__label">{b.label}</span>
            <span className="v3-chart__track">
              <span className="v3-chart__bar" />
              <span className="v3-chart__read" data-read data-final={b.display}>
                {b.display}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
