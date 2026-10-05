import { HandMark, HandNote, MonoLabel, PaperSection, Sticker } from "@/components/ui-paper";
import { IndexCard, type IndexCardProps } from "@/components/articles/IndexCard";

interface Article {
  slug: string;
  title: string;
  cta_keyword: string | null;
  video_title: string | null;
  views: number | null;
  created_at: string | null;
}

/** How each card sits on the board, cycled. Tilts stay within +-2.2deg so titles read straight. */
const BOARD: Array<Pick<IndexCardProps, "tilt" | "attach" | "stickerTone">> = [
  { tilt: -1.4, attach: "pin", stickerTone: "gold" },
  { tilt: 1.8, attach: "tape", stickerTone: "tint" },
  { tilt: -0.8, attach: "none", stickerTone: "soft" },
  { tilt: 1.2, attach: "clip", stickerTone: "gold" },
  { tilt: -2.1, attach: "tape-corners", stickerTone: "tint" },
  { tilt: 0.7, attach: "none", stickerTone: "soft" },
  { tilt: -1.1, attach: "tape", stickerTone: "gold" },
];

/**
 * /articles on paper (redesign 2026-10): a white header with the title and
 * the line under it, then the articles pinned to a grid-paper board as ruled
 * index cards, newest first and largest.
 *
 * Rendered on the server now (the name is historical). The only client code
 * is each card's drop-in, in components/articles/IndexCard.tsx.
 *
 * Copy is unchanged: the "Articles" title, the line under it and the empty
 * state. The sticker and pen note are labels and state no facts.
 */
export function ArticlesClient({ articles }: { articles: Article[] }) {
  return (
    <div className="paper-scope overflow-x-clip bg-paper pt-[67px] text-ink md:pt-[75px]">
      <PaperSection ground="paper" pad="none" checker="bottom" aria-labelledby="articles-heading">
        <div className="relative grid gap-10 pb-16 pt-14 md:grid-cols-[1fr_auto] md:items-end md:pb-24 md:pt-20">
          <div>
            <h1
              id="articles-heading"
              className="font-didone text-[clamp(4.25rem,15vw,6rem)] font-semibold leading-[0.9] tracking-[-0.01em] text-ink"
            >
              <HandMark kind="underline" load delay={300}>
                Articles
              </HandMark>
            </h1>
            <MonoLabel as="p" caps={false} size="md" tone="soft" className="mt-8 max-w-[44ch] text-[16px] leading-relaxed">
              Exclusive breakdowns, frameworks, and guides from @big_quiv.
            </MonoLabel>
          </div>

          {/* A small stack of blank index cards, the same cards the board
              below is made of. Decorative. */}
          <div aria-hidden="true" className="relative hidden h-[230px] w-[360px] md:block">
            {[
              { tilt: -9, x: 40, y: 34 },
              { tilt: 5, x: 92, y: 22 },
              { tilt: -2, x: 64, y: 44 },
            ].map((c, i) => (
              <span
                key={i}
                className="load-drop absolute block h-[150px] w-[230px] border-[3px] border-ink bg-paper shadow-brutal"
                style={
                  {
                    left: c.x,
                    top: c.y,
                    rotate: `${c.tilt}deg`,
                    "--rv-delay": `${i * 90}ms`,
                    backgroundImage:
                      "linear-gradient(var(--color-gold), var(--color-gold)), repeating-linear-gradient(to bottom, transparent 0 21px, var(--color-grid-line) 21px 22px)",
                    backgroundSize: "100% 3px, 100% 100%",
                    backgroundPosition: "0 38px, 0 44px",
                    backgroundRepeat: "no-repeat, repeat",
                  } as React.CSSProperties
                }
              />
            ))}
            <Sticker
              shape="wavy"
              tone="gold"
              size={60}
              tilt={-8}
              reveal={false}
              className="load-settle absolute -top-4 right-0"
              delay={350}
            >
              read me
            </Sticker>
            <Sticker shape="starburst" tone="paper" size={72} tilt={14} reveal={false} className="load-settle absolute left-0 top-2" delay={450} />
            <HandNote load delay={700} arrow="down-left" arrowAt="end" tilt={-6} className="absolute -bottom-20 -right-2">
              pick one
            </HandNote>
          </div>
        </div>
      </PaperSection>

      <PaperSection ground="grid" pad="lg" aria-label="All articles">
        {articles.length > 0 ? (
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
            {articles.map((article, i) => {
              const pose = BOARD[i % BOARD.length];
              const featured = i === 0;
              return (
                <li key={article.slug} className={featured ? "sm:col-span-2" : undefined}>
                  <IndexCard
                    href={`/doc/${article.slug}`}
                    title={article.title}
                    keyword={article.cta_keyword}
                    from={article.video_title}
                    views={article.views}
                    featured={featured}
                    delay={(i % 3) * 70}
                    {...pose}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mx-auto max-w-[560px] border-[3px] border-ink bg-paper p-10 text-center shadow-brutal">
            <p className="text-lg text-ink-soft">No articles yet. Check back soon.</p>
          </div>
        )}
      </PaperSection>
    </div>
  );
}
