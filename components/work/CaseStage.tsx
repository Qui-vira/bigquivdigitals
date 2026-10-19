"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import { CASE_NOTE, CASE_STAGES } from "./stages";
import { DeviceMock } from "./DeviceMock";

/** The case study's slug, from /work/<slug>. */
export function useCaseSlug() {
  const pathname = usePathname() || "";
  return pathname.split("/").filter(Boolean)[1] ?? "";
}

/** Split the h1 so its last phrase can be set in gold, as on the comp. */
function marked(children: ReactNode, phrase: string) {
  if (typeof children !== "string" || !phrase) return children;
  const at = children.lastIndexOf(phrase);
  if (at < 0) return children;
  return (
    <>
      {children.slice(0, at)}
      <span className="mark">{phrase}</span>
      {children.slice(at + phrase.length)}
    </>
  );
}

/**
 * The opening stage of a case study: the MDX's own `# title` lands here as the
 * h1, on a navy stage, with the page's device turning to the real screen as
 * you scroll (components/v3/stage/scenes/device.ts). The beats and their lines
 * are in ./stages.ts; every line repeats the page's own words.
 */
export function CaseStage({ children }: { children: ReactNode }) {
  const slug = useCaseSlug();
  const cfg = CASE_STAGES[slug];
  if (!cfg) return <h1 className="v3-display v3-work-plain-h1">{children}</h1>;
  const pins = cfg.pins?.text.split("|") ?? [];

  return (
    <Stage
      scene="device"
      params={{ kind: cfg.kind, screens: cfg.screens, poses: cfg.poses }}
      ground="navy"
      height={520}
      heightPhone={460}
      mark={cfg.mark}
      label={typeof children === "string" ? children : cfg.mark}
    >
      <div className="v3-work-nogl" aria-hidden="true">
        <DeviceMock kind={cfg.kind} src={cfg.screens[0].src} />
      </div>

      <div className="v3-intro v3-work-intro">
        <h1 className="v3-intro__line v3-display" data-lift>
          {marked(children, cfg.titleMark)}
        </h1>
        <div className="v3-intro__row" data-intro-rest>
          <div className="v3-intro__actions">
            <Link href="/contact" className="v3-btn v3-btn--lg">
              Book a call <Arrow />
            </Link>
            {cfg.check && (
              <a href={cfg.check} target="_blank" rel="noopener noreferrer" className="v3-link">
                Check it yourself
              </a>
            )}
          </div>
          <p className="v3-intro__note">{CASE_NOTE}</p>
        </div>
      </div>

      {cfg.ghosts.map((g) => (
        <p key={g.text} className="v3-ghost v3-work-ghost" data-ghost={g.win} data-side={g.side} aria-hidden="true">
          {g.text}
        </p>
      ))}

      {cfg.asides.map((a) => (
        <p
          key={a.text}
          className={`v3-aside${/^[\d.,%]+$/.test(a.text) ? " v3-work-figure" : ""}`}
          data-at={a.win}
          data-side={a.side}
          aria-hidden="true"
        >
          {a.text}
        </p>
      ))}

      {pins.length > 0 && cfg.pins && (
        <ul className="v3-work-pins" data-at={cfg.pins.win} aria-hidden="true">
          {pins.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <div className="v3-endcta v3-work-end" data-at={cfg.end.win}>
        {cfg.end.figure && (
          <p className="v3-work-end__figure" aria-hidden="true">
            {cfg.end.figure}
          </p>
        )}
        {cfg.end.line && (
          <p className="v3-work-end__line" aria-hidden="true">
            {cfg.end.line}
          </p>
        )}
        <Link href="/contact" className="v3-btn">
          Book a call <Arrow />
        </Link>
      </div>
    </Stage>
  );
}
