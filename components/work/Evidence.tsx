import Image from "next/image";
import type { ReactNode } from "react";
import { Arrow } from "@/components/v3/Arrow";
import { DigitalZoom } from "@/components/v3/fx/DigitalZoom";
import { FreezeLabel, type FreezePin } from "@/components/v3/fx/FreezeLabel";
import { EVIDENCE_DIMS } from "./evidence-dims";

type Tier = "Personal" | "Semi-verified" | "Third-party";

const TIERS: Record<Tier, string> = {
  Personal: "Own account or system, counts visible on screen",
  "Semi-verified": "Publicly checkable, awaiting direct confirmation",
  "Third-party": "Confirmed by someone other than me",
};

interface EvidenceProps {
  /** Path under /public, e.g. /proof/peaceway/12-telegram-order-confirmation.webp */
  src: string;
  /** What the screenshot demonstrates. This is content, not compliance. */
  alt: string;
  /** The claim this screenshot proves, stated with its number. */
  claim: string;
  tier: Tier;
  /** Optional live URL a reader can check for themselves. */
  href?: string;
  width?: number;
  height?: number;
  /** #3 Digital Zoom: the detail that proves the claim, as fractions of the image */
  zoom?: { x: number; y: number; scale?: number };
  /** #6 Freeze and Label: at most two labels, words lifted from the page */
  labels?: FreezePin[];
  /** set by <Pair>: the paragraph the screenshot proves, shown between the print and the claim */
  lead?: ReactNode;
}

/** Wrap the real numbers in a claim so they roll in (#10 Odometer). Years stay still. */
function numbers(claim: string): ReactNode[] {
  const parts = claim.split(/([₦N$+]?\d(?:[\d,]*\d)?(?:\.\d+)?%?\+?)/g);
  return parts.map((part, i) => {
    if (i % 2 === 0 || !part) return part;
    if (/^(19|20)\d\d$/.test(part)) return part;
    if (/^N/.test(part) && !/^N\d/.test(part)) return part;
    return (
      <span key={i} className="v3-proof__num" data-odometer>
        {part}
      </span>
    );
  });
}

/**
 * The unit the whole site argues from: a claim and the screenshot that proves
 * it, rendered together and never separable. Do not add a variant that renders
 * a claim without its image, or an image without its tier.
 *
 * v3 (rebuild 19 Oct 2026): the screenshot is a 14px proof card that opens from
 * a slit as it arrives (#37), optionally punches in on its detail (#3) or holds
 * with labelled details (#6). Phone captures sit beside their claim; a capture
 * taller than two phone screens scrolls inside its own frame.
 */
export function Evidence({ src, alt, claim, tier, href, width = 1200, height = 800, zoom, labels, lead }: EvidenceProps) {
  const [w, h] = EVIDENCE_DIMS[src] ?? [width, height];
  const ratio = h / w;
  const tall = ratio > 2.2;
  const portrait = ratio > 1.1;
  const boost = zoom ? Math.min(2, zoom.scale ?? 2) : 1;

  const image = (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={
        portrait
          ? `(max-width: 760px) ${Math.round(86 * boost)}vw, ${Math.round(340 * boost)}px`
          : `(max-width: 900px) ${Math.round(92 * boost)}vw, ${Math.round(800 * boost)}px`
      }
      quality={zoom ? 90 : 75}
      className="v3-proof__img"
    />
  );

  let shot: ReactNode;
  if (tall) {
    shot = (
      <div className="v3-proof__frame" data-reveal="clip">
        {/* A full-page capture scrolls inside its frame; focusable so a keyboard can scroll it. */}
        <div tabIndex={0} role="region" aria-label="Full-page screenshot, scrolls inside its frame" className="v3-proof__scroll" data-lenis-prevent>
          {image}
        </div>
      </div>
    );
  } else if (zoom) {
    shot = (
      <div className="v3-proof__frame v3-proof__frame--bare" data-reveal="clip">
        <DigitalZoom x={zoom.x} y={zoom.y} scale={zoom.scale} src={src}>
          {image}
        </DigitalZoom>
      </div>
    );
  } else if (labels?.length) {
    shot = (
      <div className="v3-proof__frame" data-reveal="clip">
        <FreezeLabel pins={labels} w={w} h={h}>
          {image}
        </FreezeLabel>
      </div>
    );
  } else {
    shot = (
      <div className="v3-proof__frame" data-reveal="clip">
        {image}
      </div>
    );
  }

  return (
    <figure className={`v3-proof${portrait ? " is-portrait" : ""}${tall ? " is-tall" : ""}${lead ? " has-lead" : ""}`}>
      {/* never wider than the capture itself, so nothing is shown upscaled */}
      <div className="v3-proof__shot" style={portrait ? undefined : { maxWidth: w }}>
        {shot}
      </div>
      <div className="v3-proof__text">
        {lead}
        <figcaption className="v3-proof__claim">{numbers(claim)}</figcaption>
        <div className="v3-proof__meta">
          <span className="v3-proof__tier">{tier}</span>
          <span>{TIERS[tier]}</span>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className="v3-proof__check">
              Check it yourself <Arrow className="v3-proof__arrow" />
            </a>
          )}
        </div>
      </div>
    </figure>
  );
}
