"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Arrow } from "@/components/v3/Arrow";

const links = [
  { href: "/services", label: "Services" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Work" },
  { href: "/ugc", label: "UGC" },
  { href: "/theeditcompanion", label: "Companion" },
  { href: "/contact", label: "Contact" },
];

const CALENDLY = "https://calendly.com/_quivira/one-on-one-meeting";

/** Detail routes that belong to a nav section: a case study is Work, a doc is Articles. */
const SECTION_ALIASES: Record<string, string[]> = {
  "/portfolio": ["/work"],
  "/articles": ["/doc"],
};

function isActive(pathname: string, href: string) {
  return [href, ...(SECTION_ALIASES[href] ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * The v3 navbar. It takes the colour of the section under it: bone type with
 * no bar over a navy section (`data-nav="navy"`), a frosted cloud bar with navy
 * type over everything else. Over navy it turns into a frosted navy bar once
 * the page has scrolled, so links never sit over moving content unframed.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [theme, setTheme] = useState<{ on: "navy" | "light"; solid: boolean }>(() => ({ on: pathname === "/" ? "navy" : "light", solid: false }));
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Theme follows the section under the bar's midline.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = header.offsetHeight / 2;
      const under = [...document.querySelectorAll<HTMLElement>("[data-nav]")].find((sec) => {
        const r = sec.getBoundingClientRect();
        return r.top <= mid && r.bottom > mid;
      });
      const on: "navy" | "light" = under?.dataset.nav === "navy" ? "navy" : "light";
      const solid = window.scrollY > 24;
      setTheme((t) => (t.on === on && t.solid === solid ? t : { on, solid }));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // The page body streams in after the bar mounts (server data), so re-check
    // whenever the main content changes, not only on scroll.
    const main = document.getElementById("main");
    const mo = main ? new MutationObserver(onScroll) : null;
    if (main && mo) mo.observe(main, { childList: true, subtree: true });
    return () => {
      mo?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // While the menu is open: Escape closes it, the page behind does not scroll,
  // and focus lands on the first link.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    return () => {
      root.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <header ref={headerRef} className={`v3-nav${theme.solid ? " is-solid" : ""}`} data-on={theme.on}>
      <nav aria-label="Main" className="v3-nav__bar">
        <Link href="/" className="v3-wordmark" onClick={() => close()} aria-label="BigQuiv Digitals, home">
          BigQuiv<span className="v3-wordmark__sub">Digitals</span>
          <span className="v3-wordmark__dot" aria-hidden="true">
            .
          </span>
        </Link>

        <ul className="v3-nav__links">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={active ? "page" : undefined} className="v3-nav__link">
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <a href={CALENDLY} className="v3-btn v3-nav__cta">
          Book a call <Arrow />
        </a>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className="v3-nav__toggle"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="v3-sheet">
          <ul>
            {links.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => close()}
                    className="v3-sheet__link"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <a href={CALENDLY} className="v3-btn v3-btn--lg" style={{ marginTop: "2rem", justifyContent: "space-between" }}>
            Book a call <Arrow />
          </a>
        </div>
      )}
    </header>
  );
}
