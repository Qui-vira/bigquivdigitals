import { ParticleFieldLoader } from "@/components/ParticleFieldLoader";
import { CustomCursor } from "@/components/CustomCursor";

/**
 * Admin-only chrome. The ParticleField and the CustomCursor ring were built for
 * the old black site and used to sit in the root layout for every route. Since
 * the October 2026 paper redesign every public route is light and neither layer
 * has a job there, so they moved here: the admin keeps its dark look exactly as
 * it was, and public pages no longer ship either layer.
 *
 * This layout wraps both /admin/login and the (dashboard) group. It adds no
 * auth of its own; the guard stays in app/admin/(dashboard)/layout.tsx.
 */
export default function AdminChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      <ParticleFieldLoader />
      {children}
    </>
  );
}
