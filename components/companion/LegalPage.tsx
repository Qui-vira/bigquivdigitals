import Link from "next/link";
import { ContactList } from "./ContactList";
import { LEGAL_LINKS } from "./content";

export type LegalSection = { id?: string; heading: string; paragraphs: readonly string[]; bullets?: readonly string[] };

function slug(s: LegalSection) {
  return s.id ?? s.heading.replace(/\W+/g, "-").toLowerCase();
}

/**
 * Shared shell for the Terms, Privacy and Licence pages. Plain words, marked as a draft at the
 * top. One H1 per page. Server component, no JS. Styled by components/v3/pages/legal.css,
 * inside the page's `.v3 .v3-legal` wrapper.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: readonly LegalSection[];
}) {
  return (
    <section className="v3-legal__page" aria-labelledby="legal-h">
      <div className="v3-legal__inner">
        <p role="note" className="v3-legal__note">
          Draft, not reviewed by a lawyer
        </p>
        <h1 id="legal-h" className="v3-legal__title">
          {title}
        </h1>
        <p className="v3-legal__updated">Last updated {updated}</p>
        <p className="v3-legal__intro">{intro}</p>

        <div className="v3-legal__sections">
          {sections.map((s) => (
            <section key={s.heading} id={s.id} aria-labelledby={`${slug(s)}-h`} className="v3-legal__section">
              <h2 id={`${slug(s)}-h`} className="v3-legal__h2">
                {s.heading}
              </h2>
              <div className="v3-legal__body">
                {s.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {s.bullets ? (
                <ul className="v3-legal__bullets">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="v3-legal__contact">
          <h2 className="v3-legal__h2">Contact</h2>
          <div className="v3-contacts">
            <ContactList />
          </div>
          <nav aria-label="Legal" className="v3-legal__nav">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="v3-legal__link">
                {l.label}
              </Link>
            ))}
            <Link href="/theeditcompanion" className="v3-legal__link">
              TheEditCompanion
            </Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
