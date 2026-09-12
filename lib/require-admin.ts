import "server-only";
import { verifySession } from "@/lib/auth";

/**
 * require-admin.ts — the authorization check every admin server action calls.
 *
 * ⚠ A SERVER ACTION IS A PUBLIC POST ENDPOINT. It is not protected by the page
 * it happens to be imported from. `proxy.ts` matches `/admin/:path*` and server
 * actions are dispatched by a `Next-Action` header, so treating the page gate as
 * the control is a mistake about how the framework works.
 *
 * The comment in `app/admin/(dashboard)/layout.tsx` used to imply the layout's
 * `verifySession()` covered these. It cannot: a layout runs during *render*,
 * which happens after the action body has already executed. By then the row is
 * deleted.
 *
 * Until 2026-09-12 only `graph.ts` guarded itself; the other ten files exported
 * 36 unguarded mutations including `deleteCaseStudy` and `updateSettings`. They
 * were not reachable in practice, because Next forwards an action POST to the
 * owning `/admin/*` route and the proxy redirects it, but that is an accident of
 * routing rather than a control. This makes it a control.
 *
 * 🛑 CALL THIS FIRST IN EVERY EXPORTED ACTION, before reading arguments and
 * before touching a database. The one file that must never call it is
 * `app/admin/actions/auth.ts`, which is how a person logs in.
 */
export async function requireAdmin() {
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
