import Image from "next/image";
import Link from "next/link";
import { type ProofStatData } from "@/components/ProofStat";
import { Stage } from "@/components/v3/stage/Stage";
import { HeadlineWall } from "@/components/v3/fx/HeadlineWall";
import { Arrow } from "@/components/v3/Arrow";
import { UgcChallenge } from "@/components/v3/UgcChallenge";
import { CHALLENGE_DAYS, poster } from "@/lib/ugc-challenge";
import "@/components/v3/pages/home.css";

interface Testimonial {
  quote: string;
  attribution: string;
  allImages: string[];
  rating: number;
  avatar: string | null;
}

interface HomeClientProps {
  calendlyUrl: string;
  proofStats: ProofStatData[];
  testimonials: Testimonial[];
}

/**
 * The homepage, v3 (rebuild approved 19 Oct 2026; comp: Main.dc.html on the
 * BigQuiv Digitals website comps canvas; motion: MOTION-PLAN.md).
 *
 * Every word is the owner's own copy from the live page, word for word. Only
 * the design changed. Structure: the stage (his photo, still, on navy; four
 * beats: the hook, "Same skills.", "One move.", the receipts, then his four
 * latest challenge reels orbit him), the UGC challenge (raw take against the
 * reel, every day so far), the builds (Headline Wall), the
 * problem (the site's one glitch line), the offer (navy panel), the process
 * (checklist), testimonials, the close (spotlight).
 *
 * Rendered on the server; the stage and the wall are client leaves, and the
 * effects layer (components/v3/Motion.tsx) animates by attribute.
 */

// The hero's orbit: his four latest challenge reels (owner, 19 Oct 2026: the UGC
// challenge goes first, not the data work).
const HERO_ORBIT = CHALLENGE_DAYS.slice(-4).reverse().map((d) => poster(d.file));

const CASE_STUDIES = [
  {
    href: "/work/peaceway",
    tag: "Health",
    claim: "A Lagos pharmacy that now takes orders end to end inside Telegram.",
    support:
      "Live at peacewayonline.com. Separate doors for customers, staff and suppliers, and a bot that carries a real order from search to confirmation.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage. Headline reads YOUR LAGOS PHARMACY IS NOW ONLINE, with buttons to order on Telegram or check product availability.",
  },
  {
    href: "/work/alpha-plays",
    tag: "Community and markets",
    claim: "3,485 people get my market calls.",
    support:
      "Every result published next to the call that produced it, with the entry, the stop and the target still visible.",
    image: "/proof/quivira/result-eth-setup-85pct.webp",
    imageAlt:
      "Telegram channel showing an ETH buy call with entry, stop loss and take profit, next to the resulting position card.",
  },
  {
    href: "/work/nigeria-business-costs",
    tag: "Data analysis",
    claim: "Eight government datasets, 29,032 verified rows, one honest picture of Nigerian business costs.",
    support:
      "Diesel more than doubled while the inflation rate in the news was falling. A PostgreSQL model, an Excel workbook and a Power BI report, with 110 analysis checks and both dashboards validated against the file itself.",
    image: "/proof/nbci/01-powerbi-what-is-changing.webp",
    imageAlt:
      "The opening page of the Power BI report, showing what the project measures against what it does not, and seven things it can tell you against six it cannot.",
  },
  {
    href: "/work/content-engine",
    tag: "Content",
    claim: "One video pulled 128,000 views and 1,700 comments.",
    support:
      "I answered every comment by hand. Behind it sits the pipeline: 6 deployed systems, a lead engine that scored 200 prospects, 25 published articles.",
    image: "/proof/content/web3-video-128k.webp",
    imageAlt:
      "The post's own metrics bar: 8:43 AM, 24 April 2025, 128K views, with 1.7K comments, 267 reposts, 1.4K likes and 598 bookmarks, and the follow-up post delivering the free Web3 guide the next day.",
  },
];

const OFFER_LINES = [
  "A site that answers a buyer's four questions in five minutes. Most sites lose people who had already decided to hire them.",
  "Content produced on a system. That is what keeps the output going through the months you are too busy to feel creative.",
  "Telegram and WhatsApp infrastructure, because that is where Nigerian buyers actually transact. The Peaceway bot takes real orders end to end, and I can show you it running.",
  "Strategy built on who is already buying in your market, rather than a persona document nobody opens twice.",
  "A written report every sprint. Fire me the week the numbers stop moving instead of finding out in month six.",
];

const STEPS = [
  {
    n: "01",
    t: "Scope call",
    d: "Thirty minutes. What you sell, who buys it, where people drop off. You leave with a plan whether or not you hire me.",
  },
  {
    n: "02",
    t: "Written scope",
    d: "Deliverables and timeline in writing before anything starts, so nothing changes on you halfway through.",
  },
  {
    n: "03",
    t: "Seven-day sprint",
    d: "Payment starts the work. At the end you get a report on what shipped and what moved.",
  },
  {
    n: "04",
    t: "Build out",
    d: "We keep going in sprints, each one reported, until the system runs without me standing over it.",
  },
];

const GLITCH = "Five freelancers, five invoices, and nobody answering for the result.";

export function HomeClient({ calendlyUrl, proofStats, testimonials }: HomeClientProps) {
  // The claim register, kept structural: a stat with no evidenceRef never
  // reaches the page.
  const backedStats = proofStats.filter((s) => s.evidenceRef);

  return (
    <div className="v3 v3-home">
      {/* ───────── STAGE: he is the product ───────── */}
      <Stage
        scene="portrait"
        params={{ orbit: HERO_ORBIT }}
        ground="navy"
        height={620}
        heightPhone={560}
        mark="BIG QUIV"
        fallback="/hero3d/quiv-color-900.webp"
        particles
        label="Big Quiv"
      >
        <div className="v3-intro">
          <h1 className="v3-intro__line v3-display" data-lift>
            Your next skill is going to end <span className="mark">exactly like the last one did.</span>
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-intro__actions">
              <Link href="/greatwork-waitlist" className="v3-btn v3-btn--lg" data-flood>
                Join the waitlist <Arrow />
              </Link>
              <a href={calendlyUrl} className="v3-link">
                Hire me
              </a>
            </div>
            <p className="v3-intro__note">The Great Work opens soon. The list goes first.</p>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.17,0.235,0.33,0.37" data-side="left">
          Same skills.
        </h2>
        <p className="v3-aside" data-at="0.2,0.25,0.32,0.36" data-side="left">
          Mine stopped ending that way in 2022, when I got my first seven-figure naira dev job.
        </p>

        <h2 className="v3-ghost" data-ghost="0.38,0.445,0.52,0.56" data-side="left">
          One move.
        </h2>
        <p className="v3-aside" data-at="0.41,0.46,0.51,0.55" data-side="left">
          Now I have built the thing that fixes yours.
        </p>

        <h2 className="v3-ghost" data-ghost="0.585,0.64,0.72,0.76" data-side="left">
          Receipts.
        </h2>
        {backedStats.length > 0 && (
          <div className="v3-home__receipts" data-at="0.6,0.65,0.73,0.77">
            <ul>
              {backedStats.map((stat) => (
                <li key={stat.label}>
                  <span className="v3-home__receipt-v" data-odometer>
                    {`${stat.value.toLocaleString("en-US")}${stat.suffix ?? ""}`}
                  </span>
                  <span className="v3-home__receipt-l">{stat.label}</span>
                </li>
              ))}
            </ul>
            <p>Every number here has a screenshot behind it. Ask me for any of them.</p>
          </div>
        )}

        <p className="v3-aside" data-at="0.8,0.85,0.95,0.99" data-side="center" style={{ bottom: "auto", top: "14svh" }}>
          The Great Work opens soon. The list goes first.
        </p>
        <div className="v3-endcta" data-at="0.82,0.87,0.96,1">
          <Link href="/greatwork-waitlist" className="v3-btn" data-flood>
            Join the waitlist <Arrow />
          </Link>
          <a href={calendlyUrl} className="v3-link">
            Hire me
          </a>
        </div>
      </Stage>

      {/* ───────── THE UGC CHALLENGE: what he is running now, first ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="ugc-challenge-heading">
        <div className="v3-wrap">
          <UgcChallenge />
        </div>
      </section>

      {/* ───────── THE BUILDS: Headline Wall ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-labelledby="work-heading">
        <div className="v3-wrap">
          <div className="v3-home__builds-head">
            <h2 id="work-heading" className="v3-h2 v3-display" data-split>
              Three builds. Go and check them.
            </h2>
          </div>
          <HeadlineWall className="v3-home__builds">
            {CASE_STUDIES.map((cs, i) => (
              <Link
                key={cs.href}
                href={cs.href}
                className="v3-case"
                data-wall-card
                data-flood
                data-cursor="View"
                style={i % 2 === 1 ? { marginTop: "clamp(0rem, 8vw, 7rem)" } : undefined}
              >
                <div className="v3-case__frame" data-tilt>
                  <Image
                    src={cs.image}
                    alt={cs.imageAlt}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1360px) 46vw, 640px"
                    className="v3-case__img"
                  />
                </div>
                <p className="v3-case__tag">{cs.tag}</p>
                <h3 className="v3-h3">{cs.claim}</h3>
                <p className="v3-case__support">{cs.support}</p>
                <span className="v3-case__go">
                  Read the build <Arrow className="v3-case__arrow" />
                </span>
              </Link>
            ))}
          </HeadlineWall>
        </div>
      </section>

      {/* ───────── THE PROBLEM: the site's one glitch ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="problem-heading">
        <div className="v3-wrap v3-home__problem">
          <h2 id="problem-heading" className="v3-display v3-home__glitch" data-glitch data-text={GLITCH}>
            {GLITCH}
          </h2>
          <div className="v3-home__problem-cols">
            <p data-fade>
              Your designer has never spoken to your writer. Your developer has never read the content plan. Everyone
              delivers exactly what you asked for and the numbers still sit where they were.
            </p>
            <p data-fade>
              That is a systems problem, not a talent problem, and it is why good brands stay invisible for years.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── THE OFFER: a navy panel slides in ───────── */}
      <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="offer-heading">
        <div className="v3-wrap v3-home__offer">
          <div>
            <h2 id="offer-heading" className="v3-h2 v3-display" data-split>
              The Growth Operating System
            </h2>
            <p className="v3-home__offer-line">One system, one invoice, one person you can shout at.</p>
          </div>
          <ol className="v3-home__offer-list" data-checklist>
            {OFFER_LINES.map((line) => (
              <li key={line} data-check>
                {line}
              </li>
            ))}
          </ol>
        </div>
        <div className="v3-wrap v3-home__offer-foot">
          <p data-fade>
            I quote by scope. Tell me what you are trying to move and I will tell you what it takes. If you do not need me
            yet, you will hear that on the call.
          </p>
          <div>
            <a href={calendlyUrl} className="v3-btn v3-btn--lg">
              Book a call <Arrow />
            </a>
            <p className="v3-home__offer-note">Thirty minutes, and I will not pitch you. You leave with the plan either way.</p>
          </div>
        </div>
      </section>

      {/* ───────── HOW THE WORK RUNS ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="process-heading">
        <div className="v3-wrap">
          <h2 id="process-heading" className="v3-h2 v3-display" data-split>
            Seven days to your first report.
          </h2>
          <ol className="v3-steps">
            {STEPS.map((step, i) => (
              <li key={step.n} className={i === 2 ? "is-key" : undefined} data-fade>
                <span className="v3-steps__n" data-odometer>
                  {step.n}
                </span>
                <h3 className="v3-h3">{step.t}</h3>
                <p>{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── WHAT PEOPLE SAY ───────── */}
      {testimonials.length > 0 && (
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="testimonials-heading">
          <div className="v3-wrap">
            <h2 id="testimonials-heading" className="v3-h2 v3-display" data-split>
              What people say
            </h2>
            <ul className="v3-quotes">
              {testimonials.map((t, i) => (
                <li key={i} data-fade>
                  <figure>
                    {t.allImages.length > 0 && (
                      <div className="v3-quotes__img" data-reveal="clip">
                        <Image src={t.allImages[0]} alt={t.attribution} fill sizes="(max-width: 768px) 92vw, 520px" />
                      </div>
                    )}
                    <blockquote className="v3-quotes__q">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="v3-quotes__by">{t.attribution}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────── THE CLOSE: spotlight ───────── */}
      <section className="v3-section v3-section--navy v3-grain v3-home__close" data-nav="navy" data-spotlight aria-labelledby="final-cta-heading">
        <div className="v3-wrap v3-home__close-grid">
          <div>
            <h2 id="final-cta-heading" className="v3-display v3-home__close-h" data-split>
              You have seen the proof. Now go and <span className="mark">build your own.</span>
            </h2>
            <p className="v3-home__close-p">
              The Great Work is the loop this page is built on: learn, build, show, sell, turned into something you can
              repeat. It opens soon, and the list hears first.
            </p>
            <Link href="/greatwork-waitlist" className="v3-btn v3-btn--lg" data-flood>
              Join the waitlist <Arrow />
            </Link>
            <div className="v3-home__close-alt">
              <p>Want the Growth Operating System built for you instead? No price on this page because there is no standard job.</p>
              <a href={calendlyUrl} className="v3-link">
                Book a call
              </a>
            </div>
          </div>
          <div className="v3-home__close-photo" data-parallax="0.12" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero3d/quiv-color-900.webp" alt="" width={900} height={668} loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  );
}
