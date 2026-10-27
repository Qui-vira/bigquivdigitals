/** One place to read env vars: always trimmed (a trailing newline breaks keys). Returns "" when unset. */
export function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

import { SITE_URL } from "../site";

/** Production = Vercel production, or (off Vercel) NODE_ENV production. */
export function isProductionEnv(): boolean {
  const v = env("VERCEL_ENV");
  if (v) return v === "production";
  return env("NODE_ENV") === "production";
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const PROD_HOSTS = new Set(["bigquivdigitals.com", "www.bigquivdigitals.com"]);

/** Hosts a browser request may come from. Preview (*.vercel.app) and localhost only outside production. */
export function hostAllowed(hostname: string, production: boolean): boolean {
  if (PROD_HOSTS.has(hostname)) return true;
  if (production) return false;
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".vercel.app");
}

/**
 * The origin Flutterwave should send the buyer back to. Production: SITE_URL only,
 * never anything taken from the request. Elsewhere: the (allowed) request origin,
 * else VERCEL_URL, else SITE_URL.
 */
export function resolveSiteBase(requestOrigin: string | null, production: boolean, vercelUrl: string): string {
  if (production) return SITE_URL;
  try {
    if (requestOrigin) {
      const u = new URL(requestOrigin);
      if (hostAllowed(u.hostname, false)) return u.origin;
    }
  } catch {
    /* fall through */
  }
  if (vercelUrl && /^[a-z0-9.-]+$/i.test(vercelUrl)) return `https://${vercelUrl}`;
  return SITE_URL;
}
