import Image from "next/image";
import { ShieldCheck, CircleAlert, BadgeCheck, ArrowUpRight } from "lucide-react";
import { HandNote } from "@/components/ui-paper/HandNote";
import { PhotoPrint } from "@/components/ui-paper/PhotoPrint";
import { cx } from "@/components/ui-paper/cx";
import { EVIDENCE_DIMS } from "@/components/work/evidence-dims";

type Tier = "Personal" | "Semi-verified" | "Third-party";

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
}

const TIERS: Record<Tier, { icon: typeof ShieldCheck; label: string; note: string; stamp: string }> = {
  Personal: {
    icon: ShieldCheck,
    label: "Personal",
    note: "Own account or system, counts visible on screen",
    stamp: "bg-gold",
  },
  "Semi-verified": {
    icon: CircleAlert,
    label: "Semi-verified",
    note: "Publicly checkable, awaiting direct confirmation",
    stamp: "bg-paper",
  },
  "Third-party": {
    icon: BadgeCheck,
    label: "Third-party",
    note: "Confirmed by someone other than me",
    stamp: "bg-gold-tint",
  },
};

/** How a print sits on the page. Picked from the file name, so it is stable. */
const POSES = [
  { tilt: -1.6, attach: "tape" as const, slip: 1.1 },
  { tilt: 1.3, attach: "clip" as const, slip: -1.3 },
  { tilt: -0.9, attach: "pin" as const, slip: 0.8 },
  { tilt: 1.6, attach: "tape-corners" as const, slip: -0.7 },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * The unit the whole site argues from: a claim and the screenshot that proves
 * it, rendered together and never separable.
 *
 * The proof library stores claims in prose and evidence in image files, with
 * nothing joining them. This component is that join. Do not add a variant that
 * renders a claim without its image, or an image without its tier.
 *
 * On paper (redesign 2026-10): the screenshot is a print stuck to the page and
 * the claim is a typed slip under it. Phone captures sit beside their slip;
 * desktop captures run wide with the slip overlapping the bottom edge; a
 * capture taller than two phone screens scrolls inside its own frame instead
 * of filling three screens of the page.
 */
export function Evidence({ src, alt, claim, tier, href, width = 1200, height = 800 }: EvidenceProps) {
  const { icon: Icon, label, note, stamp } = TIERS[tier];
  const [w, h] = EVIDENCE_DIMS[src] ?? [width, height];
  const ratio = h / w;
  const tall = ratio > 2.2;
  const portrait = ratio > 1.1;
  const seed = hash(src);
  const pose = POSES[seed % POSES.length];
  const flip = seed % 2 === 1;

  const image = (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={portrait ? "(max-width: 768px) 86vw, 360px" : "(max-width: 1024px) 94vw, 960px"}
      className="block h-auto w-full"
    />
  );

  const print = (
    <PhotoPrint
      tilt={pose.tilt}
      attach={pose.attach}
      mat="even"
      lift="self"
      className={portrait ? "mx-auto w-full max-w-[290px] sm:max-w-[360px]" : undefined}
    >
      {tall ? (
        // A full-page capture. It scrolls inside its frame, and the frame is
        // focusable so a keyboard can scroll it too.
        <div
          tabIndex={0}
          role="region"
          aria-label="Full-page screenshot, scrolls inside its frame"
          className="max-h-[520px] overflow-y-auto overscroll-contain"
        >
          {image}
        </div>
      ) : (
        image
      )}
    </PhotoPrint>
  );

  const slip = (
    <figcaption
      className={cx(
        "relative border-[3px] border-ink bg-paper px-5 py-4 shadow-brutal-sm sm:px-6 sm:py-5",
        portrait ? "max-md:mx-3 max-md:-mt-4" : "-mt-7 ml-3 mr-3 max-w-[600px] sm:ml-12 sm:mr-0"
      )}
      style={{ rotate: `${pose.slip}deg` }}
    >
      <p className="font-typewriter text-[15px] leading-[1.6] text-ink sm:text-base">{claim}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 border-dashed border-ink/40 pt-3.5">
        {/* Icon plus text, never colour alone. */}
        <span
          className={cx(
            "inline-flex items-center gap-1.5 border-2 border-ink px-2 py-0.5 font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-ink",
            stamp
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          {label}
        </span>
        <span className="font-typewriter text-[12.5px] leading-snug text-ink-muted">{note}</span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-link inline-flex min-h-[32px] items-center gap-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.06em] text-ink underline decoration-ink decoration-2 underline-offset-4"
          >
            Check it yourself
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          </a>
        )}
      </div>
    </figcaption>
  );

  if (portrait) {
    return (
      <figure
        className={cx(
          "case-wide relative mx-0 my-14 grid items-center gap-8 md:my-20 md:gap-14",
          flip ? "md:grid-cols-[minmax(0,1fr)_minmax(0,360px)]" : "md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
        )}
      >
        <div className={cx("relative", flip && "md:order-2")}>
          {print}
          {tall && (
            <HandNote
              arrow={flip ? "left" : "right"}
              arrowAt={flip ? "start" : "end"}
              tilt={-4}
              size="sm"
              className={cx("absolute top-1/3 hidden xl:inline-flex", flip ? "-right-44" : "-left-44")}
            >
              scroll it
            </HandNote>
          )}
        </div>
        <div className="relative">
          {slip}
          {href && (
            <HandNote arrow="up" arrowAt="above" tilt={3} size="sm" className="absolute -bottom-24 right-10 hidden lg:inline-flex">
              go on, check it
            </HandNote>
          )}
        </div>
      </figure>
    );
  }

  return (
    <figure className="case-wide relative mx-0 my-14 md:my-20">
      {print}
      <div className="relative">
        {slip}
        {href && (
          <HandNote arrow="left" arrowAt="start" tilt={-3} size="sm" className="absolute bottom-10 left-[690px] hidden xl:inline-flex">
            go on, check it
          </HandNote>
        )}
      </div>
    </figure>
  );
}
