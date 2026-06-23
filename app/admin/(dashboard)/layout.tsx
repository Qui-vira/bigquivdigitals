import { verifySession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  async function logout() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return <AdminShell logoutAction={logout}>{children}</AdminShell>;
}
