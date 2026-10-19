"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createGhost } from "../ghost";
import { SCENES, type SceneId } from "./registry";
import type { SceneHandle } from "./kit";

/**
 * The pinned 3D stage every page opens on (Adewura method, see
 * research/adewura-motion/BREAKDOWN.md). A tall section with a sticky
 * viewport; scroll progress through it drives the page's object and its lines.
 *
 * Children are plain server-rendered markup. The stage animates whatever it
 * finds inside by attribute, so every word stays in the HTML:
 *   data-lift              the opening line: lifts away word by word (p 0.02 to 0.09)
 *   data-intro-rest        buttons and notes under it: fade out (p 0.015 to 0.06)
 *   data-ghost="a,b,c,d"   a ghost-trail line: enters a..b, leaves c..d
 *   data-at="a,b,c,d"      anything else (asides, end buttons): fades in a..b, out c..d
 */

type Props = {
  scene: SceneId;
  params?: Record<string, unknown>;
  ground?: "navy" | "cloud";
  /** stage height in svh on desktop and on phones */
  height?: number;
  heightPhone?: number;
  /** the giant tone-on-tone word behind the object */
  mark?: string;
  /** still image of the object for no-WebGL and reduced data */
  fallback?: string;
  particles?: boolean;
  label: string;
  children: ReactNode;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a || 1));
const windowOf = (el: HTMLElement, attr: string) =>
  (el.getAttribute(attr) || "0,0,1,1").split(",").map(Number) as [number, number, number, number];

export function Stage({
  scene: sceneId,
  params = {},
  ground = "navy",
  height = 600,
  heightPhone = 520,
  mark,
  fallback,
  particles = false,
  label,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowPower = (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4 || window.innerWidth < 760;
    const narrowMq = window.matchMedia("(max-width: 760px)");

    const sticky = stage.querySelector<HTMLElement>(".v3-stage__sticky")!;
    const canvas = stage.querySelector<HTMLCanvasElement>(".v3-stage__gl")!;
    const specks = stage.querySelector<HTMLCanvasElement>(".v3-stage__specks");
    const markEl = stage.querySelector<HTMLElement>(".v3-stage__mark");

    // the opening line, split into words once
    const liftEl = stage.querySelector<HTMLElement>("[data-lift]");
    let words: HTMLElement[] = [];
    if (liftEl && !liftEl.dataset.split) {
      liftEl.dataset.split = "1";
      const walk = (node: Node) => {
        for (const child of [...node.childNodes]) {
          if (child.nodeType === Node.TEXT_NODE) {
            const parts = (child.textContent || "").split(/(\s+)/);
            const frag = document.createDocumentFragment();
            for (const part of parts) {
              if (!part) continue;
              if (/^\s+$/.test(part)) frag.append(part);
              else {
                const s = document.createElement("span");
                s.className = "w";
                s.textContent = part;
                frag.append(s);
              }
            }
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
        }
      };
      walk(liftEl);
    }
    if (liftEl) words = [...liftEl.querySelectorAll<HTMLElement>(".w")];
    const rest = [...stage.querySelectorAll<HTMLElement>("[data-intro-rest]")];
    const ghosts = [...stage.querySelectorAll<HTMLElement>("[data-ghost]")].map((el) => ({
      win: windowOf(el, "data-ghost"),
      g: createGhost(el, { blur: !lowPower && !reduced }),
    }));
    const timed = [...stage.querySelectorAll<HTMLElement>("[data-at]")].map((el) => ({ el, win: windowOf(el, "data-at") }));

    // ---- particles: fine gold and contrast specks, no glow, no additive blend
    type Speck = { x: number; y: number; r: number; a: number; v: number; gold: boolean; dx: number; dy: number };
    let speckList: Speck[] = [];
    let speckRaf = 0;
    let speckP = 0;
    const speckCtx = specks?.getContext("2d") ?? null;
    function seedSpecks() {
      if (!specks || !speckCtx || reduced) return;
      const w = (specks.width = specks.clientWidth);
      const h = (specks.height = specks.clientHeight);
      const n = lowPower ? 60 : 120;
      speckList = Array.from({ length: n }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const ang = Math.atan2(y - h / 2, x - w / 2);
        return {
          x,
          y,
          r: 0.6 + Math.random(),
          a: 0.3 + Math.random() * 0.4,
          v: 6 + Math.random() * 14,
          gold: Math.random() < 0.55,
          dx: Math.cos(ang),
          dy: Math.sin(ang),
        };
      });
    }
    function drawSpecks(now: number) {
      if (!specks || !speckCtx) return;
      const w = specks.width;
      const h = specks.height;
      speckCtx.clearRect(0, 0, w, h);
      const part = range(speckP, 0, 0.15); // they part as the object rises, gone by p 0.15
      const fade = 1 - part;
      if (fade <= 0) return;
      const other = ground === "navy" ? "242,237,231" : "27,36,51";
      for (const s of speckList) {
        s.x += (s.v / 60) * 0.6;
        if (s.x > w + 4) s.x = -4;
        const px = s.x + s.dx * part * w * 0.4;
        const py = s.y + s.dy * part * h * 0.4 + Math.sin(now / 1400 + s.x * 0.01) * 3;
        speckCtx.fillStyle = s.gold ? `rgba(232,163,61,${s.a * fade})` : `rgba(${other},${s.a * 0.6 * fade})`;
        speckCtx.beginPath();
        speckCtx.arc(px, py, s.r, 0, Math.PI * 2);
        speckCtx.fill();
      }
    }
    function speckLoop(now: number) {
      drawSpecks(now);
      speckRaf = requestAnimationFrame(speckLoop);
    }

    // ---- the 3D object, loaded after the page is usable
    let scene: SceneHandle | null = null;
    let disposed = false;
    let active = true;
    let lastP = 0;
    const boot = window.setTimeout(async () => {
      try {
        const mod = await SCENES[sceneId]();
        if (disposed) return;
        scene = await mod.default(canvas, {
          lowPower,
          reduced,
          narrow: () => narrowMq.matches,
          params: JSON.parse(paramsKey),
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
        stage.classList.add("no-gl");
        console.warn("WebGL unavailable, showing the still image.", err);
      }
      window.dispatchEvent(new Event("bq:stage-ready"));
    }, 40);

    function setProgress(p: number) {
      lastP = p;
      speckP = p;
      scene?.setProgress(p);
      words.forEach((w, i) => {
        const t = range(p, 0.02 + i * 0.005, 0.075 + i * 0.005);
        w.style.transform = t ? `translate3d(0, ${-t * 3}rem, 0)` : "";
        w.style.opacity = String(Math.max(0, 1 - t * 1.5));
        if (!reduced) w.style.filter = t ? `blur(${(t * 4).toFixed(1)}px)` : "";
      });
      const r = 1 - range(p, 0.015, 0.06);
      rest.forEach((el) => {
        el.style.opacity = String(r);
        el.style.transform = `translate3d(0, ${(1 - r) * -1}rem, 0)`;
        el.style.pointerEvents = r > 0.5 ? "auto" : "none";
      });
      if (markEl) {
        const m = range(p, 0.02, 0.2);
        markEl.style.transform = `translate3d(0, ${-m * 14}svh, 0) scale(${1 - m * 0.08})`;
        markEl.style.opacity = String(1 - m * 0.75);
      }
      ghosts.forEach(({ win: [a, b, c, d], g }) => g.update(range(p, a, b), range(p, c, d)));
      timed.forEach(({ el, win: [a, b, c, d] }) => {
        const v = range(p, a, b) * (1 - range(p, c, d));
        el.style.opacity = String(v);
        el.style.setProperty("--at", v.toFixed(3));
        el.style.pointerEvents = v > 0.5 ? "auto" : "none";
        el.toggleAttribute("inert", v < 0.5);
      });
    }

    const st = ScrollTrigger.create({
      trigger: stage,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setProgress(self.progress),
      onToggle: (self) => {
        active = self.isActive;
        if (self.isActive) {
          scene?.start();
          if (!speckRaf && speckList.length) speckRaf = requestAnimationFrame(speckLoop);
        } else {
          scene?.stop();
          cancelAnimationFrame(speckRaf);
          speckRaf = 0;
        }
      },
    });
    setProgress(st.progress || 0);
    if (particles) {
      seedSpecks();
      if (speckList.length) speckRaf = requestAnimationFrame(speckLoop);
    }

    const onPointer = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse" || reduced) return;
      scene?.setPointer((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
    };
    const onResize = () => {
      scene?.resize();
      seedSpecks();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.clearTimeout(boot);
      st.kill();
      cancelAnimationFrame(speckRaf);
      ghosts.forEach(({ g }) => g.destroy());
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, [sceneId, paramsKey, ground, particles]);

  return (
    <section
      ref={ref}
      className="v3-stage"
      data-ground={ground}
      data-nav={ground}
      aria-label={label}
      style={{ ["--stage-h" as string]: `${height}svh`, ["--stage-h-phone" as string]: `${heightPhone}svh` }}
    >
      <div className="v3-stage__sticky v3-grain">
        <div className="v3-stage__grid" aria-hidden="true" />
        {mark && (
          <p className="v3-stage__mark" aria-hidden="true">
            {mark}
          </p>
        )}
        {particles && <canvas className="v3-stage__specks" aria-hidden="true" />}
        {fallback && (
          <div className="v3-stage__fallback" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fallback} alt="" crossOrigin="anonymous" />
          </div>
        )}
        <canvas className="v3-stage__gl" aria-hidden="true" />
        <div className="v3-stage__floor" aria-hidden="true" />
        {children}
      </div>
    </section>
  );
}
