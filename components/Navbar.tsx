"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./Button";

const links = [
  { href: "/services", label: "Services" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/contact", label: "Contact" },
];

function NavLink({ href, label, isActive }: { href: string; label: string; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      className={`relative text-sm font-medium tracking-wide transition-colors hover:text-text-primary ${
        isActive ? "text-text-primary" : "text-text-secondary"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
      <motion.div
        className="absolute -bottom-1 left-0 h-[2px] w-full bg-accent"
        initial={false}
        animate={{ scaleX: hovered || isActive ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0.5 }}
      />
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-bg-primary/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold text-white">
          <motion.span
            className="inline-block"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            BigQuiv Digitals
          </motion.span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </div>

        <div className="hidden md:block">
          <Button href="https://calendly.com/_quivira/one-on-one-meeting" showArrow={false}>
            Book a Call
          </Button>
        </div>

        {/* Mobile hamburger */}
        {/*
          A screen reader previously announced this as an unnamed button and
          never reported whether the menu was open — WCAG 4.1.2 (Name, Role,
          Value), Level A. `aria-label` names it, `aria-expanded` reports state,
          and `aria-controls` ties it to the overlay it opens.

          The icon was 24x24, which technically clears WCAG 2.5.8 (AA) and fails
          Apple's 44pt guidance. `-m-2.5 p-2.5` grows the tap target to 44x44
          without moving the icon a pixel: the padding is cancelled by an equal
          negative margin, so layout is unchanged.
        */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className="-m-2.5 p-2.5 text-white md:hidden cursor-pointer"
        >
          {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div id="mobile-menu" className="fixed inset-0 top-16 z-40 bg-bg-primary/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col items-center gap-8 pt-12">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-medium transition-colors hover:text-text-primary ${
                  pathname === link.href ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button href="https://calendly.com/_quivira/one-on-one-meeting" showArrow={false}>
              Book a Call
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
