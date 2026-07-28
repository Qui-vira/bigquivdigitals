import Image from "next/image";
import { ShieldCheck, CircleAlert, BadgeCheck } from "lucide-react";

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

const TIERS: Record<Tier, { icon: typeof ShieldCheck; label: string; note: string }> = {
  Personal: {
    icon: ShieldCheck,
    label: "Personal",
    note: "Own account or system, counts visible on screen",
  },
  "Semi-verified": {
    icon: CircleAlert,
    label: "Semi-verified",
    note: "Publicly checkable, awaiting direct confirmation",
  },
  "Third-party": {
    icon: BadgeCheck,
    label: "Third-party",
    note: "Confirmed by someone other than me",
  },
};

/**
 * The unit the whole site argues from: a claim and the screenshot that proves
 * it, rendered together and never separable.
 *
 * The proof library stores claims in prose and evidence in image files, with
 * nothing joining them. This component is that join. Do not add a variant that
 * renders a claim without its image, or an image without its tier.
 */
export function Evidence({
  src,
  alt,
  claim,
  tier,
  href,
  width = 1200,
  height = 800,
}: EvidenceProps) {
  const { icon: Icon, label, note } = TIERS[tier];

  return (
    <figure className="my-12 overflow-hidden rounded-xl border border-border bg-bg-secondary">
      <div className="relative bg-bg-tertiary">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, 800px"
          className="h-auto w-full object-contain"
        />
      </div>

      <figcaption className="border-t border-border p-5 md:p-6">
        <p className="text-base font-semibold leading-snug text-text-primary md:text-lg">
          {claim}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Icon plus text, never colour alone. */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-tertiary px-2.5 py-1 text-xs font-medium text-text-secondary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </span>
          <span className="text-xs text-text-muted">{note}</span>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-hover"
            >
              Check it yourself
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
