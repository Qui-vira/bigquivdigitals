/**
 * AI class regression for the three TEC- guard edits.
 *
 * The three existing payment routes are driven with synthetic QV- payloads
 * (fixtures, no real data). Every outbound call is captured by a fake global
 * fetch: Flutterwave's verify API gets a canned answer, Neon's HTTP SQL endpoint
 * (fake host) records the statement and parameters. The captured decisions
 * (status, body, SQL, outbound hosts) for the pre-edit routes are frozen in
 * ai-class-golden.json, generated ONCE from the pre-edit routes (copies made with
 * `git show <pre-edit-commit>:app/api/payment/<route>/route.ts` into a temporary
 * ./_orig/ folder, then GOLDEN_WRITE=1; the folder was deleted afterwards). The test asserts the edited routes produce byte-identical
 * decisions, and that TEC- payloads never reach course_purchases or Telegram.
 *
 * Run: npx tsx --test lib/companion/__tests__/ai-class-regression.test.ts
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";

const HERE = __dirname;
const GOLDEN = path.join(HERE, "ai-class-golden.json");
const WRITE = process.env.GOLDEN_WRITE === "1";

process.env.DATABASE_URL = "postgres://u:p@fake.neon.invalid/db";
process.env.FLW_SECRET_HASH = "test-hash";
process.env.FLW_SECRET_KEY = "test-key";
process.env.BLOCKRADAR_WEBHOOK_SECRET = "br-secret";
delete process.env.RESEND_API_KEY;
delete process.env.COURSE_BOT_TOKEN;
delete process.env.TELEGRAM_ADMIN_CHAT_ID;

type Captured = { host: string; url: string; sql?: { query: string; params: unknown[] } };
let captured: Captured[] = [];
let flwVerifyAnswer: { status: number; json: unknown } = { status: 200, json: {} };
const realFetch = globalThis.fetch;

before(() => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const host = new URL(url).hostname;
    if (host.endsWith("neon.invalid")) {
      const body = JSON.parse(String(init?.body ?? "{}"));
      captured.push({ host, url: "sql", sql: { query: String(body.query), params: body.params ?? [] } });
      return new Response(JSON.stringify({ command: "SELECT", rowCount: 0, rows: [], fields: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    captured.push({ host, url: url.replace(/\d{6,}/g, "N") });
    if (host === "api.flutterwave.com") {
      return new Response(JSON.stringify(flwVerifyAnswer.json), { status: flwVerifyAnswer.status });
    }
    return new Response("{}", { status: 200 });
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});

const GOOD_ORIGIN = "https://bigquivdigitals.com";
let ipCounter = 0;
const nextIp = () => `10.0.0.${++ipCounter}`;

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": nextIp(), ...headers },
    body: raw,
  });
}

const tx = (ref: string, over: Record<string, unknown> = {}) => ({
  id: 555001,
  status: "successful",
  amount: 27000,
  currency: "NGN",
  tx_ref: ref,
  customer: { email: "Fixture.Buyer@Example.com", name: "Ada Fixture" },
  ...over,
});

type Case = {
  name: string;
  route: "webhook" | "verify" | "blockradar";
  build: () => NextRequest;
  flw?: { status: number; json: unknown };
};

const brBody = (over: Record<string, unknown> = {}, meta: Record<string, unknown> = { email: "Fixture.Buyer@Example.com" }) =>
  JSON.stringify({
    event: "deposit.confirmed",
    data: { amount: "10.2", token: "USDC", hash: "0xfixturehash", address: "0xaddr", metadata: meta, ...over },
  });
const brSig = (raw: string) => createHmac("sha256", "br-secret").update(raw).digest("hex");

const AI_CASES: Case[] = [
  {
    name: "webhook: valid AI class payment",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed", data: tx("QV-1700000000001") }, { "verif-hash": "test-hash" }),
  },
  {
    name: "webhook: AI class underpaid is rejected",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed", data: tx("QV-1700000000002", { amount: 100 }) }, { "verif-hash": "test-hash" }),
  },
  {
    name: "webhook: bad signature",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed", data: tx("QV-1700000000003") }, { "verif-hash": "wrong" }),
  },
  {
    name: "webhook: failed charge ignored",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed", data: tx("QV-1700000000004", { status: "failed" }) }, { "verif-hash": "test-hash" }),
  },
  {
    name: "webhook: other event type",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "transfer.completed", data: { id: 1 } }, { "verif-hash": "test-hash" }),
  },
  {
    name: "webhook: payload with no data",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed" }, { "verif-hash": "test-hash" }),
  },
  {
    name: "webhook: tx_ref that is not a string",
    route: "webhook",
    build: () => post("http://localhost/x", { event: "charge.completed", data: tx("x", { tx_ref: 12345 }) }, { "verif-hash": "test-hash" }),
  },
  {
    name: "verify: valid AI class payment",
    route: "verify",
    build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: GOOD_ORIGIN }),
    flw: { status: 200, json: { status: "success", data: tx("QV-1700000000010") } },
  },
  {
    name: "verify: underpaid",
    route: "verify",
    build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: GOOD_ORIGIN }),
    flw: { status: 200, json: { status: "success", data: tx("QV-1700000000011", { amount: 100 }) } },
  },
  {
    name: "verify: payment not successful",
    route: "verify",
    build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: GOOD_ORIGIN }),
    flw: { status: 200, json: { status: "success", data: tx("QV-1700000000012", { status: "failed" }) } },
  },
  {
    name: "verify: flutterwave api error",
    route: "verify",
    build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: GOOD_ORIGIN }),
    flw: { status: 500, json: {} },
  },
  {
    name: "verify: forbidden origin",
    route: "verify",
    build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: "https://bigquivdigitals.com.evil.tld" }),
  },
  {
    name: "verify: missing transaction id",
    route: "verify",
    build: () => post("http://localhost/x", {}, { origin: GOOD_ORIGIN }),
  },
  {
    name: "blockradar: confirmed deposit with email",
    route: "blockradar",
    build: () => {
      const raw = brBody();
      return post("http://localhost/x", raw, { "x-blockradar-signature": brSig(raw) });
    },
  },
  {
    name: "blockradar: bad signature",
    route: "blockradar",
    build: () => post("http://localhost/x", brBody(), { "x-blockradar-signature": "nope" }),
  },
  {
    name: "blockradar: deposit with no email",
    route: "blockradar",
    build: () => {
      const raw = brBody({}, {});
      return post("http://localhost/x", raw, { "x-blockradar-signature": brSig(raw) });
    },
  },
  {
    name: "blockradar: unrelated event",
    route: "blockradar",
    build: () => {
      const raw = JSON.stringify({ event: "wallet.updated", data: {} });
      return post("http://localhost/x", raw, { "x-blockradar-signature": brSig(raw) });
    },
  },
];

async function load(route: Case["route"]) {
  if (WRITE) {
    const f = { webhook: "flutterwave-webhook", verify: "flutterwave-verify", blockradar: "blockradar-webhook" }[route];
    return (await import(`./_orig/${f}`)) as { POST: (r: NextRequest) => Promise<Response> };
  }
  const f = { webhook: "flutterwave/webhook", verify: "flutterwave/verify", blockradar: "blockradar/webhook" }[route];
  return (await import(`../../../app/api/payment/${f}/route`)) as { POST: (r: NextRequest) => Promise<Response> };
}

async function run(c: Case) {
  captured = [];
  flwVerifyAnswer = c.flw ?? { status: 200, json: {} };
  const mod = await load(c.route);
  const res = await mod.POST(c.build());
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return {
    status: res.status,
    body,
    calls: captured.map((x) => (x.sql ? { sql: x.sql.query, params: x.sql.params } : { host: x.host, url: x.url })),
  };
}

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

if (WRITE) {
  test("write golden from the pre-edit routes", quiet(async () => {
    const out: Record<string, unknown> = {};
    for (const c of AI_CASES) out[c.name] = await run(c);
    writeFileSync(GOLDEN, JSON.stringify(out, null, 2) + "\n");
  }));
} else {
  const golden = existsSync(GOLDEN) ? (JSON.parse(readFileSync(GOLDEN, "utf8")) as Record<string, unknown>) : {};
  for (const c of AI_CASES) {
    test(`AI class unchanged: ${c.name}`, quiet(async () => {
      assert.ok(golden[c.name], "golden entry exists");
      assert.deepEqual(await run(c), golden[c.name]);
    }));
  }
  test("golden really covers a purchase write (guards against an empty baseline)", () => {
    const g = JSON.stringify(golden);
    assert.ok(g.includes("course_purchases"), "baseline records course_purchases writes");
    assert.ok(g.includes("fixture.buyer@example.com"));
  });

  const touchesCourse = (calls: { sql?: string; host?: string }[]) =>
    calls.some((x) => /course_purchases|prospects/i.test(x.sql ?? "") || x.host === "api.telegram.org");

  test("TEC- payload on the flutterwave verify route is never recorded", quiet(async () => {
    const r = await run({
      name: "tec verify",
      route: "verify",
      build: () => post("http://localhost/x", { transaction_id: 555001 }, { origin: GOOD_ORIGIN }),
      flw: { status: 200, json: { status: "success", data: tx("TEC-abcdefghijklmnopqrstuv") } },
    });
    assert.equal(r.status, 400);
    assert.equal(touchesCourse(r.calls as never), false);
    assert.equal(r.calls.filter((x) => "sql" in x).length, 0);
  }));

  test("TEC- payload on the flutterwave webhook never reaches course_purchases", quiet(async () => {
    const r = await run({
      name: "tec webhook",
      route: "webhook",
      build: () => post("http://localhost/x", { event: "charge.completed", data: tx("TEC-abcdefghijklmnopqrstuv") }, { "verif-hash": "test-hash" }),
      flw: { status: 200, json: { status: "success", data: tx("TEC-abcdefghijklmnopqrstuv") } },
    });
    assert.equal(touchesCourse(r.calls as never), false);
    // It went to the companion handler: it verified with Flutterwave and looked the order up in companion_orders.
    assert.ok(r.calls.some((x) => (x as { host?: string }).host === "api.flutterwave.com"));
    assert.ok(r.calls.some((x) => /companion_orders/.test((x as { sql?: string }).sql ?? "")));
    assert.equal(r.status, 200);
  }));

  test("TEC- webhook with a wrong hash is refused (401) and touches nothing", quiet(async () => {
    const r = await run({
      name: "tec bad hash",
      route: "webhook",
      build: () => post("http://localhost/x", { event: "charge.completed", data: tx("TEC-abcdefghijklmnopqrstuv") }, { "verif-hash": "wrong" }),
    });
    assert.equal(r.status, 401);
    assert.equal(r.calls.length, 0);
  }));

  test("TEC- deposit on the blockradar webhook is ignored, nothing written", quiet(async () => {
    const raw = brBody({}, { email: "fixture.buyer@example.com", order_ref: "TEC-abcdefghijklmnopqrstuv" });
    const r = await run({
      name: "tec blockradar",
      route: "blockradar",
      build: () => post("http://localhost/x", raw, { "x-blockradar-signature": brSig(raw) }),
    });
    assert.equal(r.status, 200);
    assert.equal(r.calls.length, 0);
  }));
}
