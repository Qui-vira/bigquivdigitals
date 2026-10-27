# Companion payments (wave 2, coder B)

Charged in NGN only. The client never sends an amount. Flutterwave hosted (Standard) flow: card, Flutterwave bank transfer, USSD. Crypto is NOT built; the page offers "message us to pay by crypto". Manual bank transfer exists but is OFF unless `companion_products.allow_manual_transfer = true` and `bank_details` is filled.

Env var NAMES used (all read with `.trim()`): `DATABASE_URL`, `FLW_SECRET_KEY`, `FLW_SECRET_HASH`, `ORDER_IP_SALT`, `COURSE_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `RESEND_API_KEY` (alerts via D's notifier).

## POST /api/companion/checkout
Headers: `Content-Type: application/json`. `Origin` or `Referer` host must be bigquivdigitals.com, www.bigquivdigitals.com or localhost (else 403). Rate limit 8/min/IP (429, `Retry-After`) plus 5 orders/email/hour (429).

Request:
```json
{ "name": "Ada", "email": "ada@example.com",
  "consentFinal": true, "consentImmediate": true,
  "method": "flutterwave", "src": "x-bio", "shownTier": "founders", "hp": "" }
```
- Both ticks must be literally `true`. Alternative shape accepted: `"consent": { "allSalesFinal": true, "immediateAccess": true }`.
- `method` optional: `flutterwave` (default) or `bank_transfer`. Anything else (including `blockradar`) gives 400 `method_not_allowed`.
- `shownTier` optional (`founders` | `regular`): if the server tier differs, 409 `price_changed`, nothing created.
- `hp` honeypot: must be empty or absent. `productSlug` optional, default `theeditcompanion`. Any `amount`/`currency` field is ignored.

Success 200 (card): `{ "ok": true, "method": "flutterwave", "ref": "TEC-...", "orderRef": "TEC-...", "tier": "founders", "amountMinor": 8900000, "currency": "NGN", "link": "https://checkout.flutterwave.com/...", "paymentLink": "<same>" }`
Success 200 (transfer): `{ "ok": true, "method": "bank_transfer", "ref", "orderRef", "tier", "amountMinor", "currency", "bankDetails": "<owner text>", "narration": "TEC-..." }`

Both set the httpOnly cookie `tec_claim` (sameSite lax, secure in production, path /, 14 days; see claim.ts). Redirect the browser to `link`. Put `ref` in the thanks-page URL if you navigate there yourself.

Errors: `{ "ok": false, "code": "...", "error": "plain message" }`. Codes and status: `invalid` 400, `consent_required` 400, `invalid_email` 400, `invalid_name` 400, `method_not_allowed` 400, `product_not_found` 404, `product_inactive` 409, `price_changed` 409 (+ `tier`, `amountMinor`, `currency`), `rate_limited` 429, `forbidden` 403, `provider_error` 502 (order expired, buyer not charged), `server_error` 500.

## GET /api/companion/return
Flutterwave's `redirect_url` (`https://bigquivdigitals.com/api/companion/return`). Query `status`, `tx_ref`, `transaction_id` are NOT trusted: the server re-queries Flutterwave (`/v3/transactions/{id}/verify`, or `verify_by_reference` when only `status=successful` and `tx_ref` arrive), checks the order, settles idempotently with the webhook, then answers `303` to `/theeditcompanion/thanks?ref=TEC-...` (or `/theeditcompanion` when `tx_ref` is not a TEC- ref). Never throws: on a provider outage the buyer still lands on the thanks page and the webhook settles. Rate limit 30/min/IP. The thanks page polls `GET /api/companion/order-status?ref=` (coder D) for the real state.

## POST /api/companion/transfer-paid
Manual transfer "I have paid". Needs the `tec_claim` cookie. Same origin check. Rate limit 6/min/IP.
Request: `{ "orderRef": "TEC-...", "senderName": "optional", "note": "optional" }`.
200 `{ "ok": true, "state": "awaiting_transfer" }` (or `"paid"` if already paid). Records event `transfer_claimed`, alerts the owner. It never marks the order paid. 404 `{ok:false,error}` for unknown ref, wrong cookie or non-transfer order (uniform). 409 order not in a transfer state. 429 after 3 notices in 24 h.

## Flutterwave webhook (existing URL, no new route)
`POST /api/payment/flutterwave/webhook`. The existing route checks `verif-hash`, parses the body, and if `data.tx_ref` starts with `TEC-` calls `dispatchCompanionFlutterwave(verifHash, event)` (`webhook-dispatch.ts`) and returns its answer. QV- payloads follow the old code unchanged.
Companion handler (`handleCompanionFlutterwaveWebhook`, `flutterwave-handler.ts`): 1) `verif-hash` equals `FLW_SECRET_HASH` (timing safe, fails closed) else 401; 2) only `charge.completed` with `data.status = successful` proceeds (others 200 `{received:true,handled:false}`); 3) non-numeric `data.id` 400; 4) re-queries the verify API, ignores the body amounts; 5) wave 1 `applyVerifiedPayment` (tx_ref, status, currency NGN, amount >= order); 6) on `won`, schedules `deliverOrder(orderId)` (D, `lib/companion/delivery.ts`) via `after()`. Answers: 200 `{received:true,handled:true,outcome}` with outcome `paid_now | already_paid | underpaid | flagged | not_payable | rejected | unknown_order`; 500 `{error}` only for real internal errors (DB down, Flutterwave 5xx or network) so Flutterwave retries. Underpaid, tx-id reuse, closed order and unknown order alert the owner.

## Guards in the AI class routes (+19 lines total, comments included)
- `flutterwave/webhook/route.ts` +7: import + dispatch when `data.tx_ref` starts `TEC-`.
- `flutterwave/verify/route.ts` +6: a verified payment whose `tx_ref` starts `TEC-` returns 400 `Payment not verified`, writes nothing.
- `blockradar/webhook/route.ts` +6: `metadata.order_ref` starting `TEC-` returns 200 `{received:true,ignored:"companion"}`, writes nothing.

## Modules
`neon-store.ts` (`createNeonStore()` / `getCompanionStore()`, same object, satisfies `CompanionStore` and D's `DeliveryStore`), `flutterwave.ts`, `checkout-handler.ts`, `flutterwave-handler.ts`, `return-handler.ts`, `transfer-handler.ts`, `webhook-dispatch.ts`, `payments-runtime.ts` (real deps), `deps.ts`. Tests: `npx tsx --test lib/companion/__tests__/*.test.ts`.

## Assumptions to check at step 0
- `session_duration` and `max_retry_attempt` are sent inside `configurations` (Flutterwave's code sample) although the parameter table lists them top level.
- `payment_options: "card,banktransfer,ussd"` only works if "Disable preferred payment methods" is off in the dashboard.
- The dashboard webhook URL is `/api/payment/flutterwave/webhook` and retries are on.
