import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-[760px]">
        <Link
          href="/#work"
          className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All work
        </Link>

        <article className="mt-10">{children}</article>

        <div className="mt-20 rounded-xl border border-border bg-bg-secondary p-8 text-center">
          <p className="text-lg font-semibold text-text-primary">
            Want this built for your brand?
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            Thirty minutes. No deck, no pitch. You leave with the plan whether you hire me or
            not.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Book a call
          </Link>
        </div>
      </div>
    </div>
  );
}
