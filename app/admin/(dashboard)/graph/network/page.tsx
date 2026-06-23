import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";

export default async function GraphNetworkPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const supabase = getOutreachSupabaseAdmin();

  const { data: multiSeed } = await supabase
    .from("graph_network_multi_seed_accounts")
    .select("*")
    .limit(30)
    .order("seed_count", { ascending: false });

  const { data: hvFollows } = await supabase
    .from("graph_network_high_value_follows")
    .select("*")
    .limit(30);

  const { data: topScored } = await supabase
    .from("graph_network_top_scored_accounts")
    .select("*")
    .limit(20);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Network Signals</h1>
      <p className="mt-1 text-sm text-[#888]">
        Accounts across multiple seeds, high-value seed connections, and top scored leads.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-white mb-3">Repeated across seeds</h2>
        <div className="space-y-2">
          {(multiSeed || []).length === 0 && <p className="text-xs text-[#555]">No multi-seed accounts yet.</p>}
          {(multiSeed || []).map((row: { username: string; seed_count: number; seed_usernames?: string[] }) => (
            <div key={row.username} className="rounded-lg border border-[#222] bg-[#111] px-4 py-2 text-xs text-[#aaa]">
              <span className="text-white">@{row.username}</span> — {row.seed_count} seeds: {(row.seed_usernames || []).map((s: string) => `@${s}`).join(", ")}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-white mb-3">High-value seed connections</h2>
        <div className="space-y-2">
          {(hvFollows || []).length === 0 && <p className="text-xs text-[#555]">No high-value edges yet.</p>}
          {(hvFollows || []).slice(0, 15).map((row: { username: string; seed_username: string; relationship_type: string }, i: number) => (
            <div key={`${row.username}-${i}`} className="rounded-lg border border-[#222] bg-[#111] px-4 py-2 text-xs text-[#aaa]">
              @{row.username} ← @{row.seed_username} ({row.relationship_type})
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-white mb-3">Top high-signal accounts</h2>
        <div className="space-y-2">
          {(topScored || []).map((row: { username: string; score?: number; score_reason?: string; role_keywords_matched?: string[] }) => (
            <div key={row.username} className="rounded-lg border border-[#222] bg-[#111] px-4 py-2 text-xs">
              <span className="text-white">@{row.username}</span>
              {row.score != null && <span className="ml-2 text-[#E63946]">score {row.score}</span>}
              {row.score_reason && <p className="mt-1 text-[#666]">{row.score_reason}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
