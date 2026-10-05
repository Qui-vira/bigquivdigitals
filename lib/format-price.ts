/**
 * Currency-aware price label, shared by the payment modal header and the card
 * button so the two can never disagree. The card button used to hardcode `$`
 * and read "Pay $15,000" on an NGN charge.
 */
export function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", NGN: "₦", GBP: "£", EUR: "€" };
  const symbol = symbols[currency.toUpperCase()];
  return symbol
    ? `${symbol}${amount.toLocaleString()}`
    : `${amount.toLocaleString()} ${currency.toUpperCase()}`;
}
