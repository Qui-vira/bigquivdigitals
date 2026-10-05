"use client";

import { usePathname } from "next/navigation";
import { CheckerStrip } from "@/components/ui-paper";

/**
 * Route loading state. Skeleton shaped like the page shell rather than a
 * spinner, so nothing jumps when data lands.
 *
 * This file sits at the app root, so it also wraps the admin area, which is
 * out of scope for the paper redesign. Admin routes keep the original dark
 * skeleton exactly; every public route gets the paper one.
 *
 * Paper skeleton: grid paper, dashed ink outlines where the headline, the
 * copy and a print will land, and a checker strip that runs along like a
 * conveyor (the one moving part, so the page reads as working). Nothing
 * fades: the motion is a transform, and reduced motion stops it (the
 * .animate-marquee rule in globals.css).
 */
function AdminSkeleton() {
  return (
    <div role="status" className="px-6 pt-28 pb-24 md:pt-36" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-[900px] animate-pulse">
        <div className="mx-auto h-4 w-40 rounded bg-bg-secondary" />
        <div className="mx-auto mt-8 h-12 w-full rounded bg-bg-secondary" />
        <div className="mx-auto mt-4 h-12 w-3/4 rounded bg-bg-secondary" />
        <div className="mx-auto mt-8 h-20 w-full rounded bg-bg-secondary" />
        <div className="mx-auto mt-10 flex justify-center gap-4">
          <div className="h-12 w-36 rounded-lg bg-bg-secondary" />
          <div className="h-12 w-36 rounded-lg bg-bg-secondary" />
        </div>
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}

const DASH = "border-2 border-dashed border-ink/30";

function PaperSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="paper-scope min-h-[100dvh] overflow-x-clip bg-grid-paper text-ink">
      <div aria-hidden="true" className="overflow-hidden pt-[67px] md:pt-[75px]">
        <div className="w-[4200px] animate-marquee" style={{ animationDuration: "9s" }}>
          <CheckerStrip />
        </div>
      </div>

      <div aria-hidden="true" className="mx-auto grid max-w-[1320px] items-center gap-16 px-4 pb-24 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div>
          <div className={`h-8 w-36 ${DASH}`} />
          <div className={`mt-8 h-16 w-full max-w-[560px] ${DASH} md:h-20`} />
          <div className={`mt-4 h-16 w-4/5 max-w-[480px] ${DASH} md:h-20`} />
          <div className="mt-10 space-y-3">
            <div className="h-3 w-full max-w-[520px] bg-ink/10" />
            <div className="h-3 w-11/12 max-w-[500px] bg-ink/10" />
            <div className="h-3 w-3/5 max-w-[340px] bg-ink/10" />
          </div>
          <div className="mt-10 h-[60px] w-52 border-[3px] border-ink/30 bg-gold-tint shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]" />
        </div>

        {/* where a print will land */}
        <div className="mx-auto w-full max-w-[400px]" style={{ rotate: "-2deg" }}>
          <div className="border-[3px] border-ink/30 bg-paper p-3 pb-12 shadow-[6px_6px_0_0_rgba(17,17,17,0.15)]">
            <div className="aspect-[4/5] border-2 border-ink/20 bg-paper-alt" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function Loading() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <AdminSkeleton />;
  return <PaperSkeleton />;
}
