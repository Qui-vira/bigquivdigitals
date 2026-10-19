# lib/companion interface (wave 1)

Sealed module. Pure logic over a small `CompanionStore` interface (`store.ts`). No file here imports `next`, a database driver, a payment API or `process.env`. Wave 2 writes the Neon adapter, the routes, the emails and the page against this file.

Run tests: `npx tsx --test lib/companion/*.test.ts`

## Owner decisions baked in (15 Oct 2026)
- Charged in NAIRA only, integer KOBO. Founders 8,900,000 kobo (N89,000), regular 12,900,000 kobo (N129,000). `Currency = "NGN"`.
- USD ($67 / $97) is display only: `Product.displayUsdFoundersMinor` / `displayUsdRegularMinor` (cents). Never charged, never checked.
- Founders window = `foundersEndsAt` timestamp (owner sets at go-live, +30 days) and optional `foundersCap` (default null). Neither set: founders price stays, no counter. Never fake scarcity.
- Support = 30 days from `paid_at` (`support_until`). No update promise.

## Money (`money.ts`)
- `toMinor(value: unknown): number | null`. Provider MAJOR units (number or numeric string) to integer minor. Null if not finite, negative, empty, or more than 2 decimals.
- `toMajor(minor): number` (sends to a provider). `assertMinor(x)` throws. `formatMinor(minor): string` ("89000.00").

## Types (`types.ts`)
`Product`, `Order`, `NewOrder`, `DownloadToken`, `OrderStatus` (created | awaiting_payment | awaiting_transfer | underpaid | paid | refunded | expired | flagged), `PayMethod` (flutterwave | blockradar | bank_transfer), `Tier`, `Currency`, `OrderEventActor` (system | admin | webhook | buyer). Dates are `Date`; the adapter maps to timestamptz. Column names: see `drizzle/companion-schema.sql` (tables prefixed `companion_`).

## Store (`store.ts`) the Neon adapter must implement
`interface CompanionStore`. Contract: every method THROWS on a database error (never swallow; routes turn it into HTTP 500 so the provider retries; never email after a failed write).
- `getProduct(slug)`, `getOrderById(id)`, `getOrderByRef(ref)`: row or null.
- `countFoundersTaken(slug, holdSince)`: count orders with tier founders and status paid or awaiting_transfer, plus created/awaiting_payment with created_at >= holdSince.
- `insertOrder(NewOrder)`: returns the Order (with id). Throws `DuplicateOrderRefError` on unique violation of order_ref.
- `claimOrderPaid(orderId, allowedFrom, patch)`: ONE conditional `UPDATE ... SET status='paid', paid_at, provider_tx_id, amount_received_minor, received_note, support_until WHERE id=$1 AND status = ANY($2) RETURNING *`. Result `won` | `not_claimable{status}` (a select of the current status when no row) | `tx_conflict` (catch Postgres unique violation 23505 on provider_tx_id) | `not_found`.
- `setOrderStatus(orderId, status)`.
- `insertToken`, `getTokenByHash(hash)`, `revokeTokensForOrder(orderId, now)` (returns count), `resetDownloadCount(tokenId)`.
- `consumeDownload(tokenId, now)`: ONE `UPDATE ... SET download_count = download_count + 1 WHERE id=$1 AND download_count < max_downloads AND revoked_at IS NULL AND expires_at > $now RETURNING *`; null when no row.
- `addEvent(orderId, actor, kind, detail, at)`, `countEvents(orderId, kind, since)`.
- Not in the interface (adapter-only, routes call directly): download_log insert, email_sent_at / email_attempts / last_email_error updates, admin lists, CSV, product updates.
Test fake: `testing/memory-store.ts` (`MemoryStore`, `sampleProduct()`).

## Tiers (`tiers.ts`)
`currentTier(product, now, foundersTaken): TierResult` where `TierResult = { tier, amountMinor, currency: "NGN", foundersPlacesLeft: number|null, countdownTo: Date|null }`.
Founders iff (no end date or now < end, strictly) AND (no cap or taken < cap). `foundersPlacesLeft` only when a cap is set and founders is open. `countdownTo` only when an end date is set and open. The page shows a counter only when those are non-null.

## Orders (`orders.ts`)
- `quote(store, slug, now): Promise<(TierResult & {productSlug, active}) | null>`. Use on the page AND in checkout (same math). Uses `FOUNDERS_HOLD_MINUTES = 60` as the unpaid hold.
- `createOrder(store, input): Promise<CreateOrderResult>`.
  Input: `{ productSlug, name, email, method, consent:{allSalesFinal, immediateAccess}, shownTier?, src?, ip?, ipSalt, now }`. There is NO amount input; any extra property is ignored. Price, tier and currency are read from the product and locked on the order. Email is trimmed and lower-cased; ref = `TEC-` + 22 url-safe chars.
  Success: `{ ok:true, order, claimToken }`. Set `claimToken` as the httpOnly cookie; only its sha256 is stored (`order.claimHash`, compare with `hashToken(cookie)`).
  Errors `{ ok:false, code }`: `product_not_found`, `product_inactive`, `consent_required`, `invalid_email`, `invalid_name`, `method_not_allowed` (bank_transfer while `allowManualTransfer` is false, or unknown method), and `price_changed` (with `tier`, `amountMinor`, `currency`; return HTTP 409; no order created).
  Initial status: `awaiting_payment` (flutterwave, blockradar) or `awaiting_transfer` (bank_transfer). Rate limits and honeypot are the route's job.
- `markOrderPaid(store, orderId, { providerTxId, amountReceivedMinor, note?, actor }, now): Promise<MarkPaidResult>`.
  Results: `won{order}` (this caller must mint the link and send the email, exactly once), `already_paid` (replay: do nothing, answer 200), `flagged_tx_conflict` (order set flagged: alert owner), `not_payable{status}` (refunded or flagged: alert owner), `not_found`. Payable from created, awaiting_payment, awaiting_transfer, underpaid, expired (a late real payment on an expired order is honoured). Sets `support_until = now + 30 days`. Does NOT check the amount: webhook/return paths use `applyVerifiedPayment`; the admin "Mark transfer paid" path must compare its entered amount to `order.expectedMinor` itself (less: set `underpaid` via `store.setOrderStatus`; forcing needs a note).
- `applyVerifiedPayment(store, tx, actor, now): Promise<ApplyResult>`. `tx = { txRef, status, currency, amount (MAJOR units), providerTxId }` taken from the provider VERIFY API response, never the webhook body. Looks up the order by `txRef`, runs `checkPayment`, then `markOrderPaid`. Extra results: `rejected{reason}` (bad_ref_prefix | unknown_order | ref_mismatch | status_not_successful | currency_mismatch | amount_invalid) and `underpaid{receivedMinor}` (order set to underpaid, no link, alert owner).
- `supportUntil(paidAt): Date` (+30 days), `SUPPORT_DAYS`, `PAYABLE_FROM`, `newOrderRef()`.

## Payment predicate (`confirm.ts`)
`checkPayment(order, tx): { ok:true, receivedMinor } | { ok:false, reason, receivedMinor? }`. Rules: tx_ref starts `TEC-` and equals `order.orderRef`; status is exactly `"successful"`; currency equals `order.currency` (case-insensitive input); amount valid and `>= order.expectedMinor` (overpay accepted). `isCompanionRef(ref)` and `ORDER_REF_PREFIX` are for the shared-webhook guards.

## Signatures (`hmac.ts`)
- `verifyFlutterwaveHash(headerValue, secretHash): boolean`. Read from current docs (https://developer.flutterwave.com/docs/webhooks, 2026-10-15): Flutterwave does NOT sign with HMAC. It sends your dashboard secret hash unchanged in header `verif-hash`; compare with the stored secret. Timing safe, length safe, fails closed on an empty secret. After this passes, re-query `GET /v3/transactions/{id}/verify` and feed that result to `applyVerifiedPayment`.
- `verifyHmac({ algorithm, secret, rawBody, signature }): boolean` for Blockradar (plan: sha512 hex, header `x-blockradar-signature`; wave 2 must re-check the current Blockradar docs). Raw body, case-insensitive hex, fails closed.
- `computeHmacHex(alg, secret, body)`, `safeEqual(a, b)`.

## Download tokens (`tokens.ts`)
- `mintToken(): { token, hash }` (32 random bytes base64url; hash = sha256 hex). `hashToken(token)`.
- `issueDownloadLink(store, { orderId, ttlHours, maxDownloads, createdBy, now }): { token, row }`. Revokes all older links of the order first. Plaintext token is returned once; put it in the email: `/theeditcompanion/download?t=<token>`. Use `product.linkTtlHours` and `product.maxDownloads`.
- `inspectToken(store, token, now): { state:"valid", row, downloadsLeft } | { state: "invalid"|"revoked"|"expired"|"exhausted" }`. Read only, for the landing page GET (consumes nothing). Show ONE generic message for every non-valid state.
- `consumeDownload(store, token, now): { ok:true, row, downloadsLeft } | { ok:false, reason }`. For the POST download route; atomic count. Not ok: respond 410.
- `resendLink(store, { orderId, ttlHours, maxDownloads, by:"buyer"|"admin", now }): { ok:true, link } | { ok:false, reason:"rate_limited" }`. Buyer max `MAX_RESENDS_PER_DAY = 3` per rolling 24 h per order. Revokes old links. Caller sends the email. The self-serve route must answer the same text whether or not an order exists.
- `revokeLinks(store, orderId, now): number`.

## Helpers
- `sanitiseSrc(raw): string | null` (`src.ts`): lowercase, only `[a-z0-9:_-]`, max 40, empty becomes null. `createOrder` already applies it.
- `consentGiven({allSalesFinal, immediateAccess})` (`consent.ts`): both must be boolean `true`. Constants `CONSENT_VERSION`, `CONSENT_FINAL_TEXT`, `CONSENT_IMMEDIATE_TEXT` (owner approves wording). `hashIp(ip, salt)` = sha256(salt + ip) or null; the salt is env var NAME `ORDER_IP_SALT`.

## Not done here (wave 2)
Neon adapter, Flutterwave create-payment and verify HTTP calls, Blockradar, email, Telegram notify, routes, claim cookie handling, CSV, admin, page, private Blob streaming. Expiring old unpaid orders and the admin "Expire/Flag/Refund" status changes use `store.setOrderStatus` plus `addEvent`.
