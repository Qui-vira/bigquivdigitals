import Link from "next/link";
import { Stage } from "@/components/v3/stage/Stage";
import { UIWorld, type UIWorldScreen } from "@/components/v3/fx/UIWorld";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/services.css";

interface ServicesClientProps {
  calendlyUrl: string;
}

/**
 * /services, v3 (rebuild approved 19 Oct 2026; comp: Services.dc.html on the
 * website comps canvas; motion: MOTION-PLAN.md section 3).
 *
 * The one offer. Every word is the live page's copy, word for word; only the
 * design changed. The stage is the system itself: five slabs that scatter like
 * five separate invoices, then lock into one cube (scenes/systemCube.ts).
 * Below it: the problem with the five invoices struck through (#26), the five
 * parts ticking off as you read them (#5) over the real system screens in 3D
 * (#9), the four front doors stacking (#45), the close.
 *
 * Rendered on the server; the stage and the UI World are client leaves, the
 * rest is animated by attribute (components/v3/Motion.tsx).
 */

const INCLUDES = [
  {
    t: "Website and conversion",
    d: "The pages a buyer actually reads before deciding. Built to answer who you are, what you solve, why they should trust you, and how to hire you, all inside five minutes.",
  },
  {
    t: "AI content production",
    d: "Video, hooks and campaign angles produced on a repeatable system. I run the same engine on my own accounts. One post on it did a million views.",
  },
  {
    t: "Community and bot infrastructure",
    d: "Telegram and WhatsApp are where Nigerian buyers actually transact. I build the bots that take orders, capture emails, and hand a question to a human when the answer matters.",
  },
  {
    t: "Growth strategy and market intelligence",
    d: "Who to target and what they respond to. I run a lead engine that scraped, scored and match-explained 200 prospects, each with the reason it matched. That is the same machinery pointed at your market.",
  },
  {
    t: "Reporting",
    d: "What shipped, what it moved, what happens next. Every sprint, in writing. You are never guessing whether this is working, and you can end it the moment it is not.",
  },
];

const ENTRY_POINTS = [
  {
    t: "Health brands",
    d: "Pharmacies, clinics, labs and diagnostic centres. Trust first, then a journey that ends in an order.",
    href: "/work/peaceway",
    linkText: "See the Peaceway build",
  },
  {
    t: "Crypto exchanges entering Africa",
    d: "Acquisition, community activation and local reporting, rather than a KOL posting a banner.",
    href: "/work/alpha-plays",
    linkText: "See the community build",
  },
  {
    t: "AI, fintech and Web3 launches",
    d: "Video, landing page and a CTA system that catches the attention your launch generates.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
  {
    t: "Founders with scattered growth",
    d: "A site that sells, content that compounds, one person accountable for both.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
];

/** The real system screens for the UI World. The lead screen comes forward last. */
const SCREENS: UIWorldScreen[] = [
  {
    src: "/proof/technical/admin-leads-blurred.webp",
    alt: "The lead engine in the admin panel: 200 of 200 leads, each with a target, a score, its keywords and the reason it matched. Names are blurred.",
    w: 1280,
    h: 439,
  },
  {
    src: "/proof/peaceway/04-customer-dashboard.webp",
    alt: "The Peaceway Online customer dashboard: medication reminders and quick access to check availability and ask a pharmacist.",
    w: 1360,
    h: 718,
  },
  {
    src: "/proof/peaceway/12-telegram-order-confirmation.webp",
    alt: "The Peaceway Telegram bot confirming an itemised order.",
    w: 604,
    h: 516,
  },
  {
    src: "/proof/peaceway/09b-telegram-inventory-search.webp",
    alt: "The Peaceway Telegram bot searching the pharmacy's inventory for a medicine.",
    w: 604,
    h: 516,
  },
];

export function ServicesClient({ calendlyUrl }: ServicesClientProps) {
  return (
    <div className="v3 v3-svc">
      {/* ───────── STAGE: five blocks lock into one system ───────── */}
      <Stage scene="systemCube" ground="navy" height={640} heightPhone={540} mark="ONE SYSTEM" label="The Growth Operating System">
        <div className="v3-intro">
          <h1 className="v3-intro__line v3-display v3-svc__h1" data-lift>
            You are paying five people and none of them <span className="mark">own the result.</span>
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-intro__actions">
              <a href={calendlyUrl} className="v3-btn v3-btn--lg">
                Book a call <Arrow />
              </a>
            </div>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        <p className="v3-ghost" data-ghost="0.075,0.13,0.2,0.23" data-side="high" aria-hidden="true">
          Invoice
        </p>
        <p className="v3-ghost" data-ghost="0.24,0.29,0.34,0.37" data-side="left" aria-hidden="true">
          one system
        </p>
        {INCLUDES.map((item, i) => {
          const a = 0.38 + i * 0.08;
          return (
            <p
              key={item.t}
              className="v3-ghost v3-svc__part"
              data-ghost={`${a.toFixed(3)},${(a + 0.025).toFixed(3)},${(a + 0.06).toFixed(3)},${(a + 0.078).toFixed(3)}`}
              data-side="left"
              aria-hidden="true"
            >
              {item.t}
            </p>
          );
        })}
        <p className="v3-ghost v3-svc__part" data-ghost="0.79,0.83,0.89,0.925" data-side="left" aria-hidden="true">
          Where people usually start
        </p>

        <div className="v3-endcta v3-svc__endcta" data-at="0.93,0.965,1.1,1.2">
          <a href={calendlyUrl} className="v3-btn">
            Book a call <Arrow />
          </a>
          <p>I quote by scope. If you do not need me yet, you will hear that on the call.</p>
        </div>
      </Stage>

      {/* ───────── THE PROBLEM: five invoices, struck through ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-label="The cost of buying growth in pieces">
        <div className="v3-wrap v3-svc__problem">
          <div className="v3-svc__problem-copy">
            <p className="v3-svc__problem-lead" data-fade>
              The designer never speaks to the writer. The developer has never read the content plan. Every one of them
              delivers what you asked for, and the numbers still do not move.
            </p>
            <p className="v3-svc__problem-body" data-fade>
              That is the real cost of buying growth in pieces, and it is not the invoices. It is the six months you spend
              before anyone admits the pieces were never going to add up.
            </p>
            <p className="v3-svc__problem-claim v3-display" data-split>
              I sell <span className="mark">one system</span> and I own the outcome.
            </p>
          </div>

          <div className="v3-svc__slips" aria-hidden="true">
            <p className="v3-hand v3-svc__hand">look familiar?</p>
            <ul>
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="v3-svc__slip" style={{ ["--i" as string]: i }}>
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 2.5h7l3.5 3.5v11.5H5z M12 2.5V6h3.5 M7.5 10h5 M7.5 13h5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span data-strike>Invoice</span>
                </li>
              ))}
            </ul>
            <p className="v3-svc__one">one system</p>
          </div>
        </div>
      </section>

      {/* ───────── WHAT IT INCLUDES: the five parts tick off ───────── */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" aria-labelledby="includes-heading">
        <div className="v3-wrap v3-svc__includes" data-checklist>
          <div className="v3-svc__includes-head">
            <h2 id="includes-heading" className="v3-h2 v3-display" data-split>
              What the Growth Operating System includes
            </h2>
            <p className="v3-svc__count" aria-hidden="true">
              <span data-check-count>0 of 5</span>
            </p>
          </div>
          <ol className="v3-svc__list">
            {INCLUDES.map((item) => (
              <li key={item.t} data-check>
                <h3 className="v3-h3">{item.t}</h3>
                <p>{item.d}</p>
              </li>
            ))}
          </ol>
        </div>
        <UIWorld screens={SCREENS} className="v3-svc__world" />
      </section>

      {/* ───────── WHERE PEOPLE USUALLY START: the doors stack ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="entry-heading">
        <div className="v3-wrap">
          <div className="v3-svc__doors-head">
            <h2 id="entry-heading" className="v3-h2 v3-display" data-split>
              Where people usually start
            </h2>
            <p className="v3-lede" data-fade>
              Nobody needs the whole system on day one. These are the common front doors, and each one leads into the same
              engine.
            </p>
          </div>
          <ul className="v3-svc__doors" data-stack>
            {ENTRY_POINTS.map((e, i) => (
              <li key={e.t} data-stack-card style={{ ["--i" as string]: i }}>
                <Link href={e.href} className="v3-svc__door" data-flood data-cursor="View">
                  <span className="v3-svc__door-n" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="v3-svc__door-body">
                    <span className="v3-svc__door-t">{e.t}</span>
                    <span className="v3-svc__door-d">{e.d}</span>
                    <span className="v3-case__go">
                      {e.linkText} <Arrow className="v3-case__arrow" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── THE CLOSE ───────── */}
      <section className="v3-section v3-section--navy v3-grain v3-svc__close" data-nav="navy" aria-labelledby="services-cta-heading">
        <div className="v3-wrap v3-svc__close-grid">
          <h2 id="services-cta-heading" className="v3-display v3-svc__close-h" data-split>
            Tell me what you are <span className="mark">building.</span>
          </h2>
          <div>
            <a href={calendlyUrl} className="v3-btn v3-btn--lg">
              Book a call <Arrow />
            </a>
            <p className="v3-svc__close-note">I quote by scope. If you do not need me yet, you will hear that on the call.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
