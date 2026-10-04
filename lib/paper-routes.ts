/**
 * Routes already migrated to the light paper design (redesign 2026-10).
 *
 * Two legacy global layers were built for the black site and have no job on
 * paper: the white ParticleField (invisible on white, and it paints over
 * in-flow content) and the CustomCursor ring. Both switch off on these routes.
 *
 * PHASE 2: add each route here in the same commit that migrates it. When every
 * public route is listed, delete both legacy layers and this file.
 */
const PAPER_EXACT = new Set<string>(["/"]);
const PAPER_PREFIXES: string[] = [];

export function isPaperRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (PAPER_EXACT.has(pathname)) return true;
  return PAPER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
