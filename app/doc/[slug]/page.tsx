import { notFound } from "next/navigation";
import { getArticle } from "@/lib/articles-db";
import Link from "next/link";
import "./doc.css";

export const revalidate = 60;

function mdToHtml(md: string): string {
  let html = md;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^---$/gm, "<hr>");
  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("<li>")) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(line);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (line.trim() === "") out.push("");
      else if (line.startsWith("<")) out.push(line);
      else out.push(`<p>${line}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Supabase first, Neon mirror if it will not answer. See lib/articles-db.ts:
  // this page used to 404 whenever Supabase was rate limited, which made an
  // outage look exactly like a deleted article.
  const { article, source } = await getArticle(slug);

  if (!article) notFound();
  if (source === "mirror") {
    console.warn(`[doc] "${slug}" served from the Neon mirror`);
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
