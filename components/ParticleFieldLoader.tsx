"use client";

import dynamic from "next/dynamic";

const ParticleField = dynamic(
  () => import("@/components/ParticleField").then((mod) => ({ default: mod.ParticleField })),
  { ssr: false }
);

/** Admin only (app/admin/layout.tsx). Public pages are paper and never load it. */
export function ParticleFieldLoader() {
  return <ParticleField />;
}
