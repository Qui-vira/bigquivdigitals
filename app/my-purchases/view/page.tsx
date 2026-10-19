import type { Metadata } from "next";
import { ContactList } from "@/components/companion/ContactList";
import { formatNairaMinor } from "@/components/companion/format";
import { PurchasesRequestForm } from "@/components/companion/PurchasesRequestForm";
import { ReceiptButton } from "@/components/companion/ReceiptButton";
import { PaperSection, SectionHead } from "@/components/ui-paper";
import { fmtDate } from "@/lib/companion/emails/templates";
import { loadPurchases, PURCHASES_NOTICES, type PurchaseRow, type PurchasesNotice } from "@/lib/companion/purchases-handler";
import { purchasesSecret } from "@/lib/companion/purchases-link";
import { getRuntime } from "@/lib/companion/runtime";

// Private, per buyer, never cached. The token is in the URL, so no referrer leaves this page.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "My purchases | BigQuiv Digitals",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const dtCls = "font-typewriter text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft";
const ddCls = "text-[16px] font-semibold text-ink";
const downloadCls =
  "paper-focus inline-flex min-h-[44px] cursor-pointer items-center justify-center border-[3px] border-ink bg-gold px-5 font-display text-[15px] font-bold text-ink shadow-brutal-sm transition-[translate,box-shadow,background-color] duration-150 hover:bg-gold-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_#111111]";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function Support() {
  return (
    <div className="mt-10">
      <h2 className="font-display text-[22px] font-bold text-ink">Support contacts</h2>
      <ContactList className="mt-4" />
    </div>
  );
}

function OrderCard({ row, token }: { row: PurchaseRow; token: string }) {
  const date = fmtDate(row.purchasedAt);
  const amount = formatNairaMinor(row.amountMinor);
  return (
    <li className="border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-6">
      <h2 className="font-display text-[22px] font-bold text-ink">{row.productName}</h2>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className={dtCls}>Date</dt>
          <dd className={ddCls}>{date}</dd>
        </div>
        <div>
          <dt className={dtCls}>Amount paid</dt>
          <dd className={ddCls}>{amount}</dd>
        </div>
        <div>
          <dt className={dtCls}>Order reference</dt>
          <dd className={`${ddCls} select-text break-all`}>{row.orderRef}</dd>
        </div>
        <div>
          <dt className={dtCls}>Status</dt>
          <dd className={ddCls}>{row.status === "paid" ? "Paid" : "Refunded"}</dd>
        </div>
      </dl>
      {row.status === "paid" ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <form method="POST" action="/api/companion/purchases/download">
            <input type="hidden" name="t" value={token} />
            <input type="hidden" name="ref" value={row.orderRef} />
            <button type="submit" className={downloadCls}>
              Download
            </button>
          </form>
          <ReceiptButton
            receipt={{
              orderRef: row.orderRef,
              date,
              productName: row.productName,
              amount,
              buyerName: row.buyerName,
              buyerEmail: row.buyerEmail,
            }}
          />
        </div>
      ) : null}
    </li>
  );
}

export default async function MyPurchasesViewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = (await searchParams) ?? {};
  const token = first(q.t) ?? "";
  const m = first(q.m);
  const notice = m && m in PURCHASES_NOTICES ? PURCHASES_NOTICES[m as PurchasesNotice] : null;
  const view = token ? await loadPurchases(await getRuntime(), token, purchasesSecret()) : ({ ok: false } as const);

  if (!view.ok) {
    return (
      <PaperSection ground="grid" width="text" pad="lg" aria-labelledby="purchases-h">
        <SectionHead as="h1" id="purchases-h" title="This link has expired" size="md" />
        <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
          Sign-in links work for 30 minutes. Enter your email to get a new one.
        </p>
        <div className="mt-8 border-[3px] border-ink bg-paper p-5 shadow-brutal sm:p-8">
          <PurchasesRequestForm />
        </div>
        <Support />
      </PaperSection>
    );
  }

  return (
    <PaperSection ground="grid" width="text" pad="lg" aria-labelledby="purchases-h">
      <SectionHead as="h1" id="purchases-h" title="My purchases" size="md" />
      <p className="mt-6 max-w-[68ch] text-[17px] leading-relaxed text-ink-soft">
        Orders for <span className="select-text break-all font-semibold text-ink">{view.email}</span>. This page works for 30
        minutes from when we sent the link.
      </p>
      {notice ? (
        <p role="alert" className="mt-6 inline-block border-2 border-ink bg-gold-tint px-2 py-0.5 text-[15px] font-semibold text-ink">
          {notice}
        </p>
      ) : null}
      {view.orders.length === 0 ? (
        <p className="mt-8 text-[17px] text-ink">We found no orders for this email.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {view.orders.map((row) => (
            <OrderCard key={row.orderRef} row={row} token={token} />
          ))}
        </ul>
      )}
      <p className="mt-6 max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">
        Download gives you a new download link. Your older emailed link stops working.
      </p>
      <Support />
    </PaperSection>
  );
}
