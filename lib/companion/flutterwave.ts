/**
 * Flutterwave v3 HTTP calls for TheEditCompanion. `fetch` is injected so tests
 * never touch the network. Docs read 2026-10-15:
 *  - create payment: POST https://api.flutterwave.com/v3/payments  (developer.flutterwave.com/docs/flutterwave-standard-1)
 *  - verify:         GET  https://api.flutterwave.com/v3/transactions/{id}/verify
 *  - by reference:   GET  https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=
 */
import { toMajor } from "./money";

const API = "https://api.flutterwave.com/v3";
export const FLW_CHECKOUT_HOST = "checkout.flutterwave.com";

type FetchFn = typeof fetch;

export class FlutterwaveError extends Error {
  constructor(message: string, readonly httpStatus?: number) {
    super(message);
    this.name = "FlutterwaveError";
  }
}

export async function createHostedPayment(opts: {
  fetch: FetchFn;
  secretKey: string;
  txRef: string;
  amountMinor: number;
  currency: "NGN";
  redirectUrl: string;
  email: string;
  name: string;
  orderId: string;
  title: string;
  sessionMinutes: number;
}): Promise<string> {
  if (!opts.secretKey) throw new FlutterwaveError("FLW_SECRET_KEY not configured");
  const res = await opts.fetch(`${API}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: opts.txRef,
      amount: toMajor(opts.amountMinor),
      currency: opts.currency,
      redirect_url: opts.redirectUrl,
      customer: { email: opts.email, name: opts.name },
      customizations: { title: opts.title },
      meta: { order_ref: opts.txRef, order_id: opts.orderId },
      payment_options: "card,banktransfer,ussd",
      configurations: { session_duration: opts.sessionMinutes, max_retry_attempt: 5 },
    }),
  });
  if (!res.ok) throw new FlutterwaveError("create payment failed", res.status);
  const body = (await res.json()) as { status?: unknown; data?: { link?: unknown } };
  const link = body?.data?.link;
  if (body?.status !== "success" || typeof link !== "string") throw new FlutterwaveError("create payment: bad response");
  let host = "";
  try {
    const u = new URL(link);
    host = u.protocol === "https:" ? u.hostname : "";
  } catch {
    host = "";
  }
  // Never hand the browser a link to anywhere else.
  if (host !== FLW_CHECKOUT_HOST) throw new FlutterwaveError("create payment: unexpected link host");
  return link;
}

/** What we keep from a verify response. Amount is MAJOR units, exactly as Flutterwave sent it. */
export type VerifiedTx = {
  txRef: unknown;
  status: unknown;
  currency: unknown;
  amount: unknown;
  providerTxId: string;
};

async function readVerify(res: Response): Promise<VerifiedTx | null> {
  // 404 / 400 = Flutterwave does not know this transaction: a definite "no".
  if (res.status === 400 || res.status === 404) return null;
  // Anything else non-2xx is a provider/network problem: THROW so callers retry.
  if (!res.ok) throw new FlutterwaveError("verify failed", res.status);
  const body = (await res.json()) as { status?: unknown; data?: Record<string, unknown> | null };
  if (body?.status !== "success" || !body.data || typeof body.data !== "object") return null;
  const d = body.data;
  if (d.id === undefined || d.id === null) return null;
  return { txRef: d.tx_ref, status: d.status, currency: d.currency, amount: d.amount, providerTxId: String(d.id) };
}

const headers = (secretKey: string) => ({ Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" });

/** transactionId must be digits only (it goes into a URL path). */
export async function verifyTransactionById(f: FetchFn, secretKey: string, transactionId: string): Promise<VerifiedTx | null> {
  if (!secretKey) throw new FlutterwaveError("FLW_SECRET_KEY not configured");
  if (!/^\d{1,20}$/.test(transactionId)) return null;
  return readVerify(await f(`${API}/transactions/${transactionId}/verify`, { headers: headers(secretKey) }));
}

export async function verifyTransactionByRef(f: FetchFn, secretKey: string, txRef: string): Promise<VerifiedTx | null> {
  if (!secretKey) throw new FlutterwaveError("FLW_SECRET_KEY not configured");
  return readVerify(
    await f(`${API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, { headers: headers(secretKey) }),
  );
}
