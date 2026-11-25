import type { Metadata } from "next";
import { ContactList } from "@/components/companion/ContactList";
import { formatNairaMinor } from "@/components/companion/format";
import { PurchasesRequestForm } from "@/components/companion/PurchasesRequestForm";
import { ReceiptButton } from "@/components/companion/ReceiptButton";
import { fmtDate } from "@/lib/companion/emails/templates";
import {
  loadPurchases,
  PURCHASES_NOTICES,
  type ClassSeatRow,
  type PurchaseRow,
  type PurchasesNotice,
} from "@/lib/companion/purchases-handler";
import { purchasesSecret } from "@/lib/companion/purchases-link";
import { getRuntime } from "@/lib/companion/runtime";
import "@/components/v3/pages/companion.css";
import "@/components/v3/pages/purchases.css";

// Private, per buyer, never cached. The token is in the URL, so no referrer leaves this page.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "My purchases | BigQuiv Digitals",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function Support() {
  return (
    <div className="v3-pur__support">
      <h2>Support contacts</h2>
      <div className="v3-contacts">
        <ContactList />
      </div>
    </div>
  );
}

function OrderCard({ row, token }: { row: PurchaseRow; token: string }) {
  const date = fmtDate(row.purchasedAt);
  const amount = formatNairaMinor(row.amountMinor);
  return (
    <li className="v3-pur__card">
      <h2>{row.productName}</h2>
      <dl className="v3-pur__dl">
        <div>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{amount}</dd>
        </div>
        <div>
          <dt>Order reference</dt>
          <dd className="v3-pur__ref">{row.orderRef}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{row.status === "paid" ? "Paid" : "Refunded"}</dd>
        </div>
      </dl>
      {row.status === "paid" ? (
        <div className="v3-pur__actions">
          <form method="POST" action="/api/companion/purchases/download">
            <input type="hidden" name="t" value={token} />
            <input type="hidden" name="ref" value={row.orderRef} />
            <button type="submit" className="v3-btn">
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

/** A class seat, the combo or coaching (course_purchases). Nothing to download, so no buttons. */
function SeatCard({ row }: { row: ClassSeatRow }) {
  const amount =
    row.currency.toUpperCase() === "NGN" ? formatNairaMinor(Math.round(row.amount * 100)) : `${row.amount} ${row.currency.toUpperCase()}`;
  return (
    <li className="v3-pur__card" data-slug={row.slug}>
      <h2>{row.productName}</h2>
      <dl className="v3-pur__dl">
        <div>
          <dt>Date</dt>
          <dd>{fmtDate(row.purchasedAt)}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{amount}</dd>
        </div>
        {row.ref ? (
          <div>
            <dt>Payment reference</dt>
            <dd className="v3-pur__ref">{row.ref}</dd>
          </div>
        ) : null}
        <div>
          <dt>Status</dt>
          <dd>{row.kind === "coaching" ? "Paid" : "Seat confirmed"}</dd>
        </div>
      </dl>
      {row.next ? <p className="v3-pur__small">{row.next}</p> : null}
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
      <section className="v3 v3-pur" data-nav="cloud" aria-labelledby="purchases-h">
        <div className="v3-pur__wrap">
          <h1 id="purchases-h">This link has expired</h1>
          <p className="v3-pur__lede">Sign-in links work for 30 minutes. Enter your email to get a new one.</p>
          <div className="v3-pur__card">
            <PurchasesRequestForm />
          </div>
          <Support />
        </div>
      </section>
    );
  }

  return (
    <section className="v3 v3-pur" data-nav="cloud" aria-labelledby="purchases-h">
      <div className="v3-pur__wrap">
        <h1 id="purchases-h">My purchases</h1>
        <p className="v3-pur__lede">
          Orders for <strong>{view.email}</strong>. This page works for 30 minutes from when we sent the link.
        </p>
        {notice ? (
          <p role="alert" className="v3-pur__notice">
            {notice}
          </p>
        ) : null}
        {view.orders.length === 0 && view.classes.length === 0 ? (
          <p className="v3-pur__empty">We found no orders for this email.</p>
        ) : (
          <ul className="v3-pur__orders">
            {view.orders.map((row) => (
              <OrderCard key={row.orderRef} row={row} token={token} />
            ))}
            {view.classes.map((row) => (
              <SeatCard key={`${row.slug}:${row.ref ?? ""}`} row={row} />
            ))}
          </ul>
        )}
        {view.orders.length > 0 ? (
          <p className="v3-pur__small">Download gives you a new download link. Your older emailed link stops working.</p>
        ) : null}
        <Support />
      </div>
    </section>
  );
}
