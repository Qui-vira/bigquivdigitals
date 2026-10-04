"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isPaperRoute } from "@/lib/paper-routes";

const ParticleField = dynamic(
  () => import("@/components/ParticleField").then((mod) => ({ default: mod.ParticleField })),
  { ssr: false }
);

/** Off on paper routes: white particles on a white page are pure cost. */
export function ParticleFieldLoader() {
  const pathname = usePathname();
  if (isPaperRoute(pathname)) return null;
  return <ParticleField />;
}
