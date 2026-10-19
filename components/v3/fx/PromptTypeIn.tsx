"use client";

import { useEffect } from "react";

/**
 * Prompt Type-In (#30 in research/EFFECTS-CATALOGUE.md) for the article
 * template. Every prompt box in the article body (`.doc-code code`, written
 * by lib/doc-markdown.ts) types its text out once as it scrolls into view.
 * Gated articles mount their body later, so new boxes are picked up too.
 *
 * The full text is always one interaction away: any pointer or keyboard
 * contact with a box finishes it at once, before the Copy button reads it,
 * so a copy never takes half a prompt. Long prompts type their first lines
 * and then complete, about 1.6 s at most. Reduced motion: nothing types.
 */
const MAX_MS = 1600;

export function PromptTypeIn({ root = ".doc-page" }: { root?: string }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const done = new WeakSet<Element>();
    const running = new Map<Element, () => void>();

    const finish = (code: Element) => running.get(code)?.();

    const run = (code: HTMLElement) => {
      const full = code.dataset.full ?? code.textContent ?? "";
      code.dataset.full = full;
      const box = code.closest(".doc-code");
      box?.classList.add("is-typing");
      const t0 = performance.now();
      const dur = Math.min(MAX_MS, 300 + full.length * 6);
      let raf = 0;
      const end = () => {
        cancelAnimationFrame(raf);
        code.textContent = full;
        box?.classList.remove("is-typing");
        running.delete(code);
      };
      running.set(code, end);
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        // ease out: most of the text arrives early, the tail lands softly
        const n = Math.round(full.length * (1 - Math.pow(1 - t, 2.2)));
        code.textContent = full.slice(0, n);
        if (t < 1) raf = requestAnimationFrame(step);
        else end();
      };
      code.textContent = "";
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          run(e.target as HTMLElement);
        }
      },
      { rootMargin: "0px 0px -15% 0px" }
    );

    const wire = () => {
      document.querySelectorAll<HTMLElement>(`${root} .doc-code code`).forEach((code) => {
        if (done.has(code)) return;
        done.add(code);
        const box = code.closest(".doc-code");
        const r = code.getBoundingClientRect();
        // already in view on arrival: leave it as it is
        if (r.top < window.innerHeight * 0.85 && r.bottom > 0) return;
        io.observe(code);
        box?.addEventListener("pointerdown", () => finish(code), { capture: true });
        box?.addEventListener("focusin", () => finish(code));
      });
    };
    wire();
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        wire();
      }, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(pending);
      io.disconnect();
      mo.disconnect();
      running.forEach((end) => end());
    };
  }, [root]);
  return null;
}
