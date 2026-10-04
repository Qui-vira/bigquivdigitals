"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";

/**
 * Public chrome. The admin area keeps its own shell and never renders these.
 *
 * The skip link is the first focusable element on every public page: a
 * keyboard user can jump past the navbar straight to <main id="main">. It is
 * off-screen until focused, then appears as an ink-framed tag over the bar.
 */
export function PublicNavbar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <a
        href="#main"
        className="paper-focus fixed left-3 top-3 z-[60] -translate-y-[200%] border-[3px] border-ink bg-gold px-3 py-2 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink shadow-brutal-sm transition-transform duration-150 focus:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar />
    </>
  );
}

export function PublicWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
