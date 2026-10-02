import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles-db";
import Link from "next/link";
import "./doc.css";
import CopyButtons from "./CopyButtons";
import { mdToHtml } from "@/lib/doc-markdown";

export const revalidate = 60;

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Neon, the source of truth since 2026-09-13. See lib/articles-db.ts.
  // This page used to 404 whenever the database would not answer, which made an
  // outage look exactly like a deleted article — hence `source`: a clean miss
  // 404s, a failed read does not.
  const { article, source } = await getArticle(slug);

  if (!article) notFound();
  if (source === "none") {
    console.error(`[doc] read of "${slug}" failed — this is an outage, not a missing article`);
  }

  const bodyHtml = mdToHtml(article.content);

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="mx-auto max-w-[680px] px-6">
        <Link
          href="/articles"
          className="mb-8 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-accent"
        >
          &larr; All Articles
        </Link>

        <article className="doc-page" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        <CopyButtons />

        <div className="mt-12 border-t border-border pt-6 text-center text-sm text-text-muted">
          <p>
            By{" "}
            <a
              href="https://x.com/_Quivira"
              target="_blank"
              className="text-accent hover:underline"
            >
              @big_quiv
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
