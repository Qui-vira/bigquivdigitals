import { createHash } from "node:crypto";

/** Bump when the wording below changes. Stored on every order. */
export const CONSENT_VERSION = "2026-10-15.v1";

export const CONSENT_FINAL_TEXT =
  "I understand that all sales are final and there are no refunds. I have read the Terms, the Privacy Policy and the Licence.";
export const CONSENT_IMMEDIATE_TEXT =
  "I want my download immediately and I understand I give up any right to cancel once I have it.";

export type ConsentInput = { allSalesFinal?: unknown; immediateAccess?: unknown };

/** Both boxes must be literally true. Truthy strings like "true" or 1 do not count. */
export function consentGiven(input: ConsentInput | null | undefined): boolean {
  return !!input && input.allSalesFinal === true && input.immediateAccess === true;
}

/** sha256(salt + ip). Returns null when there is no ip. Salt comes from ORDER_IP_SALT. */
export function hashIp(ip: string | null | undefined, salt: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(salt + ip).digest("hex");
}
