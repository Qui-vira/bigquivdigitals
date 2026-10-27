"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createGhost } from "./ghost";
import { Arrow } from "./Arrow";
import type { PortraitScene } from "./portraitScene";

/**
 * The homepage hero: he is the product.
 *
 * A 620svh section with a sticky viewport, as on the Adewura pages. Scroll
 * progress through the section drives three things at once:
 *   - the portrait's pose (portraitScene.ts): it turns to face you, steps left
 *     and right as the lines land, pushes in to the eyes, then settles;
 *   - the owner's headline, which lifts away word by word;
 *   - four ghost-trail lines and their asides, each on its own window.
 *
 * Every word on this stage is the owner's own copy from the previous homepage.
 * The h1 and the actions are in the server HTML, so nothing waits on WebGL.
 */

const GHOST_TIMES: [number, number, number, number][] = [
  [0.17, 0.235, 0.33, 0.37],
  [0.38, 0.445, 0.52, 0.56],
  [0.585, 0.645, 0.72, 0.76],
  [0.79, 0.845, 0.95, 0.99],
];
const ASIDE_TIMES: [number, number, number, number][] = [
  [0.2, 0.25, 0.32, 0.36],
  [0.41, 0.46, 0.51, 0.55],
  [0.6, 0.65, 0.71, 0.75],
  [0.81, 0.86, 0.93, 0.97],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

const HEADLINE = "Your next skill is going to end";
const HEADLINE_GOLD = "exactly like the last one did.";

export function ProductHero({ calendlyUrl }: { calendlyUrl: string }) {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("js");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower =
      (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4 || window.innerWidth < 760;
    const narrowMq = window.matchMedia("(max-width: 760px)");

    const canvas = stage.querySelector<HTMLCanvasElement>(".v3-stage__gl")!;
    const mark = stage.querySelector<HTMLElement>(".v3-stage__mark")!;
    const words = [...stage.querySelectorAll<HTMLElement>(".v3-intro__line .w")];
    const introRest = [...stage.querySelectorAll<HTMLElement>("[data-intro-rest]")];
    const asides = [...stage.querySelectorAll<HTMLElement>(".v3-aside")];
    const endCta = stage.querySelector<HTMLElement>(".v3-endcta")!;
    const ghosts = [...stage.querySelectorAll<HTMLElement>("[data-ghost]")].map((el) =>
      createGhost(el, { blur: !lowPower && !reduced })
    );

    let scene: PortraitScene | null = null;
    let disposed = false;
    let active = true;
    let lastP = 0;

    // The WebGL portrait loads after the page is usable; three.js is a separate chunk.
    const boot = window.setTimeout(async () => {
      try {
        const { createPortraitScene } = await import("./portraitScene");
        if (disposed) return;
        const sticky = stage.querySelector<HTMLElement>(".v3-stage__sticky")!;
        scene = await createPortraitScene(canvas, {
          lowPower,
          reduced,
          narrow: () => narrowMq.matches,
          onPose: (x, y) => {
            sticky.style.setProperty("--spot-x", `${(x * 100).toFixed(1)}%`);
            sticky.style.setProperty("--spot-y", `${(y * 100 - 4).toFixed(1)}%`);
          },
        });
        if (disposed) return scene.dispose();
        scene.setProgress(lastP);
        if (active) scene.start();
        stage.classList.add("is-gl");
      } catch (err) {
        document.documentElement.classList.add("no-gl");
        console.warn("WebGL unavailable, showing the flat portrait.", err);
      }
    }, 40);

    function setProgress(p: number) {
      lastP = p;
      scene?.setProgress(p);

      // the headline lifts away word by word
      words.forEach((w, i) => {
        const t = range(p, 0.02 + i * 0.006, 0.075 + i * 0.006);
        w.style.transform = t ? `translate3d(0, ${-t * 3}rem, 0)` : "";
        w.style.opacity = String(Math.max(0, 1 - t * 1.4));
        if (!reduced) w.style.filter = t ? `blur(${(t * 8).toFixed(1)}px)` : "";
      });
      const rest = 1 - range(p, 0.015, 0.06);
      introRest.forEach((el) => {
        el.style.opacity = String(rest);
        el.style.transform = `translate3d(0, ${(1 - rest) * -1}rem, 0)`;
        el.style.pointerEvents = rest > 0.5 ? "auto" : "none";
      });

      // the wordmark behind him rises and dims as the story starts
      const m = range(p, 0.02, 0.2);
      mark.style.transform = `translate3d(0, ${-m * 14}svh, 0) scale(${1 - m * 0.08})`;
      mark.style.opacity = String(1 - m * 0.75);

      ghosts.forEach((g, i) => {
        const [a, b, c, d] = GHOST_TIMES[i];
        g.update(range(p, a, b), range(p, c, d));
      });
      asides.forEach((el, i) => {
        const [a, b, c, d] = ASIDE_TIMES[i];
        const v = range(p, a, b) * (1 - range(p, c, d));
        el.style.opacity = String(v);
        const base = el.dataset.side === "center" ? "translateX(-50%) " : "";
        el.style.transform = `${base}translateY(${(1 - v) * 0.8}rem)`;
      });

      const e = range(p, 0.86, 0.9) * (1 - range(p, 0.975, 1));
      endCta.style.opacity = String(e);
      endCta.style.transform = `translateY(${(1 - e) * 0.8}rem)`;
      endCta.style.pointerEvents = e > 0.5 ? "auto" : "none";
    }

    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setProgress(self.progress),
      onToggle: (self) => {
        active = self.isActive;
        if (self.isActive) scene?.start();
        else scene?.stop();
      },
    });
    setProgress(st.progress || 0);

    const onPointer = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      scene?.setPointer((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
    };
    const onResize = () => scene?.resize();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.clearTimeout(boot);
      st.kill();
      ghosts.forEach((g) => g.destroy());
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, []);

  const headWords = HEADLINE.split(" ");
  const goldWords = HEADLINE_GOLD.split(" ");

  return (
    <section ref={stageRef} className="v3-stage" data-nav="navy" aria-label="Big Quiv">
      <div className="v3-stage__sticky">
        <div className="v3-stage__grid" aria-hidden="true" />
        <p className="v3-stage__mark" aria-hidden="true">
          BIG QUIV
        </p>
        <div className="v3-stage__fallback" aria-hidden="true">
          {/* Shown only when WebGL is unavailable: the same cut-out, flat. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero3d/quiv-color-900.webp" alt="" width={900} height={667} />
        </div>
        <canvas className="v3-stage__gl" aria-hidden="true" />
        <div className="v3-stage__floor" aria-hidden="true" />

        <div className="v3-intro">
          <h1 className="v3-intro__line v3-display">
            {headWords.map((w, i) => (
              <span key={`h${i}`}>
                <span className="w">{w}</span>{" "}
              </span>
            ))}
            {goldWords.map((w, i) => (
              <span key={`g${i}`}>
                <span className="w w--gold">{w}</span>
                {i < goldWords.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-intro__actions">
              <Link href="/greatwork-waitlist" className="v3-btn v3-btn--lg">
                Join the waitlist <Arrow />
              </Link>
              <a href={calendlyUrl} className="v3-link">
                Hire me
              </a>
            </div>
            <p className="v3-intro__note">The Great Work opens soon. The list goes first.</p>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0" data-side="right">
          Same skills.
        </h2>
        <p className="v3-aside" data-side="right">
          Mine stopped ending that way in 2022, when I got my first seven-figure naira dev job.
        </p>

        <h2 className="v3-ghost" data-ghost="1" data-side="left">
          One move.
        </h2>
        <p className="v3-aside" data-side="left">
          Now I have built the thing that fixes yours.
        </p>

        <h2 className="v3-ghost" data-ghost="2" data-side="low">
          One system. One invoice.
        </h2>
        <p className="v3-aside" data-side="left" style={{ bottom: "auto", top: "18svh" }}>
          One person you can shout at.
        </p>

        <h2 className="v3-ghost" data-ghost="3" data-side="high">
          Receipts.
        </h2>
        <p className="v3-aside" data-side="center" style={{ bottom: "15svh" }}>
          Every number here has a screenshot behind it. Ask me for any of them.
        </p>

        <div className="v3-endcta">
          <Link href="/greatwork-waitlist" className="v3-btn" tabIndex={-1}>
            Join the waitlist <Arrow />
          </Link>
          <a href={calendlyUrl} className="v3-link" tabIndex={-1}>
            Book a call
          </a>
        </div>
      </div>
    </section>
  );
}
