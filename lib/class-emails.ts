/**
 * Emails for the /classes products: the buyer's confirmation and the owner's
 * sale alert. Plain words, no em dashes, the same look as
 * lib/send-purchase-email.ts (sans-serif column, "Hey name", signed Quiv).
 * Pure functions so they can be tested without sending anything.
 */
import { CLASS_COHORT, type ClassProduct } from "./course-prices";
import { escapeHtml } from "./companion/emails/notify";
import { SITE_URL } from "./site";

export type ClassEmail = { subject: string; html: string; text: string };

export function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-US")}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/**
 * The buyer's confirmation.
 *   niche or combo: the seat in the cohort is confirmed; added to the class group before it starts
 *   coaching:       we contact you within 24 hours to book your sessions
 */
export function renderClassConfirmation(i: {
  product: ClassProduct;
  name: string;
  amount: number;
  currency: string;
  txRef: string;
}): ClassEmail {
  const { product } = i;
  const name = firstName(i.name);
  const paid = i.currency.toUpperCase() === "NGN" ? naira(i.amount) : `${i.amount} ${i.currency.toUpperCase()}`;
  const coaching = product.kind === "coaching";

  const subject = coaching ? `Payment confirmed: ${product.name}` : `You're in: ${product.name}, cohort starting ${CLASS_COHORT.startsLabel}`;
  const next = coaching
    ? "We will contact you within 24 hours to book your sessions."
    : `Your seat in the cohort starting ${CLASS_COHORT.startsLabel} is confirmed. You will be added to the class group before it starts.`;
  const purchasesUrl = `${SITE_URL}/my-purchases`;

  const text = [
    `Hey ${name},`,
    "",
    `Payment confirmed for ${product.name}.`,
    "",
    `Amount paid: ${paid}`,
    `Reference: ${i.txRef}`,
    "",
    next,
    "",
    `You can see this purchase any time at ${purchasesUrl}`,
    "",
    "If you have any questions, reply to this email or DM me on Telegram: https://t.me/Quivira_Ophir",
    "",
    "Let's build,",
    "Quiv",
    "",
    `You're receiving this because you bought ${product.name} on bigquivdigitals.com`,
  ].join("\n");

  const html = `
<div style="font-family:sans-serif;font-size:16px;line-height:1.7;color:#222;max-width:600px;margin:0 auto;padding:20px">
  <p>Hey ${escapeHtml(name)},</p>
  <p>Payment confirmed for <strong>${escapeHtml(product.name)}</strong>.</p>
  <p style="margin:20px 0;padding:14px 18px;background:#f4f5f7;border-radius:8px">
    Amount paid: <strong>${escapeHtml(paid)}</strong><br>
    Reference: ${escapeHtml(i.txRef)}
  </p>
  <p>${escapeHtml(next)}</p>
  <p>You can see this purchase any time on <a href="${purchasesUrl}">My purchases</a>.</p>
  <p>If you have any questions, reply to this email or DM me on <a href="https://t.me/Quivira_Ophir">Telegram</a>.</p>
  <br>
  <p>Let's build,<br><strong>Quiv</strong></p>
  <p style="font-size:13px;color:#888;margin-top:24px">You're receiving this because you bought ${escapeHtml(product.name)} on bigquivdigitals.com</p>
</div>`;

  return { subject, html, text };
}

/** The owner's alert for one sale (email + Telegram through the companion notifier). */
export function renderOwnerSale(i: {
  product: ClassProduct;
  email: string;
  amount: number;
  currency: string;
  txRef: string;
  tier: "early" | "standard" | "fixed";
  seatNumber: number | null;
  emailSent: boolean;
}): { subject: string; text: string } {
  const paid = i.currency.toUpperCase() === "NGN" ? naira(i.amount) : `${i.amount} ${i.currency.toUpperCase()}`;
  const lines = [
    `${i.product.name}: ${paid} (${i.tier === "fixed" ? "coaching" : `${i.tier} price`})`,
    `Buyer: ${i.email}`,
    `Reference: ${i.txRef}`,
    i.seatNumber !== null ? `Seat ${i.seatNumber} in the cohort starting ${CLASS_COHORT.startsLabel}` : null,
    i.product.kind === "coaching" ? "Action: contact the buyer within 24 hours to book the sessions." : "Action: add the buyer to the class group before the cohort starts.",
    i.emailSent ? "Confirmation email: sent." : "Confirmation email: NOT sent. Email the buyer yourself.",
  ].filter(Boolean);
  return { subject: `New sale: ${i.product.name}`, text: lines.join("\n") };
}
