"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrutalButton } from "@/components/ui-paper/BrutalButton";
import { CheckerStrip } from "@/components/ui-paper/CheckerStrip";
import { Sticker } from "@/components/ui-paper/Sticker";

const links = [
  { href: "/services", label: "Services" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Work" },
  { href: "/contact", label: "Contact" },
];

const CALENDLY = "https://calendly.com/_quivira/one-on-one-meeting";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The paper navbar. A solid white bar with a 3px ink rule under it, on every
 * public page, at every scroll position. It used to switch from transparent to
 * blurred black on a window scroll listener; a solid bar needs no listener at
 * all, and never sits over content with a see-through edge.
 *
 * HeroReveal measures this element's height (it queries `nav, header`), so the
 * hero clears it whatever height it ends up.
 */
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // While the menu is open: Escape closes it, the page behind does not scroll,
  // and focus lands on the first link so a keyboard user starts inside it.
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
    <header className="paper-scope fixed inset-x-0 top-0 z-50 border-b-[3px] border-ink bg-paper text-ink">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-4 sm:px-6 md:h-[72px] lg:px-10"
      >
        <Link
          href="/"
          className="relative font-display text-[1.2rem] font-bold tracking-[-0.01em] text-ink md:text-[1.3rem]"
          onClick={() => close()}
        >
          <span className="paper-link">BigQuiv Digitals</span>
        </Link>

        {/* Desktop links. Typewriter caps; an ink bar under the current page,
            a gold bar that draws in on hover. */}
        <ul className="hidden items-center gap-1 md:flex lg:gap-2">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="group/nl relative inline-flex min-h-[44px] items-center px-2.5 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink lg:px-3"
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-2.5 bottom-2 h-[3px] origin-left transition-transform duration-200 ease-out lg:inset-x-3 ${
                      active ? "scale-x-100 bg-ink" : "scale-x-0 bg-gold group-hover/nl:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:block">
          <BrutalButton href={CALENDLY} size="sm" arrow={false}>
            Book a Call
          </BrutalButton>
        </div>

        {/* Mobile toggle. A 44px square; two bars that cross into an X. */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center border-[3px] border-ink bg-paper shadow-brutal-sm transition-[translate,box-shadow] duration-150 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none md:hidden"
        >
          <span
            aria-hidden="true"
            className={`absolute h-[3px] w-5 bg-ink transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isOpen ? "rotate-45" : "-translate-y-[4px]"
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute h-[3px] w-5 bg-ink transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isOpen ? "-rotate-45" : "translate-y-[4px]"
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu: a sheet of grid paper under the bar. */}
      {isOpen && (
        <div
          id="mobile-menu"
          className="mobile-sheet fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col overflow-y-auto bg-grid-paper md:hidden"
        >
          <ul className="px-4 pt-4 sm:px-6">
            {links.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li
                  key={link.href}
                  className="mobile-sheet-item border-b-[3px] border-ink"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => close()}
                    className="flex min-h-[68px] items-center gap-4 py-3"
                  >
                    <span aria-hidden="true" className="w-7 font-typewriter text-[13px] font-bold text-ink-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={`font-didone text-[2.6rem] font-semibold leading-none text-ink ${active ? "hl-mark" : ""}`}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="relative px-4 pb-14 pt-9 sm:px-6">
            <BrutalButton href={CALENDLY} size="lg" arrow={false} className="w-full">
              Book a Call
            </BrutalButton>
            <Sticker shape="starburst" tone="gold" size={84} tilt={14} reveal={false} className="absolute -top-4 right-5">
              hi
            </Sticker>
          </div>
          <CheckerStrip className="mt-auto shrink-0" />
        </div>
      )}
    </header>
  );
}
