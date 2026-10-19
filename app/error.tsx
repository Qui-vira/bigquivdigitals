"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/notfound.css";

/**
 * Root error boundary. Public routes get the v3 card on navy (comp: NotFound.dc.html,
 * the error state); no 3D here, so the page that broke loads nothing heavy. The admin area
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
    <div className="v3 v3-err">
      <section className="v3-section v3-section--navy v3-grain v3-err__wrap" data-nav="navy" aria-labelledby="error-heading">
        <div className="v3-err__card">
          <p className="v3-err__label">Error</p>
          <h1 id="error-heading" className="v3-display v3-err__h">
            Something broke on my end.
          </h1>
          <p className="v3-err__p">Not your fault. Try again, and if it keeps happening tell me directly and I will fix it.</p>
          <div className="v3-err__actions">
            <button type="button" onClick={reset} className="v3-btn v3-btn--lg">
              Try again
            </button>
            <Link href="/contact" className="v3-link">
              Tell me about it <Arrow className="v3-err__arrow" />
            </Link>
          </div>
          {error.digest && <p className="v3-err__ref">Ref: {error.digest}</p>}
        </div>
      </section>
    </div>
  );
}
