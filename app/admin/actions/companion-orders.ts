"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { adminMarkTransferPaid, adminResend, adminRevoke } from "@/lib/companion/admin-ops";
import { getRuntime } from "@/lib/companion/runtime";

const BACK = "/admin/companion-orders";

function done(msg: string): never {
  revalidatePath(BACK);
  redirect(`${BACK}?msg=${encodeURIComponent(msg)}`);
}

export async function markTransferPaidAction(formData: FormData) {
  await requireAdmin();
  const res = await adminMarkTransferPaid(await getRuntime(), requireAdmin, {
    orderId: String(formData.get("orderId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    reference: String(formData.get("reference") ?? ""),
    note: String(formData.get("note") ?? ""),
    force: formData.get("force") === "on",
    overrideReference: formData.get("overrideReference") === "on",
  });
  if (!res.ok && res.reason === "reference_used") {
    done(`Not marked paid: this bank reference was already used on ${(res.usedBy ?? []).join(", ")}. If it is correct, tick the override box and add a note.`);
  }
  if (!res.ok) done(`Not marked paid: ${res.reason}`);
  done(res.delivery.ok ? "Marked paid and email sent." : `Marked paid. Email problem: ${res.delivery.reason ?? "unknown"}`);
}

export async function resendAction(formData: FormData) {
  await requireAdmin();
  const res = await adminResend(await getRuntime(), requireAdmin, String(formData.get("orderId") ?? ""), {
    revokeAll: formData.get("revokeAll") === "on",
  });
  done(res.ok ? "New link sent. Old links revoked." : `Re-send failed: ${res.reason}`);
}

export async function revokeAction(formData: FormData) {
  await requireAdmin();
  const n = await adminRevoke(await getRuntime(), requireAdmin, String(formData.get("orderId") ?? ""));
  done(`Revoked ${n} link(s).`);
}
