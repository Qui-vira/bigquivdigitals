"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center px-6 py-28">
      <div className="mx-auto max-w-[560px] text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Error</p>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
          Something broke on my end.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-text-secondary">
          Not your fault. Try again, and if it keeps happening tell me directly and I will fix
          it.
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

        {error.digest && (
          <p className="mt-8 font-mono text-xs text-text-muted">Ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
