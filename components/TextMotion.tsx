"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The site's text entrances. Three of them, deliberately, so pages can vary
 * without every section inventing its own curve.
 *
 *   Typewriter  types a short line out, one character at a time
 *   RiseWords   lifts a headline word by word
 *   PopIn       scales a block up with a small overshoot
 *
 * ── THE CONSTRAINT THAT SHAPES ALL THREE ───────────────────────────────────
 *
 * None of them animate opacity from 0, and none hide text behind a clip while
 * waiting for a trigger. On 2026-07-25 the homepage shipped with roughly
 * 2,950px of blank space: scroll-triggered reveals never fired and everything
 * below the fold stayed invisible. `/services` and `/articles` had the same
 * hole. The lesson is that an entrance must be a lift on top of readable
 * content, never the thing that makes content readable.
 *
 * So the failure mode of every component here is "text sits 14px low" or
 * "text is at 92% scale", not "text is missing". Typewriter is the one that
 * genuinely has to hide characters, and it handles that by rendering the
 * complete string on the server and only emptying itself after mount, in a
 * layout effect that runs before paint — so no-JS and failed-hydration both
 * leave the full sentence on screen.
 */

/** Split on spaces, keeping the spaces so justified text does not collapse. */
function toWords(text: string) {
  return text.split(" ");
}

/**
 * Motion components resolved once, at module scope.
 *
 * NOT `motion[tag]` inside a render. `motion` is a Proxy that manufactures a
 * component on each property access, so a dynamic lookup during render hands
 * React a different component identity every time. React sees a new type,
 * unmounts the old subtree and mounts a fresh one on every render — which
 * throws away the animation state it is supposed to be driving. Looking them
 * up here makes each one a stable reference for the life of the module.
 */
const MOTION_BLOCK = {
  div: motion.div,
  li: motion.li,
} as const;

const MOTION_TEXT = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
} as const;

/* ────────────────────────────────────────────────────────────────────────────
   Typewriter
   ──────────────────────────────────────────────────────────────────────────── */

export function Typewriter({
  text,
  className = "",
  speed = 45,
  startDelay = 150,
  caret = true,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  /** Milliseconds per character. */
  speed?: number;
  startDelay?: number;
  caret?: boolean;
  as?: "span" | "p" | "h1" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduced = usePrefersReducedMotion();

  // Starts as the COMPLETE string. Server render, no-JS and a failed hydration
  // therefore all show the finished sentence.
  const [shown, setShown] = useState(text);
  const [armed, setArmed] = useState(false);

  // Empty it before the browser paints, so there is no flash of the full line
  // followed by it disappearing. useEffect would run after paint and flicker.
  useLayoutEffect(() => {
    if (reduced) return;
    setShown("");
    setArmed(true);
  }, [reduced]);

  useEffect(() => {
    if (!armed || reduced || !inView) return;

    let i = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) timer = setTimeout(tick, speed);
    };

    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [armed, inView, reduced, text, speed, startDelay]);

  // Derived, NOT read from state directly. `reduced` is false during SSR and
  // hydration — that is the store's server snapshot — so the layout effect
  // above empties `shown` before the media query has actually been read. A
  // visitor on prefers-reduced-motion therefore landed on an EMPTY element:
  // the effect had cleared the text, and the typing effect refuses to run
  // under reduce, so nothing ever put it back.
  //
  // Deriving it here makes reduce show the whole string regardless of the
  // order those two things happen in. Text going missing is the one failure
  // this file exists to prevent, so it does not get left to sequencing.
  const visible = reduced ? text : shown;
  const done = visible.length === text.length;

  return (
    <Tag
      ref={ref as never}
      className={className}
      // The animated span is character soup to a screen reader, so the real
      // sentence is announced once, here, and the visual copy is hidden.
      aria-label={text}
    >
      <span aria-hidden="true">
        {visible}
        {caret && !reduced && !done ? <span className="caret" /> : null}
      </span>
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   RiseWords
   ──────────────────────────────────────────────────────────────────────────── */

export function RiseWords({
  children,
  className = "",
  as: Tag = "h2",
  stagger = 0.045,
  delay = 0,
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduced = usePrefersReducedMotion();
  const words = toWords(children);

  // No overflow-hidden on the wrapper. Clipping the words and sliding them up
  // from underneath is the same failure as opacity 0: if the observer never
  // fires, the clip hides the headline permanently.
  const MotionTag = MOTION_TEXT[Tag];

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 1, y: 14 }}
          animate={inView ? { y: 0 } : undefined}
          transition={{
            duration: 0.55,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   PopIn
   ──────────────────────────────────────────────────────────────────────────── */

export function PopIn({
  children,
  className = "",
  delay = 0,
  /**
   * The element rendered. Defaults to a div; pass "li" inside a list, since an
   * ol/ul may only contain li children and a wrapper div there is invalid HTML
   * that some screen readers drop the list semantics over.
   */
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = MOTION_BLOCK[Tag];

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 1, scale: 0.94 }}
      animate={inView ? { scale: 1 } : undefined}
      transition={{
        duration: 0.5,
        delay,
        // Matches --ease-out-back in globals.css. A restrained overshoot: at
        // the more common 1.56 the element visibly rubber-bands.
        ease: [0.34, 1.22, 0.64, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}
