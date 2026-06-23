export type GraphTargetFilterType =
  | "bd"
  | "kol_manager"
  | "partnerships"
  | "listing_manager"
  | "affiliate_manager"
  | "ambassador"
  | "growth"
  | "founder"
  | "custom";

export type GraphTargetMatchMode = "any" | "all";

export type GraphVerifiedFilter = "any" | "verified_only" | "exclude_verified";

export const TARGET_FILTER_PRESETS: Record<
  Exclude<GraphTargetFilterType, "custom">,
  { label: string; keywords: string[] }
> = {
  bd: {
    label: "BD / Business Development",
    keywords: [
      "bd",
      "bdm",
      "bizdev",
      "business development",
      "business developer",
      "partnership",
      "partnerships",
      "partner manager",
      "head of partnerships",
      "ecosystem",
      "listing",
      "exchange listing",
      "商务",
      "商务合作",
    ],
  },
  kol_manager: {
    label: "KOL Manager",
    keywords: [
      "kol",
      "kol manager",
      "kol bd",
      "influencer manager",
      "creator partnerships",
      "creator partnership",
      "influencer marketing",
      "ambassador manager",
      "ambassador",
      "community partner",
      "content partner",
      "creator manager",
      "creator lead",
    ],
  },
  partnerships: {
    label: "Partnerships",
    keywords: [
      "partnerships",
      "partnership",
      "partnership manager",
      "partner manager",
      "strategic partnerships",
      "ecosystem partner",
      "ecosystem partnerships",
      "business partnerships",
      "alliance",
      "alliances",
      "partner lead",
      "head of partnerships",
    ],
  },
  listing_manager: {
    label: "Listing Manager",
    keywords: [
      "listing",
      "listings",
      "token listing",
      "exchange listing",
      "listing manager",
      "listings manager",
      "listing bd",
      "listing partnerships",
      "launchpad",
      "launchpool",
    ],
  },
  affiliate_manager: {
    label: "Affiliate Manager",
    keywords: [
      "affiliate",
      "affiliates",
      "affiliate manager",
      "affiliate lead",
      "referral",
      "referrals",
      "referral manager",
      "broker affiliate",
      "partner program",
      "affiliate program",
    ],
  },
  ambassador: {
    label: "Ambassador",
    keywords: [
      "ambassador",
      "brand ambassador",
      "community ambassador",
      "campus ambassador",
      "regional ambassador",
      "ecosystem ambassador",
      "ambassador manager",
      "community lead",
      "community manager",
      "mod",
      "moderator",
    ],
  },
  growth: {
    label: "Growth / Marketing",
    keywords: [
      "growth",
      "head of growth",
      "growth lead",
      "marketing",
      "digital marketing",
      "pr",
      "narrative",
      "brand",
      "branding",
      "cmo",
      "community",
      "ecosystem",
      "go-to-market",
      "gtm",
      "user acquisition",
    ],
  },
  founder: {
    label: "Founder",
    keywords: [
      "founder",
      "co-founder",
      "cofounder",
      "ceo",
      "builder",
      "owner",
      "operator",
      "entrepreneur",
      "startup",
      "founder of",
    ],
  },
};

export const TARGET_FILTER_TYPE_OPTIONS: { value: GraphTargetFilterType; label: string }[] = [
  ...Object.entries(TARGET_FILTER_PRESETS).map(([value, preset]) => ({
    value: value as GraphTargetFilterType,
    label: preset.label,
  })),
  { value: "custom", label: "Custom keywords" },
];

export function formatTargetFilterSummary(run: {
  target_filter_enabled?: boolean;
  target_filter_type?: string;
  target_keywords?: string[];
  target_match_mode?: string;
  target_min_score?: number;
  target_min_followers?: number;
  target_verified_filter?: string;
  target_filter_preset_name?: string;
}): string | null {
  if (!run.target_filter_enabled) return null;
  const type = run.target_filter_type || "custom";
  const label =
    type === "custom"
      ? "Custom"
      : TARGET_FILTER_PRESETS[type as Exclude<GraphTargetFilterType, "custom">]?.label || type;
  const kw =
    run.target_keywords?.length
      ? run.target_keywords.slice(0, 4).join(", ")
      : type !== "custom"
        ? TARGET_FILTER_PRESETS[type as Exclude<GraphTargetFilterType, "custom">]?.keywords
            .slice(0, 3)
            .join(", ")
        : "";
  const parts = [
    run.target_filter_preset_name ? `preset: ${run.target_filter_preset_name}` : null,
    label,
    kw ? `kw: ${kw}` : null,
    `mode: ${run.target_match_mode || "any"}`,
    (run.target_min_score || 0) > 0 ? `min score ${run.target_min_score}` : null,
    (run.target_min_followers || 0) > 0 ? `min followers ${run.target_min_followers}` : null,
    run.target_verified_filter && run.target_verified_filter !== "any"
      ? run.target_verified_filter.replace("_", " ")
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function parseCustomKeywordsInput(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
