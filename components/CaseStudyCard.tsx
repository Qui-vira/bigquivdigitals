import Image from "next/image";
import Link from "next/link";
import { PhotoPrint, Sticker } from "@/components/ui-paper";

interface CaseStudyCardProps {
  href: string;
  tag: string;
  /** The claim, carrying one real number. */
  claim: string;
  support: string;
  image: string;
  imageAlt: string;
  /** Degrees. Vary it across a set so the prints do not line up like tiles. */
  tilt?: number;
  attach?: "tape" | "tape-corners" | "clip" | "pin";
}

/**
 * Screenshot-first. The image is the content, not decoration.
 *
 * The old portfolio cards were four bullet points of unbacked stats. This
 * shows the work instead of asserting it, and the whole card is one link
 * target so there is no small hit area to hunt for.
 *
 * Paper redesign (2026-10): the same pinned print the homepage's case-study
 * board uses (components/HomeClient.tsx, section 3), as a reusable card.
 */
export function CaseStudyCard({
  href,
  tag,
  claim,
  support,
  image,
  imageAlt,
  tilt = -1.6,
  attach = "tape",
}: CaseStudyCardProps) {
  return (
    <Link href={href} className="group block">
      {/* aspect-ratio declared so nothing shifts while the image loads */}
      <PhotoPrint tilt={tilt} attach={attach} lift="group" mat="even">
        <div className="relative aspect-[16/10]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1200px) 46vw, 560px"
            className="object-cover object-top"
          />
        </div>
      </PhotoPrint>

      <div className="mt-8 px-1">
        <Sticker shape="label" tone={tilt < 0 ? "tint" : "gold"} tilt={tilt < 0 ? -2 : 2} decorative={false}>
          {tag}
        </Sticker>
        <h3 className="mt-5 font-display text-[1.4rem] font-bold leading-[1.15] tracking-[-0.015em] text-ink text-balance md:text-[1.6rem]">
          {claim}
        </h3>
        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink-soft md:text-base">{support}</p>
        <span className="mt-5 inline-flex items-center gap-2 border-b-[3px] border-ink pb-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink transition-[gap] duration-200 group-hover:gap-3.5">
          Read the build <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  );
}
