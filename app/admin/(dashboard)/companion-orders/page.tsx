import { requireAdmin } from "@/lib/require-admin";
import { adminListEvents, adminListOrders, ORDER_STATUSES } from "@/lib/companion/admin-ops";
import { getRuntime } from "@/lib/companion/runtime";
import { sanitiseSrc } from "@/lib/companion/src";
import { formatMinor } from "@/lib/companion/money";
import { markTransferPaidAction, resendAction, revokeAction } from "@/app/admin/actions/companion-orders";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const day = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "-");

export default async function CompanionOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === one(sp.status));
  const src = sanitiseSrc(one(sp.src)) ?? undefined;
  const rt = await getRuntime();
  const rows = await adminListOrders(rt, requireAdmin, { status, src, limit: 300 });
  const eventsFor = one(sp.events);
  const events = eventsFor ? await adminListEvents(rt, requireAdmin, eventsFor) : [];
  const msg = one(sp.msg);
  const exportQs = new URLSearchParams({ ...(status ? { status } : {}), ...(src ? { src } : {}) }).toString();

  return (
    <div className="p-6 text-sm text-[#ddd]">
      <h1 className="mb-4 text-2xl font-bold text-white">Companion orders</h1>
      {msg && <p className="mb-4 rounded bg-[#1a1a1a] p-3">{msg}</p>}

      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3">
        <label>
          Status
          <select name="status" defaultValue={status ?? ""} className="ml-2 rounded bg-[#1a1a1a] p-2">
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <input name="src" defaultValue={src ?? ""} className="ml-2 rounded bg-[#1a1a1a] p-2" />
        </label>
        <button className="rounded bg-[#333] px-3 py-2">Filter</button>
        <a className="rounded bg-[#333] px-3 py-2" href={`/api/admin/companion-orders/export?${exportQs}`}>
          Export CSV
        </a>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="text-[#888]">
            <tr>
              <th className="p-2">Email / name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Tier</th>
              <th className="p-2">Amount (NGN)</th>
              <th className="p-2">Src</th>
              <th className="p-2">Support until</th>
              <th className="p-2">Downloads</th>
              <th className="p-2">Email</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ order: o, downloadCount, email, duplicatePayment }) => {
              const failed = o.status === "paid" && !email.sentAt && !!email.lastError;
              return (
                <tr key={o.id} className="border-t border-[#222] align-top">
                  <td className="p-2">
                    {o.email}
                    <br />
                    <span className="text-[#888]">
                      {o.name} ({o.orderRef})
                    </span>
                  </td>
                  <td className="p-2">{o.status}</td>
                  <td className="p-2">{o.priceTier}</td>
                  <td className="p-2">{formatMinor(o.amountReceivedMinor ?? o.expectedMinor)}</td>
                  <td className="p-2">{o.src ?? "-"}</td>
                  <td className="p-2">{day(o.supportUntil)}</td>
                  <td className="p-2">{downloadCount}</td>
                  <td className="p-2">
                    {email.sentAt ? `sent ${day(email.sentAt)}` : "not sent"}
                    {duplicatePayment && (
                      <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Duplicate payment</span>
                    )}
                    {failed && (
                      <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Delivery failed</span>
                    )}
                  </td>
                  <td className="space-y-2 p-2">
                    {o.status === "paid" && (
                      <div className="flex gap-2">
                        <form action={resendAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <label className="block text-xs">
                            <input type="checkbox" name="revokeAll" /> also revoke thanks link
                          </label>
                          <button className="rounded bg-[#333] px-2 py-1">Re-send</button>
                        </form>
                        <form action={revokeAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button className="rounded bg-[#333] px-2 py-1">Revoke</button>
                        </form>
                      </div>
                    )}
                    {o.method === "bank_transfer" && (o.status === "awaiting_transfer" || o.status === "underpaid") && (
                      <form action={markTransferPaidAction} className="space-y-1">
                        <input type="hidden" name="orderId" value={o.id} />
                        <input name="amount" placeholder="Amount received (NGN)" required className="w-full rounded bg-[#1a1a1a] p-1" />
                        <input name="reference" placeholder="Bank reference" required className="w-full rounded bg-[#1a1a1a] p-1" />
                        <input name="note" placeholder="Note (needed to accept less or reuse a reference)" className="w-full rounded bg-[#1a1a1a] p-1" />
                        <label className="block">
                          <input type="checkbox" name="force" /> Accept less than expected
                        </label>
                        <label className="block">
                          <input type="checkbox" name="overrideReference" /> This bank reference was already used on another order, mark paid anyway (note required)
                        </label>
                        <button className="rounded bg-[#333] px-2 py-1">Mark transfer paid</button>
                      </form>
                    )}
                    <a className="underline" href={`?events=${o.id}`}>
                      Event log
                    </a>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-[#888]">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {eventsFor && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-white">Event log</h2>
          <ul className="space-y-1">
            {events.map((e, i) => (
              <li key={i}>
                {e.at.toISOString()} | {e.actor} | {e.kind} | {e.detail}
              </li>
            ))}
            {events.length === 0 && <li className="text-[#888]">No events.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
