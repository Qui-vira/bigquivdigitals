import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getArticle } from "@/lib/articles-db";
import { mdToHtml } from "@/lib/doc-markdown";
import { BrutalButton, CheckerStrip, HandNote, MonoLabel, Sticker } from "@/components/ui-paper";
import { ReadingProgress } from "@/components/longread/ReadingProgress";
import "./doc.css";
import CopyButtons from "./CopyButtons";

export const revalidate = 60;

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
  const { article, source } = await getArticle(slug);

  if (!article) notFound();
  if (source === "none") {
    console.error(`[doc] read of "${slug}" failed — this is an outage, not a missing article`);
  }

  const fullHtml = mdToHtml(article.content);
  // Lift the leading title out of the body. If an article ever starts without
  // one, its stored title stands in so the page still has a single h1.
  const lead = /^\s*<h1>([\s\S]*?)<\/h1>\s*/.exec(fullHtml);
  const titleHtml = lead ? lead[1] : null;
  const bodyHtml = lead ? fullHtml.slice(lead[0].length) : fullHtml;

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
        <article className="doc-page mx-auto" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
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
