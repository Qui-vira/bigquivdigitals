"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Comment Bubble (#12 in research/EFFECTS-CATALOGUE.md): the real form, styled
 * as a conversation. Each question bubble and its answer field arrive in turn
 * as the form scrolls in, and the message field types its own placeholder
 * once, like someone starting to write. The form itself is untouched: same
 * fields, same names, same action. Reduced motion and no-JS: the finished
 * conversation, static placeholder.
 *
 * Children mark the pieces: [data-bubble] rows, [data-bubble-type] the field
 * whose placeholder types in.
 */
export function CommentBubble({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = [...el.querySelectorAll<HTMLElement>("[data-bubble]")];
      const field = el.querySelector<HTMLInputElement | HTMLTextAreaElement>("[data-bubble-type]");
      const full = field?.placeholder ?? "";
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 78%", once: true } });
      tl.from(rows, { y: 14, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.12, clearProps: "transform,opacity" });
      if (field && full) {
        const typed = { n: 0 };
        field.placeholder = "";
        tl.to(
          typed,
          {
            n: full.length,
            duration: Math.min(2.4, full.length / 32),
            ease: "none",
            onUpdate: () => {
              // stop typing the moment someone starts writing their own message
              if (field.value) return;
              field.placeholder = full.slice(0, Math.round(typed.n));
            },
            onComplete: () => {
              field.placeholder = full;
            },
          },
          "-=0.1"
        );
      }
      return () => {
        if (field && full) field.placeholder = full;
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
