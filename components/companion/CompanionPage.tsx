import Link from "next/link";
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

/*
 * NOT SERVED. /theeditcompanion renders components/v3/pages/CompanionV3.tsx (owner's v2 copy,
 * 20 Oct 2026). This is the earlier page, kept only because tests/companion/page.test.tsx and
 * tests/companion-e2e/07-consent-text.test.tsx assert its copy, FAQ and consent wiring. It had
 * the paper styling; that was removed on 27 Oct 2026 with the paper system, so it is bare
 * markup now. Do not route to it and do not style it; port the tests to CompanionV3 instead.
 */

/* Small, server-only building blocks. No client JS on this page except the checkout form. */

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <div>
      {lines.map((l) => (
        <p key={l}>
          {l}
        </p>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3>{children}</h3>;
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
      <section aria-labelledby="hero-h">
        <div>
          <p>
            TheEditCompanion by BigQuiv Digitals
          </p>
          <h1
            id="hero-h"
          >
            {HERO.h1}
          </h1>
          <div>
            <p>{HERO.promise1}</p>
            <p>{HERO.promise2}</p>
          </div>
          <div>
            <a href="#order">
              <LiveText kind="buyLabel" />
            </a>
            <a href="#how">
              {HERO.seeHow}
            </a>
          </div>
          <p>
            <LiveText kind="heroLine" />
          </p>
          <p>{SUPPORT_LINE}</p>
        </div>
      </section>

      {/* 2. Problems */}
      <section aria-labelledby="problems-h">
        <h2 id="problems-h">{PROBLEMS.heading}</h2>
        <div>
          {PROBLEMS.items.map((p) => (
            <div key={p.title}>
              <h3>{p.title}</h3>
              <Lines lines={p.lines} />
            </div>
          ))}
        </div>
        <div>
          {PROBLEMS.closing.map((l) => (
            <p key={l}>
              {l}
            </p>
          ))}
        </div>
      </section>

      {/* 3. What it is */}
      <section aria-labelledby="what-h">
        <h2 id="what-h">{WHAT_IT_IS.heading}</h2>
        <Lines lines={WHAT_IT_IS.lines} />
      </section>

      {/* 4. How it works */}
      <section id="how" aria-labelledby="how-h">
        <h2 id="how-h">{HOW.heading}</h2>
        <ol>
          {HOW.steps.map(([name, text], i) => (
            <li key={name}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <p>{name}</p>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div>
          <Lines lines={[HOW.stopsIntro]} />
          <div>
            {HOW.stops.map(([name, text]) => (
              <div key={name}>
                <H3>{name}</H3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2>
            {HOW.scriptHeading}
          </h2>
          <Bullets items={HOW.scriptLines} />
        </div>
      </section>

      {/* 5. What is inside */}
      <section aria-labelledby="inside-h">
        <h2 id="inside-h">{INSIDE.heading}</h2>
        <Bullets items={INSIDE.items} />

        <div>
          {[INSIDE.installer, INSIDE.doctor, INSIDE.rescue, INSIDE.reconstruct].map((b) => (
            <div key={b.title}>
              <H3>{b.title}</H3>
              <Lines lines={b.lines} />
            </div>
          ))}
        </div>

        <div>
          <div>
            <h2>
              {INSIDE.ratioHeading}
            </h2>
            <Lines lines={INSIDE.ratioLines} />
            <Bullets items={INSIDE.ratios} />
          </div>
          <div>
            <h2>
              {INSIDE.aeHeading}
            </h2>
            <Lines lines={INSIDE.aeLines} />
          </div>
        </div>
        <Lines lines={[INSIDE.extras]} />
      </section>

      {/* 6. Roles */}
      <section aria-labelledby="roles-h">
        <h2 id="roles-h">{ROLES.heading}</h2>
        <div>
          <div>
            <H3>{ROLES.youTitle}</H3>
            <Bullets items={ROLES.you} />
          </div>
          <div>
            <H3>{ROLES.claudeTitle}</H3>
            <Bullets items={ROLES.claude} />
          </div>
        </div>
      </section>

      {/* 7. Fit */}
      <section aria-labelledby="fit-h">
        <h2 id="fit-h">{FIT.heading}</h2>
        <div>
          <div>
            <H3>{FIT.forTitle}</H3>
            <Bullets items={FIT.for} />
          </div>
          <div>
            <H3>{FIT.notTitle}</H3>
            <Bullets items={FIT.not} />
          </div>
        </div>
      </section>

      {/* 8. Honest limits (above the price block, as the SEO file requires) */}
      <section aria-labelledby="limits-h">
        <h2 id="limits-h">{LIMITS.heading}</h2>
        <Bullets items={LIMITS.items} />
      </section>

      {/* 9. Requirements */}
      <section aria-labelledby="req-h">
        <h2 id="req-h">{REQUIREMENTS.heading}</h2>
        <div>
          <H3>{REQUIREMENTS.statusTitle}</H3>
          <p>{INSTALL_STATUS}</p>
          <p>{REQUIREMENTS.help}</p>
        </div>
        <div>
          <div>
            <H3>{REQUIREMENTS.onYourComputer}</H3>
            <Bullets items={REQUIREMENTS.list} />
          </div>
          <div>
            <H3>{REQUIREMENTS.optionalTitle}</H3>
            <Bullets items={REQUIREMENTS.optional} />
          </div>
        </div>
        <Lines lines={[REQUIREMENTS.notIncluded]} />
      </section>

      {/* 10. Price */}
      <section aria-labelledby="price-h">
        <h2 id="price-h">{PRICE.heading}</h2>
        <LivePriceBlock product={PRICE.product} />

        <div>
          <H3>{PRICE.coversTitle}</H3>
          <Bullets items={PRICE.covers} />
          <Lines lines={[PRICE.supportNote]} />
        </div>
        <div>
          <a href="#order">
            <LiveText kind="buyLabel" />
          </a>
          <p>{SUPPORT_LINE}</p>
        </div>
      </section>

      {/* 11. How to buy + checkout */}
      <section id="order" aria-labelledby="buy-h">
        <h2 id="buy-h">{HOW_TO_BUY.heading}</h2>
        <ol>
          {HOW_TO_BUY.steps.map(([a, b]) => (
            <li key={a}>
              <span>{a}</span> {b}
            </li>
          ))}
        </ol>

        <div>
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
      </section>

      {/* 12. After paying */}
      <section aria-labelledby="after-h">
        <h2 id="after-h">{AFTER.heading}</h2>
        <Bullets items={AFTER.items} />
        <div>
          <H3>{AFTER.contactsTitle}</H3>
          <ContactList />
          <p>
            <Link href="/contact">
              Contact BigQuiv Digitals
            </Link>
          </p>
          <p>{SUPPORT_LINE}</p>
        </div>
      </section>

      {/* 13. FAQ. One array feeds this list AND the FAQPage JSON-LD. */}
      <section aria-labelledby="faq-h">
        <h2 id="faq-h">Questions people ask</h2>
        <div data-faq-list>
          {FAQ.map((f) => (
            <details key={f.question}>
              <summary>
                <span data-faq-q>{f.question}</span>
                <span aria-hidden="true">
                  +
                </span>
              </summary>
              <div>
                <p data-faq-a>
                  {f.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* 14. Optional expertise block. Hidden by default (owner decision). */}
      {FLAGS.expertiseBlock ? (
        <section aria-labelledby="expertise-h">
          <h2 id="expertise-h">{EXPERTISE.heading}</h2>
          <Lines lines={EXPERTISE.lines} />
          <p>{EXPERTISE.signed}</p>
        </section>
      ) : null}

      {/* 15. Proof slot. Hidden by default. Nothing is written for it yet, so even with the flag
          on it renders nothing until the owner files the video, the plan and the colour note. */}

      {/* 16. Credits */}
      <section aria-labelledby="credits-h">
        <h2 id="credits-h">{CREDITS.heading}</h2>
        <Lines lines={[CREDITS.intro]} />
        <Bullets items={CREDITS.items} />
        <Lines lines={[CREDITS.thirdParty, CREDITS.notAffiliated]} />
        <nav aria-label="Legal">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
      </section>
    </PriceProvider>
  );
}
