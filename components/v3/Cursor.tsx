"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Desktop cursor (#40) and magnetic buttons (#39). Mouse only: touch screens
 * and reduced motion keep the system cursor and nothing follows anything.
 *
 * A small dot follows the pointer exactly; a ring follows it with a short ease.
 * Over a link or button the ring grows; over an element with
 * data-cursor="View" (or "Play", any short word) the ring fills and shows that
 * word. Colours flip with the section under the pointer: navy on cloud and
 * paper, bone on navy.
 *
 * Buttons (.v3-btn) and anything with data-magnetic lean up to 8px toward the
 * pointer while it is within 80px, then settle back.
 */
export function Cursor() {
  const pathname = usePathname();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    document.documentElement.classList.add("v3-cursor-on");

    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let label = "";
    let mode: "idle" | "link" | "label" | "text" = "idle";
    let raf = 0;
    let magnet: HTMLElement | null = null;

    const tick = () => {
      pos.rx += (pos.x - pos.rx) * 0.2;
      pos.ry += (pos.y - pos.ry) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const setMode = (m: typeof mode, text = "") => {
      if (m === mode && text === label) return;
      mode = m;
      label = text;
      if (ring.current) {
        ring.current.dataset.mode = m;
        ring.current.textContent = m === "label" ? text : "";
      }
      if (dot.current) dot.current.dataset.mode = m;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      const t = e.target as HTMLElement | null;
      const ground = t?.closest<HTMLElement>("[data-nav]")?.dataset.nav;
      document.documentElement.dataset.cursorGround = ground === "navy" ? "navy" : "light";
      const labelled = t?.closest<HTMLElement>("[data-cursor]");
      if (labelled) setMode("label", labelled.dataset.cursor || "");
      else if (t?.closest("input, textarea, select, [contenteditable]")) setMode("text");
      else if (t?.closest("a, button, summary, label, [role='button']")) setMode("link");
      else setMode("idle");

      // magnetic pull
      const m = t?.closest<HTMLElement>(".v3-btn, [data-magnetic]") ?? null;
      if (magnet && magnet !== m) {
        magnet.style.translate = "";
        magnet = null;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const k = 8 / Math.max(r.width / 2 + 80, 1);
        m.style.translate = `${(dx * k).toFixed(1)}px ${(dy * k * 1.4).toFixed(1)}px`;
        magnet = m;
      }
    };
    const onLeave = () => {
      pos.x = pos.y = -100;
      if (magnet) magnet.style.translate = "";
      magnet = null;
    };
    const onDown = () => ring.current?.classList.add("is-down");
    const onUp = () => ring.current?.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.classList.remove("v3-cursor-on");
      if (magnet) magnet.style.translate = "";
    };
  }, [pathname]);

  // Always in the DOM; CSS shows them only while html.v3-cursor-on is set.
  return (
    <>
      <div ref={ring} className="v3-cursor-ring" aria-hidden="true" />
      <div ref={dot} className="v3-cursor-dot" aria-hidden="true" />
    </>
  );
}
