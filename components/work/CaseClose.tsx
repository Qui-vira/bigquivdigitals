"use client";

import Link from "next/link";
import { Arrow } from "@/components/v3/Arrow";
import { CASE_NOTE, CASE_STAGES } from "./stages";
import { DeviceMock } from "./DeviceMock";
import { useCaseSlug } from "./CaseStage";

/**
 * Every case study ends on the same live close: the heading, the line and the
 * button keep the live copy and the /contact target exactly. Beside it, the
 * page's device settles small with its real screen.
 */
export function CaseClose() {
  const cfg = CASE_STAGES[useCaseSlug()];
  return (
    <section className="v3-section v3-section--navy v3-grain v3-work-close" data-nav="navy" aria-labelledby="case-cta-heading">
      <div className="v3-wrap v3-work-close__grid">
        <div>
          <h2 id="case-cta-heading" className="v3-display v3-work-close__h" data-split>
            Want this built for <span className="mark">your brand?</span>
          </h2>
          <p className="v3-work-close__p">{CASE_NOTE}</p>
          <Link href="/contact" className="v3-btn v3-btn--lg">
            Book a call <Arrow />
          </Link>
        </div>
        {cfg && <DeviceMock kind={cfg.kind} src={cfg.closeScreen} className="v3-work-close__device" />}
      </div>
    </section>
  );
}
