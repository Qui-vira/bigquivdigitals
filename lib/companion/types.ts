/**
 * Shared types for the sealed TheEditCompanion module.
 * Money is ALWAYS an integer in minor units (cents, kobo). Never a float.
 * Dates are JS Date objects; the database adapter maps them to timestamptz.
 */

/** The product is charged in naira only (owner decision 2026-10-15). USD is display only. */
export type Currency = "NGN";
export type Tier = "founders" | "regular";
export type PayMethod = "flutterwave" | "blockradar" | "bank_transfer";

export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "awaiting_transfer"
  | "underpaid"
  | "paid"
  | "refunded"
  | "expired"
  | "flagged";

export type Product = {
  slug: string;
  name: string;
  active: boolean;
  currencyBase: Currency;
  /** Kobo. 5_000_000 = N50,000. */
  foundersMinor: number;
  /** Kobo. 15_000_000 = N150,000. */
  regularMinor: number;
  /** Optional. Founders price stops at this instant (exclusive). */
  foundersEndsAt: Date | null;
  /** Optional. Founders price stops once this many founders places are taken. */
  foundersCap: number | null;
  /** USD reference prices in cents, for DISPLAY ONLY. Never charged, never checked. */
  displayUsdFoundersMinor: number | null;
  displayUsdRegularMinor: number | null;
  linkTtlHours: number;
  maxDownloads: number;
  allowManualTransfer: boolean;
};

export type Order = {
  id: string;
  orderRef: string; // TEC-xxxx, also the Flutterwave tx_ref
  productSlug: string;
  email: string;
  name: string;
  status: OrderStatus;
  method: PayMethod;
  priceTier: Tier;
  expectedMinor: number;
  currency: Currency;
  supportUntil: Date | null;
  providerTxId: string | null;
  providerRef: string | null;
  amountReceivedMinor: number | null;
  receivedNote: string | null;
  consentAt: Date;
  consentVersion: string;
  consentIpHash: string | null;
  src: string | null;
  claimHash: string;
  createdAt: Date;
  paidAt: Date | null;
};

export type NewOrder = Omit<
  Order,
  | "id"
  | "supportUntil"
  | "providerTxId"
  | "providerRef"
  | "amountReceivedMinor"
  | "receivedNote"
  | "paidAt"
>;

/** "email" links are emailed; "thanks" links belong to the thanks page. They revoke independently. */
export type TokenKind = "email" | "thanks";

export type DownloadToken = {
  kind: TokenKind;
  id: string;
  orderId: string;
  tokenHash: string;
  expiresAt: Date;
  maxDownloads: number;
  downloadCount: number;
  revokedAt: Date | null;
  createdAt: Date;
  createdBy: "system" | "admin";
};

export type OrderEventActor = "system" | "admin" | "webhook" | "buyer";
