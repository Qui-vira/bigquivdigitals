import Image from "next/image";
import { getIcon } from "@/lib/icons";
import {
  BrutalFrame,
  CheckerStrip,
  HandNote,
  PaperSection,
  PhotoPrint,
  SectionHead,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

interface Value {
  icon: string;
  title: string;
  description: string;
}

interface EcosystemItem {
  name: string;
  role: string;
  description: string;
}

interface Milestone {
  year: string;
  title: string;
  text: string;
  allImages: string[];
  imageLayout: "carousel" | "grid";
}

interface AboutClientProps {
  content: Record<string, string>;
  values: Value[];
  ecosystem: EcosystemItem[];
  marqueeItems: string[];
  milestones: Milestone[];
}

/**
 * /about on the paper system (redesign 2026-10, phase 2).
 *
 * Every word on this page comes from the database (about_content,
 * milestones, about_values, about_ecosystem) exactly as before; this file
 * changed how it looks, not what it says. The only new words are sticker
 * labels and pen notes, and none of them states a fact. The handwritten
 * caption on each journey print is the milestone's own `year` field.
 *
 * Rendered on the server (the name is historical). The animated pieces are
 * client leaves from components/ui-paper.
 */

/** How each journey print sits on the board. */
const PRINT_STYLE = [
  { tilt: -2.6, attach: "pin" as const },
  { tilt: 2.1, attach: "tape" as const },
  { tilt: -1.4, attach: "clip" as const },
  { tilt: 2.6, attach: "tape-corners" as const },
  { tilt: -2, attach: "pin" as const },
];

/** A pile of prints (a year with several photos): tilt, fastener and overlap per slot. */
const CLUSTER = [
  { tilt: -3.5, attach: "pin" as const, cls: "z-[1]" },
  { tilt: 3, attach: "tape" as const, cls: "z-[2] mt-14 -ml-5" },
  { tilt: 2.2, attach: "clip" as const, cls: "z-[3] -mt-8" },
  { tilt: -2.4, attach: "tape-corners" as const, cls: "z-[4] mt-4 -ml-5" },
];

const VALUE_TILT = [-1.2, 0.9, -0.6, 1.3, -1, 0.7];

function paragraphs(text: string) {
  return text
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

function JourneyPhotos({ m, i }: { m: Milestone; i: number }) {
  const style = PRINT_STYLE[i % PRINT_STYLE.length];

  if (m.allImages.length === 0) {
    // No photo for this year: the year itself, on a taped gold-tint card.
    return (
      <BrutalFrame tone="tint" shadow="lg" tilt={style.tilt} className="hidden aspect-[4/3] items-center justify-center lg:flex">
        <span className="font-didone text-[7rem] font-semibold leading-none text-ink">{m.year}</span>
        <Tape className="-top-3.5 left-1/2 -translate-x-1/2" />
      </BrutalFrame>
    );
  }

  if (m.allImages.length === 1) {
    return (
      <PhotoPrint tilt={style.tilt} attach={style.attach} mat="polaroid" caption={m.year} lift="self">
        <Image
          src={m.allImages[0]}
          alt={m.title}
          width={1080}
          height={720}
          sizes="(max-width: 1024px) 92vw, 520px"
          className="block h-auto w-full"
        />
      </PhotoPrint>
    );
  }

  // Several photos for one year: a loose pile of prints, two by two, each
  // overlapping the last, the way they would be pinned to a board.
  return (
    <div className="grid grid-cols-2 items-start gap-x-3 px-2 sm:px-4">
      {m.allImages.map((src, j) => {
        const c = CLUSTER[j % CLUSTER.length];
        return (
          <PhotoPrint
            key={j}
            tilt={c.tilt}
            attach={c.attach}
            mat={j === 0 ? "polaroid" : "thin"}
            caption={j === 0 ? m.year : undefined}
            lift="self"
            delay={j * 90}
            className={cx("relative hover:z-[5]", c.cls)}
          >
            <Image
              src={src}
              alt={`${m.title} ${j + 1}`}
              width={600}
              height={800}
              sizes="(max-width: 1024px) 46vw, 260px"
              className="block h-auto w-full"
            />
          </PhotoPrint>
        );
      })}
    </div>
  );
}

export function AboutClient({ content, values, ecosystem, marqueeItems, milestones }: AboutClientProps) {
  const services = (content.services_list || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const beliefs = (content.mission || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. HERO ─────────
          The portrait as a big clipped print on grid paper, a gold sheet
          slipped behind it, the headline set beside it. */}
      <PaperSection ground="grid" pad="none" innerClassName="pb-24 pt-28 md:pb-32 md:pt-36" aria-labelledby="about-heading">
        <div className="grid items-center gap-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div>
            <Sticker shape="wavy" tone="soft" size={46} tilt={-8} className="mb-7 ml-1" reveal={false}>
              about me
            </Sticker>
            <h1
              id="about-heading"
              className="max-w-[16ch] font-didone text-[clamp(3rem,7.2vw,5.9rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance"
            >
              {content.hero_title || "The person behind the brand."}
            </h1>
            {content.hero_subtitle ? (
              <p className="mt-8 max-w-[44ch] whitespace-pre-line text-lg leading-relaxed text-ink-soft md:text-xl">
                {content.hero_subtitle}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[440px]">
            {/* The gold sheet behind the print: an object, not a ground. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-3 inset-y-5 translate-x-5 translate-y-2 rotate-[7deg] border-[3px] border-ink bg-gold shadow-brutal"
            />
            <PhotoPrint tilt={-3} attach="clip" mat="polaroid" caption="Big Quiv" lift="self" reveal={false} className="load-drop">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src={content.hero_image || "/quivira-hero.webp"}
                  alt="Big Quiv"
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 440px"
                  className="object-cover"
                  style={{ objectPosition: "100% 30%" }}
                />
              </div>
            </PhotoPrint>
            <Sticker
              shape="starburst"
              tone="gold"
              size={92}
              tilt={12}
              reveal={false}
              className="load-settle absolute -right-4 -top-8 sm:-right-9"
            />
            <Sticker
              shape="circle"
              tone="paper"
              size={92}
              tilt={-10}
              reveal={false}
              className="load-settle absolute -bottom-8 -right-3 sm:-right-8"
            >
              hello
            </Sticker>
            <HandNote
              load
              delay={500}
              arrow="right"
              arrowAt="end"
              tilt={-5}
              size="lg"
              className="absolute -left-60 top-[40%] hidden xl:inline-flex"
            >
              that&apos;s me
            </HandNote>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 2. WHAT I DO ─────────
          The sentence on the left, the five parts as a ruled ticket list. */}
      {content.what_i_do && (
        <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="what-heading">
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 items-center border-[3px] border-ink bg-gold px-1.5 font-typewriter text-[13px] font-bold text-ink shadow-brutal-sm"
                >
                  (01)
                </span>
                <h2 id="what-heading" className="font-typewriter text-[14px] font-bold uppercase tracking-[0.1em] text-ink">
                  What I Do
                </h2>
              </div>
              <p className="mt-8 max-w-[30ch] font-display text-[clamp(1.6rem,2.7vw,2.35rem)] font-semibold leading-[1.22] tracking-[-0.018em] text-ink text-pretty">
                {content.what_i_do}
              </p>
            </div>

            {services.length > 0 && (
              <ol aria-labelledby="what-heading" className="self-start border-[3px] border-ink bg-paper shadow-brutal-lg">
                {services.map((s, i) => (
                  <li
                    key={s}
                    className="group grid grid-cols-[4.25rem_1fr] border-b-[3px] border-ink last:border-b-0 sm:grid-cols-[5rem_1fr]"
                  >
                    <span
                      aria-hidden="true"
                      className={cx(
                        "flex items-center justify-center border-r-[3px] border-ink font-didone text-[2rem] font-semibold leading-none text-ink tabular-nums sm:text-[2.4rem]",
                        i % 2 === 0 ? "bg-gold" : "bg-gold-tint"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-h-[4.5rem] items-center px-5 py-4 font-display text-[1.1rem] font-bold leading-snug tracking-[-0.01em] text-ink transition-[background-color] duration-200 group-hover:bg-paper-alt sm:text-[1.25rem]">
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </PaperSection>
      )}

      {/* ───────── 3. THE JOURNEY ─────────
          The maximalist moment: each year a pinned print with the year
          handwritten under it, the story beside it. The print column sticks
          while a long year scrolls past. */}
      {milestones.length > 0 && (
        <PaperSection ground="grid" pad="lg" aria-labelledby="journey-heading">
          <div className="relative">
            <SectionHead index="02" id="journey-heading" title="Growth Timeline" kicker="The Journey" />
            <HandNote
              arrow="down-left"
              arrowAt="below"
              tilt={4}
              size="lg"
              className="absolute right-[4%] top-0 hidden lg:inline-flex"
              arrowClassName="ml-6"
            >
              start here
            </HandNote>
          </div>

          <ol className="mt-16 md:mt-24">
            {milestones.map((m, i) => {
              const paras = paragraphs(m.text);
              const flip = i % 2 === 1;
              return (
                <li
                  key={`${m.year}-${m.title}`}
                  className="grid gap-12 border-t-[3px] border-ink py-14 first:border-t-0 first:pt-0 md:py-20 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-20"
                >
                  <div className={cx("lg:sticky lg:top-28 lg:self-start", flip && "lg:order-2")}>
                    <div className="mx-auto max-w-[520px] px-2 sm:px-4">
                      <JourneyPhotos m={m} i={i} />
                    </div>
                  </div>

                  <div className={cx(flip && "lg:order-1")}>
                    <div className="flex items-end gap-5">
                      <span className="font-didone text-[clamp(3.6rem,7vw,6rem)] font-semibold leading-[0.85] text-ink tabular-nums">
                        {m.year}
                      </span>
                      <span aria-hidden="true" className="mb-2 h-[3px] flex-1 bg-ink" />
                    </div>
                    <h3 className="mt-6 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
                      <span className="hl-mark">{m.title}</span>
                    </h3>
                    <div className="mt-7 max-w-[60ch] space-y-3.5">
                      {paras.map((p, pi) => (
                        <p
                          key={pi}
                          className={
                            pi === 0
                              ? "font-display text-[1.25rem] font-semibold leading-snug tracking-[-0.01em] text-ink"
                              : "text-[17px] leading-[1.75] text-ink-soft"
                          }
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </PaperSection>
      )}

      {/* ───────── 4. WHAT I BELIEVE ─────────
          The quiet interlude: the stands, one per ruled line, big. */}
      {content.mission && (
        <PaperSection ground="paper" width="mid" pad="lg" aria-labelledby="believe-heading">
          <SectionHead index="03" id="believe-heading" title={content.mission_title || "The Mission"} />
          <ol className="mt-12 md:mt-16">
            {beliefs.map((b, i) => (
              <li
                key={i}
                className={cx(
                  "grid grid-cols-[auto_1fr] gap-4 border-t-[3px] border-ink py-7 sm:gap-7 md:py-9",
                  i % 2 === 1 && "md:pl-[12%]"
                )}
              >
                <span aria-hidden="true" className="pt-2 font-typewriter text-[14px] font-bold text-gold-deep">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <p className="whitespace-pre-line font-didone text-[clamp(1.9rem,4vw,3.3rem)] font-semibold leading-[1.04] tracking-[-0.005em] text-ink text-balance">
                  {b}
                </p>
              </li>
            ))}
          </ol>
        </PaperSection>
      )}

      {/* ───────── 5. VALUES ─────────
          Index cards in a loose grid, each with its gold-tint header strip. */}
      {values.length > 0 && (
        <PaperSection ground="alt" pad="lg" aria-labelledby="values-heading">
          <SectionHead index="04" id="values-heading" title="What BigQuiv Digitals Stands For" kicker="Why People Trust Me" />
          <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
            {values.map((v, i) => {
              const Icon = getIcon(v.icon);
              return (
                <li key={v.title} className={cx(i % 3 === 1 && "lg:mt-10", i % 3 === 2 && "lg:mt-4")}>
                  <article
                    className="relative h-full border-[3px] border-ink bg-paper shadow-brutal transition-[rotate,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] hover:-translate-y-1 hover:[rotate:0deg]"
                    style={{ "--tilt": `${VALUE_TILT[i % VALUE_TILT.length]}deg` } as React.CSSProperties}
                  >
                    {i % 2 === 0 && <Tape className="-top-3.5 right-6" tilt={6} width={84} />}
                    <div className="flex items-center gap-3 border-b-[3px] border-ink bg-gold-tint px-5 py-3.5">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center border-[3px] border-ink bg-gold"
                      >
                        <Icon className="h-5 w-5 text-ink" strokeWidth={2.25} />
                      </span>
                      <h3 className="font-display text-[1.2rem] font-bold tracking-[-0.01em] text-ink">{v.title}</h3>
                    </div>
                    <p className="whitespace-pre-line px-5 py-5 text-[15px] leading-relaxed text-ink-soft">{v.description}</p>
                  </article>
                </li>
              );
            })}
          </ul>
        </PaperSection>
      )}

      {/* Marquee strip, only when the admin has set items for this page. It
          rendered three bare slashes when the list was empty. */}
      {marqueeItems.length > 0 && (
        <div aria-hidden="true" className="paper-scope overflow-hidden bg-paper">
          <CheckerStrip />
          <div className="whitespace-nowrap py-5">
            <div className="inline-flex animate-marquee items-center" style={{ animationDuration: "40s" }}>
              {[0, 1, 2].map((k) => (
                <span key={k} className="font-typewriter text-[15px] font-bold uppercase tracking-[0.12em] text-ink">
                  {marqueeItems.map((t, ti) => (
                    <span key={ti} className="px-6">
                      {t} <span className="text-gold-deep">/</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
          <CheckerStrip />
        </div>
      )}

      {/* ───────── 6. THE ECOSYSTEM ─────────
          A directory, not cards: role, name, what it is, one ruled row each. */}
      {ecosystem.length > 0 && (
        <PaperSection ground="grid" pad="lg" aria-labelledby="ecosystem-heading">
          <SectionHead index="05" id="ecosystem-heading" title="The Ecosystem" kicker="The Brands" />
          <ul className="mt-14 border-b-[3px] border-ink md:mt-20">
            {ecosystem.map((e, i) => (
              <li
                key={e.name}
                className="grid gap-4 border-t-[3px] border-ink py-8 md:grid-cols-[12rem_1fr_minmax(0,24rem)] md:items-center md:gap-10 md:py-10"
              >
                <div>
                  <Sticker
                    shape="label"
                    tone={i % 2 === 0 ? "gold" : "tint"}
                    tilt={i % 2 === 0 ? -2 : 2}
                    decorative={false}
                    reveal={false}
                  >
                    {e.role}
                  </Sticker>
                </div>
                <h3 className="font-didone text-[clamp(2.4rem,5vw,4.2rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink">
                  {e.name}
                </h3>
                <p className="whitespace-pre-line text-base leading-relaxed text-ink-soft md:text-[17px]">{e.description}</p>
              </li>
            ))}
          </ul>
        </PaperSection>
      )}
    </div>
  );
}
