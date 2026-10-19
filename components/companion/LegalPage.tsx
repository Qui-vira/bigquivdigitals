import Link from "next/link";
import { PaperSection, SectionHead } from "@/components/ui-paper";
import { ContactList } from "./ContactList";
import { LEGAL_LINKS } from "./content";

export type LegalSection = { id?: string; heading: string; paragraphs: readonly string[]; bullets?: readonly string[] };

function slug(s: LegalSection) {
  return s.id ?? s.heading.replace(/\W+/g, "-").toLowerCase();
}

/**
 * Shared shell for the Terms, Privacy and Licence pages. Plain words, marked as a draft at the
 * top. One H1 per page. Server component, no JS.
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
    <PaperSection ground="grid" width="text" pad="lg" aria-labelledby="legal-h">
      <p
        role="note"
        className="mb-6 inline-block border-[3px] border-ink bg-gold px-3 py-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink"
      >
        Draft, not reviewed by a lawyer
      </p>
      <SectionHead as="h1" id="legal-h" title={title} size="md" />
      <p className="mt-4 font-typewriter text-[13px] text-ink-soft">Last updated {updated}</p>
      <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">{intro}</p>

      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.heading} id={s.id} aria-labelledby={`${slug(s)}-h`}>
            <h2 id={`${slug(s)}-h`} className="font-display text-[24px] font-bold leading-tight text-ink">
              {s.heading}
            </h2>
            <div className="mt-3 space-y-3">
              {s.paragraphs.map((p) => (
                <p key={p} className="max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </div>
            {s.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-6">
                {s.bullets.map((b) => (
                  <li key={b} className="max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
                    {b}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-12 border-t-[3px] border-ink pt-8">
        <h2 className="font-display text-[22px] font-bold text-ink">Contact</h2>
        <ContactList className="mt-4" />
        <nav aria-label="Legal" className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="paper-link font-semibold text-ink">
              {l.label}
            </Link>
          ))}
          <Link href="/theeditcompanion" className="paper-link font-semibold text-ink">
            TheEditCompanion
          </Link>
        </nav>
      </div>
    </PaperSection>
  );
}
