import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@/lib/articles-db";
import { mdToHtml, splitTitle } from "@/lib/doc-markdown";
import { SITE_NAME } from "@/lib/site";
import { ReadProgress } from "@/components/v3/fx/ReadProgress";
import { PromptTypeIn } from "@/components/v3/fx/PromptTypeIn";
import { Arrow } from "@/components/v3/Arrow";
import "./doc.css";
import CopyButtons from "./CopyButtons";
import DocGate from "./DocGate";

export const revalidate = 60;

/** One Neon read per request, shared by generateMetadata and the page. */
const loadArticle = cache((slug: string) => getArticle(slug));

/** Rendered HTML to one line of plain text, for the title and description tags. */
function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** About 155 characters, cut on a word boundary. */
function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

/**
 * Each article gets its own title, description, canonical and og tags. Before
 * this every /doc page inherited the homepage's, so a shared article link
 * carded as "Growth systems that turn attention into revenue". The words come
 * from the article: its title, and the opening paragraphs of its body.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await loadArticle(slug);
  if (!article) return { title: `Article not found | ${SITE_NAME}` };

  const { titleHtml, bodyHtml } = splitTitle(mdToHtml(article.content));
  const name = (titleHtml && plainText(titleHtml)) || article.title;
  // A gated article has no body here (see getArticle), and its description must
  // not hint at one.
  const gatedDescription = "Enter the code word from the video to open the full workflow.";
  // Many articles open with a one-line greeting ("Thank you for commenting."),
  // so read paragraphs in order until there is enough to describe the page.
  let lead = "";
  for (const m of bodyHtml.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    lead = lead ? `${lead} ${plainText(m[1])}` : plainText(m[1]);
    if (lead.length >= 120) break;
  }
  const description = article.gated ? gatedDescription : clip(lead || plainText(bodyHtml));
  const title = `${name} | ${SITE_NAME}`;
  const path = `/doc/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "article",
      url: path,
      siteName: SITE_NAME,
      publishedTime: article.created_at ? new Date(article.created_at).toISOString() : undefined,
      images: [{ url: "/og-image.webp", width: 1456, height: 816, alt: name }],
    },
  };
}

/**
 * The CTA document reader, v3 (rebuild approved 19 Oct 2026; comp: DocArticle.dc.html).
 *
 * No stage: a calm reading page in the same system. A cloud header band with
 * the way back, the keyword, the title and its source video; then one column
 * at about 68 characters on paper, Karla at 18px. A gold reading-progress bar
 * runs under the nav, and prompt boxes type their text in once (#30). The
 * body styles live in doc.css.
 *
 * Every article opens with a markdown `# title`. That line is lifted out of
 * the rendered body and set in the header as the page's h1. The words are
 * the article's own, unchanged.
 */
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
  const { article, source } = await loadArticle(slug);

  if (!article) notFound();
  if (source === "none") {
    console.error(`[doc] read of "${slug}" failed — this is an outage, not a missing article`);
  }

  // Lift the leading title out of the body. If an article ever starts without
  // one, its stored title stands in so the page still has a single h1.
  const { titleHtml, bodyHtml } = splitTitle(mdToHtml(article.content));

  return (
    <div className="v3 v3-doc">
      <ReadProgress />
      <PromptTypeIn />

      {/* ───────── Header band: the way back, the keyword, the title ───────── */}
      <header className="v3-doc__head v3-grain" data-nav="cloud">
        <div className="v3-doc__head-in">
          <Link href="/articles" className="v3-doc__back">
            <Arrow className="v3-doc__back-arrow" />
            All Articles
          </Link>

          <div className="v3-doc__title-wrap">
            {article.cta_keyword && <p className="v3-doc__key">{article.cta_keyword}</p>}
            {titleHtml ? (
              <h1 className="doc-title v3-display v3-doc__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
            ) : (
              <h1 className="doc-title v3-display v3-doc__title">{article.title}</h1>
            )}
            {article.video_title && <p className="v3-doc__from">From: {article.video_title}</p>}
            <p className="v3-hand v3-doc__hand" aria-hidden="true">
              start here
            </p>
          </div>
        </div>
      </header>

      {/* ───────── The reading column ───────── */}
      <div className="v3-doc__body" data-nav="cloud">
        {/* A gated article ships no body: DocGate fetches it after the server checks the code word. */}
        {article.gated ? (
          <DocGate slug={slug} />
        ) : (
          <article className="doc-page mx-auto" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        )}
        <CopyButtons />

        <footer className="doc-sign v3-doc__sign">
          <p>
            <span>By</span>
            <a href="https://x.com/_Quivira" target="_blank" rel="noopener noreferrer">
              @big_quiv
            </a>
          </p>
          <Link href="/articles" className="v3-btn v3-btn--navy">
            All Articles <Arrow />
          </Link>
        </footer>
      </div>
    </div>
  );
}
