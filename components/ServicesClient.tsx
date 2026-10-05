import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BrutalButton,
  HandMark,
  HandNote,
  Highlighter,
  MonoLabel,
  PaperSection,
  Pin,
  SectionHead,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

interface ServicesClientProps {
  calendlyUrl: string;
}

/**
 * /services on the paper system (redesign 2026-10, phase 2).
 *
 * The one offer. Copy is unchanged from the conversion pass; this file
 * changed how it looks. The hero's five slips are decoration for the line
 * they sit beside ("paying five people"): they carry no numbers, no names
 * and no amounts, and they are aria-hidden.
 *
 * Rendered on the server. Animated pieces are client leaves from ui-paper.
 */

const INCLUDES = [
  {
    t: "Website and conversion",
    d: "The pages a buyer actually reads before deciding. Built to answer who you are, what you solve, why they should trust you, and how to hire you, all inside five minutes.",
  },
  {
    t: "AI content production",
    d: "Video, hooks and campaign angles produced on a repeatable system. I run the same engine on my own accounts. One post on it did a million views.",
  },
  {
    t: "Community and bot infrastructure",
    d: "Telegram and WhatsApp are where Nigerian buyers actually transact. I build the bots that take orders, capture emails, and hand a question to a human when the answer matters.",
  },
  {
    t: "Growth strategy and market intelligence",
    d: "Who to target and what they respond to. I run a lead engine that scraped, scored and match-explained 200 prospects, each with the reason it matched. That is the same machinery pointed at your market.",
  },
  {
    t: "Reporting",
    d: "What shipped, what it moved, what happens next. Every sprint, in writing. You are never guessing whether this is working, and you can end it the moment it is not.",
  },
];

/** Bento placement and finish for each part of the system. */
const INCLUDE_STYLE = [
  { span: "lg:col-span-7", tone: "bg-paper", tilt: -0.6, sticker: "gold" as const },
  { span: "lg:col-span-5 lg:mt-10", tone: "bg-gold-tint", tilt: 0.8, sticker: "paper" as const },
  { span: "lg:col-span-4", tone: "bg-paper", tilt: 0.5, sticker: "tint" as const },
  { span: "lg:col-span-4 lg:mt-8", tone: "bg-paper", tilt: -0.7, sticker: "gold" as const },
  { span: "lg:col-span-4 lg:-mt-4", tone: "bg-gold", tilt: 0.9, sticker: "paper" as const },
];

const ENTRY_POINTS = [
  {
    t: "Health brands",
    d: "Pharmacies, clinics, labs and diagnostic centres. Trust first, then a journey that ends in an order.",
    href: "/work/peaceway",
    linkText: "See the Peaceway build",
  },
  {
    t: "Crypto exchanges entering Africa",
    d: "Acquisition, community activation and local reporting, rather than a KOL posting a banner.",
    href: "/work/alpha-plays",
    linkText: "See the community build",
  },
  {
    t: "AI, fintech and Web3 launches",
    d: "Video, landing page and a CTA system that catches the attention your launch generates.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
  {
    t: "Founders with scattered growth",
    d: "A site that sells, content that compounds, one person accountable for both.",
    href: "/work/content-engine",
    linkText: "See the content build",
  },
];

/** Five loose slips, fanned. Positions are percentages of the stack box. */
const SLIPS = [
  { left: "2%", top: "14%", tilt: -11 },
  { left: "22%", top: "2%", tilt: 6 },
  { left: "44%", top: "16%", tilt: -4 },
  { left: "10%", top: "40%", tilt: 9 },
  { left: "36%", top: "44%", tilt: -8 },
];

function Slip({ tilt, left, top }: { tilt: number; left: string; top: string }) {
  return (
    <div
      className="absolute w-[46%] border-[3px] border-ink bg-paper p-3.5 shadow-brutal sm:p-4"
      style={{ left, top, rotate: `${tilt}deg` }}
    >
      <div className="flex items-center justify-between border-b-2 border-dashed border-ink/50 pb-2">
        <span className="font-typewriter text-[11px] font-bold uppercase tracking-[0.14em] text-ink sm:text-[12px]">Invoice</span>
        <span className="h-3 w-3 rounded-full border-2 border-ink" />
      </div>
      <div className="mt-3 space-y-2">
        <span className="block h-[5px] w-[82%] bg-ink/80" />
        <span className="block h-[5px] w-[64%] bg-ink/30" />
        <span className="block h-[5px] w-[74%] bg-ink/30" />
        <span className="block h-[5px] w-[40%] bg-ink/30" />
      </div>
      <div className="mt-4 flex justify-end">
        <span className="block h-[9px] w-[34%] bg-gold" />
      </div>
    </div>
  );
}

export function ServicesClient({ calendlyUrl }: ServicesClientProps) {
  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. HERO ─────────
          The cost on the left; on the right, the five bills it is talking
          about, fanned on the desk with one stamp across them. */}
      <PaperSection ground="grid" pad="none" innerClassName="pb-24 pt-28 md:pb-32 md:pt-36" aria-labelledby="services-heading">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            <h1
              id="services-heading"
              className="max-w-[15ch] font-didone text-[clamp(2.9rem,6.6vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.01em] text-ink text-balance"
            >
              You are paying five people and <HandMark kind="underline" load delay={500}>none of them</HandMark> own the
              result.
            </h1>

            <div className="mt-9 max-w-[58ch] space-y-4">
              <p className="text-lg leading-relaxed text-ink-soft">
                The designer never speaks to the writer. The developer has never read the content plan. Every one of them
                delivers what you asked for, and the numbers still do not move.
              </p>
              <p className="text-lg leading-relaxed text-ink-soft">
                That is the real cost of buying growth in pieces, and it is not the invoices. It is the six months you
                spend before anyone admits the pieces were never going to add up.
              </p>
            </div>

            <p className="mt-8 font-display text-[1.45rem] font-bold leading-snug tracking-[-0.01em] text-ink sm:text-[1.65rem]">
              <Highlighter load delay={900}>I sell one system and I own the outcome.</Highlighter>
            </p>
          </div>

          <div aria-hidden="true" className="relative mx-auto aspect-[1/0.92] w-full max-w-[460px]">
            {SLIPS.map((s, i) => (
              <Slip key={i} {...s} />
            ))}
            <Pin className="left-[43%] top-[1%]" />
            <Tape className="right-[1%] top-[13%]" tilt={38} width={88} />
            <Sticker
              shape="starburst"
              tone="gold"
              size={150}
              tilt={-12}
              reveal={false}
              className="load-settle absolute -bottom-6 right-0 sm:-right-4"
              textClassName="text-[13px]"
            >
              one system
            </Sticker>
            <HandNote load delay={700} tilt={-6} size="lg" arrow="down-right" arrowAt="end" className="absolute -left-10 -top-24 hidden sm:inline-flex">
              look familiar?
            </HandNote>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 2. WHAT IT INCLUDES ─────────
          The five parts as framed cards on a bento, each tagged with its
          number sticker. Reporting is the gold one: it is the part you read. */}
      <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="includes-heading">
        <SectionHead index="01" id="includes-heading" title="What the Growth Operating System includes" />

        <ol className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-14">
          {INCLUDES.map((item, i) => {
            const st = INCLUDE_STYLE[i];
            return (
              <li key={item.t} className={cx(st.span, i === 4 && "md:col-span-2 lg:col-span-4")}>
                <article
                  className={cx(
                    "relative h-full border-[3px] border-ink p-7 pt-10 shadow-brutal-lg transition-[rotate,translate] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] hover:-translate-y-1 hover:[rotate:0deg] sm:p-9 sm:pt-11",
                    st.tone
                  )}
                  style={{ "--tilt": `${st.tilt}deg` } as React.CSSProperties}
                >
                  <Sticker
                    shape="label"
                    tone={st.sticker}
                    tilt={i % 2 === 0 ? -4 : 3}
                    className="absolute -top-4 left-6"
                    delay={i * 70}
                  >
                    ({String(i + 1).padStart(2, "0")})
                  </Sticker>
                  {i === 4 && (
                    <Sticker shape="starburst" tone="paper" size={74} tilt={16} className="absolute -right-6 -top-8" delay={300} />
                  )}
                  <h3
                    className={cx(
                      "font-display font-bold leading-[1.12] tracking-[-0.02em] text-ink text-balance",
                      i < 2 ? "text-[1.6rem] sm:text-[1.95rem]" : "text-[1.4rem] sm:text-[1.55rem]"
                    )}
                  >
                    {item.t}
                  </h3>
                  <p className={cx("mt-4 leading-relaxed", i === 4 ? "text-ink" : "text-ink-soft", i < 2 ? "text-[17px]" : "text-base")}>
                    {item.d}
                  </p>
                </article>
              </li>
            );
          })}
        </ol>
      </PaperSection>

      {/* ───────── 3. WHERE PEOPLE START ─────────
          Four front doors, as file folders with a tab each. */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="entry-heading">
        <div className="relative">
          <SectionHead
            index="02"
            id="entry-heading"
            title="Where people usually start"
            kicker="Nobody needs the whole system on day one. These are the common front doors, and each one leads into the same engine."
          />
          <HandNote arrow="down" arrowAt="below" tilt={5} size="lg" className="absolute right-[8%] top-4 hidden lg:inline-flex" arrowClassName="ml-10">
            pick your door
          </HandNote>
        </div>

        <ul className="mt-20 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {ENTRY_POINTS.map((e, i) => (
            <li key={e.t} className={cx(i % 2 === 1 && "md:mt-14")}>
              <Link href={e.href} className="group relative block pt-9">
                {/* the folder tab */}
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute left-0 top-0 inline-flex h-10 items-center border-[3px] border-b-0 border-ink px-4 font-typewriter text-[13px] font-bold tracking-[0.06em] text-ink",
                    i % 2 === 0 ? "bg-gold" : "bg-gold-tint"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="block border-[3px] border-ink bg-paper p-7 shadow-brutal transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-x-0.5 group-hover:-translate-y-1 group-hover:shadow-brutal-lg sm:p-8">
                  <span className="block font-display text-[1.45rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[1.6rem]">
                    {e.t}
                  </span>
                  <span className="mt-3 block text-base leading-relaxed text-ink-soft">{e.d}</span>
                  <span className="mt-6 inline-flex items-center gap-2 border-b-[3px] border-ink pb-1 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink transition-[gap] duration-200 group-hover:gap-3.5">
                    {e.linkText} <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PaperSection>

      {/* ───────── 4. CTA ───────── */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="services-cta-heading">
        <div className="relative grid items-end gap-12 border-[3px] border-ink bg-paper p-8 shadow-brutal-lg sm:p-12 lg:grid-cols-[1.3fr_0.7fr] lg:p-16">
          <Tape className="-top-3.5 left-12" tilt={-4} width={110} />
          <Sticker shape="circle" tone="gold" size={96} tilt={-12} className="absolute -right-3 -top-16 sm:-right-8 sm:-top-10">
            your move
          </Sticker>
          <h2
            id="services-cta-heading"
            className="font-didone text-[clamp(2.8rem,6.4vw,5.2rem)] font-semibold leading-[0.96] tracking-[-0.01em] text-ink text-balance"
          >
            Tell me what you are <Highlighter>building.</Highlighter>
          </h2>
          <div>
            <BrutalButton href={calendlyUrl} size="lg">
              Book a call
            </BrutalButton>
            <MonoLabel as="p" caps={false} tone="soft" className="mt-5 max-w-[36ch]">
              I quote by scope. If you do not need me yet, you will hear that on the call.
            </MonoLabel>
          </div>
        </div>
      </PaperSection>
    </div>
  );
}
