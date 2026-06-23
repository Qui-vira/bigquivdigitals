import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import type { GraphProfile } from "@/lib/graph-types";

export default async function GraphProfilesPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  const supabase = getOutreachSupabaseAdmin();
  const { data: profiles } = await supabase
    .from("graph_profiles")
    .select("id, username, display_name, bio, follower_count, following_count, verified, location, website, last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(100);

  const { data: edges } = await supabase
    .from("graph_edges")
    .select("discovered_username, seed_username, relationship_type")
    .order("discovered_at", { ascending: false })
    .limit(200);

  type GraphEdgeRow = {
    discovered_username: string;
    seed_username: string;
    relationship_type: string;
  };

  const edgeMap = new Map<string, { seed: string; rel: string }>();
  for (const e of (edges || []) as GraphEdgeRow[]) {
    if (!edgeMap.has(e.discovered_username)) {
      edgeMap.set(e.discovered_username, {
        seed: e.seed_username,
        rel: e.relationship_type,
      });
    }
  }

  const { data: scores } = await supabase
    .from("graph_lead_scores")
    .select("lead_id, score, graph_leads(username)")
    .order("scored_at", { ascending: false })
    .limit(100);

  type ScoreRow = {
    score: number;
    graph_leads?: { username?: string } | { username?: string }[] | null;
  };

  const scoreMap = new Map<string, number>();
  for (const s of (scores || []) as ScoreRow[]) {
    const leadsRaw = s.graph_leads;
    const username = Array.isArray(leadsRaw) ? leadsRaw[0]?.username : leadsRaw?.username;
    if (username && !scoreMap.has(username)) {
      scoreMap.set(username, s.score);
    }
  }

  const list = (profiles || []) as GraphProfile[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Discovered Profiles</h1>
      <p className="mt-1 text-sm text-[#888]">Profiles collected from seed graph scans.</p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#222] text-[#666]">
              <th className="py-2 pr-4">Username</th>
              <th className="py-2 pr-4">Bio</th>
              <th className="py-2 pr-4">Seed</th>
              <th className="py-2 pr-4">Rel</th>
              <th className="py-2 pr-4">Followers</th>
              <th className="py-2 pr-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const edge = edgeMap.get(p.username);
              return (
                <tr key={p.id} className="border-b border-[#1a1a1a] text-[#ccc]">
                  <td className="py-2 pr-4 text-white">@{p.username}</td>
                  <td className="py-2 pr-4 max-w-xs truncate">{p.bio || "—"}</td>
                  <td className="py-2 pr-4">{edge?.seed ? `@${edge.seed}` : "—"}</td>
                  <td className="py-2 pr-4">{edge?.rel || "—"}</td>
                  <td className="py-2 pr-4">{p.follower_count}</td>
                  <td className="py-2 pr-4">{scoreMap.get(p.username) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="mt-4 text-sm text-[#555]">No profiles collected yet.</p>
        )}
      </div>
    </div>
  );
}
