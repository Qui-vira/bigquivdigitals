/** Email content. Plain words. No em dashes. HTML and plain text for each. */
import { formatMinor } from "../money";
import { escapeHtml } from "./notify";
import type { Order } from "../types";
import { SITE_URL } from "../../site";
import { CONSENT_FINAL_TEXT, CONSENT_IMMEDIATE_TEXT } from "../consent";
import { DELIVERY_FILE_BYTES, DELIVERY_FILE_SHA256 } from "../file-hash";

export const CONTACTS = {
  telegram: { label: "Telegram", value: "@quivira_ophir", href: "https://t.me/quivira_ophir" },
  whatsapp: { label: "WhatsApp", value: "+234 706 509 2434", href: "https://wa.me/2347065092434" },
  email: { label: "Email", value: "contact@bigquivdigitals.com", href: "mailto:contact@bigquivdigitals.com" },
  instagram: { label: "Instagram", value: "@big_quiv", href: "https://instagram.com/big_quiv" },
} as const;

export const WINDOWS_COMMAND = "powershell -NoProfile -ExecutionPolicy Bypass -File .\\install.ps1";
export const STATUS_LINE = "Tested on Windows 11 in a controlled setup. Not yet tested on a brand new computer. Mac is not tested yet.";
export const POLICY_LINE = "All sales are final. For 30 days after you buy, we help you install and run it. Updates are not promised.";
export const WHATS_IN_ZIP = "TheEditCompanion.zip (about 11 MB). It holds START-HERE.pdf, the installer (install.ps1) and the Companion files.";

export type Rendered = { subject: string; html: string; text: string };

function contactsText(): string {
  return Object.values(CONTACTS).map((c) => `${c.label}: ${c.value}`).join("\n");
}
function contactsHtml(): string {
  return Object.values(CONTACTS)
    .map((c) => `<li>${c.label}: <a href="${c.href}">${escapeHtml(c.value)}</a></li>`)
    .join("");
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
function shell(inner: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:20px">${inner}</div>`;
}
function first(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}
function pre(text: string): string {
  return shell(`<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(text)}</pre>`);
}

export type DeliveryEmailInput = {
  order: Order;
  downloadUrl: string;
  linkExpiresAt: Date;
  maxDownloads: number;
  supportUntil: Date;
  resend?: boolean;
};

export function renderDelivery(i: DeliveryEmailInput): Rendered {
  const { order } = i;
  const subject = i.resend ? "Your new TheEditCompanion download link" : "Your TheEditCompanion download and receipt";
  const intro = i.resend ? "Here is a new download link. Older links no longer work." : "Payment confirmed. Thank you.";
  const receipt = [
    `Order ${order.orderRef}`,
    `Amount: NGN ${formatMinor(order.amountReceivedMinor ?? order.expectedMinor)} (${order.priceTier} price)`,
    `Paid: ${order.paidAt ? fmtDate(order.paidAt) : "confirmed"}`,
  ].join("\n");
  const termsUrl = `${SITE_URL}/terms`;
  const licenceUrl = `${SITE_URL}/licence`;
  const hashLine = `SHA-256 of TheEditCompanion.zip: ${DELIVERY_FILE_SHA256} (${DELIVERY_FILE_BYTES.toLocaleString("en-US")} bytes)`;
  const hashHow = "To check it on Windows, run: certutil -hashfile TheEditCompanion.zip SHA256";
  const consentBlock = [
    `You accepted (version ${order.consentVersion}):`,
    CONSENT_FINAL_TEXT,
    CONSENT_IMMEDIATE_TEXT,
  ].join("\n");
  const expiry = `The link works until ${fmtDate(i.linkExpiresAt)} and allows up to ${i.maxDownloads} downloads.`;
  const supportLine = `Your 30 days of help run until ${fmtDate(i.supportUntil)}.`;
  const text = [
    `Hi ${first(order.name)},`,
    "",
    intro,
    "",
    "Download:",
    i.downloadUrl,
    expiry,
    "",
    "What is in the zip:",
    WHATS_IN_ZIP,
    "",
    "Start here:",
    "Unzip it, then open START-HERE.pdf.",
    "On Windows, open PowerShell in the unzipped folder and run:",
    WINDOWS_COMMAND,
    "",
    STATUS_LINE,
    POLICY_LINE,
    supportLine,
    "",
    "Check your download:",
    hashLine,
    hashHow,
    "",
    "Receipt:",
    receipt,
    "",
    consentBlock,
    `Terms: ${termsUrl}`,
    `Licence: ${licenceUrl}`,
    "",
    "Contact us:",
    contactsText(),
  ].join("\n");
  const html = shell(
    `<p>Hi ${escapeHtml(first(order.name))},</p>` +
      `<p>${intro}</p>` +
      `<p style="text-align:center;margin:24px 0"><a href="${escapeHtml(i.downloadUrl)}" style="display:inline-block;padding:14px 28px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Download TheEditCompanion</a></p>` +
      `<p style="font-size:14px;color:#555">${expiry}</p>` +
      `<h3>What is in the zip</h3><p>${escapeHtml(WHATS_IN_ZIP)}</p>` +
      `<h3>Start here</h3><p>Unzip it, then open <strong>START-HERE.pdf</strong>. On Windows, open PowerShell in the unzipped folder and run:</p>` +
      `<pre style="background:#f4f4f4;padding:12px;border-radius:6px;overflow:auto">${escapeHtml(WINDOWS_COMMAND)}</pre>` +
      `<p>${escapeHtml(STATUS_LINE)}</p>` +
      `<p>${escapeHtml(POLICY_LINE)} ${supportLine}</p>` +
      `<h3>Check your download</h3><p style="word-break:break-all">${escapeHtml(hashLine)}</p><p>${escapeHtml(hashHow)}</p>` +
      `<h3>Receipt</h3><p style="white-space:pre-line">${escapeHtml(receipt)}</p>` +
      `<p style="font-size:14px;color:#555;white-space:pre-line">${escapeHtml(consentBlock)}</p>` +
      `<p><a href="${termsUrl}">Terms</a> | <a href="${licenceUrl}">Licence</a></p>` +
      `<h3>Contact us</h3><ul>${contactsHtml()}</ul>`,
  );
  return { subject, html, text };
}

export function renderOwnerNewOrder(o: Order): Rendered {
  const text = [
    `Order ${o.orderRef} is paid.`,
    `Tier: ${o.priceTier}`,
    `Amount: NGN ${formatMinor(o.amountReceivedMinor ?? o.expectedMinor)}`,
    `Method: ${o.method}`,
    `Buyer: ${o.name} <${o.email}>`,
    `Source: ${o.src ?? "none"}`,
  ].join("\n");
  return { subject: `New TheEditCompanion order ${o.orderRef}`, text, html: pre(text) };
}

export function renderOwnerTransferAwaiting(o: Order): Rendered {
  const text = [
    "A buyer chose bank transfer.",
    `Order: ${o.orderRef}`,
    `Expected: NGN ${formatMinor(o.expectedMinor)} (${o.priceTier})`,
    `Buyer: ${o.name} <${o.email}>`,
    "When the money arrives, open Admin, Companion orders, and use Mark transfer paid with the amount and bank reference.",
  ].join("\n");
  return { subject: `Bank transfer awaiting check: ${o.orderRef}`, text, html: pre(text) };
}

export function renderOwnerEmailFailed(o: Order, error: string): Rendered {
  const text = [
    "The order is paid but the delivery email did not send.",
    `Order: ${o.orderRef}`,
    `Buyer: ${o.name} <${o.email}>`,
    `Error: ${error}`,
    "The buyer can still download from the thanks page. Use Re-send in Admin, Companion orders.",
  ].join("\n");
  return { subject: `Delivery email FAILED for ${o.orderRef}`, text, html: pre(text) };
}

export function renderTransferReceived(o: Order): Rendered {
  const text = [
    `Hi ${first(o.name)},`,
    "",
    "We received your message that you paid by bank transfer.",
    `Order: ${o.orderRef}`,
    `Amount to confirm: NGN ${formatMinor(o.expectedMinor)}`,
    "",
    "We are checking the payment in our bank account. When it is confirmed we will email your download link. Nothing more is needed from you.",
    "",
    POLICY_LINE,
    "",
    "Contact us:",
    contactsText(),
  ].join("\n");
  const html = shell(
    `<p>Hi ${escapeHtml(first(o.name))},</p>` +
      `<p>We received your message that you paid by bank transfer.</p>` +
      `<p>Order: ${escapeHtml(o.orderRef)}<br>Amount to confirm: NGN ${formatMinor(o.expectedMinor)}</p>` +
      `<p>We are checking the payment in our bank account. When it is confirmed we will email your download link. Nothing more is needed from you.</p>` +
      `<p>${escapeHtml(POLICY_LINE)}</p><h3>Contact us</h3><ul>${contactsHtml()}</ul>`,
  );
  return { subject: "Order received: we are checking your transfer", text, html };
}
