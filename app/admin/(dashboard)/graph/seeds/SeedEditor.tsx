"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSeed, startGraphScanForSeed, toggleSeed, updateSeed } from "@/app/admin/actions/graph";
import type { GraphSeedAccount } from "@/lib/graph-types";
import {
  formatCursorSnippet,
  getSeedCursor,
  PROVIDER_CURSOR_WARNING,
  seedLastScannedLabel,
} from "@/lib/graph-seed-cursors";

const SEED_TYPES = ["exchange", "kol", "bd", "founder", "competitor", "custom"] as const;

export default function SeedEditor({ seeds }: { seeds: GraphSeedAccount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scanFlash, setScanFlash] = useState<{ type: "ok" | "err"; message: string; runId?: string } | null>(null);

  return (
    <div className="mt-8 space-y-6">
      {scanFlash && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            scanFlash.type === "ok"
              ? "border-green-600/40 bg-green-600/10 text-green-200"
              : "border-red-600/40 bg-red-600/10 text-red-200"
          }`}
        >
          <p>{scanFlash.message}</p>
          {scanFlash.runId && (
            <p className="mt-1 text-xs">
              Run ID: <span className="font-mono">{scanFlash.runId}</span>{" "}
              <Link href="/admin/graph/scan" className="underline ml-2">
                View on scan page
              </Link>
            </p>
          )}
        </div>
      )}
      <form
        action={(fd) => startTransition(async () => { await createSeed(fd); })}
        className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3"
      >
        <h2 className="text-sm font-medium text-white">Add seed account</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <input
            name="username"
            placeholder="@binance"
            required
            className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
          />
          <select
            name="seed_type"
            defaultValue="exchange"
            className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
          >
            {SEED_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            name="priority"
            type="number"
            defaultValue={80}
            className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
          />
          <input
            name="display_name"
            placeholder="Display name"
            className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="flex gap-4 text-xs text-[#aaa]">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="enabled" defaultChecked />
            Enabled
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_high_value" defaultChecked />
            High-value seed
          </label>
        </div>
        <textarea
          name="notes"
          placeholder="Notes"
          rows={2}
          className="w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#E63946] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Saving..." : "Add seed"}
        </button>
      </form>

      <div className="space-y-3">
        {seeds.length === 0 && (
          <p className="text-sm text-[#555]">No seeds yet. Add @binance to start.</p>
        )}
        {seeds.map((seed) => (
          <form
            key={seed.id}
            action={(fd) => startTransition(async () => { await updateSeed(seed.id, fd); })}
            className="rounded-xl border border-[#222] bg-[#111] p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              <input
                name="username"
                defaultValue={seed.username}
                className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
              />
              <select
                name="seed_type"
                defaultValue={seed.seed_type}
                className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
              >
                {SEED_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                name="priority"
                type="number"
                defaultValue={seed.priority}
                className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
              />
              <input
                name="display_name"
                defaultValue={seed.display_name}
                className="rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#aaa]">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="enabled" defaultChecked={seed.enabled} />
                Enabled
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_high_value" defaultChecked={seed.is_high_value} />
                High-value
              </label>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await toggleSeed(seed.id, !seed.enabled);
                  })
                }
                className="text-[#888] hover:text-white cursor-pointer"
              >
                Quick toggle
              </button>
              {seedLastScannedLabel(seed) && (
                <span className="text-[#555]">Last scan: {seedLastScannedLabel(seed)}</span>
              )}
            </div>
            {(seed.seed_quality_score != null || seed.bd_leads_found != null) && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#666] rounded-lg border border-[#222] bg-[#0a0a0a] p-2">
                <div>
                  <span className="text-[#888]">Quality: </span>
                  <span className="text-white">{seed.seed_quality_score ?? 0}</span>
                </div>
                <div>
                  <span className="text-[#888]">BD yield: </span>
                  <span className="text-white">{((seed.bd_yield_rate ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#888]">Leads: </span>
                  <span className="text-white">{seed.bd_leads_found ?? 0}</span>
                </div>
                <div>
                  <span className="text-[#888]">Cost/lead: </span>
                  <span className="text-white">${Number(seed.cost_per_lead ?? 0).toFixed(2)}</span>
                </div>
                {seed.recommended_action && (
                  <div className="col-span-2 sm:col-span-4 text-yellow-200/80">
                    → {seed.recommended_action.replace(/_/g, " ")}
                    {seed.last_quality_note ? ` — ${seed.last_quality_note}` : ""}
                  </div>
                )}
              </div>
            )}
            <div className="mt-2 grid gap-1 text-[10px] text-[#666] md:grid-cols-2">
              <span>
                Followers scanned: {getSeedCursor(seed, "follower")?.profiles_fetched ?? 0} ·{" "}
                {formatCursorSnippet(getSeedCursor(seed, "follower"))}
              </span>
              <span>
                Following scanned: {getSeedCursor(seed, "following")?.profiles_fetched ?? 0} ·{" "}
                {formatCursorSnippet(getSeedCursor(seed, "following"))}
              </span>
              {(getSeedCursor(seed, "follower")?.provider_supports_resume === false ||
                getSeedCursor(seed, "following")?.provider_supports_resume === false) && (
                <span className="col-span-full text-yellow-300/90">{PROVIDER_CURSOR_WARNING}</span>
              )}
            </div>
            <textarea
              name="notes"
              defaultValue={seed.notes}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg border border-[#333] px-3 py-1.5 text-xs text-white hover:border-[#555] cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                disabled={isPending || !seed.enabled}
                onClick={() =>
                  startTransition(async () => {
                    setScanFlash(null);
                    const result = await startGraphScanForSeed(seed.id);
                    if (result.ok) {
                      setScanFlash({
                        type: "ok",
                        message: `Scan queued for @${seed.username}.`,
                        runId: result.runId,
                      });
                      router.refresh();
                    } else {
                      setScanFlash({
                        type: "err",
                        message: result.error || "Failed to start scan",
                      });
                    }
                  })
                }
                className="rounded-lg bg-[#E63946]/20 px-3 py-1.5 text-xs text-[#E63946] hover:bg-[#E63946]/30 disabled:opacity-50 cursor-pointer"
              >
                Scan this seed
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
