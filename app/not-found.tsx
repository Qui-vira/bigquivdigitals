import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HandMark, HandNote, PaperSection, Sticker, Tape } from "@/components/ui-paper";

/**
 * 404 on the paper system: a note torn off a pad and taped to grid paper.
 * Copy and links are unchanged; the pen note and the sticker are labels.
 */

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/work/peaceway", label: "Peaceway Online, the health build" },
  { href: "/work/alpha-plays", label: "Big_Quiv Alpha plays, community and markets" },
  { href: "/work/content-engine", label: "The Content Engine, technical" },
  { href: "/work/nigeria-business-costs", label: "Nigeria Business Cost Intelligence, the data build" },
  { href: "/services", label: "The Growth Operating System" },
  { href: "/articles", label: "Articles" },
  { href: "/contact", label: "Contact" },
];

/** The torn bottom edge of the note: a jagged strip, paper fill, ink line. */
function TornEdge() {
  const teeth = 28;
  const pts: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100;
    const y = i % 2 === 0 ? 4 : 14 + ((i * 7) % 5);
    pts.push(`${x.toFixed(2)},${y}`);
  }
  const edge = pts.join(" ");
  return (
    <svg aria-hidden="true" viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 top-full -mt-px block h-5 w-full">
      <polygon points={`0,0 100,0 ${pts.slice().reverse().join(" ")}`} fill="#FFFFFF" />
      <polyline points={edge} fill="none" stroke="#111111" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <line x1="0" y1="0" x2="0" y2="4" stroke="#111111" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <line x1="100" y1="0" x2="100" y2="4" stroke="#111111" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      <PaperSection ground="grid" pad="none" width="mid" innerClassName="pb-32 pt-28 md:pb-40 md:pt-36" aria-labelledby="nf-heading">
        <div className="relative mx-auto max-w-[680px]">
          {/* The note. drop-shadow (not box-shadow) so the hard shadow follows
              the torn edge too. */}
          <div className="relative [filter:drop-shadow(8px_8px_0_#111111)]" style={{ rotate: "-1.5deg" }}>
            <div className="relative border-[3px] border-b-0 border-ink bg-paper pb-10 pl-[3.4rem] pr-5 pt-12 sm:px-12 sm:pt-14">
              {/* ruled pad lines and a margin rule, like a page from a pad */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent 2.6rem, rgba(232,163,61,0.55) 2.6rem, rgba(232,163,61,0.55) calc(2.6rem + 2px), transparent calc(2.6rem + 2px)), repeating-linear-gradient(180deg, transparent 0 33px, #E6E9ED 33px 34px)",
                }}
              />
              <div className="relative">
                <p className="font-didone text-[clamp(5.5rem,20vw,9.5rem)] font-semibold leading-[0.8] tracking-[-0.02em] text-ink">
                  <HandMark kind="circle" load delay={300}>
                    404
                  </HandMark>
                </p>
                <h1
                  id="nf-heading"
                  className="mt-8 font-didone text-[clamp(2.4rem,6vw,3.6rem)] font-semibold leading-[1] tracking-[-0.01em] text-ink"
                >
                  That page does not exist.
                </h1>
                <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
                  It may have moved during the rebuild. Here is everything worth reading.
                </p>

                <ul className="mt-9 border-t-[3px] border-ink">
                  {LINKS.map((l, i) => (
                    <li key={l.href} className="border-b-2 border-dashed border-ink/40">
                      <Link
                        href={l.href}
                        className="group grid min-h-[52px] grid-cols-[auto_1fr_auto] items-center gap-4 py-2.5 transition-[background-color] duration-150 hover:bg-gold-tint focus-visible:bg-gold-tint"
                      >
                        <span aria-hidden="true" className="font-typewriter text-[13px] font-bold text-gold-deep">
                          [{String(i + 1).padStart(2, "0")}]
                        </span>
                        <span className="font-display text-[1.05rem] font-bold leading-snug text-ink sm:text-[1.1rem]">{l.label}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="mr-1 h-5 w-5 text-ink transition-transform duration-200 ease-out group-hover:translate-x-1"
                          strokeWidth={2.5}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <TornEdge />
          </div>

          <Tape className="-top-3 left-1/2 -translate-x-1/2" tilt={-4} width={120} />
          <Sticker shape="starburst" tone="gold" size={108} tilt={14} reveal={false} className="load-settle absolute -right-4 -top-10 sm:-right-12">
            oops
          </Sticker>
          <HandNote
            load
            delay={600}
            arrow="down-left"
            arrowAt="below"
            tilt={6}
            size="lg"
            className="absolute -right-56 top-[42%] hidden xl:inline-flex"
            arrowClassName="ml-2"
          >
            try one of these
          </HandNote>
        </div>
      </PaperSection>
    </div>
  );
}
