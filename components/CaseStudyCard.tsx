import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CaseStudyCardProps {
  href: string;
  tag: string;
  /** The claim, carrying one real number. */
  claim: string;
  support: string;
  image: string;
  imageAlt: string;
}

/**
 * Screenshot-first. The image is the content, not decoration.
 *
 * The old portfolio cards were four bullet points of unbacked stats. This
 * shows the work instead of asserting it, and the whole card is one link
 * target so there is no small hit area to hunt for.
 */
export function CaseStudyCard({
  href,
  tag,
  claim,
  support,
  image,
  imageAlt,
}: CaseStudyCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary transition-colors duration-200 hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {/* aspect-ratio declared so nothing shifts while the image loads */}
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-tertiary">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <span className="text-xs font-medium uppercase tracking-widest text-accent">
          {tag}
        </span>

        <h3 className="mt-3 text-lg font-bold leading-snug text-text-primary md:text-xl">
          {claim}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-text-secondary">
          {support}
        </p>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          Read the build
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
