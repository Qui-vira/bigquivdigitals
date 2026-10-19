"use client";

import { CONTACTS } from "./content";

/**
 * Opens a clean receipt in a new window and prints it (window.print). The receipt is
 * built with DOM text nodes only, never HTML strings, so no buyer data is parsed as markup.
 * If the browser blocks the new window, it prints the current page instead.
 */
export type ReceiptData = {
  orderRef: string;
  date: string;
  productName: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
};

const btnCls =
  "paper-focus inline-flex min-h-[44px] cursor-pointer items-center justify-center border-[3px] border-ink bg-paper px-5 font-display text-[15px] font-bold text-ink shadow-brutal-sm transition-[translate,box-shadow,background-color] duration-150 hover:bg-gold-tint active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_#111111]";

export function receiptLines(r: ReceiptData): [string, string][] {
  return [
    ["Order reference", r.orderRef],
    ["Date", r.date],
    ["Product", r.productName],
    ["Amount paid", r.amount],
    ["Paid via", "Flutterwave"],
    ["Buyer", r.buyerName],
    ["Email", r.buyerEmail],
  ];
}

function buildReceipt(doc: Document, r: ReceiptData) {
  doc.title = `Receipt ${r.orderRef}`;
  const style = doc.createElement("style");
  style.textContent =
    "body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:640px;margin:40px auto;padding:0 24px;line-height:1.5}" +
    "h1{font-size:24px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:24px 0}" +
    "td{padding:8px 0;border-bottom:1px solid #ddd;vertical-align:top}td:first-child{color:#555;width:40%}" +
    "p{margin:4px 0}.small{font-size:13px;color:#555}";
  doc.head.appendChild(style);
  const add = (parent: HTMLElement, tag: string, text: string, cls?: string) => {
    const el = doc.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    parent.appendChild(el);
    return el;
  };
  const body = doc.body;
  add(body, "h1", "Receipt");
  add(body, "p", "BigQuiv Digitals");
  add(body, "p", "bigquivdigitals.com", "small");
  const table = doc.createElement("table");
  for (const [k, v] of receiptLines(r)) {
    const tr = doc.createElement("tr");
    add(tr, "td", k);
    add(tr, "td", v);
    table.appendChild(tr);
  }
  body.appendChild(table);
  add(body, "p", `Questions about this order? Email ${CONTACTS.email.display} or WhatsApp ${CONTACTS.whatsapp.display}.`, "small");
}

export function ReceiptButton({ receipt }: { receipt: ReceiptData }) {
  function onClick() {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) {
      window.print();
      return;
    }
    buildReceipt(w.document, receipt);
    w.focus();
    w.print();
  }
  return (
    <button type="button" onClick={onClick} className={btnCls}>
      Receipt
    </button>
  );
}
