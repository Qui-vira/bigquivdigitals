/**
 * Shared harness for the end-to-end lifecycle tests. Wires the REAL handlers
 * (checkout, webhook, return, transfer-paid, delivery, download, order-status,
 * admin-ops) to in-memory fakes: DeliveryMemoryStore, a fake email sender, a
 * local-disk fake file store, a fake Flutterwave (verify + create-payment) and a
 * recording alert sink. No database, no network, no real email.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CLAIM_COOKIE_NAME, THANKS_COOKIE_NAME } from "../../lib/companion/claim";
import { handleCheckout, type CheckoutResult } from "../../lib/companion/checkout-handler";
import type { PaymentsDeps } from "../../lib/companion/deps";
import { deliverOrderWith } from "../../lib/companion/delivery";
import { DeliveryMemoryStore } from "../../lib/companion/delivery-memory";
import { handleDownload, handleOrderStatus, type StatusOutcome } from "../../lib/companion/download-handler";
import type { EmailSender, OutgoingEmail, SendResult } from "../../lib/companion/emails/sender";
import { DEFAULT_FILE_KEY, LocalDiskFileStore } from "../../lib/companion/file-store";
import { handleCompanionFlutterwaveWebhook } from "../../lib/companion/flutterwave-handler";
import type { Runtime } from "../../lib/companion/runtime";
import { MemoryStore, sampleProduct } from "../../lib/companion/testing/memory-store";
import type { Order, Product } from "../../lib/companion/types";

export const SLUG = "theeditcompanion";
export const FLW_HASH = "e2e-secret-hash";
export const ZIP_BYTES = Buffer.from("PK-e2e-fake-zip-".repeat(600));
export const GOOD_ORIGIN = "https://bigquivdigitals.com";
export const T0 = new Date("2026-11-01T10:00:00Z");

export class FakeSender implements EmailSender {
  sent: OutgoingEmail[] = [];
  attempts = 0;
  /** Fail the next N sends, or all when "always". */
  failNext: number | "always" = 0;
  async send(m: OutgoingEmail): Promise<SendResult> {
    this.attempts++;
    if (this.failNext === "always" || (typeof this.failNext === "number" && this.failNext > 0)) {
      if (typeof this.failNext === "number") this.failNext--;
      return { ok: false, error: "resend: simulated outage" };
    }
    this.sent.push(m);
    return { ok: true };
  }
}

export type FlwTx = { id: number | string; tx_ref: string; status: string; currency: string; amount: number | string };

export class FakeFlutterwave {
  txs = new Map<string, FlwTx>();
  calls: { url: string; method: string; body: unknown }[] = [];
  /** "down" makes every call answer 500. */
  mode: "ok" | "down" = "ok";
  createFails = false;
  fetch: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method ?? "GET";
    let body: unknown = null;
    try {
      body = init?.body ? JSON.parse(String(init.body)) : null;
    } catch {
      body = null;
    }
    this.calls.push({ url, method, body });
    const json = (status: number, j: unknown) => new Response(JSON.stringify(j), { status });
    if (this.mode === "down") return json(500, {});
    if (url.endsWith("/v3/payments") && method === "POST") {
      if (this.createFails) return json(500, {});
      const ref = (body as { tx_ref: string }).tx_ref;
      return json(200, { status: "success", data: { link: `https://checkout.flutterwave.com/v3/hosted/pay/${encodeURIComponent(ref)}` } });
    }
    const byId = url.match(/\/v3\/transactions\/(\d+)\/verify$/);
    if (byId) {
      const t = this.txs.get(byId[1]);
      return t ? json(200, { status: "success", data: t }) : json(404, { status: "error" });
    }
    const byRef = url.match(/verify_by_reference\?tx_ref=([^&]+)/);
    if (byRef) {
      const ref = decodeURIComponent(byRef[1]);
      const t = [...this.txs.values()].find((x) => x.tx_ref === ref);
      return t ? json(200, { status: "success", data: t }) : json(404, { status: "error" });
    }
    return json(404, {});
  };
  verifyCalls() {
    return this.calls.filter((c) => /verify/.test(c.url)).length;
  }
}

export type World = Awaited<ReturnType<typeof makeWorld>>;

let ipN = 0;
/** A fresh client IP per request so the in-process rate limiters never interfere with a scenario. */
export const freshIp = () => `10.${(ipN >> 16) & 255}.${(ipN >> 8) & 255}.${++ipN & 255}`;

export async function makeWorld(opts: { product?: Partial<Product>; bankDetails?: string | null; withFile?: boolean } = {}) {
  delete process.env.COMPANION_FILE_KEY;
  const store = new DeliveryMemoryStore();
  store.products.set(SLUG, sampleProduct(opts.product ?? {}));
  const dir = await mkdtemp(path.join(tmpdir(), "tec-e2e-"));
  if (opts.withFile !== false) {
    await mkdir(path.dirname(path.join(dir, DEFAULT_FILE_KEY)), { recursive: true });
    await writeFile(path.join(dir, DEFAULT_FILE_KEY), ZIP_BYTES);
  }
  const sender = new FakeSender();
  const alerts: { subject: string; text: string }[] = [];
  const logs: string[] = [];
  const clock = { t: new Date(T0) };
  const flw = new FakeFlutterwave();
  const bank = { details: opts.bankDetails === undefined ? "GTBank 0123456789 BigQuiv Digitals" : opts.bankDetails };
  const rt: Runtime = {
    store,
    files: new LocalDiskFileStore(dir),
    sender,
    notifier: { alertOwner: async (subject: string, text: string) => (alerts.push({ subject, text }), true) },
    baseUrl: "https://example.test",
    ipSalt: "e2e-salt",
    now: () => clock.t,
  };
  const pending: Promise<unknown>[] = [];
  const deliveries: string[] = [];
  const hold = { gate: null as Promise<void> | null };
  const deps: PaymentsDeps = {
    store,
    now: () => clock.t,
    fetch: flw.fetch,
    env: { flwSecretKey: "e2e-key", flwSecretHash: FLW_HASH, ipSalt: "e2e-salt", production: false },
    scheduleDelivery(orderId: string) {
      deliveries.push(orderId);
      pending.push(
        (async () => {
          if (hold.gate) await hold.gate;
          return deliverOrderWith(rt, orderId);
        })(),
      );
    },
    alert: async (subject: string, text: string) => void alerts.push({ subject, text }),
    log: (m: string) => void logs.push(m),
    sendBuyerEmail: (m: { to: string; subject: string; html: string; text: string }) => sender.send(m),
    getBankDetails: async () => bank.details,
    countOrdersByEmailSince: async (email: string, since: Date) => {
      let n = 0;
      for (const o of store.orders.values()) if (o.email === email && o.createdAt >= since) n++;
      return n;
    },
  };
  return {
    store, rt, deps, sender, alerts, logs, clock, flw, bank, deliveries, hold,
    /** Wait for every scheduled delivery to finish. */
    async settle() {
      let n = -1;
      while (n !== pending.length) {
        n = pending.length;
        await Promise.allSettled(pending);
      }
    },
    orders: () => [...store.orders.values()],
  };
}

export const validBody = (over: Record<string, unknown> = {}) => ({
  name: "Ada Okafor",
  email: "ada@example.com",
  consentFinal: true,
  consentImmediate: true,
  ...over,
});

/** Run checkout and return the result plus the order row it created (when ok). */
export async function checkout(w: World, over: Record<string, unknown> = {}, ip: string | null = freshIp()) {
  const res: CheckoutResult = await handleCheckout(w.deps, { body: validBody(over), ip });
  let order: Order | null = null;
  if (res.status === 200) {
    const ref = String(res.body.ref);
    order = await w.store.getOrderByRef(ref);
    assert.ok(order, "order row exists after a 200 checkout");
  }
  return { res, order, claim: res.claimToken };
}

let txN = 700000;
/** Register a Flutterwave transaction for the order (as the verify API would return it). */
export function flwTx(w: World, order: Pick<Order, "orderRef" | "expectedMinor">, over: Partial<FlwTx> = {}): FlwTx {
  const tx: FlwTx = {
    id: ++txN,
    tx_ref: order.orderRef,
    status: "successful",
    currency: "NGN",
    amount: order.expectedMinor / 100,
    ...over,
  };
  w.flw.txs.set(String(tx.id), tx);
  return tx;
}

export const webhookEvent = (tx: Pick<FlwTx, "id" | "tx_ref">, over: Record<string, unknown> = {}) => ({
  event: "charge.completed",
  data: { id: tx.id, tx_ref: tx.tx_ref, status: "successful", amount: 1, currency: "NGN", ...over },
});

export const sendWebhook = (w: World, tx: Pick<FlwTx, "id" | "tx_ref">, hash: string | null = FLW_HASH, evOver: Record<string, unknown> = {}) =>
  handleCompanionFlutterwaveWebhook(w.deps, { verifHash: hash, event: { ...webhookEvent(tx), ...evOver } });

export function tokenFromEmail(m: OutgoingEmail): string {
  const hit = m.text.match(/\/companion\/download\/([A-Za-z0-9_-]+)/);
  assert.ok(hit, "email carries a download link");
  return hit[1];
}
export const tokenFromUrl = (u: string) => u.split("/").pop() as string;

export function dlRequest(token: string | null, init: { ip?: string; headers?: Record<string, string>; form?: boolean; raw?: string } = {}): Request {
  const headers: Record<string, string> = { "x-forwarded-for": init.ip ?? freshIp(), ...(init.headers ?? {}) };
  if (init.form) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    return new Request("https://example.test/api/companion/download", { method: "POST", headers, body: `token=${encodeURIComponent(token ?? "")}` });
  }
  headers["content-type"] = "application/json";
  return new Request("https://example.test/api/companion/download", {
    method: "POST",
    headers,
    body: init.raw ?? JSON.stringify({ token }),
  });
}
export const download = (w: World, token: string | null, init: Parameters<typeof dlRequest>[1] = {}) => handleDownload(w.rt, dlRequest(token, init));

export function statusReq(ref: string | null, ip = freshIp()): Request {
  const u = new URL("https://example.test/api/companion/order-status");
  if (ref !== null) u.searchParams.set("ref", ref);
  return new Request(u, { headers: { "x-forwarded-for": ip } });
}
export const jar = (c: Record<string, string | undefined>) => ({ get: (n: string) => c[n] });
export const orderStatus = (w: World, ref: string | null, cookies: Record<string, string | undefined> = {}): Promise<StatusOutcome> =>
  handleOrderStatus(w.rt, statusReq(ref), jar(cookies));
export const claimJar = (claim: string | undefined, extra: Record<string, string | undefined> = {}) => ({ [CLAIM_COOKIE_NAME]: claim, ...extra });
export { CLAIM_COOKIE_NAME, THANKS_COOKIE_NAME, MemoryStore };

export async function bodyBytes(res: Response): Promise<Buffer> {
  return Buffer.from(await res.arrayBuffer());
}

/** Full card purchase: checkout, then a verified payment through the webhook, then wait for delivery. */
export async function buyByCard(w: World, over: Record<string, unknown> = {}, tx: Partial<FlwTx> = {}) {
  const c = await checkout(w, over);
  assert.equal(c.res.status, 200, JSON.stringify(c.res.body));
  const order = c.order as Order;
  const t = flwTx(w, order, tx);
  const r = await sendWebhook(w, t);
  await w.settle();
  return { ...c, order, tx: t, webhook: r };
}
