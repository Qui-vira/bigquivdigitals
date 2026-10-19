/**
 * Scenario 18: the legal consent text recorded with an order matches the text shown on the page.
 * An order stores consent_at, consent_version and a salted ip hash (not the text), so the version string is the
 * link between what the buyer saw and what was recorded. This file pins version -> exact wording with a fixture
 * hash, renders the real product page, and checks the checkout request and the plan wording.
 * Run: npx tsx --test tests/companion-e2e/07-consent-text.test.tsx
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CompanionPage } from "@/components/companion/CompanionPage";
import { FALLBACK_PRODUCT, priceView } from "@/components/companion/product";
import { SUPPORT_LINE } from "@/components/companion/content";
import { POLICY_LINE } from "../../lib/companion/emails/templates";
import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT, CONSENT_VERSION, consentGiven } from "../../lib/companion/consent";
import { checkout, makeWorld } from "./harness";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const FIXTURE = JSON.parse(readFileSync(path.resolve(__dirname, "fixtures/consent-texts.json"), "utf8")) as {
  version: string; finalSha256: string; immediateSha256: string;
};
const decode = (s: string) => s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const NOW = new Date("2026-11-01T12:00:00Z");
const html = decode(renderToStaticMarkup(<CompanionPage view={priceView(FALLBACK_PRODUCT, NOW)} />));

test("S18 the order records the current consent version, time and a salted ip hash", async () => {
  const w = await makeWorld();
  const { order } = await checkout(w, {}, "203.0.113.9");
  assert.equal(order!.consentVersion, CONSENT_VERSION);
  assert.equal(order!.consentAt.getTime(), w.clock.t.getTime());
  assert.match(order!.consentIpHash ?? "", /^[a-f0-9]{64}$/);
  assert.ok(consentGiven({ allSalesFinal: true, immediateAccess: true }));
});

test("S18 the wording behind a version never changes without a version bump (fixture hash)", () => {
  // If this fails: the consent text was edited. Bump CONSENT_VERSION in lib/companion/consent.ts and update
  // tests/companion-e2e/fixtures/consent-texts.json in the same change, so old orders still point at old wording.
  if (CONSENT_VERSION === FIXTURE.version) {
    assert.equal(sha(CONSENT_FINAL_TEXT), FIXTURE.finalSha256, "final-sale wording changed without a version bump");
    assert.equal(sha(CONSENT_IMMEDIATE_TEXT), FIXTURE.immediateSha256, "immediate-access wording changed without a version bump");
  } else {
    assert.notEqual(CONSENT_VERSION, FIXTURE.version, "version was bumped; refresh the fixture");
  }
});

test("S18 the rendered product page shows exactly the constants that the server records against", () => {
  assert.ok(html.includes(CONSENT_FINAL_TEXT), "page shows CONSENT_FINAL_TEXT verbatim");
  assert.ok(html.includes(CONSENT_IMMEDIATE_TEXT), "page shows CONSENT_IMMEDIATE_TEXT verbatim");
  // Two real, unticked checkboxes sit next to those labels.
  const boxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? [];
  assert.equal(boxes.length, 2);
  for (const b of boxes) assert.ok(!/checked/.test(b), "unticked by default");
  // The wording is not duplicated as a second hard-coded copy in components.
  const comp = readFileSync(path.resolve(__dirname, "../../components/companion/CompanionPage.tsx"), "utf8");
  assert.ok(/CONSENT_FINAL_TEXT/.test(comp) && /CONSENT_IMMEDIATE_TEXT/.test(comp), "page imports the constants");
  assert.ok(!/all sales are final and there are no refunds/i.test(comp), "no second hard-coded copy of the sentence");
});

test("S18 the constants match the wording the plan (section 8, D7) and the legal pages promise", () => {
  assert.equal(
    CONSENT_FINAL_TEXT,
    "I understand that all sales are final and there are no refunds. I have read the Terms, the Privacy Policy and the Licence.",
  );
  assert.equal(CONSENT_IMMEDIATE_TEXT, "I want my download immediately and I understand I give up any right to cancel once I have it.");
  // The "all sales are final" line sits directly above the pay button, as plain text (not small print), and agrees with the email.
  assert.ok(html.includes(SUPPORT_LINE), "support line shown on the page");
  assert.ok(html.indexOf(SUPPORT_LINE) < html.indexOf("Pay "), "line is above the pay button");
  assert.equal(SUPPORT_LINE, POLICY_LINE, "page and delivery email state the same policy");
  // Links to the three documents named in the label are on the page.
  for (const href of ["/terms", "/privacy", "/licence"]) assert.ok(html.includes(`href="${href}"`), `link to ${href}`);
});

test("S18 the browser form posts the flat consent fields the server reads, as literal true", () => {
  const form = readFileSync(path.resolve(__dirname, "../../components/companion/CheckoutForm.tsx"), "utf8");
  assert.match(form, /consentFinal: true,/);
  assert.match(form, /consentImmediate: true,/);
  assert.ok(/if \(!consentFinal \|\| !consentImmediate\)/.test(form), "submit blocked client side until both ticked");
});

test("S18 BUG check: plan section 8 says the consent is shown again in the delivery email", async () => {
  const w = await makeWorld();
  const { buyByCard } = await import("./harness");
  await buyByCard(w);
  const mail = w.sender.sent[0];
  const shown = mail.text.includes(CONSENT_FINAL_TEXT) || mail.text.includes(CONSENT_VERSION);
  // BUG: renderDelivery prints POLICY_LINE ("All sales are final...") but neither the consent wording the buyer ticked nor its version.
  assert.ok(shown, "BUG: delivery email does not repeat the consent text or version the buyer accepted");
});
