import Link from "next/link";
import { BrutalButton, BrutalFrame, PaperSection, SectionHead } from "@/components/ui-paper";
import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT } from "@/lib/companion/consent";
import { CheckoutForm } from "./CheckoutForm";
import { LiveText, LivePriceBlock, PriceProvider, type PriceData } from "./PriceContext";
import { ContactList } from "./ContactList";
import { CompanionJsonLd } from "./JsonLd";
import {
  AFTER,
  CHECKOUT,
  CREDITS,
  EXPERTISE,
  FIT,
  FLAGS,
  HERO,
  HOW,
  HOW_TO_BUY,
  INSIDE,
  INSTALL_STATUS,
  LEGAL_LINKS,
  LIMITS,
  PRICE,
  PROBLEMS,
  REQUIREMENTS,
  ROLES,
  SUPPORT_LINE,
  WHAT_IT_IS,
} from "./content";
import { FAQ } from "./faq";
import { metaDescription, type PriceView } from "./product";

/* Small, server-only building blocks. No client JS on this page except the checkout form. */

function Lines({ lines, className = "" }: { lines: readonly string[]; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {lines.map((l) => (
        <p key={l} className="max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
          {l}
        </p>
      ))}
    </div>
  );
}

function Bullets({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-[17px] leading-relaxed text-ink-soft">
          <span aria-hidden="true" className="mt-[0.55em] h-2.5 w-2.5 shrink-0 border-2 border-ink bg-gold" />
          <span className="min-w-0 max-w-[68ch]">{i}</span>
        </li>
      ))}
    </ul>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[22px] font-bold leading-tight text-ink">{children}</h3>;
}

export type CompanionPageProps = { view: PriceView };

export function CompanionPage({ view }: CompanionPageProps) {
  const usdRef =
    view.usdFounders && view.usdRegular
      ? `For international buyers, the reference price is ${view.usdFounders} founders price, then ${view.usdRegular}. You pay in naira.`
      : null;

  const priceData: PriceData = {
    ssrTier: view.tier,
    endsAtIso: view.endsAtIso,
    foundersAmount: view.foundersAmount,
    regularAmount: view.regularAmount,
    foundersUntilLine: view.foundersUntilLine,
    usdRef,
  };

  return (
    <PriceProvider data={priceData}>
      <CompanionJsonLd view={view} description={metaDescription(view)} />

      {/* 1. Hero */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="hero-h">
        <div className="max-w-[900px]">
          <p className="mb-4 inline-block border-[3px] border-ink bg-gold px-2 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink">
            TheEditCompanion by BigQuiv Digitals
          </p>
          <h1
            id="hero-h"
            className="font-didone text-[clamp(2.4rem,6vw,4.5rem)] font-semibold leading-[1] tracking-[-0.005em] text-ink text-balance"
          >
            {HERO.h1}
          </h1>
          <div className="mt-6 space-y-2">
            <p className="max-w-[60ch] text-[19px] leading-relaxed text-ink">{HERO.promise1}</p>
            <p className="max-w-[60ch] text-[19px] leading-relaxed text-ink">{HERO.promise2}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <BrutalButton href="#order" size="lg" className="whitespace-normal! text-center">
              <LiveText kind="buyLabel" />
            </BrutalButton>
            <a href="#how" className="paper-link text-[16px] font-semibold text-ink">
              {HERO.seeHow}
            </a>
          </div>
          <p className="mt-4 text-[15px] text-ink-soft">
            <LiveText kind="heroLine" />
          </p>
          <p className="mt-1 text-[15px] text-ink-soft">{SUPPORT_LINE}</p>
        </div>
      </PaperSection>

      {/* 2. Problems */}
      <PaperSection ground="paper" aria-labelledby="problems-h">
        <SectionHead id="problems-h" title={PROBLEMS.heading} size="md" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROBLEMS.items.map((p) => (
            <BrutalFrame key={p.title} shadow="sm" className="p-6">
              <h3 className="font-display text-[19px] font-bold leading-snug text-ink">{p.title}</h3>
              <Lines lines={p.lines} className="mt-3" />
            </BrutalFrame>
          ))}
        </div>
        <div className="mt-8 space-y-1">
          {PROBLEMS.closing.map((l) => (
            <p key={l} className="font-display text-[20px] font-bold text-ink">
              {l}
            </p>
          ))}
        </div>
      </PaperSection>

      {/* 3. What it is */}
      <PaperSection ground="alt" width="mid" aria-labelledby="what-h">
        <SectionHead id="what-h" title={WHAT_IT_IS.heading} size="md" />
        <Lines lines={WHAT_IT_IS.lines} className="mt-8" />
      </PaperSection>

      {/* 4. How it works */}
      <PaperSection ground="paper" id="how" aria-labelledby="how-h">
        <SectionHead id="how-h" title={HOW.heading} size="md" />
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {HOW.steps.map(([name, text], i) => (
            <li key={name} className="border-[3px] border-ink bg-paper p-4 shadow-brutal-sm">
              <span className="font-typewriter text-[13px] font-bold text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-1 font-display text-[19px] font-bold text-ink">{name}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14">
          <Lines lines={[HOW.stopsIntro]} />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {HOW.stops.map(([name, text]) => (
              <BrutalFrame key={name} tone="tint" shadow="sm" className="p-5">
                <H3>{name}</H3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink">{text}</p>
              </BrutalFrame>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-didone text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
            {HOW.scriptHeading}
          </h2>
          <Bullets items={HOW.scriptLines} className="mt-6" />
        </div>
      </PaperSection>

      {/* 5. What is inside */}
      <PaperSection ground="grid" aria-labelledby="inside-h">
        <SectionHead id="inside-h" title={INSIDE.heading} size="md" />
        <Bullets items={INSIDE.items} className="mt-8" />

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[INSIDE.installer, INSIDE.doctor, INSIDE.rescue, INSIDE.reconstruct].map((b) => (
            <BrutalFrame key={b.title} shadow="sm" className="p-6">
              <H3>{b.title}</H3>
              <Lines lines={b.lines} className="mt-3" />
            </BrutalFrame>
          ))}
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-didone text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
              {INSIDE.ratioHeading}
            </h2>
            <Lines lines={INSIDE.ratioLines} className="mt-4" />
            <Bullets items={INSIDE.ratios} className="mt-4" />
          </div>
          <div>
            <h2 className="font-didone text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight text-ink">
              {INSIDE.aeHeading}
            </h2>
            <Lines lines={INSIDE.aeLines} className="mt-4" />
          </div>
        </div>
        <Lines lines={[INSIDE.extras]} className="mt-10" />
      </PaperSection>

      {/* 6. Roles */}
      <PaperSection ground="paper" aria-labelledby="roles-h">
        <SectionHead id="roles-h" title={ROLES.heading} size="md" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <BrutalFrame shadow="sm" className="p-6">
            <H3>{ROLES.youTitle}</H3>
            <Bullets items={ROLES.you} className="mt-4" />
          </BrutalFrame>
          <BrutalFrame shadow="sm" className="p-6">
            <H3>{ROLES.claudeTitle}</H3>
            <Bullets items={ROLES.claude} className="mt-4" />
          </BrutalFrame>
        </div>
      </PaperSection>

      {/* 7. Fit */}
      <PaperSection ground="alt" aria-labelledby="fit-h">
        <SectionHead id="fit-h" title={FIT.heading} size="md" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <BrutalFrame shadow="sm" className="p-6">
            <H3>{FIT.forTitle}</H3>
            <Bullets items={FIT.for} className="mt-4" />
          </BrutalFrame>
          <BrutalFrame shadow="sm" className="p-6">
            <H3>{FIT.notTitle}</H3>
            <Bullets items={FIT.not} className="mt-4" />
          </BrutalFrame>
        </div>
      </PaperSection>

      {/* 8. Honest limits (above the price block, as the SEO file requires) */}
      <PaperSection ground="paper" width="mid" aria-labelledby="limits-h">
        <SectionHead id="limits-h" title={LIMITS.heading} size="md" />
        <Bullets items={LIMITS.items} className="mt-8" />
      </PaperSection>

      {/* 9. Requirements */}
      <PaperSection ground="grid" aria-labelledby="req-h">
        <SectionHead id="req-h" title={REQUIREMENTS.heading} size="md" />
        <BrutalFrame tone="tint" shadow="sm" className="mt-8 p-6">
          <H3>{REQUIREMENTS.statusTitle}</H3>
          <p className="mt-2 text-[17px] font-semibold leading-relaxed text-ink">{INSTALL_STATUS}</p>
          <p className="mt-3 max-w-[68ch] text-[16px] leading-relaxed text-ink">{REQUIREMENTS.help}</p>
        </BrutalFrame>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <H3>{REQUIREMENTS.onYourComputer}</H3>
            <Bullets items={REQUIREMENTS.list} className="mt-4" />
          </div>
          <div>
            <H3>{REQUIREMENTS.optionalTitle}</H3>
            <Bullets items={REQUIREMENTS.optional} className="mt-4" />
          </div>
        </div>
        <Lines lines={[REQUIREMENTS.notIncluded]} className="mt-8" />
      </PaperSection>

      {/* 10. Price */}
      <PaperSection ground="paper" width="mid" aria-labelledby="price-h">
        <SectionHead id="price-h" title={PRICE.heading} size="md" />
        <LivePriceBlock product={PRICE.product} />

        <div className="mt-8">
          <H3>{PRICE.coversTitle}</H3>
          <Bullets items={PRICE.covers} className="mt-4" />
          <Lines lines={[PRICE.supportNote]} className="mt-4" />
        </div>
        <div className="mt-8">
          <BrutalButton href="#order" size="lg" className="whitespace-normal! text-center">
            <LiveText kind="buyLabel" />
          </BrutalButton>
          <p className="mt-4 text-[17px] font-semibold text-ink">{SUPPORT_LINE}</p>
        </div>
      </PaperSection>

      {/* 11. How to buy + checkout */}
      <PaperSection ground="alt" width="mid" id="order" aria-labelledby="buy-h">
        <SectionHead id="buy-h" title={HOW_TO_BUY.heading} size="md" />
        <ol className="mt-8 space-y-3">
          {HOW_TO_BUY.steps.map(([a, b]) => (
            <li key={a} className="text-[17px] leading-relaxed text-ink-soft">
              <span className="font-bold text-ink">{a}</span> {b}
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <CheckoutForm
            productName={PRICE.product}
            active={view.active}
            finalText={CONSENT_FINAL_TEXT}
            immediateText={CONSENT_IMMEDIATE_TEXT}
            copy={{ ...CHECKOUT }}
            legalLinks={[...LEGAL_LINKS]}
            supportLine={SUPPORT_LINE}
          />
        </div>
      </PaperSection>

      {/* 12. After paying */}
      <PaperSection ground="paper" width="mid" aria-labelledby="after-h">
        <SectionHead id="after-h" title={AFTER.heading} size="md" />
        <Bullets items={AFTER.items} className="mt-8" />
        <div className="mt-10">
          <H3>{AFTER.contactsTitle}</H3>
          <ContactList className="mt-4" />
          <p className="mt-4 text-[16px]">
            <Link href="/contact" className="paper-link font-semibold text-ink">
              Contact BigQuiv Digitals
            </Link>
          </p>
          <p className="mt-6 text-[17px] font-semibold text-ink">{SUPPORT_LINE}</p>
        </div>
      </PaperSection>

      {/* 13. FAQ. One array feeds this list AND the FAQPage JSON-LD. */}
      <PaperSection ground="grid" width="mid" aria-labelledby="faq-h">
        <SectionHead id="faq-h" title="Questions people ask" size="md" />
        <div className="mt-8 space-y-3" data-faq-list>
          {FAQ.map((f) => (
            <details key={f.question} className="group border-[3px] border-ink bg-paper shadow-brutal-sm">
              <summary className="paper-focus flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-display text-[18px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                <span data-faq-q>{f.question}</span>
                <span aria-hidden="true" className="shrink-0 font-typewriter text-xl group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t-[3px] border-ink px-5 py-4">
                <p data-faq-a className="max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
                  {f.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </PaperSection>

      {/* 14. Optional expertise block. Hidden by default (owner decision). */}
      {FLAGS.expertiseBlock ? (
        <PaperSection ground="paper" width="mid" aria-labelledby="expertise-h">
          <SectionHead id="expertise-h" title={EXPERTISE.heading} size="md" />
          <Lines lines={EXPERTISE.lines} className="mt-8" />
          <p className="mt-4 font-semibold text-ink">{EXPERTISE.signed}</p>
        </PaperSection>
      ) : null}

      {/* 15. Proof slot. Hidden by default. Nothing is written for it yet, so even with the flag
          on it renders nothing until the owner files the video, the plan and the colour note. */}

      {/* 16. Credits */}
      <PaperSection ground="alt" width="mid" aria-labelledby="credits-h">
        <SectionHead id="credits-h" title={CREDITS.heading} size="md" />
        <Lines lines={[CREDITS.intro]} className="mt-8" />
        <Bullets items={CREDITS.items} className="mt-4" />
        <Lines lines={[CREDITS.thirdParty, CREDITS.notAffiliated]} className="mt-6" />
        <nav aria-label="Legal" className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="paper-link font-semibold text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
      </PaperSection>
    </PriceProvider>
  );
}
