"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  pauseGraphScan,
  resumeGraphScan,
  startGraphScan,
  stopGraphScan,
  updateGraphCronSettings,
} from "@/app/admin/actions/graph";
import {
  DEFAULT_PRESET,
  ENABLED_SCAN_PRESETS,
  MAX_SEEDS_PER_RUN,
  PRESET_DESCRIPTIONS,
  SCAN_PRESETS,
  BD_SCAN_DEFAULTS,
  type GraphCronStatus,
  type GraphJobControls,
  type GraphScanFilterPreset,
  type GraphScanMode,
  type GraphScanPreset,
  type GraphSeedAccount,
} from "@/lib/graph-types";
import {
  TARGET_FILTER_PRESETS,
  TARGET_FILTER_TYPE_OPTIONS,
  type GraphTargetFilterType,
} from "@/lib/graph-target-filters";
import { formatWeeklyDay } from "@/lib/graph-cron-utils";
import { getRunStatusHint, type RunSkipBreakdown } from "@/lib/graph-scan-messages";
import {
  formatCursorSnippet,
  getSeedCursor,
  PROVIDER_CURSOR_WARNING,
} from "@/lib/graph-seed-cursors";
import { formatSeedOptionLabel } from "@/lib/graph-seed-utils";
import {
  APIFY_COST_EXAMPLES,
  APIFY_COST_WARNING,
  estimateApifyCost,
  estimatePresetScanCost,
  formatCostUsd,
} from "@/lib/graph-cost";

type LatestRun = {
  id: string;
  status: string;
  profiles_collected: number;
  profiles_classified: number;
  edges_created: number;
  estimated_cost_usd: number;
  actual_cost_usd?: number;
  apify_profiles_fetched?: number;
  profiles_stored?: number;
  profiles_skipped?: number;
  leads_created?: number;
  stopped_reason: string;
  skip_already_scanned: boolean;
  target_filter_enabled?: boolean;
  selected_seed_id: string | null;
  preset_name: string | null;
  created_at: string;
} | null;

type Flash = { type: "ok" | "err"; message: string; runId?: string } | null;

export default function ScanControl({
  controls,
  latestRun,
  runSkipBreakdown = null,
  selectedSeedUsername,
  cronStatus,
  enabledSeeds,
  savedFilterPresets = [],
}: {
  controls: GraphJobControls;
  latestRun: LatestRun;
  runSkipBreakdown?: RunSkipBreakdown | null;
  selectedSeedUsername: string | null;
  cronStatus: GraphCronStatus;
  enabledSeeds: GraphSeedAccount[];
  savedFilterPresets?: GraphScanFilterPreset[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<Flash>(null);
  const [preset, setPreset] = useState<GraphScanPreset>(DEFAULT_PRESET);
  const [scanMode, setScanMode] = useState<GraphScanMode>(BD_SCAN_DEFAULTS.scanMode);
  const [depth, setDepth] = useState(1);
  const [seedSelection, setSeedSelection] = useState("auto");
  const [maxSeeds, setMaxSeeds] = useState(1);
  const [targetFilterEnabled, setTargetFilterEnabled] = useState(BD_SCAN_DEFAULTS.targetFilterEnabled);
  const [targetFilterType, setTargetFilterType] = useState<GraphTargetFilterType>(BD_SCAN_DEFAULTS.targetFilterType);
  const [customKeywords, setCustomKeywords] = useState("");
  const [matchMode, setMatchMode] = useState<"any" | "all">(BD_SCAN_DEFAULTS.matchMode);
  const [targetMinScore, setTargetMinScore] = useState(BD_SCAN_DEFAULTS.targetMinScore);
  const [targetMinFollowers, setTargetMinFollowers] = useState(0);
  const [verifiedFilter, setVerifiedFilter] = useState<"any" | "verified_only" | "exclude_verified">("any");
  const [savePreset, setSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const limits = SCAN_PRESETS[preset];
  const scanCostEstimate = estimatePresetScanCost({ ...limits, scanMode });
  const selectedPresetKeywords =
    targetFilterType !== "custom"
      ? TARGET_FILTER_PRESETS[targetFilterType]?.keywords.join(", ")
      : "";
  const specificSeed = seedSelection !== "auto";
  const selectedSeed = specificSeed
    ? enabledSeeds.find((s) => s.id === seedSelection)
    : undefined;
  const followerCursor = selectedSeed ? getSeedCursor(selectedSeed, "follower") : undefined;
  const followingCursor = selectedSeed ? getSeedCursor(selectedSeed, "following") : undefined;
  const fallbackUnsupported =
    followerCursor?.provider_supports_resume === false ||
    followingCursor?.provider_supports_resume === false;
  const runHint = getRunStatusHint(latestRun, controls.command, runSkipBreakdown);

  useEffect(() => {
    if (!latestRun || !["queued", "running", "paused"].includes(latestRun.status)) return;
    const timer = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(timer);
  }, [latestRun?.id, latestRun?.status, router]);

  return (
    <div className="mt-8 space-y-6">
      {flash && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            flash.type === "ok"
              ? "border-green-600/40 bg-green-600/10 text-green-200"
              : "border-red-600/40 bg-red-600/10 text-red-200"
          }`}
        >
          <p>{flash.message}</p>
          {flash.runId && (
            <div className="mt-2 text-xs opacity-90 space-y-1">
              <p className="break-all">
                Run ID: <span className="font-mono">{flash.runId}</span>
              </p>
              <Link href={`/admin/graph/runs/${flash.runId}`} className="text-[#E63946] hover:underline">
                View run results →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-white">Latest run status</h2>
          <Link href="/admin/graph/runs" className="text-xs text-[#E63946] hover:underline">
            View all runs →
          </Link>
        </div>
        {latestRun ? (
          <>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-[#666]">Command: </span>
                <span className="text-white font-medium">{controls.command}</span>
              </div>
              <div>
                <span className="text-[#666]">Status: </span>
                <span className="text-white font-medium">{latestRun.status}</span>
              </div>
              <div>
                <span className="text-[#666]">Run ID: </span>
                <span className="font-mono text-xs text-white break-all">{latestRun.id}</span>
              </div>
              {selectedSeedUsername && (
                <div>
                  <span className="text-[#666]">Seed: </span>
                  <span className="text-white">@{selectedSeedUsername}</span>
                </div>
              )}
              <div>
                <span className="text-[#666]">Apify fetched: </span>
                <span className="text-white">{latestRun.apify_profiles_fetched ?? 0}</span>
              </div>
              <div>
                <span className="text-[#666]">Stored: </span>
                <span className="text-white">{latestRun.profiles_stored ?? latestRun.profiles_collected}</span>
              </div>
              <div>
                <span className="text-[#666]">Skipped: </span>
                <span className="text-white">{latestRun.profiles_skipped ?? 0}</span>
              </div>
              <div>
                <span className="text-[#666]">Leads: </span>
                <span className="text-white">{latestRun.leads_created ?? latestRun.profiles_classified}</span>
              </div>
              <div>
                <span className="text-[#666]">Est. cost: </span>
                <span className="text-white">{formatCostUsd(Number(latestRun.estimated_cost_usd))}</span>
              </div>
              {(latestRun.actual_cost_usd ?? 0) > 0 && (
                <div>
                  <span className="text-[#666]">Apify billed: </span>
                  <span className="text-white">{formatCostUsd(Number(latestRun.actual_cost_usd))}</span>
                </div>
              )}
            </div>
            {runHint && (
              <p className="text-xs text-yellow-200/90 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
                {runHint}
              </p>
            )}
            <Link
              href={latestRun.id ? `/admin/graph/runs/${latestRun.id}` : "/admin/graph/runs"}
              className="inline-block text-xs text-[#aaa] hover:text-white underline"
            >
              View run results
            </Link>
          </>
        ) : (
          <p className="text-sm text-[#555]">No runs yet. Start a manual scan below.</p>
        )}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await pauseGraphScan(); })} className="w-full rounded-lg bg-yellow-600/20 px-4 py-2.5 text-xs text-yellow-400 cursor-pointer sm:w-auto">Pause</button>
          <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await resumeGraphScan(); })} className="w-full rounded-lg bg-green-600/20 px-4 py-2.5 text-xs text-green-400 cursor-pointer sm:w-auto">Resume</button>
          <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await stopGraphScan(); })} className="w-full rounded-lg bg-red-600/20 px-4 py-2.5 text-xs text-red-400 cursor-pointer sm:w-auto">Stop</button>
        </div>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-2 text-xs text-[#aaa]">
        <h2 className="text-sm font-medium text-white">Automation status</h2>
        <p>
          Automation:{" "}
          <span className={controls.cron_enabled ? "text-green-400" : "text-red-400"}>
            {controls.cron_enabled ? "on" : "off"}
          </span>
        </p>
        {cronStatus.workerCronEnvKnown ? (
          <p>
            Railway GRAPH_CRON_ENABLED:{" "}
            <span className={cronStatus.workerCronEnvEnabled ? "text-green-400" : "text-red-400"}>
              {cronStatus.workerCronEnvEnabled ? "true" : "false"}
            </span>
          </p>
        ) : (
          <p className="text-yellow-300">
            Railway GRAPH_CRON_ENABLED not mirrored on Vercel. Cron requires true on graph-worker service.
          </p>
        )}
        <p>Next daily (UTC): {cronStatus.nextDailyUtc ? new Date(cronStatus.nextDailyUtc).toUTCString() : "off"}</p>
        <p>Next weekly (UTC): {cronStatus.nextWeeklyUtc ? new Date(cronStatus.nextWeeklyUtc).toUTCString() : "off"}</p>
        <p>
          Last cron run:{" "}
          {cronStatus.lastCronRunId
            ? `${cronStatus.lastCronRunId.slice(0, 8)}… (${cronStatus.lastCronRunSource}, ${cronStatus.lastCronRunStatus})`
            : "none yet"}
        </p>
        <p>
          Budget used today: ${cronStatus.dailyBudgetUsed.toFixed(4)} / ${cronStatus.dailyBudgetCap.toFixed(2)}
        </p>
        <p>
          Budget used this week: ${cronStatus.weeklyBudgetUsed.toFixed(4)} / ${cronStatus.weeklyBudgetCap.toFixed(2)}
        </p>
        <p>
          Depth 2:{" "}
          <span className={controls.depth_2_enabled ? "text-yellow-400" : "text-green-400"}>
            {controls.depth_2_enabled ? "enabled (manual only)" : "off"}
          </span>
        </p>
      </div>

      <form
        action={(fd) =>
          startTransition(async () => {
            setFlash(null);
            const result = await startGraphScan(fd);
            if (result.ok) {
              setFlash({
                type: "ok",
                message: "Scan queued successfully. graph-worker will pick it up shortly.",
                runId: result.runId,
              });
              router.refresh();
            } else {
              setFlash({
                type: "err",
                message: result.error || "Failed to start scan",
              });
            }
          })
        }
        className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-4"
      >
        <h2 className="text-sm font-medium text-white">Start manual scan</h2>
        <p className="text-xs text-yellow-200/90 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
          Apify charges for fetched profiles even if they are rejected. Use{" "}
          <Link href="/admin/graph/pointers" className="text-[#E63946] underline">
            BD Pointers
          </Link>{" "}
          and Micro scan before increasing limits. Mine existing profiles first:{" "}
          <code className="text-[10px] bg-black/30 px-1 rounded">
            python scripts/reclassify_graph_run_profiles.py --all --target bd
          </code>
        </p>
        <label className="block text-xs text-[#888]">
          Seed to scan
          <select
            name="seed_account_id"
            value={seedSelection}
            onChange={(e) => setSeedSelection(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
          >
            <option value="auto">Auto — highest priority enabled seed(s)</option>
            {enabledSeeds.map((seed) => (
              <option key={seed.id} value={seed.id}>
                {formatSeedOptionLabel(seed)}
              </option>
            ))}
          </select>
        </label>
        {specificSeed && (
          <div className="text-[10px] text-[#666] space-y-1">
            <p>Specific seed selected — this run scans only that account (max seeds = 1).</p>
            {selectedSeed && (
              <p>
                Saved pagination — followers: {followerCursor?.profiles_fetched ?? 0} scanned (
                {formatCursorSnippet(followerCursor)}) · following:{" "}
                {followingCursor?.profiles_fetched ?? 0} scanned (
                {formatCursorSnippet(followingCursor)})
              </p>
            )}
          </div>
        )}
        <div className="rounded-lg border border-[#333] bg-[#0d0d0d] p-3 space-y-2">
          <p className="text-xs text-[#888]">Pagination</p>
          <label className="flex items-center gap-2 text-xs text-[#aaa]">
            <input type="radio" name="resume_mode" value="continue" defaultChecked />
            Continue from last scan (default)
          </label>
          <label className="flex items-center gap-2 text-xs text-[#aaa]">
            <input type="radio" name="resume_mode" value="restart" />
            Restart from beginning
          </label>
          <p className="text-[10px] text-[#555]">
            Primary actor resumes via saved offset until Apify ships cursor support. Restart clears saved
            progress for this seed.
          </p>
        </div>
        {fallbackUnsupported && (
          <p className="text-xs text-yellow-200/90 rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-3 py-2">
            {PROVIDER_CURSOR_WARNING}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="text-xs text-[#888]">
            Preset
            <select
              name="preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value as GraphScanPreset)}
              className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
            >
              {ENABLED_SCAN_PRESETS.map((k) => (
                <option key={k} value={k}>{SCAN_PRESETS[k].label}</option>
              ))}
              <option value="large" disabled>{SCAN_PRESETS.large.label}</option>
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Scan mode
            <select
              name="scan_mode"
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value as GraphScanMode)}
              className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white"
            >
              <option value="both">Followers + following</option>
              <option value="followers">Followers only</option>
              <option value="following">Following only</option>
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Max seeds (1–{MAX_SEEDS_PER_RUN})
            <input
              name="max_seed_accounts"
              type="number"
              value={specificSeed ? 1 : maxSeeds}
              onChange={(e) => setMaxSeeds(Number(e.target.value))}
              readOnly={specificSeed}
              min={1}
              max={MAX_SEEDS_PER_RUN}
              className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white disabled:opacity-60"
            />
          </label>
          <label className="text-xs text-[#888]">
            Depth
            <select name="depth" value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white">
              <option value={1}>1 (default)</option>
              <option value={2} disabled={!controls.depth_2_enabled}>2 (high-confidence only)</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <input type="hidden" name="max_followers_per_seed" value={limits.max_followers_per_seed} />
          <input type="hidden" name="max_following_per_seed" value={limits.max_following_per_seed} />
          <input type="hidden" name="max_total_profiles" value={limits.max_total_profiles} />
          <input type="hidden" name="max_cost_usd" value={limits.max_cost_usd} />
          <div className="text-xs text-[#666] col-span-2 md:col-span-4 space-y-1">
            <p>
              <span className="text-[#888]">{SCAN_PRESETS[preset].label}:</span>{" "}
              {PRESET_DESCRIPTIONS[preset]}
            </p>
            <p>
              {ENABLED_SCAN_PRESETS.filter((k) => k !== preset)
                .map((k) => `${SCAN_PRESETS[k].label}: ${PRESET_DESCRIPTIONS[k]}`)
                .join(" · ")}
            </p>
            <p className="text-yellow-200/80">
              Estimated Apify cost for this scan: ~{formatCostUsd(scanCostEstimate)} (cap {formatCostUsd(limits.max_cost_usd)})
            </p>
            <p className="text-[#666]">
              {APIFY_COST_EXAMPLES.map((e) => `${e.profiles} profiles ≈ ${formatCostUsd(e.cost)}`).join(" · ")}
            </p>
            <p className="text-yellow-200/70 border border-yellow-600/20 rounded px-2 py-1">
              {APIFY_COST_WARNING}
            </p>
            <label className="flex items-center gap-2 text-xs text-[#aaa] mt-2">
              <input type="checkbox" name="stop_loss_enabled" defaultChecked />
              Stop-loss: halt if 0 BD matches after first 20 profiles (saves Apify credits)
            </label>
          </div>
        </div>
        {depth === 2 && (
          <div className="rounded-lg border border-yellow-600/30 bg-yellow-600/10 p-3 text-xs text-yellow-200">
            <p>Depth 2 expands only from high-confidence leads (score ≥ 60). Higher cost risk.</p>
            <label className="mt-2 flex items-center gap-2">
              <input type="checkbox" name="depth_2_confirmed" required />
              I understand and want depth 2 for this run
            </label>
          </div>
        )}

        <div className="rounded-lg border border-[#333] bg-[#0d0d0d] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-white">Target filter</h3>
            <label className="flex items-center gap-2 text-xs text-[#aaa]">
              <input
                type="checkbox"
                name="target_filter_enabled"
                checked={targetFilterEnabled}
                onChange={(e) => setTargetFilterEnabled(e.target.checked)}
              />
              Enable targeted lead filter
            </label>
          </div>
          <p className="text-[10px] text-[#555]">
            When enabled, xquik actor-side filters (bioContains, minFollowers, verifiedOnly) reduce
            Apify billing. Post-fetch matching still applies for multi-keyword filters. Non-matches
            appear in run results as skipped_target_filter.
          </p>
          {targetFilterEnabled && (
            <>
              {savedFilterPresets.length > 0 && (
                <label className="block text-xs text-[#888]">
                  Load saved preset
                  <select
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                    onChange={(e) => {
                      const preset = savedFilterPresets.find((p) => p.id === e.target.value);
                      if (!preset) return;
                      setTargetFilterType(preset.filter_type as GraphTargetFilterType);
                      setCustomKeywords((preset.keywords || []).join(", "));
                      setMatchMode(preset.match_mode);
                      setTargetMinScore(preset.min_score);
                      setTargetMinFollowers(preset.min_followers);
                      setVerifiedFilter(preset.verified_filter);
                      setPresetName(preset.name);
                    }}
                    defaultValue=""
                  >
                    <option value="">— choose saved preset —</option>
                    {savedFilterPresets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <label className="text-xs text-[#888]">
                  Target profile type
                  <select
                    name="target_filter_type"
                    value={targetFilterType}
                    onChange={(e) => setTargetFilterType(e.target.value as GraphTargetFilterType)}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  >
                    {TARGET_FILTER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-[#888]">
                  Match mode
                  <select
                    name="target_match_mode"
                    value={targetFilterType === "custom" ? matchMode : "any"}
                    onChange={(e) => setMatchMode(e.target.value as "any" | "all")}
                    disabled={targetFilterType !== "custom"}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white disabled:opacity-60"
                  >
                    <option value="any">Any keyword</option>
                    <option value="all">All keywords (custom only)</option>
                  </select>
                  <span className="mt-1 block text-[10px] text-[#666]">
                    Preset filters use Any mode automatically. All mode is only for custom keywords.
                  </span>
                </label>
                <label className="text-xs text-[#888]">
                  Verified accounts
                  <select
                    name="target_verified_filter"
                    value={verifiedFilter}
                    onChange={(e) =>
                      setVerifiedFilter(e.target.value as "any" | "verified_only" | "exclude_verified")
                    }
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  >
                    <option value="any">Include all</option>
                    <option value="verified_only">Verified only</option>
                    <option value="exclude_verified">Exclude verified</option>
                  </select>
                </label>
                <label className="text-xs text-[#888]">
                  Minimum score
                  <input
                    name="target_min_score"
                    type="number"
                    min={0}
                    max={100}
                    value={targetMinScore}
                    onChange={(e) => setTargetMinScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-[#888]">
                  Minimum followers
                  <input
                    name="target_min_followers"
                    type="number"
                    min={0}
                    value={targetMinFollowers}
                    onChange={(e) => setTargetMinFollowers(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  />
                </label>
              </div>
              {targetFilterType === "custom" ? (
                <label className="block text-xs text-[#888]">
                  Custom keywords (comma-separated)
                  <textarea
                    name="target_custom_keywords"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    rows={2}
                    placeholder="bd, partnerships, listing manager"
                    className="mt-1 w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-sm text-white"
                  />
                </label>
              ) : (
                <p className="text-[10px] text-[#666]">
                  Preset keywords: {selectedPresetKeywords}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[#aaa]">
                  <input
                    type="checkbox"
                    name="save_filter_preset"
                    checked={savePreset}
                    onChange={(e) => setSavePreset(e.target.checked)}
                  />
                  Save filter as preset
                </label>
                {savePreset && (
                  <input
                    name="target_preset_name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="My BD filter"
                    className="rounded-lg border border-[#333] bg-[#111] px-3 py-1.5 text-xs text-white"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-[#aaa]">
          <input type="checkbox" name="skip_already_scanned" defaultChecked />
          Skip already scanned profiles
        </label>
        <button type="submit" disabled={isPending} className="w-full rounded-lg bg-[#E63946] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 cursor-pointer sm:w-auto">
          {isPending ? "Starting..." : "Start scan"}
        </button>
      </form>

      <form
        action={(fd) => startTransition(async () => { await updateGraphCronSettings(fd); })}
        className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3"
      >
        <h2 className="text-sm font-medium text-white">Automation settings</h2>
        <p className="text-[10px] text-[#555]">
          Website toggles control scheduling. Railway graph-worker must have GRAPH_CRON_ENABLED=true.
          Scheduled runs use safe Test limits ($0.10 cap, depth 1).
        </p>
        <label className="flex items-center gap-2 text-xs text-[#aaa]">
          <input type="checkbox" name="cron_enabled" defaultChecked={!!controls.cron_enabled} />
          Master cron enabled
        </label>
        <label className="flex items-center gap-2 text-xs text-[#aaa]">
          <input type="checkbox" name="daily_scan_enabled" defaultChecked={!!controls.daily_scan_enabled} />
          Daily scan
        </label>
        <label className="flex items-center gap-2 text-xs text-[#aaa]">
          <input type="checkbox" name="weekly_scan_enabled" defaultChecked={!!controls.weekly_scan_enabled} />
          Weekly scan
        </label>
        <label className="flex items-center gap-2 text-xs text-[#aaa]">
          <input type="checkbox" name="depth_2_enabled" defaultChecked={!!controls.depth_2_enabled} />
          Allow depth 2 (cron stays depth 1)
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="text-xs text-[#888]">
            Daily hour (UTC)
            <input name="daily_scan_hour_utc" type="number" min={0} max={23} defaultValue={controls.daily_scan_hour_utc ?? 3} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white" />
          </label>
          <label className="text-xs text-[#888]">
            Weekly day
            <select name="weekly_scan_day" defaultValue={controls.weekly_scan_day ?? 0} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{formatWeeklyDay(d)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#888]">
            Weekly hour (UTC)
            <input name="weekly_scan_hour_utc" type="number" min={0} max={23} defaultValue={controls.weekly_scan_hour_utc ?? 3} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-[#888]">
            Max daily budget ($)
            <input name="global_max_cost_usd_per_day" type="number" step="0.01" defaultValue={controls.global_max_cost_usd_per_day ?? controls.max_daily_budget_usd ?? 5} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white" />
          </label>
          <label className="text-xs text-[#888]">
            Max weekly budget ($)
            <input name="global_max_cost_usd_per_week" type="number" step="0.01" defaultValue={controls.global_max_cost_usd_per_week ?? controls.max_weekly_budget_usd ?? 20} className="mt-1 w-full rounded-lg border border-[#333] bg-[#0d0d0d] px-3 py-2 text-sm text-white" />
          </label>
        </div>
        <button type="submit" disabled={isPending} className="rounded-lg border border-[#333] px-4 py-2 text-xs text-white cursor-pointer">Save automation settings</button>
      </form>
    </div>
  );
}
