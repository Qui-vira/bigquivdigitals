"use client";

import { usePathname } from "next/navigation";
import "@/components/v3/pages/notfound.css";

/**
 * Route loading state. Skeleton shaped like the page shell rather than a
 * spinner, so nothing jumps when data lands.
 *
 * This file sits at the app root, so it also wraps the admin area, which is
 * out of scope for the redesign. Admin routes keep the original dark
 * skeleton exactly; every public route gets the v3 one.
 *
 * Public skeleton (v3, 2026-10-19): see PublicSkeleton below.
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

/**
 * v3 public skeleton: a navy screen (most pages open on a navy stage, so the
 * page lands without a flash) with the wordmark's gold dot rolling along a
 * rule. CSS only, no 3D: a loading state must be the lightest thing on the
 * site. Reduced motion: the dot rests.
 */
function PublicSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="v3 v3-loading" data-nav="navy">
      <div className="v3-loading__track" aria-hidden="true">
        <span className="v3-loading__dot" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function Loading() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return <AdminSkeleton />;
  return <PublicSkeleton />;
}
