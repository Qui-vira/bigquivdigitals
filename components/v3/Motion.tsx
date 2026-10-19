"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The site's scroll and hover effects, applied by attribute so pages stay
 * server-rendered and every word is in the HTML before any script runs.
 * Numbers in brackets are entries in research/EFFECTS-CATALOGUE.md.
 *
 *   data-split            heading lines rise into place once (#44, #22)
 *   data-fade             a block rises 24px into place once
 *   data-odometer         a number rolls to its value once (#10)
 *   data-scramble         characters scramble then settle (#41)
 *   data-parallax="0.2"   floats at its own depth while its section passes (#35)
 *   data-reveal="clip"    an image wipes in from the bottom once (#37)
 *   data-panel            the section rises over the one before with a rounded top
 *   data-glitch           the one glitch line on the site (gold and cloud copies)
 *   data-checklist        children [data-check] tick as the list passes the middle (#5)
 *   data-typein           its text types itself out once, like a prompt (#30)
 *   data-strike           a line draws through it once (#26)
 *   data-tilt             tilts a little towards the mouse (#43)
 *   data-stack            child [data-stack-card] cards stack and settle back (#45)
 *   data-hscroll          pins and scrolls its [data-hscroll-track] sideways (#38)
 *   data-spotlight        the section dims to navy around its centre as it arrives (#4)
 *
 * Reduced motion: everything is shown in its final state, nothing moves.
 */

const reducedMq = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE = "expo.out";

function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return [...el.querySelectorAll<HTMLElement>(".sw > span")];
  el.dataset.splitDone = "1";
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of (child.textContent || "").split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(part);
            continue;
          }
          const outer = document.createElement("span");
          outer.className = "sw";
          const inner = document.createElement("span");
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
          out.push(inner);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
    }
  };
  walk(el);
  return out;
}

function odometer(el: HTMLElement) {
  if (el.dataset.odoDone) return null;
  el.dataset.odoDone = "1";
  const text = el.textContent || "";
  el.setAttribute("aria-label", text);
  el.textContent = "";
  const cols: { strip: HTMLElement; digit: number }[] = [];
  for (const ch of text) {
    if (/\d/.test(ch)) {
      const col = document.createElement("span");
      col.className = "odo-col";
      col.setAttribute("aria-hidden", "true");
      const strip = document.createElement("span");
      strip.className = "odo-strip";
      strip.textContent = "0 1 2 3 4 5 6 7 8 9".split(" ").join("\n");
      col.append(strip);
      el.append(col);
      cols.push({ strip, digit: Number(ch) });
    } else {
      const s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      el.append(s);
    }
  }
  return cols;
}

function typeIn(el: HTMLElement) {
  const full = el.textContent || "";
  el.setAttribute("aria-label", full);
  el.dataset.full = full;
  return full;
}

/** How many elements have been wired; a rescan that wires none skips the refresh. */
let wired = 0;

/** Elements matching `sel` that have not been wired yet; marks them wired. */
function fresh(root: HTMLElement, sel: string, key: string) {
  return [...root.querySelectorAll<HTMLElement>(sel)].filter((el) => {
    if (el.dataset[key]) return false;
    el.dataset[key] = "1";
    wired++;
    return true;
  });
}

export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = reducedMq();
    const root = document.getElementById("main");
    if (!root) return;
    const cleanups: (() => void)[] = [];
    let alive = true;
    cleanups.push(() => {
      alive = false;
    });

    // Never touch the page's DOM before React has hydrated it: wait for the
    // document to finish loading, then for the browser to be idle.
    const whenHydrated = (fn: () => void) => {
      const go = () => {
        const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
          .requestIdleCallback;
        if (idle) idle(() => alive && fn(), { timeout: 600 });
        else window.setTimeout(() => alive && fn(), 250);
      };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };

    const ctx = gsap.context(() => {}, root);
    const scan = () => ctx.add(() => {
      // split-text headings
      fresh(root, "[data-split]", "mSplit").forEach((el) => {
        if (reduced) return;
        const words = splitWords(el);
        gsap.from(words, {
          yPercent: 110,
          duration: 1,
          ease: EASE,
          stagger: 0.035,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      fresh(root, "[data-fade]", "mFade").forEach((el) => {
        if (reduced) return;
        gsap.from(el, { y: 24, opacity: 0, duration: 0.9, ease: EASE, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });

      // odometer
      fresh(root, "[data-odometer]", "mOdo").forEach((el) => {
        if (reduced) return;
        const cols = odometer(el);
        if (!cols) return;
        cols.forEach(({ strip }) => gsap.set(strip, { yPercent: 0 }));
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () =>
            cols.forEach(({ strip, digit }, i) =>
              gsap.to(strip, { yPercent: -digit * 10, duration: 1.4 + i * 0.08, ease: "power3.out", delay: i * 0.04 })
            ),
        });
      });

      // number scramble
      fresh(root, "[data-scramble]", "mScr").forEach((el) => {
        if (reduced) return;
        const final = el.textContent || "";
        el.setAttribute("aria-label", final);
        const chars = "0123456789#%&*";
        const obj = { t: 0 };
        gsap.to(obj, {
          t: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            const settled = Math.floor(obj.t * final.length);
            el.textContent = final
              .split("")
              .map((c, i) => (i < settled || c === " " ? c : chars[Math.floor(Math.random() * chars.length)]))
              .join("");
          },
          onComplete: () => {
            el.textContent = final;
          },
        });
      });

      // parallax depth
      fresh(root, "[data-parallax]", "mPar").forEach((el) => {
        if (reduced) return;
        const depth = Number(el.dataset.parallax) || 0.15;
        const wide = window.innerWidth > 760;
        gsap.to(el, {
          y: () => depth * (wide ? -480 : -160),
          ease: "none",
          scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        });
      });

      // clip reveal
      fresh(root, '[data-reveal="clip"]', "mClip").forEach((el) => {
        if (reduced) return;
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 85%", once: true } }
        );
      });

      // panel wipe over the previous section
      fresh(root, "[data-panel]", "mPanel").forEach((el) => {
        if (reduced) return;
        gsap.fromTo(
          el,
          { clipPath: "inset(12% 0% 0% 0% round 2.5rem 2.5rem 0rem 0rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0rem 0rem 0rem 0rem)",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true },
          }
        );
      });

      // the one glitch
      fresh(root, "[data-glitch]", "mGlitch").forEach((el) => {
        if (reduced) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          end: "top 40%",
          onUpdate: ({ progress }) => {
            const g = Math.sin(progress * Math.PI) * (0.55 + 0.45 * Math.sin(progress * 46));
            el.style.setProperty("--g", Math.max(0, g).toFixed(3));
          },
          onLeave: () => el.style.setProperty("--g", "0"),
          onLeaveBack: () => el.style.setProperty("--g", "0"),
        });
      });

      // checklist ticks as it passes the middle of the screen
      fresh(root, "[data-checklist]", "mCheck").forEach((list) => {
        const items = [...list.querySelectorAll<HTMLElement>("[data-check]")];
        const count = list.querySelector<HTMLElement>("[data-check-count]");
        const set = (n: number) => {
          items.forEach((it, i) => it.classList.toggle("is-done", i < n));
          if (count) count.textContent = `${n} of ${items.length}`;
        };
        if (reduced) return set(items.length);
        set(0);
        ScrollTrigger.create({
          trigger: list,
          start: "top 70%",
          end: "bottom 45%",
          onUpdate: ({ progress }) => set(Math.round(progress * items.length)),
        });
      });

      // prompt type-in
      fresh(root, "[data-typein]", "mType").forEach((el) => {
        if (reduced) return;
        const full = typeIn(el);
        const obj = { n: 0 };
        el.classList.add("is-typing");
        el.textContent = "";
        gsap.to(obj, {
          n: full.length,
          duration: Math.min(4, full.length / 40),
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = full.slice(0, Math.round(obj.n));
          },
          onComplete: () => el.classList.remove("is-typing"),
        });
      });

      // strike-through draws in
      fresh(root, "[data-strike]", "mStrike").forEach((el) => {
        if (reduced) return el.classList.add("is-struck");
        ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => el.classList.add("is-struck") });
      });

      // stacking cards
      fresh(root, "[data-stack]", "mStack").forEach((wrap) => {
        if (reduced) return;
        const cards = [...wrap.querySelectorAll<HTMLElement>("[data-stack-card]")];
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, {
            scale: 0.94,
            opacity: 0.55,
            ease: "none",
            scrollTrigger: { trigger: next, start: "top 85%", end: "top 25%", scrub: true },
          });
        });
      });

      // spotlight: the section dims to navy around one line
      fresh(root, "[data-spotlight]", "mSpot").forEach((el) => {
        if (reduced) return;
        const shade = document.createElement("div");
        shade.className = "v3-spotlight";
        shade.setAttribute("aria-hidden", "true");
        el.prepend(shade);
        gsap.fromTo(
          shade,
          { "--r": "140%" },
          { "--r": "38%", ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "top 15%", scrub: true } }
        );
      });

      // horizontal pinned scroll
      fresh(root, "[data-hscroll]", "mH").forEach((wrap) => {
        if (reduced || window.innerWidth < 760) return;
        const track = wrap.querySelector<HTMLElement>("[data-hscroll-track]");
        if (!track) return;
        gsap.to(track, {
          x: () => -(track.scrollWidth - wrap.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: () => `+=${track.scrollWidth - wrap.clientWidth}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });
    });
    cleanups.push(() => ctx.revert());

    // hover tilt, mouse only
    const wireTilt = () => {
      if (reduced || !finePointer()) return;
      fresh(root, "[data-tilt]", "mTilt").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`;
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    };

    // content that streams in after the shell mounts gets wired too
    let pending = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(pending);
      pending = window.setTimeout(() => {
        const before = wired;
        scan();
        wireTilt();
        if (wired !== before) ScrollTrigger.refresh();
      }, 120);
    });
    whenHydrated(() => {
      scan();
      wireTilt();
      ScrollTrigger.refresh();
      mo.observe(root, { childList: true, subtree: true });
    });
    cleanups.push(() => {
      mo.disconnect();
      window.clearTimeout(pending);
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      window.clearTimeout(refresh);
      cleanups.forEach((c) => c());
    };
  }, [pathname]);

  return null;
}
