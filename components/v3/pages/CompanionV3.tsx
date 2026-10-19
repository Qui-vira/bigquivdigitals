import Link from "next/link";
import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT } from "@/lib/companion/consent";
import { CheckoutForm } from "@/components/companion/CheckoutForm";
import { LiveText, PriceProvider, type PriceData } from "@/components/companion/PriceContext";
import { ContactList } from "@/components/companion/ContactList";
import { CompanionJsonLd } from "@/components/companion/JsonLd";
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
} from "@/components/companion/content";
import { FAQ } from "@/components/companion/faq";
import { metaDescription, type PriceView } from "@/components/companion/product";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import { ReelBeforeAfter } from "@/components/v3/ReelBeforeAfter";
import { RunCard } from "@/components/v3/fx/RunCard";
import { CompanionPrice } from "./CompanionPrice";
import "./companion.css";

/**
 * TheEditCompanion, v3 (rebuild approved 19 Oct 2026; comp: Companion.dc.html;
 * motion: MOTION-PLAN.md section 3).
 *
 * This is a restyle of components/companion/CompanionPage.tsx, which stays in
 * place untouched for the checkout session. Same data flow, same section
 * order, same copy (every string comes from components/companion/content.ts
 * and faq.ts), same anchors (#how, #order), same checkout component with the
 * same props, same live price context, same JSON-LD. Only the layout is new.
 *
 * Effects: the product box stage, #7 Before and After, #29 Run Card on the
 * five steps, #30 Prompt Type-In on the rescue command, #25 Price Anchor
 * Stack on the price, #5 checklist on "Your script stays yours".
 */

/** The hero line, with its last sentence marked in gold. The words are HERO.h1. */
function heroLine() {
  const MARK = "There is a better order.";
  const i = HERO.h1.lastIndexOf(MARK);
  return i < 0 ? { lead: HERO.h1, mark: "" } : { lead: HERO.h1.slice(0, i), mark: HERO.h1.slice(i) };
}

function Lines({ lines, className = "" }: { lines: readonly string[]; className?: string }) {
  return (
    <div className={`v3-cpn-lines ${className}`}>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </div>
  );
}

function Bullets({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`v3-cpn-bullets ${className}`}>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

/** The rescue card's first line carries the real command; it types itself in (#30). */
function RescueLine({ line }: { line: string }) {
  const CMD = "/motion-rescue";
  const at = line.indexOf(CMD);
  if (at < 0) return <p>{line}</p>;
  return (
    <p>
      {line.slice(0, at)}
      <code className="v3-cpn-cmd" data-typein>
        {CMD}
      </code>
      {line.slice(at + CMD.length)}
    </p>
  );
}

export function CompanionV3({ view }: { view: PriceView }) {
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
  const { lead, mark } = heroLine();
  const [refLine, planLine, checkLine] = PROBLEMS.closing[1].split(/(?<=\.)\s+/);

  return (
    <PriceProvider data={priceData}>
      <CompanionJsonLd view={view} description={metaDescription(view)} />

      <div className="v3 v3-companion">
        {/* ───────── STAGE: the product box ───────── */}
        <Stage scene="box" ground="navy" height={560} heightPhone={480} mark="COMPANION" fallback="/v3/stills/box.webp" label="TheEditCompanion">
          <div className="v3-intro v3-cpn-intro">
            <h1 id="hero-h" className="v3-intro__line v3-display" data-lift>
              {lead}
              {mark && <span className="mark">{mark}</span>}
            </h1>
            <div className="v3-cpn-intro__rest" data-intro-rest>
              <div className="v3-cpn-intro__promise">
                <p>{HERO.promise1}</p>
                <p>{HERO.promise2}</p>
              </div>
              <div className="v3-intro__actions">
                <a href="#order" className="v3-btn v3-btn--lg">
                  <LiveText kind="buyLabel" /> <Arrow />
                </a>
                <a href="#how" className="v3-link">
                  {HERO.seeHow}
                </a>
              </div>
              <div className="v3-cpn-intro__notes">
                <p>
                  <LiveText kind="heroLine" />
                </p>
                <p>{SUPPORT_LINE}</p>
              </div>
            </div>
          </div>

          {refLine && (
            <h2 className="v3-ghost" data-ghost="0.12,0.17,0.29,0.33" data-side="right">
              {refLine}
            </h2>
          )}
          {planLine && (
            <h2 className="v3-ghost" data-ghost="0.34,0.39,0.51,0.55" data-side="left">
              {planLine}
            </h2>
          )}
          {checkLine && (
            <h2 className="v3-ghost" data-ghost="0.56,0.61,0.73,0.77" data-side="high">
              {checkLine}
            </h2>
          )}
          <div className="v3-endcta v3-cpn-endcta" data-at="0.8,0.85,0.96,1">
            <p className="v3-cpn-endcta__line">
              <LiveText kind="heroLine" />
            </p>
            <a href="#order" className="v3-btn v3-btn--lg">
              <LiveText kind="buyLabel" /> <Arrow />
            </a>
          </div>
        </Stage>

        {/* 2. Problems */}
        <section className="v3-section v3-section--paper" data-nav="cloud" data-panel aria-labelledby="problems-h">
          <div className="v3-wrap">
            <h2 id="problems-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {PROBLEMS.heading}
            </h2>
            <div className="v3-cpn-problems">
              {PROBLEMS.items.map((p) => (
                <div key={p.title} className="v3-cpn-problem" data-fade>
                  <h3 className="v3-h3">{p.title}</h3>
                  <Lines lines={p.lines} />
                </div>
              ))}
            </div>
            <div className="v3-cpn-closing">
              {PROBLEMS.closing.map((l, i) => (
                <p key={l} className={i === 1 ? "is-strong" : undefined}>
                  {l}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* 3. What it is, with the Before and After */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="what-h">
          <div className="v3-wrap v3-cpn-what">
            <div>
              <h2 id="what-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
                {WHAT_IT_IS.heading}
              </h2>
              <Lines lines={WHAT_IT_IS.lines} className="v3-cpn-lines--lede" />
            </div>
            {/* Owner, 19 Oct 2026: the real Day 12 pair from his UGC challenge
                (lib/ugc-challenge.ts), the same seconds on both sides. */}
            <figure className="v3-cpn-ba">
              <ReelBeforeAfter
                before="ugc-d12-before"
                after="ugc-d12-after"
                label="Compare the raw take with the finished video"
              />
              <figcaption>Day 12 of my UGC challenge: the raw take, and the finished reel.</figcaption>
            </figure>
          </div>
        </section>

        {/* 4. How it works: the Run Card, the stops, your script */}
        <section className="v3-section v3-section--paper" id="how" data-nav="cloud" aria-labelledby="how-h">
          <div className="v3-wrap">
            <h2 id="how-h" className="v3-h2 v3-display v3-cpn-h2 v3-cpn-h2--wide" data-split>
              {HOW.heading}
            </h2>
            <RunCard className="v3-cpn-run">
              <div className="v3-cpn-run__bar" aria-hidden="true">
                <i data-run-bar />
              </div>
              <ol className="v3-cpn-run__steps">
                {HOW.steps.map(([name, text], i) => (
                  <li key={name} data-run-step data-state="done">
                    <span className="v3-cpn-run__n">{String(i + 1).padStart(2, "0")}</span>
                    <span className="v3-cpn-run__status" aria-hidden="true" />
                    <h3 className="v3-h3">{name}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </RunCard>

            <p className="v3-cpn-stops-intro" data-fade>
              {HOW.stopsIntro}
            </p>
            <div className="v3-cpn-stops">
              {HOW.stops.map(([name, text]) => (
                <div key={name} className="v3-cpn-stop" data-fade>
                  <h3 className="v3-h3">{name}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>

            <div className="v3-cpn-script">
              <h3 className="v3-display v3-cpn-script__h" data-split>
                {HOW.scriptHeading}
              </h3>
              <ul className="v3-cpn-checks" data-checklist>
                {HOW.scriptLines.map((l) => (
                  <li key={l} data-check>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5. What is inside */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="inside-h">
          <div className="v3-wrap">
            <h2 id="inside-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {INSIDE.heading}
            </h2>
            <Bullets items={INSIDE.items} className="v3-cpn-bullets--two" />

            <div className="v3-cpn-cards">
              {[INSIDE.installer, INSIDE.doctor, INSIDE.rescue, INSIDE.reconstruct].map((b) => (
                <div key={b.title} className="v3-cpn-card" data-fade>
                  <h3 className="v3-h3">{b.title}</h3>
                  <div className="v3-cpn-lines">
                    {b.lines.map((l, i) =>
                      b === INSIDE.rescue && i === 0 ? <RescueLine key={l} line={l} /> : <p key={l}>{l}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="v3-cpn-two">
              <div>
                <h3 className="v3-display v3-cpn-sub">{INSIDE.ratioHeading}</h3>
                <Lines lines={INSIDE.ratioLines} />
                <ul className="v3-cpn-ratios">
                  {INSIDE.ratios.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="v3-display v3-cpn-sub">{INSIDE.aeHeading}</h3>
                <Lines lines={INSIDE.aeLines} />
              </div>
            </div>
            <p className="v3-cpn-extras">{INSIDE.extras}</p>
          </div>
        </section>

        {/* 6. Roles */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="roles-h">
          <div className="v3-wrap">
            <h2 id="roles-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {ROLES.heading}
            </h2>
            <div className="v3-cpn-split">
              <div>
                <h3 className="v3-h3">{ROLES.youTitle}</h3>
                <Bullets items={ROLES.you} />
              </div>
              <div>
                <h3 className="v3-h3">{ROLES.claudeTitle}</h3>
                <Bullets items={ROLES.claude} />
              </div>
            </div>
          </div>
        </section>

        {/* 7. Fit */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="fit-h">
          <div className="v3-wrap">
            <h2 id="fit-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {FIT.heading}
            </h2>
            <div className="v3-cpn-split">
              <div>
                <h3 className="v3-h3">{FIT.forTitle}</h3>
                <Bullets items={FIT.for} />
              </div>
              <div>
                <h3 className="v3-h3">{FIT.notTitle}</h3>
                <Bullets items={FIT.not} className="v3-cpn-bullets--not" />
              </div>
            </div>
          </div>
        </section>

        {/* 8. Honest limits (above the price block, as the SEO file requires) */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="limits-h">
          <div className="v3-wrap v3-cpn-narrow">
            <h2 id="limits-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {LIMITS.heading}
            </h2>
            <ol className="v3-cpn-limits">
              {LIMITS.items.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* 9. Requirements */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="req-h">
          <div className="v3-wrap">
            <h2 id="req-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {REQUIREMENTS.heading}
            </h2>
            <div className="v3-cpn-status">
              <h3 className="v3-h3">{REQUIREMENTS.statusTitle}</h3>
              <p className="v3-cpn-status__line">{INSTALL_STATUS}</p>
              <p>{REQUIREMENTS.help}</p>
            </div>
            <div className="v3-cpn-split">
              <div>
                <h3 className="v3-h3">{REQUIREMENTS.onYourComputer}</h3>
                <Bullets items={REQUIREMENTS.list} />
              </div>
              <div>
                <h3 className="v3-h3">{REQUIREMENTS.optionalTitle}</h3>
                <Bullets items={REQUIREMENTS.optional} />
              </div>
            </div>
            <p className="v3-cpn-extras">{REQUIREMENTS.notIncluded}</p>
          </div>
        </section>

        {/* 10. Price: a navy panel, the anchor stack */}
        <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="price-h">
          <div className="v3-wrap v3-cpn-pricegrid">
            <div>
              <h2 id="price-h" className="v3-display v3-cpn-price-h" data-split>
                {PRICE.heading}
              </h2>
              <CompanionPrice product={PRICE.product} />
            </div>
            <div className="v3-cpn-covers">
              <h3 className="v3-h3">{PRICE.coversTitle}</h3>
              <ul className="v3-cpn-checks v3-cpn-checks--navy" data-checklist>
                {PRICE.covers.map((c) => (
                  <li key={c} data-check>
                    {c}
                  </li>
                ))}
              </ul>
              <p className="v3-cpn-covers__note">{PRICE.supportNote}</p>
              <a href="#order" className="v3-btn v3-btn--lg">
                <LiveText kind="buyLabel" /> <Arrow />
              </a>
              <p className="v3-cpn-covers__support">{SUPPORT_LINE}</p>
            </div>
          </div>
        </section>

        {/* 11. How to buy + checkout */}
        <section className="v3-section v3-section--cloud v3-grain" id="order" data-nav="cloud" aria-labelledby="buy-h">
          <div className="v3-wrap v3-cpn-buy">
            <div>
              <h2 id="buy-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
                {HOW_TO_BUY.heading}
              </h2>
              <ol className="v3-cpn-buysteps">
                {HOW_TO_BUY.steps.map(([a, b], i) => (
                  <li key={a}>
                    <span className="v3-cpn-buysteps__n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{a}</strong> {b}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="v3-checkout">
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
          </div>
        </section>

        {/* 12. After paying */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="after-h">
          <div className="v3-wrap v3-cpn-after">
            <div>
              <h2 id="after-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
                {AFTER.heading}
              </h2>
              <Bullets items={AFTER.items} />
            </div>
            <div className="v3-cpn-support">
              <h3 className="v3-h3">{AFTER.contactsTitle}</h3>
              <div className="v3-contacts">
                <ContactList />
              </div>
              <Link href="/contact" className="v3-link">
                Contact BigQuiv Digitals
              </Link>
              <p className="v3-cpn-support__line">{SUPPORT_LINE}</p>
            </div>
          </div>
        </section>

        {/* 13. FAQ. One array feeds this list AND the FAQPage JSON-LD. */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="faq-h">
          <div className="v3-wrap v3-cpn-narrow">
            <h2 id="faq-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              Questions people ask
            </h2>
            <div className="v3-faq" data-faq-list>
              {FAQ.map((f) => (
                <details key={f.question}>
                  <summary>
                    <span data-faq-q>{f.question}</span>
                    <span className="v3-faq__icon" aria-hidden="true" />
                  </summary>
                  <p data-faq-a>{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 14. Optional expertise block. Hidden by default (owner decision). */}
        {FLAGS.expertiseBlock ? (
          <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="expertise-h">
            <div className="v3-wrap v3-cpn-narrow">
              <h2 id="expertise-h" className="v3-h2 v3-display v3-cpn-h2">
                {EXPERTISE.heading}
              </h2>
              <Lines lines={EXPERTISE.lines} />
              <p className="v3-cpn-signed">{EXPERTISE.signed}</p>
            </div>
          </section>
        ) : null}

        {/* 15. Proof slot. Hidden by default; nothing is written for it yet. */}

        {/* 16. Credits */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="credits-h">
          <div className="v3-wrap v3-cpn-narrow">
            <h2 id="credits-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              {CREDITS.heading}
            </h2>
            <p className="v3-cpn-credits__intro">{CREDITS.intro}</p>
            <ul className="v3-cpn-credits">
              {CREDITS.items.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Lines lines={[CREDITS.thirdParty, CREDITS.notAffiliated]} className="v3-cpn-lines--small" />
            <nav aria-label="Legal" className="v3-cpn-legal">
              {LEGAL_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="v3-link">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </div>
    </PriceProvider>
  );
}
