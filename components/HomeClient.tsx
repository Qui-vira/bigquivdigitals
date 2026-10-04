import Image from "next/image";
import Link from "next/link";
import { type ProofStatData } from "@/components/ProofStat";
import { HeroReveal } from "@/components/HeroReveal";
import { AutoCarousel } from "@/components/AutoCarousel";
import {
  BrutalButton,
  HandArrow,
  HandMark,
  HandNote,
  Highlighter,
  MonoLabel,
  PaperSection,
  PhotoPrint,
  SectionHead,
  StatStamp,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

interface Testimonial {
  quote: string;
  attribution: string;
  allImages: string[];
  rating: number;
  avatar: string | null;
}

interface HomeClientProps {
  calendlyUrl: string;
  proofStats: ProofStatData[];
  testimonials: Testimonial[];
}

/**
 * The homepage on the paper system (redesign 2026-10).
 *
 * Structure is unchanged from the conversion pass: who -> proof -> cost ->
 * offer -> process -> hire me, with the same three CTA placements. Every word
 * and number of the owner's copy below is unchanged; this file changed how it
 * looks, not what it says. The only new words are pen annotations and sticker
 * labels, and none of them states a fact.
 *
 * Rendered on the server (the name is historical). The animated pieces are
 * client leaves from components/ui-paper.
 */

const CASE_STUDIES = [
  {
    href: "/work/peaceway",
    tag: "Health",
    claim: "A Lagos pharmacy that now takes orders end to end inside Telegram.",
    support:
      "Live at peacewayonline.com. Separate doors for customers, staff and suppliers, and a bot that carries a real order from search to confirmation.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage. Headline reads YOUR LAGOS PHARMACY IS NOW ONLINE, with buttons to order on Telegram or check product availability.",
  },
  {
    href: "/work/alpha-plays",
    tag: "Community and markets",
    claim: "3,485 people get my market calls.",
    support:
      "Every result published next to the call that produced it, with the entry, the stop and the target still visible.",
    image: "/proof/quivira/result-eth-setup-85pct.webp",
    imageAlt:
      "Telegram channel showing an ETH buy call with entry, stop loss and take profit, next to the resulting position card.",
  },
  {
    href: "/work/nigeria-business-costs",
    tag: "Data analysis",
    claim:
      "Eight government datasets, 29,032 verified rows, one honest picture of Nigerian business costs.",
    support:
      "Diesel more than doubled while the inflation rate in the news was falling. A PostgreSQL model, an Excel workbook and a Power BI report, with 110 analysis checks and both dashboards validated against the file itself.",
    image: "/proof/nbci/01-powerbi-what-is-changing.webp",
    imageAlt:
      "The opening page of the Power BI report, showing what the project measures against what it does not, and seven things it can tell you against six it cannot.",
  },
  {
    href: "/work/content-engine",
    tag: "Content",
    claim: "One video pulled 128,000 views and 1,700 comments.",
    support:
      "I answered every comment by hand. Behind it sits the pipeline: 6 deployed systems, a lead engine that scored 200 prospects, 25 published articles.",
    image: "/proof/content/web3-video-128k.webp",
    imageAlt:
      "The post's own metrics bar: 8:43 AM, 24 April 2025, 128K views, with 1.7K comments, 267 reposts, 1.4K likes and 598 bookmarks, and the follow-up post delivering the free Web3 guide the next day.",
  },
];

/** How each print sits on the board: its tilt and what holds it on. */
const PRINT_LAYOUT = [
  { tilt: -2.2, attach: "tape" as const },
  { tilt: 1.6, attach: "clip" as const },
  { tilt: 1.2, attach: "pin" as const },
  { tilt: -1.6, attach: "tape-corners" as const },
];

const OFFER_LINES = [
  "A site that answers a buyer's four questions in five minutes. Most sites lose people who had already decided to hire them.",
  "Content produced on a system. That is what keeps the output going through the months you are too busy to feel creative.",
  "Telegram and WhatsApp infrastructure, because that is where Nigerian buyers actually transact. The Peaceway bot takes real orders end to end, and I can show you it running.",
  "Strategy built on who is already buying in your market, rather than a persona document nobody opens twice.",
  "A written report every sprint. Fire me the week the numbers stop moving instead of finding out in month six.",
];

const STEPS = [
  {
    n: "01",
    t: "Scope call",
    d: "Thirty minutes. What you sell, who buys it, where people drop off. You leave with a plan whether or not you hire me.",
  },
  {
    n: "02",
    t: "Written scope",
    d: "Deliverables and timeline in writing before anything starts, so nothing changes on you halfway through.",
  },
  {
    n: "03",
    t: "Seven-day sprint",
    d: "Payment starts the work. At the end you get a report on what shipped and what moved.",
  },
  {
    n: "04",
    t: "Build out",
    d: "We keep going in sprints, each one reported, until the system runs without me standing over it.",
  },
];

const STAMP_STYLE = [
  { tone: "gold" as const, tilt: -2.4 },
  { tone: "paper" as const, tilt: 1.8 },
  { tone: "tint" as const, tilt: -1.2 },
  { tone: "paper" as const, tilt: 2.2 },
];

const NOTE_TILT = [-1.8, 1.4, -0.8, 1.9, -1.4, 1];

/** Numbers inside a quote get a highlighter pass, not a colour change. */
function MarkedQuote({ text }: { text: string }) {
  const parts = text.split(/(\$[\d,.]+[KkMm]?|\d+[%+x]|\d{2,}[\d,.]*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\$[\d,.]+[KkMm]?$|^\d+[%+x]$|^\d{2,}[\d,.]*$/.test(part) ? (
          <span key={i} className="hl-mark">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cx("h-4 w-4", i <= rating ? "text-ink" : "text-ink/20")}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function HomeClient({ calendlyUrl, proofStats, testimonials }: HomeClientProps) {
  // The claim register, kept structural: a stat with no evidenceRef never
  // reaches the page. Same rule ProofStrip enforced before the redesign.
  const backedStats = proofStats.filter((s) => s.evidenceRef);

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. HERO ─────────
          Copy written by the owner, unchanged. The portrait and the liquid
          glass effect are unchanged too; HeroReveal now frames them as a
          print on grid paper instead of a full-bleed black screen. */}
      <HeroReveal
        headline={
          <>
            Your next skill is going to end{" "}
            <Highlighter load delay={650}>
              exactly like the last one did.
            </Highlighter>
          </>
        }
        supporting="Mine stopped ending that way in 2022, when I got my first seven-figure naira dev job."
        mechanism="Now I have built the thing that fixes yours."
        proof="Same skills. One move."
      >
        {/* The course name sits ABOVE the button, where it can inform the
            decision. One filled control for the waitlist; hiring is a quiet
            link beside it so a buyer who is not a learner still has a door. */}
        <div className="w-full">
          <MonoLabel as="p" caps={false} size="md" tone="soft" className="mb-4">
            The Great Work opens soon. The list goes first.
          </MonoLabel>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
            <BrutalButton href="/greatwork-waitlist" size="lg">
              Join the waitlist
            </BrutalButton>
            <a
              href={calendlyUrl}
              className="paper-link inline-flex min-h-[44px] items-center font-display text-[1.05rem] font-bold text-ink underline decoration-ink decoration-[3px] underline-offset-[7px]"
            >
              Hire me
            </a>
          </div>
        </div>
      </HeroReveal>

      {/* ───────── 2. RECEIPTS ─────────
          Stamped tickets. Values are static text: no count-up, on purpose
          (see StatStamp). */}
      {backedStats.length > 0 && (
        <PaperSection ground="paper" checker="top" aria-labelledby="proof-strip-heading">
          <SectionHead index="01" id="proof-strip-heading" title={<HandMark kind="underline">Receipts.</HandMark>} />

          {/* Four across only from xl, two from sm, one on phones: the longest
              value has to fit its ticket at every width. */}
          <ul className="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
            {backedStats.map((stat, i) => (
              <li key={stat.label} className="max-sm:px-1.5">
                <StatStamp
                  value={`${stat.value.toLocaleString("en-US")}${stat.suffix ?? ""}`}
                  label={stat.label}
                  tone={STAMP_STYLE[i % STAMP_STYLE.length].tone}
                  tilt={STAMP_STYLE[i % STAMP_STYLE.length].tilt}
                  delay={i * 90}
                />
              </li>
            ))}
          </ul>

          <MonoLabel as="p" caps={false} size="md" tone="soft" className="mt-14">
            Every number here has a screenshot behind it. Ask me for any of them.
          </MonoLabel>
        </PaperSection>
      )}

      {/* ───────── 3. CASE STUDIES ─────────
          Pinned prints on a grid-paper board. The whole card is one link. */}
      <PaperSection ground="grid" id="work" aria-labelledby="work-heading" pad="lg">
        <div className="relative">
          <SectionHead index="02" id="work-heading" title="Three builds. Go and check them." />
          <HandNote
            arrow="down-right"
            arrowAt="end"
            tilt={4}
            className="absolute -bottom-20 left-[44%] hidden lg:inline-flex"
          >
            go on, open one
          </HandNote>
        </div>

        <ul className="mt-16 grid gap-x-12 gap-y-16 md:mt-24 md:grid-cols-2 lg:gap-x-20">
          {CASE_STUDIES.map((cs, i) => {
            const layout = PRINT_LAYOUT[i % PRINT_LAYOUT.length];
            return (
              <li key={cs.href} className={i % 2 === 1 ? "md:mt-28" : undefined}>
                <Link href={cs.href} className="group block">
                  <PhotoPrint tilt={layout.tilt} attach={layout.attach} lift="group" mat="even" delay={i * 80}>
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={cs.image}
                        alt={cs.imageAlt}
                        fill
                        sizes="(max-width: 768px) 92vw, (max-width: 1320px) 46vw, 580px"
                        className="object-cover object-top"
                      />
                    </div>
                  </PhotoPrint>

                  <div className="mt-8 px-1">
                    <Sticker
                      shape="label"
                      tone={i % 2 === 0 ? "tint" : "gold"}
                      tilt={i % 2 === 0 ? -2 : 2}
                      decorative={false}
                    >
                      {cs.tag}
                    </Sticker>
                    <h3 className="mt-5 font-display text-[1.45rem] font-bold leading-[1.15] tracking-[-0.015em] text-ink text-balance md:text-[1.65rem]">
                      {cs.claim}
                    </h3>
                    <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink-soft md:text-base">
                      {cs.support}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 border-b-[3px] border-ink pb-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink transition-[gap] duration-200 group-hover:gap-3.5">
                      Read the build <span aria-hidden="true">&rarr;</span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </PaperSection>

      {/* ───────── 4. THE PROBLEM ─────────
          The quiet interlude: one statement, two paragraphs, one pen mark. */}
      <PaperSection ground="paper" width="mid" pad="lg" aria-labelledby="problem-heading">
        <div className="relative">
          <h2
            id="problem-heading"
            className="max-w-[18ch] font-didone text-[clamp(2.7rem,7.4vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.005em] text-ink text-balance"
          >
            Five freelancers, five invoices, and <HandMark kind="circle">nobody answering</HandMark> for the result.
          </h2>
          <HandNote
            tilt={-6}
            className="absolute -top-6 right-0 hidden lg:inline-flex"
            arrow="down-left"
            arrowAt="below"
            arrowClassName="ml-6"
          >
            sound familiar?
          </HandNote>
        </div>

        <div className="mt-12 grid gap-6 border-t-[3px] border-ink pt-8 md:grid-cols-2 md:gap-12">
          <p className="text-lg leading-relaxed text-ink-soft">
            Your designer has never spoken to your writer. Your developer has never read the content plan. Everyone
            delivers exactly what you asked for and the numbers still sit where they were.
          </p>
          <p className="text-lg leading-relaxed text-ink-soft">
            That is a systems problem, not a talent problem, and it is why good brands stay invisible for years.
          </p>
        </div>
      </PaperSection>

      {/* ───────── 5. THE OFFER ─────────
          One framed object: the name on a gold panel, the five parts of the
          system as an indexed list beside it. */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="offer-heading">
        <div className="relative grid border-[3px] border-ink bg-paper shadow-brutal-lg lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative flex flex-col border-b-[3px] border-ink bg-gold p-6 pb-10 sm:p-10 lg:border-b-0 lg:border-r-[3px]">
            <SectionHead index="03" indexTone="paper" id="offer-heading" title="The Growth Operating System" />
            <p className="mt-7 max-w-[24ch] font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink sm:text-[1.5rem]">
              One system, one invoice, one person you can <HandMark kind="circle" tone="ink">shout at.</HandMark>
            </p>
            {/* Lower half of the panel: the sticker and a pen arrow across to
                the list, so the panel reads as a label pinned to it. */}
            <div aria-hidden="true" className="mt-10 hidden items-end gap-3 sm:flex lg:mt-auto">
              <Sticker shape="starburst" tone="paper" size={132} tilt={-10} className="shrink-0">
                the offer
              </Sticker>
              <HandArrow kind="right" className="mb-10 w-28 lg:w-36" />
            </div>
          </div>

          <ol className="p-6 sm:p-10">
            {OFFER_LINES.map((line, i) => (
              <li
                key={line}
                className="grid grid-cols-[auto_1fr] gap-4 border-b-2 border-dashed border-ink/35 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:gap-6"
              >
                <span aria-hidden="true" className="pt-0.5 font-typewriter text-[14px] font-bold text-gold-deep">
                  [{String(i + 1).padStart(2, "0")}]
                </span>
                <span className="text-base leading-relaxed text-ink md:text-[17px]">{line}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <p className="max-w-[52ch] text-lg leading-relaxed text-ink">
            I quote by scope. Tell me what you are trying to move and I will tell you what it takes. If you do not need me
            yet, you will hear that on the call.
          </p>
          <div>
            <BrutalButton href={calendlyUrl} size="lg">
              Book a call
            </BrutalButton>
            <MonoLabel as="p" caps={false} tone="soft" className="mt-5 max-w-[40ch]">
              Thirty minutes, and I will not pitch you. You leave with the plan either way.
            </MonoLabel>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 6. HOW THE WORK RUNS ─────────
          A real sequence, so the numbers are the content: a ruled brutalist
          table, the sprint cell in gold because that is where the report is. */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="process-heading">
        <SectionHead id="process-heading" title="Seven days to your first report." />

        <div aria-hidden="true" className="relative hidden h-24 xl:block">
          <HandNote arrow="down-right" arrowAt="end" tilt={-3} className="absolute -bottom-3 left-[40%]" arrowClassName="!w-[96px]">
            the report lands here
          </HandNote>
        </div>

        <ol className="mt-12 grid gap-[3px] border-[3px] border-ink bg-ink shadow-brutal-lg md:grid-cols-2 xl:mt-0 xl:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.n} className={cx("flex flex-col p-6 sm:p-8", i === 2 ? "bg-gold" : "bg-paper")}>
              <span className="font-didone text-[4.5rem] font-semibold leading-[0.85] text-ink tabular-nums sm:text-[5.25rem]">
                {step.n}
              </span>
              <h3 className="mt-6 font-display text-xl font-bold tracking-[-0.01em] text-ink">{step.t}</h3>
              <p className={cx("mt-3 text-[15px] leading-relaxed", i === 2 ? "text-ink" : "text-ink-soft")}>{step.d}</p>
            </li>
          ))}
        </ol>
      </PaperSection>

      {/* ───────── TESTIMONIALS ─────────
          Taped notes. Below the case studies on purpose: real, but
          role-attributed, so they support the proof rather than carry it. */}
      {testimonials.length > 0 && (
        <PaperSection ground="paper" pad="lg" aria-labelledby="testimonials-heading">
          <SectionHead index="04" id="testimonials-heading" title="What people say" />
          <ul
            className={cx(
              "mt-16 grid items-start gap-x-12 gap-y-14 md:grid-cols-2",
              testimonials.length >= 3 ? "lg:grid-cols-3" : "lg:max-w-[1080px] lg:gap-x-20"
            )}
          >
            {testimonials.map((t, i) => (
              <li key={i} className={cx(i % 3 === 1 && "md:mt-12", i % 3 === 2 && "lg:mt-4")}>
                <figure
                  className="relative m-0 border-[3px] border-ink bg-gold-tint p-7 pt-9 shadow-brutal"
                  style={{ rotate: `${NOTE_TILT[i % NOTE_TILT.length]}deg` }}
                >
                  <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={i % 2 === 0 ? -4 : 3} />
                  {/* Pass images explicitly. Spreading the row would send the
                      raw `images` column (a JSON string or null). */}
                  {t.allImages.length > 0 && (
                    <div className="mb-5 border-2 border-ink">
                      <AutoCarousel images={t.allImages} alt={t.attribution} interval={4000} />
                    </div>
                  )}
                  {t.rating > 0 && <Stars rating={t.rating} />}
                  <blockquote
                    className={cx(
                      "mt-4 whitespace-pre-line font-didone font-medium leading-[1.12] text-ink",
                      testimonials.length >= 3 ? "text-[1.7rem]" : "text-[1.8rem] sm:text-[2.1rem]"
                    )}
                  >
                    &ldquo;
                    <MarkedQuote text={t.quote} />
                    &rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t-2 border-dashed border-ink/40 pt-4">
                    {t.avatar ? (
                      <Image
                        src={t.avatar}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 border-2 border-ink object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-gold font-display text-sm font-bold text-ink"
                      >
                        {t.attribution.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <MonoLabel tone="ink" size="xs">
                      {t.attribution}
                    </MonoLabel>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </PaperSection>
      )}

      {/* ───────── 7. FINAL CTA ─────────
          The big statement, with the portrait pinned beside it. Copy matches
          the action it sits above (the waitlist); the call keeps its own path
          underneath as the secondary control. */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="final-cta-heading">
        <div className="grid items-center gap-20 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="relative order-2 mx-auto w-full max-w-[280px] sm:max-w-[330px] lg:order-1">
            <PhotoPrint tilt={-4} attach="clip" mat="polaroid" caption="Big Quiv" lift="self">
              <div className="relative aspect-square bg-black">
                <Image
                  src="/hero/king-base-1024.webp"
                  alt="Big Quiv, founder of BigQuiv Digitals."
                  fill
                  sizes="330px"
                  className="object-cover"
                  style={{ objectPosition: "51% 30%" }}
                />
              </div>
            </PhotoPrint>
            <Sticker shape="starburst" tone="gold" size={88} tilt={14} className="absolute -right-6 -top-8" delay={150} />
            <Sticker shape="circle" tone="paper" size={88} tilt={-12} className="absolute -bottom-10 -right-5 sm:-right-10" delay={250}>
              your turn
            </Sticker>
          </div>

          <div className="order-1 lg:order-2">
            <h2
              id="final-cta-heading"
              className="font-didone text-[clamp(3.2rem,8.6vw,6rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance"
            >
              You have seen the proof. Now go and <Highlighter>build your own.</Highlighter>
            </h2>
            <p className="mt-7 max-w-[50ch] text-lg leading-relaxed text-ink-soft">
              The Great Work is the loop this page is built on: learn, build, show, sell, turned into something you can
              repeat. It opens soon, and the list hears first.
            </p>
            <div className="mt-9">
              <BrutalButton href="/greatwork-waitlist" size="lg">
                Join the waitlist
              </BrutalButton>
            </div>

            <div className="mt-14 flex flex-col gap-5 border-t-[3px] border-ink pt-7 sm:flex-row sm:items-center sm:justify-between">
              <MonoLabel as="p" caps={false} tone="soft" className="max-w-[46ch]">
                Want the Growth Operating System built for you instead? No price on this page because there is no
                standard job.
              </MonoLabel>
              <BrutalButton href={calendlyUrl} variant="paper" className="shrink-0 self-start sm:self-auto">
                Book a call
              </BrutalButton>
            </div>
          </div>
        </div>
      </PaperSection>
    </div>
  );
}
