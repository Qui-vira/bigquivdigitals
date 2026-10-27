"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { SmoothScroll } from "./v3/SmoothScroll";
import { Motion } from "./v3/Motion";
import { Cursor } from "./v3/Cursor";
import { Transitions } from "./v3/Transitions";
import { Opener } from "./v3/Opener";
import { useEffect } from "react";

/**
 * Public chrome. The admin area keeps its own shell and never renders these.
 *
 * The skip link is the first focusable element on every public page: a
 * keyboard user can jump past the navbar straight to <main id="main">. It is
 * off-screen until focused, then appears as an ink-framed tag over the bar.
 */
export function PublicNavbar() {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  // public pages sit on cloud; the admin keeps its own dark shell
  useEffect(() => {
    document.documentElement.classList.toggle("v3-site", !admin);
  }, [admin]);
  if (admin) return null;
  return (
    <>
      <a
        href="#main"
        className="fixed left-3 top-3 z-[60] -translate-y-[200%] rounded-[6px] bg-[var(--v3-gold)] px-4 py-2.5 font-display text-[14px] font-bold text-[var(--v3-ink)] transition-transform duration-150 focus:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar />
      <SmoothScroll />
      <Opener />
      <Motion />
      <Cursor />
      <Transitions />
    </>
  );
}

export function PublicWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
