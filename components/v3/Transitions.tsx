"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Page transition (#47), after Adewura's "visit flood": clicking a link marked
 * data-flood floods the screen in navy from the click point (0.6 s), then the
 * next page opens and the flood fades away as its stage rises in.
 * Plain links, new tabs, modified clicks and reduced motion navigate normally.
 */
export function Transitions() {
  const router = useRouter();
  const pathname = usePathname();
  const layer = useRef<HTMLDivElement>(null);
  const flooding = useRef(false);

  // the new page is in: let the flood go
  useEffect(() => {
    const el = layer.current;
    if (!el || !flooding.current) return;
    flooding.current = false;
    window.requestAnimationFrame(() => {
      el.classList.add("is-leaving");
      window.setTimeout(() => {
        el.classList.remove("is-on", "is-leaving");
        el.style.clipPath = "";
      }, 450);
    });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[data-flood]");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const el = layer.current;
      if (!el) return;
      e.preventDefault();
      flooding.current = true;
      el.style.setProperty("--fx", `${e.clientX}px`);
      el.style.setProperty("--fy", `${e.clientY}px`);
      el.classList.add("is-on");
      window.setTimeout(() => router.push(url.pathname + url.search + url.hash), 600);
    };
    document.addEventListener("click", onClick);
    // back/forward cache: never come back to a flooded screen
    const onShow = () => layer.current?.classList.remove("is-on", "is-leaving");
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onShow);
    };
  }, [router]);

  return <div ref={layer} className="v3-flood" aria-hidden="true" />;
}
