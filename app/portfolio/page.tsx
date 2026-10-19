import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/portfolio.css";

export const metadata: Metadata = {
  title: "Proof of Work | BigQuiv Digitals",
  description:
    "Three things I built and six films I made. Every one has a public link you can open, and the films play here without leaving the page.",
  alternates: { canonical: "/portfolio" },
};

/**
 * /portfolio (Work), v3 (rebuild approved 19 Oct 2026; comp: Portfolio.dc.html;
 * motion: MOTION-PLAN.md section 3). Copy is the live page's, word for word.
 *
 * ⚠ NO EXPLAINER PARAGRAPH UNDER THE HEADLINE. One listed the builds and the
 * films and a second described the page's own standards. His ruling on both,
 * 2026-09-12: "this is not needed". The cut line also claimed "nothing is
 * behind a login", which stopped being true when the PharmaOS card started
 * pointing at its sign-in screen. Do not reinstate that sentence.
 *
 * The stage is a device rack (scenes/deviceRack.ts) that turns to each build as
 * its name lands, with the real screens on its devices.
 */

const BEATS = [
  { t: "MedBand", at: "0.1,0.15,0.25,0.29" },
  { t: "Peaceway Online", at: "0.31,0.36,0.45,0.49" },
  { t: "Nigeria Business Cost Intelligence", at: "0.51,0.56,0.65,0.69" },
  { t: "PharmaOS", at: "0.71,0.75,0.84,0.87" },
];

export default function PortfolioPage() {
  return (
    <div className="v3 v3-workpage">
      <Stage
        scene="deviceRack"
        params={{
          right: "/proof/portfolio/medband.webp",
          left: "/proof/peaceway/00-homepage-hero.webp",
          laptop: "/proof/nbci/02-powerbi-fuel-and-power.webp",
          laptop2: "/proof/portfolio/pharmaos.webp",
        }}
        ground="navy"
        height={600}
        heightPhone={520}
        mark="PROOF OF WORK"
        label="Proof of work"
      >
        <div className="v3-intro">
          <h1 id="portfolio-heading" className="v3-intro__line v3-display v3-workpage__h1" data-lift>
            I built these. <span className="mark">Open any one of them.</span>
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-intro__actions">
              <Link href="/contact" className="v3-btn v3-btn--lg">
                Start a project <Arrow />
              </Link>
              <p className="v3-label v3-workpage__tally">Proof of Work / 04 builds / 06 films</p>
            </div>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        {BEATS.map((b) => (
          <p key={b.t} className="v3-ghost v3-workpage__beat" data-ghost={b.at} data-side="left" aria-hidden="true">
            {b.t}
          </p>
        ))}

        <div className="v3-endcta" data-at="0.89,0.93,1.1,1.2">
          <Link href="/contact" className="v3-btn">
            Start a project <Arrow />
          </Link>
        </div>
      </Stage>

      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-label="Portfolio projects">
        <div className="v3-wrap">
          <PortfolioShowcase />
        </div>
      </section>

      <section className="v3-section v3-section--navy v3-grain v3-workpage__close" data-nav="navy" aria-labelledby="portfolio-cta-heading">
        <div className="v3-wrap v3-workpage__close-grid">
          <div>
            <p className="v3-title v3-workpage__ask">Have a similar problem?</p>
            <h2 id="portfolio-cta-heading" className="v3-display v3-workpage__close-h" data-split>
              Bring me the outcome. I will tell you what it takes to <span className="mark">build it.</span>
            </h2>
          </div>
          <Link href="/contact" className="v3-btn v3-btn--lg">
            Start a project <Arrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
