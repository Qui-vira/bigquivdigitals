"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { BrutalButton, PaperSection, Sticker, Tape } from "@/components/ui-paper";

/**
 * Root error boundary. Public routes get the paper note; the admin area
 * (out of scope for the redesign) keeps its original dark layout exactly.
 * Copy is unchanged in both.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
  }, [error]);

  if (pathname?.startsWith("/admin")) {
    return (
      <div className="flex min-h-[70vh] items-center px-6 py-28">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Error</p>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Something broke on my end.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            Not your fault. Try again, and if it keeps happening tell me directly and I will fix it.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Try again
            </button>
            <Link
              href="/contact"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
            >
              Tell me about it
            </Link>
          </div>
          {error.digest && <p className="mt-8 font-mono text-xs text-text-muted">Ref: {error.digest}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      <PaperSection ground="grid" pad="none" width="mid" innerClassName="pb-32 pt-28 md:pb-40 md:pt-36" aria-labelledby="error-heading">
        <div className="relative mx-auto max-w-[620px]">
          <div
            className="relative border-[3px] border-ink bg-paper px-6 py-12 shadow-brutal-lg sm:px-12 sm:py-14"
            style={{ rotate: "1.2deg" }}
          >
            <Tape className="-top-3.5 left-10" tilt={-6} width={100} />
            <Tape className="-top-3.5 right-10" tilt={5} width={100} />
            <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false}>
              Error
            </Sticker>
            <h1
              id="error-heading"
              className="mt-7 font-didone text-[clamp(2.6rem,6.4vw,4rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink text-balance"
            >
              Something broke on my end.
            </h1>
            <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
              Not your fault. Try again, and if it keeps happening tell me directly and I will fix it.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-5">
              <BrutalButton onClick={reset} arrow={false}>
                Try again
              </BrutalButton>
              <BrutalButton href="/contact" variant="paper">
                Tell me about it
              </BrutalButton>
            </div>

            {error.digest && (
              <p className="mt-9 border-t-2 border-dashed border-ink/40 pt-4 font-typewriter text-[13px] text-ink-muted">
                Ref: {error.digest}
              </p>
            )}
          </div>
          <Sticker shape="starburst" tone="paper" size={92} tilt={-12} reveal={false} className="absolute -bottom-10 -left-6 sm:-left-12" />
        </div>
      </PaperSection>
    </div>
  );
}
