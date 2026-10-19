"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * Smooth scroll for the public pages, the Adewura way: one Lenis instance
 * driven by the GSAP ticker, feeding ScrollTrigger. Off under reduced motion
 * and on the admin area.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  useEffect(() => {
    if (admin) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    // hold the page still while the opener plays
    const opening = document.documentElement.classList.contains("bq-opening");
    if (opening) lenis.stop();
    const onDone = () => lenis.start();
    window.addEventListener("bq:opener-done", onDone);
    return () => {
      window.removeEventListener("bq:opener-done", onDone);
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [admin]);

  // a new page starts at the top, and ScrollTrigger re-measures it
  useEffect(() => {
    if (admin) return;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.scrollTo(0, { immediate: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, admin]);

  return null;
}
