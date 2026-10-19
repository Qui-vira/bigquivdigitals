import { requireAdmin } from "@/lib/require-admin";
import { adminExportCsv, ORDER_STATUSES } from "@/lib/companion/admin-ops";
import { getRuntime } from "@/lib/companion/runtime";
import { sanitiseSrc } from "@/lib/companion/src";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const csv = await adminExportCsv(await getRuntime(), requireAdmin, {
    status: ORDER_STATUSES.find((s) => s === status),
    src: sanitiseSrc(sp.get("src")) ?? undefined,
  });
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="companion-orders.csv"',
      "cache-control": "no-store",
    },
  });
}
