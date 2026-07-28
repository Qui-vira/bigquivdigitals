import { verifySession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: this layout is the ONLY admin auth guard. There is no middleware.ts,
  // so any admin route created OUTSIDE the (dashboard) route group is
  // unprotected by default. Put new admin pages inside this group.
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  async function logout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return <AdminShell logoutAction={logout}>{children}</AdminShell>;
}
