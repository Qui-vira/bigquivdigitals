import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT } from "@/lib/companion/consent";
import { CheckoutForm } from "@/components/companion/CheckoutForm";
import { PriceProvider, type PriceData } from "@/components/companion/PriceContext";
import { CompanionJsonLd } from "@/components/companion/JsonLd";
import { CHECKOUT, LEGAL_LINKS, PRICE, SUPPORT_LINE } from "@/components/companion/content";
import {
  V2_CLOSE,
  V2_DIFFERENCE,
  V2_FAQ,
  V2_HERO,
  V2_IDEAS,
  V2_IMAGINE,
  V2_KINDS,
  V2_MEET,
  V2_PRICE,
  V2_STEPS,
} from "@/components/companion/content-v2";
import { metaDescription, type PriceView } from "@/components/companion/product";
import { Arrow } from "@/components/v3/Arrow";
import { ReelBeforeAfter } from "@/components/v3/ReelBeforeAfter";
import { BEFORE_AFTER } from "@/lib/ugc-challenge";
import { BuyLabel, FoundersLine, PriceBlock } from "./CompanionLive";
import "./companion.css";

/**
 * TheEditCompanion sales page, v2 (owner, 20 Oct 2026: "this is the sales copy i
 * want"). Every word is his, from components/companion/content-v2.ts, in his order.
 * Sell the videos, not the machinery: the gates, modules, rescue command, limits
 * and FAQ of v1 are off the page (their copy stays in content.ts and faq.ts for the
 * old CompanionPage and its tests).
 *
 * Order (owner, 20 Oct 2026): desire, results and visual proof, benefits, how it
 * works, price, purchase, then a FAQ for requirements, limits and refunds. The Day 12
 * raw take vs finished reel sits beside the headline; "See the Difference" carries
 * four more real pairs. Prices and
 * the founders date are live (CompanionLive.tsx), and every button goes to the
 * checkout (#order), which is unchanged.
 */

const Order = ({ children }: { children: React.ReactNode }) => (
  <a href="#order" className="v3-btn v3-btn--lg">
    {children} <Arrow />
  </a>
);

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
  const day12 = BEFORE_AFTER.find((p) => p.day === 12);

  return (
    <PriceProvider data={priceData}>
      <CompanionJsonLd view={view} description={metaDescription(view)} faqItems={V2_FAQ} />

      <div className="v3 v3-companion v3-sp">
        {/* 1. Hero: the promise, the buy button, and the finished result beside it */}
        <section className="v3-section v3-section--navy v3-grain v3-sp-hero" data-nav="navy" aria-labelledby="hero-h">
          <div className="v3-wrap v3-sp-hero__grid">
            <div className="v3-sp-hero__copy">
              <h1 id="hero-h" className="v3-display v3-sp-hero__h1" data-split>
                {V2_HERO.h1}
              </h1>
              <p className="v3-sp-hero__sub" data-fade>
                {V2_HERO.sub}
              </p>
              <div className="v3-sp-hero__actions" data-fade>
                <Order>
                  <BuyLabel />
                </Order>
                <p className="v3-sp-hero__price">
                  <FoundersLine />
                </p>
              </div>
            </div>
            {day12 ? (
              <figure className="v3-sp-hero__proof" data-fade>
                <ReelBeforeAfter
                  before={day12.before}
                  after={day12.after}
                  label="Day 12: what I filmed and what Claude made"
                  beforeLabel="What I filmed"
                  afterLabel="What Claude made"
                />
              </figure>
            ) : null}
          </div>
        </section>

        {/* 2. Meet TheEditCompanion */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="meet-h">
          <div className="v3-wrap v3-sp-narrow">
            <div className="v3-sp-lines v3-sp-lines--lede">
              {V2_MEET.lines.map((l) => (
                <p key={l} data-fade>
                  {l}
                </p>
              ))}
            </div>
            <h2 id="meet-h" className="v3-h2 v3-display v3-sp-meet" data-split>
              {V2_MEET.meet}
            </h2>
            <p className="v3-sp-intro" data-fade>
              {V2_MEET.intro}
            </p>
          </div>
        </section>

        {/* 3. Your Ideas Deserve Better Videos */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="ideas-h">
          <div className="v3-wrap v3-sp-narrow">
            <h2 id="ideas-h" className="v3-h2 v3-display" data-split>
              {V2_IDEAS.heading}
            </h2>
            <div className="v3-sp-lines">
              {V2_IDEAS.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            <ul className="v3-sp-pains">
              {V2_IDEAS.pains.map((l) => (
                <li key={l} data-fade>
                  {l}
                </li>
              ))}
            </ul>
            <p className="v3-sp-turn" data-fade>
              {V2_IDEAS.turn}
            </p>
            <p className="v3-sp-answer" data-fade>
              {V2_IDEAS.answer}
            </p>
          </div>
        </section>

        {/* 5. See the Difference for Yourself: four more real pairs */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="diff-h">
          <div className="v3-wrap">
            <h2 id="diff-h" className="v3-h2 v3-display" data-split>
              {V2_DIFFERENCE.heading}
            </h2>
            <p className="v3-sp-sub" data-fade>
              {V2_DIFFERENCE.sub}
            </p>
            <div className="v3-cpn-wall">
              {BEFORE_AFTER.filter((p) => p.day !== 12).map((p) => (
                <figure key={p.day} className="v3-cpn-wall__item" data-fade>
                  <ReelBeforeAfter
                    before={p.before}
                    after={p.after}
                    label={`Day ${p.day}: what I filmed and what Claude made`}
                    beforeLabel="What I filmed"
                    afterLabel="What Claude made"
                  />
                  <figcaption>
                    <span className="v3-cpn-wall__day">Day {p.day}</span> {p.title}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="v3-sp-lines v3-sp-after-wall">
              {V2_DIFFERENCE.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
            <Order>{V2_DIFFERENCE.cta}</Order>
          </div>
        </section>

        {/* 4. Imagine What You Could Create */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="imagine-h">
          <div className="v3-wrap">
            <h2 id="imagine-h" className="v3-h2 v3-display" data-split>
              {V2_IMAGINE.heading}
            </h2>
            <div className="v3-sp-cards">
              {V2_IMAGINE.items.map(([t, d]) => (
                <div key={t} className="v3-sp-card" data-fade>
                  <h3 className="v3-h3">{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Create More Than Just Talking-Head Videos */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="kinds-h">
          <div className="v3-wrap">
            <h2 id="kinds-h" className="v3-h2 v3-display" data-split>
              {V2_KINDS.heading}
            </h2>
            <p className="v3-sp-sub" data-fade>
              {V2_KINDS.sub}
            </p>
            <ul className="v3-sp-kinds">
              {V2_KINDS.items.map(([t, d]) => (
                <li key={t} data-fade>
                  <strong>{t}:</strong> {d}
                </li>
              ))}
            </ul>
            <p className="v3-sp-answer" data-fade>
              {V2_KINDS.close}
            </p>
          </div>
        </section>

        {/* 6. From Inspiration to Finished Video */}
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="steps-h">
          <div className="v3-wrap">
            <h2 id="steps-h" className="v3-h2 v3-display" data-split>
              {V2_STEPS.heading}
            </h2>
            <p className="v3-sp-sub" data-fade>
              {V2_STEPS.sub}
            </p>
            <ol className="v3-sp-steps">
              {V2_STEPS.steps.map(([t, d], i) => (
                <li key={t} data-fade>
                  <span className="v3-sp-steps__n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="v3-h3">{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
            <p className="v3-sp-answer" data-fade>
              {V2_STEPS.close}
            </p>
          </div>
        </section>

        {/* 9. Price */}
        <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="price-h">
          <div className="v3-wrap v3-sp-pricegrid">
            <div>
              <h2 id="price-h" className="v3-h2 v3-display v3-sp-price-h" data-split>
                {V2_PRICE.heading}
              </h2>
              <p className="v3-sp-price-intro">{V2_PRICE.intro}</p>
              <p className="v3-sp-price-lede">{V2_PRICE.lede}</p>
            </div>
            <PriceBlock>
              <p className="v3-sp-price__inc-title">{V2_PRICE.includesTitle}</p>
              <ul className="v3-sp-price__inc">
                {V2_PRICE.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="v3-sp-price__req">{V2_PRICE.requirement}</p>
              <Order>
                <BuyLabel />
              </Order>
            </PriceBlock>
          </div>
        </section>

        {/* 10. Checkout (unchanged component, props and anchor) */}
        <section className="v3-section v3-section--cloud v3-grain" id="order" data-nav="cloud" aria-label="Your order">
          <div className="v3-wrap v3-sp-order">
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

        {/* 12. FAQ: requirements, limits and refunds, after the purchase (owner, 20 Oct 2026) */}
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="faq-h">
          <div className="v3-wrap v3-cpn-narrow">
            <h2 id="faq-h" className="v3-h2 v3-display v3-cpn-h2" data-split>
              Questions people ask
            </h2>
            <div className="v3-faq" data-faq-list>
              {V2_FAQ.map((f) => (
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

        {/* 11. Close */}
        <section className="v3-section v3-section--navy v3-grain v3-sp-close" data-nav="navy" aria-labelledby="close-h">
          <div className="v3-wrap v3-sp-narrow">
            <h2 id="close-h" className="v3-h2 v3-display" data-split>
              {V2_CLOSE.heading}
            </h2>
            <div className="v3-sp-lines v3-sp-close__lines">
              {V2_CLOSE.lines.map((l) => (
                <p key={l} data-fade>
                  {l}
                </p>
              ))}
            </div>
            <p className="v3-sp-close__last" data-fade>
              {V2_CLOSE.last}
            </p>
            <Order>{V2_CLOSE.cta}</Order>
          </div>
        </section>
      </div>
    </PriceProvider>
  );
}
