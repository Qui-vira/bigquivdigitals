"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";

/**
 * Look Swap (#24 in research/EFFECTS-CATALOGUE.md). One clip in two looks,
 * cross-faded. It swaps on its own once when it scrolls into view, then the
 * visitor toggles with a real button (aria-pressed). Any <video> in the two
 * layers is kept on one clock: the hidden one follows the shown one.
 *
 * Only looks that were really made go in here; the page passes a labelled
 * placeholder until they exist. Reduced motion: both looks side by side, no
 * auto swap.
 */
export function LookSwap({
  a,
  b,
  aLabel,
  bLabel,
  className = "",
}: {
  a: ReactNode;
  b: ReactNode;
  aLabel: string;
  bLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [look, setLook] = useState<"a" | "b">("a");
  const touched = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    let t = 0;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 65%",
      once: true,
      onEnter: () => {
        t = window.setTimeout(() => !touched.current && setLook("b"), 500);
      },
    });
    return () => {
      st.kill();
      window.clearTimeout(t);
    };
  }, []);

  // one clock for both looks
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vids = [...el.querySelectorAll("video")];
    if (vids.length < 2) return;
    const [va, vb] = vids;
    const lead = look === "a" ? va : vb;
    const other = look === "a" ? vb : va;
    if (Math.abs(other.currentTime - lead.currentTime) > 0.08) other.currentTime = lead.currentTime;
  }, [look]);

  return (
    <div ref={ref} className={`v3-look ${className}`} data-look={look}>
      <div className="v3-look__stage">
        <div className="v3-look__layer v3-look__layer--a" aria-hidden={look !== "a"}>
          {a}
        </div>
        <div className="v3-look__layer v3-look__layer--b" aria-hidden={look !== "b"}>
          {b}
        </div>
      </div>
      <div className="v3-look__switch" role="group" aria-label="Look">
        {(["a", "b"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={look === k}
            onClick={() => {
              touched.current = true;
              setLook(k);
            }}
          >
            {k === "a" ? aLabel : bLabel}
          </button>
        ))}
        <span className="v3-look__thumb" aria-hidden="true" />
      </div>
    </div>
  );
}
