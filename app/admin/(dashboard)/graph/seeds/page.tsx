import { getOutreachSupabaseAdmin } from "@/lib/supabase-outreach-admin";
import SeedEditor from "./SeedEditor";

export const dynamic = "force-dynamic";

export default async function GraphSeedsPage() {
  const supabase = getOutreachSupabaseAdmin();
  const { data: seeds } = await supabase
    .from("graph_seed_accounts")
    .select("*")
    .order("priority", { ascending: false });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold text-white">Graph Seeds</h1>
      <p className="mt-1 text-sm text-[#888]">
        Seed accounts for X graph scanning. Quality scores update after each scan.
      </p>
      <SeedEditor seeds={seeds || []} />
    </div>
  );
}
