import { listArticles } from "@/lib/articles-db";
import { ArticlesClient } from "@/components/ArticlesClient";

export const revalidate = 60;

export const metadata = {
  title: "Articles & Breakdowns | BigQuiv Digitals",
  description:
    "Published breakdowns on growth systems, Web3, AI content and market structure. The working notes behind the builds, not recycled advice.",
  alternates: { canonical: "/articles" },
};

export default async function ArticlesPage() {
  // The old version did `const { data } = await ...` then `data ?? []`, which
  // turned a rate-limited database into an empty page that returned HTTP 200.
  // Twenty-five articles were dark for days and nothing alerted.
  const { articles, source } = await listArticles();

  if (source === "none") {
    console.error("[articles] BOTH Supabase and the Neon mirror failed");
  }

  return <ArticlesClient articles={articles} />;
}
