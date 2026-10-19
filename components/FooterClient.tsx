import Link from "next/link";

const pageLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Work" },
  { href: "/ugc", label: "UGC" },
  { href: "/theeditcompanion", label: "TheEditCompanion" },
  { href: "/contact", label: "Contact" },
  { href: "/my-purchases", label: "My purchases" },
  { href: "/greatwork-waitlist", label: "The Great Work Waitlist" },
  { href: "/aimastery-waitlist", label: "AI Mastery Waitlist" },
];

const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/licence", label: "Licence" },
];

interface FooterClientProps {
  socialLinks: { name: string; href: string }[];
  email: string;
  telegramHandle: string;
  telegramUrl: string;
  calendlyUrl: string;
}

/**
 * The v3 footer: a navy field, the wordmark set big, then pages, social and
 * contact in ruled columns, legal links on the bottom line. Same links and
 * the same data as before (socials, email, Telegram and Calendly come from the
 * settings table through FooterServer). TheEditCompanion, Terms, Privacy and
 * Licence are required while the checkout is live.
 */
export function FooterClient({ socialLinks, email, telegramHandle, telegramUrl, calendlyUrl }: FooterClientProps) {
  return (
    <footer className="v3 v3-footer v3-grain" data-nav="navy">
      <div className="v3-footer__inner">
        <div className="v3-footer__grid">
          <div>
            <Link href="/" className="v3-footer__mark">
              BigQuiv Digitals<span className="v3-wordmark__dot">.</span>
            </Link>
            <p className="v3-footer__line">
              Growth systems that turn attention into revenue. Website, AI content, community, strategy and reporting, built as one.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="v3-footer__head">Pages</h2>
            <ul className="v3-footer__list">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="v3-footer__head">Social</h2>
            <ul className="v3-footer__list">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="v3-footer__head">Contact</h2>
            <ul className="v3-footer__list">
              <li>
                <a href={`mailto:${email}`} className="v3-footer__email">
                  {email}
                </a>
              </li>
              <li>
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  Telegram: {telegramHandle}
                </a>
              </li>
              <li>
                <a href={calendlyUrl} target="_blank" rel="noopener noreferrer">
                  Book a Call
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="v3-footer__bottom">
          <p>&copy; {new Date().getFullYear()} BigQuiv Digitals. All rights reserved.</p>
          <ul className="v3-footer__legal">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <a href="#top">back to top</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
