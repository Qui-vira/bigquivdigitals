import Image from "next/image";
import { Stage } from "@/components/v3/stage/Stage";
import { FrameBreak } from "@/components/v3/fx/FrameBreak";
import { Handwritten } from "@/components/v3/fx/Handwritten";
import { ScanCard } from "@/components/v3/fx/ScanCard";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/about.css";

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
  calendlyUrl: string;
}

/**
 * /about, v3 (rebuild approved 19 Oct 2026; comp: About.dc.html; motion:
 * MOTION-PLAN.md section 3).
 *
 * Every word on this page comes from the database (about_content, milestones,
 * about_values, about_ecosystem) exactly as before; this file changes how it
 * looks, not what it says. The stage lines are lifted from the same milestone
 * rows (titles and their own sentences), never written here.
 *
 * Stage: his story cards fan out, one per year (scenes/storyCards.ts, printed
 * with the timeline's own photos). Then: Frame Break (#14) with the one
 * handwritten note (#28), the timeline with each photo card scanned in (#32),
 * the beliefs, the values, the ecosystem.
 *
 * Rendered on the server; the stage and the effects are client leaves.
 */

function paragraphs(text: string) {
  return text
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The first sentence of the first paragraph that matches, else null. */
function sentenceMatching(m: Milestone | undefined, re: RegExp) {
  if (!m) return null;
  for (const p of paragraphs(m.text)) {
    const hit = p.match(re);
    if (hit) return hit[0].trim();
  }
  return null;
}

/** The four stage lines, all taken from the milestone rows themselves. */
function stageBeats(ms: Milestone[]) {
  if (ms.length === 0) return [];
  const last = ms.length - 1;
  const ophir = ms.findIndex((m) => /students trained/i.test(m.text));
  const second = ms[1] ? paragraphs(ms[1].text)[0] : undefined;
  const beats = [
    { card: 0, line: ms[0].title },
    ms[1] ? { card: 1, line: second && second.length <= 32 ? second : ms[1].title } : null,
    ophir >= 0
      ? { card: ophir, line: sentenceMatching(ms[ophir], /[^.]*students trained\./i) ?? ms[ophir].title }
      : ms[2]
        ? { card: 2, line: ms[2].title }
        : null,
    { card: last, line: sentenceMatching(ms[last], /[^.]*hungry for more\./i) ?? ms[last].title },
  ];
  return beats.filter(Boolean) as { card: number; line: string }[];
}

const BEAT_WINDOWS = ["0.1,0.15,0.25,0.29", "0.3,0.35,0.45,0.49", "0.5,0.55,0.65,0.69", "0.7,0.75,0.86,0.9"];

/** The one marked phrase in a line, if the line ends with it. */
function markEnd(text: string, phrase: string) {
  if (!text.endsWith(phrase)) return text;
  return (
    <>
      {text.slice(0, text.length - phrase.length)}
      <span className="mark">{phrase}</span>
    </>
  );
}

export function AboutClient({ content, values, ecosystem, marqueeItems, milestones, calendlyUrl }: AboutClientProps) {
  const services = (content.services_list || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const beliefs = (content.mission || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const heroTitle = content.hero_title || "The person behind the brand.";
  const beats = stageBeats(milestones);

  return (
    <div className="v3 v3-about">
      {/* ───────── STAGE: the story cards fan out ───────── */}
      <Stage
        scene="storyCards"
        params={{
          cards: milestones.map((m) => ({ year: m.year, title: m.title })),
          focus: beats.map((b) => b.card),
        }}
        ground="navy"
        height={600}
        heightPhone={520}
        mark="THE JOURNEY"
        label="About Big Quiv"
      >
        <div className="v3-intro">
          <h1 id="about-heading" className="v3-intro__line v3-display v3-about__h1" data-lift>
            {markEnd(heroTitle, "nobody could see.")}
          </h1>
          <div className="v3-intro__row" data-intro-rest>
            <div className="v3-about__intro">
              {content.hero_subtitle ? <p className="v3-about__sub">{content.hero_subtitle}</p> : null}
              <div className="v3-intro__actions">
                <a href={calendlyUrl} className="v3-btn v3-btn--lg">
                  Book a Call <Arrow />
                </a>
              </div>
            </div>
            <span className="v3-intro__cue" aria-hidden="true">
              <i />
              Scroll
            </span>
          </div>
        </div>

        {beats.map((b, i) => (
          <p key={i} className="v3-ghost v3-about__beat" data-ghost={BEAT_WINDOWS[i]} data-side="left" aria-hidden="true">
            {b.line}
          </p>
        ))}

        <div className="v3-endcta" data-at="0.91,0.95,1.1,1.2">
          <a href={calendlyUrl} className="v3-btn">
            Book a Call <Arrow />
          </a>
        </div>
      </Stage>

      {/* ───────── WHAT I DO: he steps out of the frame ───────── */}
      {content.what_i_do && (
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" data-panel aria-labelledby="what-heading">
          <div className="v3-wrap v3-about__what">
            <div className="v3-about__portrait">
              <FrameBreak src="/hero3d/quiv-color-900.webp" alt="Big Quiv" width={900} height={668} caption="Big Quiv">
                <Handwritten text="that's me" arrow="M8 16 C 40 6, 80 14, 104 44|M104 44 L 92 40|M104 44 L 106 31" className="v3-about__note" />
              </FrameBreak>
            </div>
            <div>
              <h2 id="what-heading" className="v3-h2 v3-display" data-split>
                What I Do
              </h2>
              <p className="v3-about__what-p" data-fade>
                {content.what_i_do}
              </p>
              {services.length > 0 && (
                <ol className="v3-about__services" aria-labelledby="what-heading">
                  {services.map((s, i) => (
                    <li key={s} data-fade>
                      <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ───────── GROWTH TIMELINE: each photo card scans in ───────── */}
      {milestones.length > 0 && (
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="journey-heading">
          <div className="v3-wrap">
            <div className="v3-about__head">
              <h2 id="journey-heading" className="v3-h2 v3-display" data-split>
                Growth Timeline
              </h2>
              <p className="v3-about__kicker">The Journey</p>
            </div>
            <ol className="v3-about__timeline">
              {milestones.map((m, i) => {
                const paras = paragraphs(m.text);
                const half = Math.ceil(paras.length / 2);
                const cols = paras.length > 3 ? [paras.slice(0, half), paras.slice(half)] : [paras];
                return (
                  <li key={`${m.year}-${m.title}`} className="v3-about__year">
                    <div className="v3-about__year-side">
                      <p className="v3-about__year-n" aria-hidden="true">
                        {m.year}
                      </p>
                      <h3 className="v3-h3">
                        <span className="v3-sr">{m.year}: </span>
                        {m.title}
                      </h3>
                      {m.allImages.length > 0 && (
                        <div className={m.allImages.length > 1 ? "v3-about__photos is-grid" : "v3-about__photos"}>
                          {m.allImages.map((src, j) => (
                            <ScanCard key={j} className="v3-about__photo" delay={j * 0.12}>
                              <Image
                                src={src}
                                alt={m.allImages.length > 1 ? `${m.title} ${j + 1}` : m.title}
                                width={m.allImages.length > 1 ? 600 : 1080}
                                height={m.allImages.length > 1 ? 800 : 720}
                                sizes="(max-width: 900px) 92vw, 360px"
                                data-story-img={j === 0 ? i : undefined}
                              />
                            </ScanCard>
                          ))}
                        </div>
                      )}
                    </div>
                    {cols.map((col, ci) => (
                      <div key={ci} className={cols.length === 1 ? "v3-about__year-col is-wide" : "v3-about__year-col"}>
                        {col.map((p, pi) => (
                          <p key={pi} className={ci === 0 && pi === 0 ? "is-first" : undefined}>
                            {p}
                          </p>
                        ))}
                      </div>
                    ))}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {/* ───────── WHAT I BELIEVE ───────── */}
      {content.mission && (
        <section className="v3-section v3-section--navy v3-grain" data-nav="navy" data-panel aria-labelledby="believe-heading">
          <div className="v3-wrap">
            <h2 id="believe-heading" className="v3-h2 v3-display" data-split>
              {content.mission_title || "The Mission"}
            </h2>
            <ol className="v3-about__beliefs">
              {beliefs.map((b, i) => (
                <li key={i} data-fade>
                  <p>{markEnd(b, "gambling wearing a suit.")}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ───────── WHAT BIGQUIV DIGITALS STANDS FOR ───────── */}
      {values.length > 0 && (
        <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="values-heading">
          <div className="v3-wrap">
            <div className="v3-about__head">
              <h2 id="values-heading" className="v3-h2 v3-display" data-split>
                What BigQuiv Digitals Stands For
              </h2>
              <p className="v3-about__kicker">Why People Trust Me</p>
            </div>
            <ul className="v3-about__values">
              {values.map((v) => (
                <li key={v.title} data-fade>
                  <h3 className="v3-h3">{v.title}</h3>
                  <p>{v.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Marquee strip, only when the admin has set items for this page. */}
      {marqueeItems.length > 0 && (
        <div aria-hidden="true" className="v3-about__marquee" data-nav="navy">
          <div className="v3-about__marquee-run">
            {[0, 1].map((k) => (
              <span key={k}>
                {marqueeItems.map((t, ti) => (
                  <span key={ti} className="v3-about__marquee-item">
                    {t}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ───────── THE ECOSYSTEM ───────── */}
      {ecosystem.length > 0 && (
        <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="ecosystem-heading">
          <div className="v3-wrap">
            <div className="v3-about__head">
              <h2 id="ecosystem-heading" className="v3-h2 v3-display" data-split>
                The Ecosystem
              </h2>
              <p className="v3-about__kicker">The Brands</p>
            </div>
            <ul className="v3-about__eco">
              {ecosystem.map((e) => (
                <li key={e.name} data-fade>
                  <p className="v3-case__tag">{e.role}</p>
                  <h3 className="v3-about__eco-name">{e.name}</h3>
                  <p className="v3-about__eco-d">{e.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
