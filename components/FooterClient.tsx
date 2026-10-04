import Link from "next/link";
import { CheckerStrip } from "@/components/ui-paper/CheckerStrip";
import { HandArrow } from "@/components/ui-paper/HandNote";

const pageLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Work" },
  { href: "/contact", label: "Contact" },
  { href: "/greatwork-waitlist", label: "The Great Work Waitlist" },
  { href: "/aimastery-waitlist", label: "AI Mastery Waitlist" },
];

interface FooterClientProps {
  socialLinks: { name: string; href: string }[];
  email: string;
  telegramHandle: string;
  telegramUrl: string;
  calendlyUrl: string;
}

function ColumnHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 inline-block border-[3px] border-ink bg-gold px-2 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink">
      {children}
    </h2>
  );
}

const linkCls = "paper-link text-[15px] text-ink";

/**
 * The paper footer. One ink-framed sheet on grid paper: the wordmark set big in
 * the Didone, then pages, social and contact in ruled columns. Same links and
 * same data as before (socials, email, Telegram and Calendly come from the
 * settings table through FooterServer).
 */
export function FooterClient({ socialLinks, email, telegramHandle, telegramUrl, calendlyUrl }: FooterClientProps) {
  return (
    <footer className="paper-scope relative bg-grid-paper text-ink">
      <CheckerStrip />
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-14 sm:px-6 md:pt-20 lg:px-10">
        <div className="grid border-[3px] border-ink bg-paper shadow-brutal sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_0.8fr_1.05fr]">
          {/* Brand */}
          <div className="border-b-[3px] border-ink p-6 sm:col-span-2 sm:p-8 lg:col-span-1 lg:border-b-0 lg:border-r-[3px]">
            <Link href="/" className="inline-block font-didone text-[clamp(2.9rem,6vw,4.4rem)] font-semibold leading-[0.92] text-ink">
              BigQuiv
              <br />
              Digitals
            </Link>
            <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-ink-soft">
              Growth systems that turn attention into revenue. Website, AI content, community, strategy and reporting, built as one.
            </p>
          </div>

          {/* Pages */}
          <nav aria-label="Footer" className="border-b-[3px] border-ink p-6 sm:border-r-[3px] sm:p-8 lg:border-b-0">
            <ColumnHead>Pages</ColumnHead>
            <ul className="space-y-3">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkCls}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social */}
          <div className="border-b-[3px] border-ink p-6 sm:p-8 lg:border-b-0 lg:border-r-[3px]">
            <ColumnHead>Social</ColumnHead>
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="p-6 sm:col-span-2 sm:p-8 lg:col-span-1">
            <ColumnHead>Contact</ColumnHead>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${email}`} className={`${linkCls} break-all`}>
                  {email}
                </a>
              </li>
              <li>
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Telegram: {telegramHandle}
                </a>
              </li>
              <li>
                <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Book a Call
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <p className="font-typewriter text-[13px] text-ink-soft">
            &copy; {new Date().getFullYear()} BigQuiv Digitals. All rights reserved.
          </p>
          <a href="#top" className="group/top inline-flex items-center gap-1 font-hand text-[1.5rem] font-bold leading-none text-ink">
            <HandArrow kind="up" className="w-7 transition-transform duration-200 ease-out group-hover/top:-translate-y-1" />
            back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
