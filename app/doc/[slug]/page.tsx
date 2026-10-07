import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getArticle } from "@/lib/articles-db";
import { mdToHtml, splitTitle } from "@/lib/doc-markdown";
import { SITE_NAME } from "@/lib/site";
import { BrutalButton, CheckerStrip, HandNote, MonoLabel, Sticker } from "@/components/ui-paper";
import { ReadingProgress } from "@/components/longread/ReadingProgress";
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
 * The CTA document reader, on paper (redesign 2026-10).
 *
 * The reading experience is the point: one column at about 68 characters,
 * Karla at 18px, a clear heading scale, prompt boxes and tables framed as
 * hard-edged objects, images as prints. The body styles live in doc.css.
 *
 * Every article opens with a markdown `# title`. That line is lifted out of
 * the rendered body and set in the grid-paper header band as the page's h1,
 * so the title and the reading column are two separate objects. The words
 * are the article's own, unchanged.
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
    <div className="paper-scope relative isolate overflow-x-clip bg-paper pt-[67px] text-ink md:pt-[75px]">
      <ReadingProgress />

      {/* ───────── Header band: grid paper, the way back, the title ───────── */}
      <header className="relative bg-grid-paper">
        <div className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-6 sm:px-6 md:pb-24 md:pt-8">
          <Link
            href="/articles"
            className="paper-link inline-flex min-h-[44px] items-center gap-2 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            All Articles
          </Link>

          <div className="relative mt-10 md:mt-14">
            {article.cta_keyword && (
              <div className="mb-7">
                <Sticker shape="label" tone="gold" tilt={-2} decorative={false} reveal={false}>
                  {article.cta_keyword}
                </Sticker>
              </div>
            )}
            {titleHtml ? (
              <h1
                className="doc-title max-w-[18ch] font-didone text-[clamp(2.6rem,6.6vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.008em] text-ink text-balance"
                dangerouslySetInnerHTML={{ __html: titleHtml }}
              />
            ) : (
              <h1 className="doc-title max-w-[18ch] font-didone text-[clamp(2.6rem,6.6vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.008em] text-ink text-balance">
                {article.title}
              </h1>
            )}
            {article.video_title && (
              <MonoLabel as="p" caps={false} size="md" tone="soft" className="mt-7 max-w-[60ch]">
                From: {article.video_title}
              </MonoLabel>
            )}
            <HandNote
              load
              delay={500}
              arrow="down-left"
              arrowAt="end"
              tilt={-4}
              className="absolute -bottom-16 right-0 hidden lg:inline-flex"
            >
              start here
            </HandNote>
          </div>
        </div>
        <CheckerStrip />
      </header>

      {/* ───────── The reading column ───────── */}
      <div className="mx-auto w-full max-w-[960px] px-4 pb-24 pt-14 sm:px-6 md:pb-32 md:pt-20">
        {/* A gated article ships no body: DocGate fetches it after the server checks the code word. */}
        {article.gated ? (
          <DocGate slug={slug} />
        ) : (
          <article className="doc-page mx-auto" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        )}
        <CopyButtons />

        <footer className="doc-sign mx-auto mt-20 flex flex-col gap-8 border-t-[3px] border-ink pt-8 sm:flex-row sm:items-end sm:justify-between">
          <p className="flex items-baseline gap-3">
            <span className="font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink">By</span>
            <a
              href="https://x.com/_Quivira"
              target="_blank"
              rel="noopener noreferrer"
              className="paper-link font-hand text-[2.1rem] font-bold leading-none text-ink"
            >
              @big_quiv
            </a>
          </p>
          <BrutalButton href="/articles" variant="paper" size="sm" className="self-start sm:self-auto">
            All Articles
          </BrutalButton>
        </footer>
      </div>
    </div>
  );
}
