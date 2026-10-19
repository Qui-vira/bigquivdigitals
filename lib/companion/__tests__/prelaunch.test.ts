/**
 * Pre-launch fixes (REVIEW-FINAL N-H2, N-M1, N-M2, N-M5, M11, file hash note). Each test fails on
 * the code before 2026-10-19.
 * Run: npx tsx --test lib/companion/__tests__/prelaunch.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { adminExportCsv } from "../admin-ops";
import { DeliveryMemoryStore } from "../delivery-memory";
import { DELIVERY_FILE_BYTES, DELIVERY_FILE_SHA256 } from "../file-hash";
import { createNeonCompanionStore, type Row, type SqlClient } from "../neon-store";
import { applyVerifiedPayment, createOrder } from "../orders";
import type { Runtime } from "../runtime";
import { MemoryStore, sampleProduct } from "../testing/memory-store";
import type { OrderStatus } from "../types";

const NOW = new Date("2026-11-01T12:00:00Z");
const ROOT = path.resolve(__dirname, "..", "..", "..");
let n = 0;

async function order(store: MemoryStore) {
  const r = await createOrder(store, {
    productSlug: "theeditcompanion",
    name: "Ada",
    email: `late${++n}@example.com`,
    method: "flutterwave",
    consent: { allSalesFinal: true, immediateAccess: true },
    ipSalt: "salt",
    ip: null,
    now: NOW,
  });
  if (!r.ok) throw new Error("order not created");
  return r.order;
}
function store() {
  const s = new MemoryStore();
  s.products.set("theeditcompanion", sampleProduct());
  return s;
}
const lowTx = (ref: string) => ({ txRef: ref, status: "successful", currency: "NGN", amount: 50000, providerTxId: 99 });

// ---------- N-M1: refunded and flagged are terminal ----------
for (const closed of ["refunded", "flagged"] as const) {
  test(`N-M1: a late underpaid payment does not revive a ${closed} order`, async () => {
    const s = store();
    const o = await order(s);
    await s.setOrderStatus(o.id, closed);
    const r = await applyVerifiedPayment(s, lowTx(o.orderRef), "webhook", NOW);
    assert.deepEqual(r, { kind: "not_payable", status: closed }, "caller alerts the owner");
    assert.equal((await s.getOrderById(o.id))?.status, closed, "status unchanged");
    assert.ok(s.events.some((e) => e.orderId === o.id && e.kind === "underpaid_on_closed_order"));
    assert.ok(!s.events.some((e) => e.orderId === o.id && e.kind === "underpaid"));
  });
}

test("N-M1: an order paid between the read and the write is not downgraded to underpaid", async () => {
  const s = store();
  const o = await order(s);
  const stale = await s.getOrderById(o.id);
  // Someone else pays the order right after applyVerifiedPayment has read it.
  const realGet = s.getOrderByRef.bind(s);
  s.getOrderByRef = async (ref: string) => {
    const snap = await realGet(ref);
    s.orders.get(o.id)!.status = "paid";
    return snap ?? stale;
  };
  const r = await applyVerifiedPayment(s, lowTx(o.orderRef), "webhook", NOW);
  assert.deepEqual(r, { kind: "rejected", reason: "amount_underpaid" });
  assert.equal(s.orders.get(o.id)!.status, "paid");
});

test("N-M1: an open order still becomes underpaid, then a full payment completes it", async () => {
  const s = store();
  const o = await order(s);
  assert.deepEqual(await applyVerifiedPayment(s, lowTx(o.orderRef), "webhook", NOW), { kind: "underpaid", receivedMinor: 5_000_000 });
  const full = { ...lowTx(o.orderRef), amount: 89000, providerTxId: 100 };
  assert.equal((await applyVerifiedPayment(s, full, "webhook", NOW)).kind, "won");
});

test("setOrderStatus with allowedFrom is conditional in the memory store", async () => {
  const s = store();
  const o = await order(s);
  assert.equal(await s.setOrderStatus(o.id, "underpaid", ["paid"]), false);
  assert.equal(s.orders.get(o.id)!.status, "awaiting_payment");
  assert.equal(await s.setOrderStatus(o.id, "underpaid", ["awaiting_payment"]), true);
  assert.equal(await s.setOrderStatus("missing", "underpaid", ["awaiting_payment"]), false);
  await assert.rejects(s.setOrderStatus("missing", "expired"), /order not found/);
});

// ---------- Neon adapter SQL shape ----------
function recording(answer: (text: string, params: unknown[]) => Row[] | Error = () => []) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql: SqlClient = {
    async query(text, params = []) {
      calls.push({ text, params });
      const a = answer(text, params);
      if (a instanceof Error) throw a;
      return a;
    },
  };
  return { calls, store: createNeonCompanionStore(sql, () => NOW) };
}

test("Neon: setOrderStatus with allowedFrom is ONE conditional UPDATE and returns false on no row", async () => {
  const { calls, store: s } = recording();
  const allowed: OrderStatus[] = ["awaiting_payment", "expired"];
  assert.equal(await s.setOrderStatus("id-1", "underpaid", allowed), false);
  assert.equal(calls.length, 1);
  assert.match(calls[0].text, /WHERE id = \$1 AND status = ANY\(\$3::text\[\]\) RETURNING id/);
  assert.deepEqual(calls[0].params, ["id-1", "underpaid", allowed]);
});

test("N-M2: every checkout attempt deletes attempt rows older than 24 hours; a failed clean-up does not block", async () => {
  const { calls, store: s } = recording((text) => {
    if (/INSERT INTO companion_checkout_attempts/.test(text)) return [{ n: 1 }];
    if (/DELETE FROM companion_checkout_attempts/.test(text)) return new Error("db hiccup");
    return [];
  });
  assert.equal(await s.reserveCheckoutAttempt("a@b.co", NOW, 5), true);
  const del = calls.find((c) => /DELETE FROM companion_checkout_attempts WHERE bucket < \$1/.test(c.text));
  assert.ok(del, "clean-up ran");
  assert.equal((del!.params[0] as Date).toISOString(), "2026-10-31T12:00:00.000Z");
});

test("M11: Neon addEventForOrders writes all rows in ONE statement", async () => {
  const { calls, store: s } = recording();
  await s.addEventForOrders!(["a", "b"], "admin", "csv_export", "rows=2", NOW);
  await s.addEventForOrders!([], "admin", "csv_export", "rows=0", NOW);
  assert.equal(calls.length, 1, "no query for an empty list");
  assert.match(calls[0].text, /SELECT unnest\(\$1::uuid\[\]\)/);
});

// ---------- M11: the CSV export leaves an audit event on each exported order ----------
test("M11: adminExportCsv records a csv_export event on every exported order, with no email in it", async () => {
  const s = new DeliveryMemoryStore();
  s.products.set("theeditcompanion", sampleProduct());
  const a = await order(s);
  const b = await order(s);
  const rt = { store: s, now: () => NOW } as unknown as Runtime;
  const csv = await adminExportCsv(rt, async () => undefined, {});
  assert.ok(csv.includes(a.orderRef) && csv.includes(b.orderRef));
  const ev = s.events.filter((e) => e.kind === "csv_export");
  assert.deepEqual(ev.map((e) => e.orderId).sort(), [a.id, b.id].sort());
  for (const e of ev) {
    assert.equal(e.actor, "admin");
    assert.equal(e.detail, "rows=2 status=all src=all");
    assert.ok(!e.detail.includes("@"));
  }
});

test("M11: the audit runs only after authorize succeeds", async () => {
  const s = new DeliveryMemoryStore();
  s.products.set("theeditcompanion", sampleProduct());
  await order(s);
  const rt = { store: s, now: () => NOW } as unknown as Runtime;
  await assert.rejects(adminExportCsv(rt, async () => { throw new Error("Unauthorized"); }, {}), /Unauthorized/);
  assert.equal(s.events.filter((e) => e.kind === "csv_export").length, 0);
});

// ---------- N-H2 and N-M5: the SQL files ----------
test("N-H2: the seed inserts the product row idempotently with the owner's prices and the current file hash", () => {
  const seed = readFileSync(path.join(ROOT, "drizzle", "companion-seed.sql"), "utf8");
  const p = sampleProduct();
  assert.match(seed, /insert into companion_products/i);
  assert.match(seed, /on conflict \(slug\) do nothing;/i);
  assert.ok(seed.includes("'theeditcompanion'"));
  for (const v of [p.foundersMinor, p.regularMinor, p.displayUsdFoundersMinor, p.displayUsdRegularMinor, DELIVERY_FILE_BYTES]) {
    assert.ok(new RegExp(`\\b${v}\\b`).test(seed), `seed carries ${v}`);
  }
  assert.ok(seed.includes(`'${DELIVERY_FILE_SHA256}'`), "seed hash equals file-hash.ts");
  assert.ok(!new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`).test(seed), "no em or en dashes");
});

test("N-M5: the pre-clean runs before the in-flight unique index is created", () => {
  const schema = readFileSync(path.join(ROOT, "drizzle", "companion-schema.sql"), "utf8");
  const clean = schema.search(/update companion_orders o\s+set status = 'expired'/);
  const idx = schema.indexOf("create unique index if not exists companion_orders_inflight_uidx");
  assert.ok(clean > 0 && idx > clean, "pre-clean comes first");
});

test("file-hash.ts tells the next builder to run the hash script", () => {
  const src = readFileSync(path.join(ROOT, "lib", "companion", "file-hash.ts"), "utf8");
  assert.ok(src.includes("node scripts/companion-zip-hash.mjs"));
  assert.match(DELIVERY_FILE_SHA256, /^[0-9a-f]{64}$/);
});
