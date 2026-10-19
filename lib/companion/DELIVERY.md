# Delivery, download, admin (wave 2, coder D)

Run tests: `npx tsx --test lib/companion/*.test.ts`

## What coder B must provide
- `lib/companion/neon-store.ts` exporting `createNeonStore(): DeliveryStore` (type in `runtime.ts`). It is `CompanionStore` plus: `getEmailState`, `recordEmailResult` (bumps `email_attempts`, sets `email_sent_at` or `last_email_error`), `insertDownloadLog`, `listOrders` (newest first, download count = sum over the order's tokens), `listEvents`. `delivery-memory.ts` is the reference behaviour.
- After `markOrderPaid` returns `won`: `await deliverOrder(order.id)` from `lib/companion/delivery.ts`. Signature `deliverOrder(orderId: string): Promise<{ ok: boolean; reason?: string }>`. Reasons: `not_found`, `not_paid`, `product_not_found`, `email_failed`, `already_delivered` (ok true).
- Set the claim cookie with the constants in `claim.ts`: name `CLAIM_COOKIE_NAME` (`tec_claim`), value = `claimToken` from `createOrder`, options from `claimCookieOptions(production)` (httpOnly, sameSite lax, secure in production).
- Owner alert for a new bank transfer: `renderOwnerTransferAwaiting(order)` in `emails/templates.ts` plus `createDefaultNotifier().alertOwner(subject, text)`.

## Routes
- `POST /api/companion/download` body: form field `token` (or JSON `{ "token": "..." }`). 200 streams the zip: `content-type: application/zip`, `content-disposition: attachment; filename="TheEditCompanion.zip"`, `content-length`, `cache-control: no-store`, `accept-ranges: none`. Any Range header gives 416. Bad, expired, revoked or used-up token gives 410 with ONE identical HTML page (with the four contacts). Missing file in the store gives 503 and does not burn a download. 20 requests per 10 min per IP (429). The raw token is never logged.
- `GET /companion/download/[token]` landing page. Read only (never consumes). Valid: explains the file and shows a form that POSTs to the route. Invalid: the same generic page.
- `GET /api/companion/order-status?ref=TEC-...` with the claim cookie. Response `{ status: "pending"|"paid"|"failed", downloadUrl?, emailSent: boolean }` (`emailSent` is true only when the delivery email was actually sent). `downloadUrl` only when paid and only with a matching claim cookie. Wrong or missing cookie and unknown ref both give the same `404 { error: "not_found" }`. When paid it mints a separate 24 h thanks link (max 2 downloads, does not revoke the emailed link) and keeps it in the httpOnly cookie `tec_dl`, so repeat polls return the same URL and the thanks page still works if the email fails. `underpaid`, `refunded`, `expired`, `flagged` all show as `failed`.
- `GET /api/admin/companion-orders/export?status=&src=` admin only (401 otherwise). CSV with formula injection protection (cells starting `= + - @ tab CR` get a leading `'`).
- Admin page `/admin/companion-orders`, server actions in `app/admin/actions/companion-orders.ts`. Each action calls `requireAdmin()` first and the underlying `admin-ops.ts` functions take the check as a parameter and await it before anything else. Mark transfer paid needs amount and bank reference; less than expected sets `underpaid` unless "accept less" is ticked and a note is given.

## File store setup (OWNER APPROVAL NEEDED, nothing was created)
1. Create a SECOND Vercel Blob store, access **private**, for this product only. The existing `BLOB_READ_WRITE_TOKEN` belongs to the PUBLIC store used by `app/api/upload/route.ts`: never reuse, replace or delete it.
   - Dashboard: Storage, Create Database, Blob, choose **Private**, name it `companion-private`. When it asks for the env var prefix or name, set a custom one (for example `COMPANION_BLOB`), so Vercel does NOT write `BLOB_READ_WRITE_TOKEN` again.
   - CLI alternative: `vercel blob create-store companion-private --access private` WITHOUT `--yes`, and connect it only with its own variable name.
   - Copy that store's read-write token into a project env var named exactly `COMPANION_BLOB_TOKEN` (Production and Preview). The code reads only this variable, trimmed. If it is missing, downloads answer a generic 503, nothing is counted, and the log names the variable.
   - After connecting, confirm the old `BLOB_READ_WRITE_TOKEN` is unchanged and the existing upload still works.
2. File key: `companion/TheEditCompanion.zip` (override with env var `COMPANION_FILE_KEY`).
3. Upload once from your machine, for example `put("companion/TheEditCompanion.zip", fileStream, { access: "private", addRandomSuffix: false })` in a throwaway script (or the dashboard). Do not upload through a Vercel function: functions have a 4.5 MB request body limit.
4. Check the upload: size and sha256 must equal `DELIVERY_FILE_BYTES` and `DELIVERY_FILE_SHA256` in `lib/companion/file-hash.ts` (11,773,338 bytes, sha256 `db8e28c3...6f802` as of 2026-10-19, after the Day 12 render-method update). After EVERY rebuild of the zip run `node scripts/companion-zip-hash.mjs <path-to-zip> --write`: it prints the new hash, updates `file-hash.ts`, and prints the SQL for the product row. Manual check: `certutil -hashfile TheEditCompanion.zip SHA256`.
5. **Risk to test before launch:** the Vercel limits page (read 2026-10-15, https://vercel.com/docs/functions/limitations) says the response body of a function is limited to 4.5 MB and does not say streamed responses are exempt. The zip is 11.2 MB. Test on a preview deployment with a real 11 MB blob first. If it is cut off, the fallback is a short-lived private-blob read URL redirect (needs a design change; tell the lead).
6. The SDK `get` has no byte-range option, so ranges are refused rather than faked. Duration is `maxDuration = 300` on the download route.

## Env var names used
`RESEND_API_KEY`, `COMPANION_OWNER_EMAIL` (default contact@bigquivdigitals.com), `COURSE_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` (existing Telegram pattern), `ORDER_IP_SALT`, `COMPANION_BLOB_TOKEN`, `COMPANION_FILE_KEY`, `NEXT_PUBLIC_SITE_URL` (default https://bigquivdigitals.com).

## Behaviour notes
- `deliverOrder` is idempotent once an email has succeeded. Concurrent first calls are prevented by `markOrderPaid` returning `won` to exactly one caller.
- A failed email: order stays `paid`, `email_sent_at` null and `last_email_error` set (admin shows a red "Delivery failed" badge), owner alerted. Calling `deliverOrder` again retries.
- Wave 1 `resendLink` counts admin resends toward the buyer daily cap of 3 (same event kind). Left as is.
- Tokens are in the landing URL path. The page sets noindex and `referrer: no-referrer`.

## Token kinds (review fix H3, M4)
- Tokens have `kind`: `email` (emailed) or `thanks` (thanks page). Issuing or resending the email link revokes only older `email` links; an admin Re-send with "also revoke thanks link", or Revoke, kills both.
- Thanks links: at most 3 minted per order per 24 h, one live at a time, and the thanks page gives at most 2 downloads per order in total (counted by `thanks_download` events). When the bound is hit the response has no `downloadUrl` and the buyer uses the email.
- **Schema change needed:** `companion_download_tokens.kind text not null default 'email' check (kind in ('email','thanks'))`. It is in `drizzle/companion-schema.sql`, with an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for a branch that already exists.
