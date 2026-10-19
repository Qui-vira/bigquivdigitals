import Link from "next/link";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/articles.css";

interface Article {
  slug: string;
  title: string;
  cta_keyword: string | null;
  video_title: string | null;
  views: number | null;
  created_at: string | null;
}

/**
 * /articles, v3 (rebuild approved 19 Oct 2026; comp: Articles.dc.html).
 *
 * A short navy stage with the document stack (scene "docStack"): the top three
 * sheets carry the three newest articles and deal out as the page scrolls, then
 * the index on cloud, every article in live order, newest first and largest.
 * Titles rise into place (#44); cards lift and tilt towards the mouse.
 *
 * Rendered on the server (the name is historical). Copy is unchanged: the
 * "Articles" title, the line under it and the empty state.
 */
const LINE_LEAD = "Exclusive breakdowns, frameworks, and guides from ";
const HANDLE = "@big_quiv";

export function ArticlesClient({ articles }: { articles: Article[] }) {
  const latest = articles[0];
  const sheets = articles.slice(0, 3).map((a) => ({ k: a.cta_keyword, t: a.title }));

  return (
    <div className="v3 v3-articles">
      <Stage scene="docStack" params={{ sheets }} ground="navy" height={300} heightPhone={260} mark="ARTICLES" fallback="/v3/stills/docStack.webp" label="Articles">
        <div className="v3-intro v3-art-intro">
          <h1 id="articles-heading" className="v3-intro__line v3-display" data-lift>
            Articles
          </h1>
          <div className="v3-art-intro__row" data-intro-rest>
            <p className="v3-art-intro__line">
              {LINE_LEAD}
              <span className="mark">{HANDLE}</span>.
            </p>
            {latest && (
              <Link href={`/doc/${latest.slug}`} className="v3-btn v3-btn--lg v3-art-intro__btn">
                <span>{latest.title}</span> <Arrow />
              </Link>
            )}
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.14,0.2,0.32,0.38" data-side="high" aria-hidden="true">
          Articles
        </h2>
        {latest && (
          <h2 className="v3-ghost v3-art-ghost-title" data-ghost="0.44,0.5,0.66,0.72" data-side="high" aria-hidden="true">
            {latest.title}
          </h2>
        )}
        <p className="v3-aside v3-art-aside" data-at="0.76,0.82,0.97,1" data-side="center">
          {LINE_LEAD}
          {HANDLE}.
        </p>
      </Stage>

      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-label="All articles">
        <div className="v3-wrap">
          {articles.length > 0 ? (
            <ul className="v3-art-grid">
              {articles.map((article, i) => (
                <li key={article.slug} className={i === 0 ? "is-featured" : undefined}>
                  <Link href={`/doc/${article.slug}`} className="v3-art-card" data-tilt>
                    <div className="v3-art-card__head">
                      {article.cta_keyword ? <span className="v3-art-card__key">{article.cta_keyword}</span> : <span />}
                      <span className="v3-art-card__go" aria-hidden="true">
                        <Arrow className="v3-art-card__arrow" />
                      </span>
                    </div>
                    <h2 className="v3-display v3-art-card__title" data-split>
                      {article.title}
                    </h2>
                    {article.video_title && <p className="v3-art-card__from">From: {article.video_title}</p>}
                    {article.views != null && article.views > 0 && (
                      <p className="v3-art-card__views">
                        {article.views.toLocaleString()} {article.views === 1 ? "view" : "views"}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="v3-art-empty">
              <p>No articles yet. Check back soon.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
