/**
 * Scenario 6: a TEC- payload sent to each of the three EXISTING AI class payment routes writes nothing to
 * course_purchases or prospects and makes no Telegram call, while QV- payloads still follow the old path
 * (compared with the frozen golden decisions in lib/companion/__tests__/ai-class-golden.json).
 * The real route modules run; every outbound call is captured by a fake global fetch (Neon's HTTP SQL endpoint
 * is a fake host). No database, no network.
 * Run: npx tsx --test tests/companion-e2e/06-ai-class-isolation.test.ts
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";

process.env.DATABASE_URL = "postgres://u:p@fake.neon.invalid/db";
process.env.FLW_SECRET_HASH = "test-hash";
process.env.FLW_SECRET_KEY = "test-key";
process.env.BLOCKRADAR_WEBHOOK_SECRET = "br-secret";
delete process.env.RESEND_API_KEY;
delete process.env.COURSE_BOT_TOKEN;
delete process.env.TELEGRAM_ADMIN_CHAT_ID;

const GOLDEN = JSON.parse(readFileSync(path.resolve(__dirname, "../../lib/companion/__tests__/ai-class-golden.json"), "utf8")) as Record<string, unknown>;

type Call = { host: string; sql?: string; params?: unknown[]; url?: string };
let captured: Call[] = [];
let flwAnswer: { status: number; json: unknown } = { status: 200, json: {} };
const realFetch = globalThis.fetch;

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const host = new URL(url).hostname;
    if (host.endsWith("neon.invalid")) {
      const body = JSON.parse(String(init?.body ?? "{}"));
      captured.push({ host, sql: String(body.query), params: body.params ?? [] });
      return new Response(JSON.stringify({ command: "SELECT", rowCount: 0, rows: [], fields: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    captured.push({ host, url: url.replace(/\d{6,}/g, "N") });
    if (host === "api.flutterwave.com") return new Response(JSON.stringify(flwAnswer.json), { status: flwAnswer.status });
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});

let ip = 0;
const post = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++ip}`, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const tx = (ref: unknown, over: Record<string, unknown> = {}) => ({
  id: 555001, status: "successful", amount: 27000, currency: "NGN", tx_ref: ref,
  customer: { email: "Fixture.Buyer@Example.com", name: "Ada Fixture" }, ...over,
});
const TEC = "TEC-abcdefghijklmnopqrstuv";
const brSig = (raw: string) => createHmac("sha256", "br-secret").update(raw).digest("hex");
const brRaw = (meta: Record<string, unknown>, over: Record<string, unknown> = {}) =>
  JSON.stringify({ event: "deposit.confirmed", data: { amount: "10.2", token: "USDC", hash: "0xfixturehash", address: "0xaddr", metadata: meta, ...over } });

const quiet = <T>(fn: () => Promise<T>) => async () => {
  const log = console.log, err = console.error, warn = console.warn;
  console.log = console.error = console.warn = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = err;
    console.warn = warn;
  }
};

type Route = "webhook" | "verify" | "blockradar";
const PATH: Record<Route, string> = { webhook: "flutterwave/webhook", verify: "flutterwave/verify", blockradar: "blockradar/webhook" };
async function run(route: Route, req: NextRequest, flw: { status: number; json: unknown } = { status: 200, json: {} }) {
  captured = [];
  flwAnswer = flw;
  const mod = (await import(`../../app/api/payment/${PATH[route]}/route`)) as { POST: (r: NextRequest) => Promise<Response> };
  const res = await mod.POST(req);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, calls: captured.map((c) => (c.sql ? { sql: c.sql, params: c.params } : { host: c.host, url: c.url })) };
}
const hitsCourse = (calls: { sql?: string; host?: string }[]) => calls.filter((c) => /course_purchases|prospects/i.test(c.sql ?? ""));
const hitsTelegram = (calls: { host?: string }[]) => calls.filter((c) => c.host === "api.telegram.org");
const sqlOf = (calls: { sql?: string }[]) => calls.filter((c) => c.sql);

test("S6 TEC- on the Flutterwave webhook: no course_purchases, no prospects, no Telegram, no AI class email", quiet(async () => {
  for (const email of ["Fixture.Buyer@Example.com", "an.ai.class.buyer@example.com"]) {
    for (const amount of [27000, 89000, 129000]) {
      const r = await run("webhook", post({ event: "charge.completed", data: tx(TEC, { amount, customer: { email, name: "X" } }) }, { "verif-hash": "test-hash" }), {
        status: 200, json: { status: "success", data: tx(TEC, { amount }) },
      });
      assert.equal(r.status, 200);
      assert.equal(hitsCourse(r.calls as never).length, 0, `amount ${amount}`);
      assert.equal(hitsTelegram(r.calls as never).length, 0);
      assert.ok(!r.calls.some((c) => (c as { host?: string }).host === "api.resend.com"), "no AI class purchase email");
      // It went to the companion handler: verify call plus a lookup in companion_orders, never the course tables.
      assert.ok(r.calls.some((c) => (c as { host?: string }).host === "api.flutterwave.com"));
      assert.ok(sqlOf(r.calls as never).every((c) => /companion_/i.test((c as { sql: string }).sql)), "only companion_ tables touched");
    }
  }
  // Wrong hash: refused before anything.
  const bad = await run("webhook", post({ event: "charge.completed", data: tx(TEC) }, { "verif-hash": "wrong" }));
  assert.equal(bad.status, 401);
  assert.equal(bad.calls.length, 0);
  // A TEC- ref inside a non-charge event is handed over too and does nothing to the course tables.
  const other = await run("webhook", post({ event: "transfer.completed", data: { tx_ref: TEC, id: 1 } }, { "verif-hash": "test-hash" }));
  assert.equal(hitsCourse(other.calls as never).length, 0);
}));

test("S6 TEC- on the Flutterwave verify route: 400, nothing written, nothing sent", quiet(async () => {
  for (const amount of [27000, 89000]) {
    const r = await run("verify", post({ transaction_id: 555001 }, { origin: "https://bigquivdigitals.com" }), {
      status: 200, json: { status: "success", data: tx(TEC, { amount }) },
    });
    assert.equal(r.status, 400);
    assert.deepEqual(r.body, { success: false, error: "Payment not verified" });
    assert.equal(sqlOf(r.calls as never).length, 0, "no SQL at all");
    assert.equal(hitsTelegram(r.calls as never).length, 0);
    assert.ok(!r.calls.some((c) => (c as { host?: string }).host === "api.resend.com"));
  }
}));

test("S6 TEC- on the Blockradar webhook: 200 ignored, nothing written", quiet(async () => {
  const raw = brRaw({ email: "fixture.buyer@example.com", order_ref: TEC });
  const r = await run("blockradar", post(raw, { "x-blockradar-signature": brSig(raw) }));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { received: true, ignored: "companion" });
  assert.equal(r.calls.length, 0);
  // Bad signature still wins first.
  const bad = await run("blockradar", post(raw, { "x-blockradar-signature": "nope" }));
  assert.notEqual(bad.status, 200);
  assert.equal(bad.calls.length, 0);
}));

test("S6 QV- payloads still follow the old path: results equal the frozen golden decisions", quiet(async () => {
  const w = await run("webhook", post({ event: "charge.completed", data: tx("QV-1700000000001") }, { "verif-hash": "test-hash" }));
  assert.deepEqual(w, GOLDEN["webhook: valid AI class payment"]);
  assert.ok(hitsCourse(w.calls as never).length >= 2, "the old path still records the purchase");

  const under = await run("webhook", post({ event: "charge.completed", data: tx("QV-1700000000002", { amount: 100 }) }, { "verif-hash": "test-hash" }));
  assert.deepEqual(under, GOLDEN["webhook: AI class underpaid is rejected"]);

  const v = await run("verify", post({ transaction_id: 555001 }, { origin: "https://bigquivdigitals.com" }), { status: 200, json: { status: "success", data: tx("QV-1700000000010") } });
  assert.deepEqual(v, GOLDEN["verify: valid AI class payment"]);

  const raw = brRaw({ email: "Fixture.Buyer@Example.com" });
  const b = await run("blockradar", post(raw, { "x-blockradar-signature": brSig(raw) }));
  assert.deepEqual(b, GOLDEN["blockradar: confirmed deposit with email"]);

  const noData = await run("webhook", post({ event: "charge.completed" }, { "verif-hash": "test-hash" }));
  assert.deepEqual(noData, GOLDEN["webhook: payload with no data"]);
  const nonString = await run("webhook", post({ event: "charge.completed", data: tx("x", { tx_ref: 12345 }) }, { "verif-hash": "test-hash" }));
  assert.deepEqual(nonString, GOLDEN["webhook: tx_ref that is not a string"]);
}));

test("S6 near-miss refs are NOT treated as companion: lower case 'tec-' and a QV- ref carrying TEC- in the email still follow the old path", quiet(async () => {
  // The guard is an exact, case-sensitive prefix. Refs we mint are always upper-case TEC-, so these are not ours.
  const lower = await run("webhook", post({ event: "charge.completed", data: tx("tec-abcdefghijklmnopqrstuv") }, { "verif-hash": "test-hash" }));
  assert.ok(hitsCourse(lower.calls as never).length >= 1, "unchanged old behaviour for a non TEC- prefix");
  const qv = await run("webhook", post({ event: "charge.completed", data: tx("QV-1700000000077", { customer: { email: "TEC-x@example.com", name: "TEC-" } }) }, { "verif-hash": "test-hash" }));
  assert.ok(hitsCourse(qv.calls as never).length >= 1);
}));
