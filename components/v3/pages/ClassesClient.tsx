"use client";

import { useState } from "react";
import { PaymentModal } from "@/components/PaymentModal";
import { Arrow } from "@/components/v3/Arrow";
import { MarkList } from "@/components/course/V3Course";
import type { ClassProduct } from "@/lib/course-prices";
import type { NicheContent } from "@/lib/classes";
import "@/components/v3/pages/course.css";
import "./classes.css";

/**
 * The /classes menu (app/classes/page.tsx). Light sections only (paper and
 * cloud), the v3 type, buttons and lists of /aimastery and /theeditcompanion.
 *
 * Every Pay button opens the site's existing PaymentModal (Flutterwave, the
 * same checkout as /aimastery) with the product's tx_ref prefix, so the
 * payment routes know which product was bought. The amount passed is the one
 * the server computed for this render; the payment routes check it again.
 */

export type PriceNow = { amount: number; early: number | null; standard: number; seatsLeft: number | null };
export type ClassCard = { product: ClassProduct; content: NicheContent; price: PriceNow };
export type ComboCard = { product: ClassProduct; line: string; price: PriceNow; standardSum: number; names: string[] };
export type CoachingRow = { niche: string; options: Array<{ product: ClassProduct; amount: number }> };

type Checkout = { name: string; amount: number; refPrefix: string };

const ngn = (n: number) => `₦${n.toLocaleString("en-US")}`;

function SeatLine({ price }: { price: PriceNow }) {
  if (price.early === null) return null;
  if (price.seatsLeft === null) return <p className="v3-cls-seats">Standard price</p>;
  if (price.seatsLeft > 0)
    return (
      <p className="v3-cls-seats">
        <span className="v3-cls-seats__n">{price.seatsLeft}</span> of 10 early seats left. Then {ngn(price.standard)}.
      </p>
    );
  return <p className="v3-cls-seats">The 10 early seats are gone.</p>;
}

function PriceTag({ price }: { price: PriceNow }) {
  const early = price.early !== null && price.seatsLeft !== null && price.seatsLeft > 0;
  return (
    <div className="v3-cls-price">
      <p className="v3-cls-price__now">
        {ngn(price.amount)}
        {early ? <span className="v3-cls-price__tag">first 10 seats</span> : null}
      </p>
      <SeatLine price={price} />
    </div>
  );
}

export function ClassesClient({
  cards,
  combo,
  coaching,
  cohortLabel,
}: {
  cards: ClassCard[];
  combo: ComboCard;
  coaching: CoachingRow[];
  cohortLabel: string;
}) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const pay = (product: ClassProduct, amount: number) => setCheckout({ name: product.name, amount, refPrefix: product.refPrefix });

  return (
    <div className="v3 v3-course v3-cls">
      {/* ───────── HERO ───────── */}
      <section className="v3-section v3-section--cloud v3-cls-hero" data-nav="cloud" aria-labelledby="cls-h">
        <div className="v3-wrap">
          <p className="v3-label v3-cls-kicker">AI classes · first cohort {cohortLabel}</p>
          <h1 id="cls-h" className="v3-display v3-cls-hero__h">
            Seven AI classes. <span className="mark">Pick the one you need.</span>
          </h1>
          <p className="v3-lede">
            Every class starts on {cohortLabel}. The first 10 seats in each class cost less, and the price goes up once
            they are taken. Lesson 1 of every class is prompting, written for that class.
          </p>
          <nav className="v3-cls-jump" aria-label="Classes on this page">
            {cards.map((c) => (
              <a key={c.product.slug} href={`#${c.product.slug}`} className="v3-chip">
                {c.product.name}
              </a>
            ))}
            <a href={`#${combo.product.slug}`} className="v3-chip">
              All 7: the combo
            </a>
            <a href="#coaching" className="v3-chip">
              One-on-one coaching
            </a>
          </nav>
        </div>
      </section>

      {/* ───────── THE SEVEN NICHES ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="cls-niches">
        <div className="v3-wrap">
          <h2 id="cls-niches" className="v3-h2 v3-display">
            The classes
          </h2>
          <ol className="v3-cls-grid">
            {cards.map((c) => (
              <li key={c.product.slug} id={c.product.slug} className="v3-cls-card" data-slug={c.product.slug}>
                <div className="v3-cls-card__head">
                  <h3 className="v3-h3">{c.product.name}</h3>
                  <p className="v3-cls-card__for">{c.content.forWho}</p>
                </div>

                <div className="v3-cls-card__weeks">
                  {[c.content.week1, c.content.week2].map((w, i) => (
                    <div key={w.title}>
                      <p className="v3-label v3-cls-card__wk">
                        Week {i + 1}: {w.title}
                      </p>
                      <MarkList items={w.lessons} kind="arrow" className="v3-cls-card__lessons" />
                    </div>
                  ))}
                </div>

                <dl className="v3-cls-card__dl">
                  <div>
                    <dt>You finish with</dt>
                    <dd>{c.content.deliverable}</dd>
                  </div>
                  <div>
                    <dt>Tools you pay for</dt>
                    <dd>{c.content.toolCost}</dd>
                  </div>
                  <div>
                    <dt>Not for</dt>
                    <dd>{c.content.notFor}</dd>
                  </div>
                </dl>
                {c.content.rule ? <p className="v3-cls-card__rule">{c.content.rule}</p> : null}

                <div className="v3-cls-card__buy">
                  <PriceTag price={c.price} />
                  <p className="v3-cls-card__start">Starts {cohortLabel}</p>
                  <button type="button" className="v3-btn v3-btn--lg" onClick={() => pay(c.product, c.price.amount)}>
                    Pay {ngn(c.price.amount)} <Arrow />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── THE COMBO ───────── */}
      <section className="v3-section v3-section--cloud" data-nav="cloud" aria-labelledby="cls-combo">
        <div className="v3-wrap v3-cls-combo" id={combo.product.slug} data-slug={combo.product.slug}>
          <div>
            <p className="v3-label v3-cls-kicker">AI Mastery Combo</p>
            <h2 id="cls-combo" className="v3-h2 v3-display">
              All seven, <span className="mark">one course</span>
            </h2>
            <p className="v3-lede">{combo.line}</p>
            <MarkList items={combo.names} kind="check" className="v3-cls-combo__list" />
          </div>
          <div className="v3-cls-combo__buy">
            <PriceTag price={combo.price} />
            <p className="v3-cls-combo__sum">
              {ngn(combo.standardSum)} if you buy all seven one by one at the standard price.
            </p>
            <p className="v3-cls-card__start">Starts {cohortLabel}</p>
            <button type="button" className="v3-btn v3-btn--lg" onClick={() => pay(combo.product, combo.price.amount)}>
              Pay {ngn(combo.price.amount)} <Arrow />
            </button>
          </div>
        </div>
      </section>

      {/* ───────── COACHING ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="coaching">
        <div className="v3-wrap">
          <h2 id="coaching" className="v3-h2 v3-display">
            <span className="v3-cls-nowrap">One-on-one</span> coaching
          </h2>
          <p className="v3-lede">
            Just you and me, on one niche, for 2 weeks or 3 weeks. After you pay, we contact you within 24 hours to book
            your sessions.
          </p>
          <ul className="v3-cls-coach">
            {coaching.map((row) => (
              <li key={row.niche} className="v3-cls-coach__row">
                <p className="v3-cls-coach__name">{row.niche}</p>
                <div className="v3-cls-coach__opts">
                  {row.options.map((o) => (
                    <button
                      key={o.product.slug}
                      type="button"
                      className="v3-btn v3-btn--navy v3-cls-coach__btn"
                      data-slug={o.product.slug}
                      onClick={() => pay(o.product, o.amount)}
                    >
                      {o.product.weeks} weeks · {ngn(o.amount)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── WHAT HAPPENS AFTER YOU PAY ───────── */}
      <section className="v3-section v3-section--cloud" data-nav="cloud" aria-labelledby="cls-after">
        <div className="v3-wrap v3-cls-after">
          <h2 id="cls-after" className="v3-h2 v3-display">
            After you pay
          </h2>
          <ol className="v3-cls-steps">
            <li>
              <span className="v3-cls-steps__n">01</span>
              <p>You get an email confirming your seat, the amount and your payment reference.</p>
            </li>
            <li>
              <span className="v3-cls-steps__n">02</span>
              <p>Before the class starts on {cohortLabel}, you are added to the class group.</p>
            </li>
            <li>
              <span className="v3-cls-steps__n">03</span>
              <p>
                Coaching: we contact you within 24 hours to book your sessions. Every purchase is on{" "}
                <a href="/my-purchases">My purchases</a>.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <PaymentModal
        isOpen={checkout !== null}
        onClose={() => setCheckout(null)}
        serviceName={checkout?.name ?? ""}
        amount={checkout?.amount ?? 0}
        currency="NGN"
        txRefPrefix={checkout?.refPrefix}
      />
    </div>
  );
}
