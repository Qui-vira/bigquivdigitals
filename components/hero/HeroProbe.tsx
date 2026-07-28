"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Stats } from "./liquid-glass";

/**
 * Dev-only frame-time and tuning readout for the hero shader.
 *
 * Gated twice: the query param turns it on, and the NODE_ENV check means the
 * component returns null in a production build regardless of the URL. Read it
 * off a real device; throttled desktop Chromium models a mid-range Android
 * rather than measuring one.
 *
 *   localhost:3001/?probe=1
 *   localhost:3001/?probe=1&k=0.5&amp=0.42&lens=0.12&chroma=0.06&band=0.3
 *
 * The tuning values shown are live, so the numbers you land on by fiddling the
 * query string are the numbers to bake into DEFAULT_TUNING.
 */

/**
 * Module-level store, so the client's FIRST snapshot is always `false` and
 * matches getServerSnapshot.
 *
 * Reading location.search directly from getSnapshot looks equivalent but is
 * not: on a ?probe=1 load it returns true on the client while the server
 * returned false, and useSyncExternalStore treats that as a hydration error.
 * The real value is read after commit and published through the subscription,
 * which is the mechanism this hook exists for.
 */
let probeOn = false;
let probeRead = false;
const probeListeners = new Set<() => void>();

function readProbe() {
  if (probeRead) return;
  probeRead = true;
  const next =
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(window.location.search).has("probe");
  if (next !== probeOn) {
    probeOn = next;
    for (const l of probeListeners) l();
  }
}

function subscribeProbe(cb: () => void) {
  probeListeners.add(cb);
  queueMicrotask(readProbe);
  return () => {
    probeListeners.delete(cb);
  };
}

export function useProbeEnabled() {
  return useSyncExternalStore(subscribeProbe, () => probeOn, () => false);
}

/* ── bisect flags for the portrait paint issue ─────────────────────────── */

export interface DevFlags {
  /** Remove the legibility scrim overlays. */
  noscrim: boolean;
  /** Do not mount the WebGL canvas at all. */
  nocanvas: boolean;
  /** Base plate alone: no copy, no scrim, no canvas. */
  plateonly: boolean;
}

/**
 * Frozen and shared, so getSnapshot returns a stable reference and the
 * hydration snapshot is identical to the server's. Returning a fresh object
 * from getSnapshot would make useSyncExternalStore loop forever.
 */
const NO_FLAGS: DevFlags = Object.freeze({
  noscrim: false,
  nocanvas: false,
  plateonly: false,
});

let devFlags: DevFlags = NO_FLAGS;
let devRead = false;
const devListeners = new Set<() => void>();

function readDev() {
  if (devRead) return;
  devRead = true;
  if (process.env.NODE_ENV === "production") return;
  const q = new URLSearchParams(window.location.search);
  const next: DevFlags = {
    noscrim: q.has("noscrim"),
    nocanvas: q.has("nocanvas"),
    plateonly: q.has("plateonly"),
  };
  if (next.noscrim || next.nocanvas || next.plateonly) {
    devFlags = next;
    for (const l of devListeners) l();
  }
}

function subscribeDev(cb: () => void) {
  devListeners.add(cb);
  queueMicrotask(readDev);
  return () => {
    devListeners.delete(cb);
  };
}

export function useDevFlags(): DevFlags {
  return useSyncExternalStore(subscribeDev, () => devFlags, () => NO_FLAGS);
}

const TUNE_KEYS = ["k", "amp", "lens", "chroma", "band", "blobScale", "drift"] as const;
const TIER_KEYS = { octaves: "octaves", res: "resScale", blobs: "maxBlobs" } as const;

function numbers(keys: readonly string[]) {
  if (typeof window === "undefined") return {};
  if (process.env.NODE_ENV === "production") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, number> = {};
  for (const key of keys) {
    const raw = q.get(key);
    if (raw === null) continue;
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}

/** Shader tuning from the query string: k, amp, lens, chroma, band, blobScale, drift. */
export function readTuningOverrides(): Record<string, number> {
  return numbers(TUNE_KEYS);
}

/**
 * Tier overrides from the query string: octaves, res, blobs.
 *
 * These let a candidate tier be tested on a real device without shipping it —
 * tier 2 at 3 octaves and 0.65 resolution, say — so the decision is made on a
 * measured frame time rather than on how it looks on a desktop GPU.
 */
export function readTierOverrides(): Record<string, number> {
  const raw = numbers(Object.keys(TIER_KEYS));
  const out: Record<string, number> = {};
  for (const [param, field] of Object.entries(TIER_KEYS)) {
    if (raw[param] !== undefined) out[field] = raw[param];
  }
  return out;
}

const ROW = "flex justify-between gap-6 tabular-nums";

export function HeroProbe({ getStats }: { getStats: () => Stats | null }) {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setS(getStats()), 250);
    return () => window.clearInterval(id);
  }, [getStats]);

  if (process.env.NODE_ENV === "production") return null;
  if (!s) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-3 right-3 z-50 w-56 rounded-md border border-white/15 bg-black/85 p-3 font-mono text-[11px] leading-relaxed text-white/85 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="mb-1 flex justify-between font-semibold text-white">
        <span>hero probe</span>
        <span className={s.warmingUp ? "text-amber-400" : "text-emerald-400"}>
          {s.warmingUp ? "warmup" : "live"}
        </span>
      </div>
      <div className={ROW}>
        <span>frame mean</span>
        <span>{s.meanMs.toFixed(1)} ms</span>
      </div>
      <div className={ROW}>
        <span>frame p95</span>
        <span>{s.p95Ms.toFixed(1)} ms</span>
      </div>
      <div className={ROW}>
        <span>fps</span>
        <span>{s.fps.toFixed(0)}</span>
      </div>
      <div className="my-1.5 h-px bg-white/15" />
      <div className={ROW}>
        <span>tier</span>
        <span>
          {s.tierIndex} {s.tierName}
        </span>
      </div>
      <div className={ROW}>
        <span>res scale</span>
        <span>{s.resScale}</span>
      </div>
      <div className={ROW}>
        <span>octaves</span>
        <span>{s.octaves}</span>
      </div>
      <div className={ROW}>
        <span>blobs</span>
        <span>
          {s.activeBlobs} / {s.maxBlobs}
        </span>
      </div>
      <div className={ROW}>
        <span>blob ceiling</span>
        <span>{s.blobCeiling}</span>
      </div>
      <div className={ROW}>
        <span>base radius</span>
        <span>{s.baseRadiusPx.toFixed(1)} px</span>
      </div>
      <div className="my-1.5 h-px bg-white/15" />
      <div className={ROW}>
        <span>smin k</span>
        <span>{s.tune.k}</span>
      </div>
      <div className={ROW}>
        <span>noise amp</span>
        <span>{s.tune.amp}</span>
      </div>
      <div className={ROW}>
        <span>lens</span>
        <span>{s.tune.lens}</span>
      </div>
      <div className={ROW}>
        <span>chroma</span>
        <span>{s.tune.chroma}</span>
      </div>
      <div className={ROW}>
        <span>band</span>
        <span>{s.tune.band}</span>
      </div>
      <div className={ROW}>
        <span>blobScale</span>
        <span>{s.tune.blobScale}</span>
      </div>
      <div className={ROW}>
        <span>drift</span>
        <span>{s.tune.drift}</span>
      </div>
    </div>
  );
}
