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

/** The query string cannot change without a navigation, so nothing to subscribe to. */
const noSubscribe = () => () => {};

export function useProbeEnabled() {
  // useSyncExternalStore rather than an effect: the server snapshot is false, so
  // the hydration render matches, and the real value lands without a cascading
  // setState in an effect body.
  return useSyncExternalStore(
    noSubscribe,
    () =>
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("probe"),
    () => false
  );
}

/** Reads k / amp / lens / chroma / band overrides out of the query string. */
export function readTuningOverrides(): Record<string, number> {
  if (typeof window === "undefined") return {};
  if (process.env.NODE_ENV === "production") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, number> = {};
  for (const key of ["k", "amp", "lens", "chroma", "band"]) {
    const raw = q.get(key);
    if (raw === null) continue;
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) out[key] = n;
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
    </div>
  );
}
