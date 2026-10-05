"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Clock3 } from "lucide-react";
import { PaperFilmReel, FILM_COUNT } from "@/components/portfolio/PaperFilmReel";
import { MonoLabel, PhotoPrint, Sticker, Tape, cx } from "@/components/ui-paper";

/**
 * ⚠ "ai-video" HAS NO ENTRY IN PROJECTS AND THAT IS CORRECT. Its six items are
 * films, rendered by FilmReel, not project cards. The tab is still real: it
 * counts the films and selecting it shows the reel.
 *
 * It was briefly deleted from this list, which was wrong twice over. AI video is
 * his strongest discipline, so a filter row that does not mention it tells a
 * visitor he does not do it. His words on seeing that row: "why is the ai video
 * producer not here?". Do not remove it again. If it ever renders the empty
 * state, the bug is in the count or the branch below, not in the tab existing.
 */
type CategoryId =
  | "all"
  | "ai-video"
  | "ai-engineer"
  | "automation"
  | "software"
  | "data-engineer"
  | "data-analyst";

interface Category {
  id: CategoryId;
  label: string;
}

interface Project {
  title: string;
  /** The discipline this project leads with. */
  category: Exclude<CategoryId, "all">;
  /**
   * Further disciplines the same project genuinely answers. A build that is both
   * data engineering and data analysis should appear under both, rather than
   * leaving one tab claiming nothing has been shipped for it.
   */
  alsoIn?: Array<Exclude<CategoryId, "all">>;
  eyebrow: string;
  description: string;
  proof: string;
  image: string;
  imageAlt: string;
  href: string;
  external?: boolean;
  disclosure?: string;
}

const CATEGORIES: Category[] = [
  { id: "all", label: "All work" },
  { id: "ai-video", label: "AI Video Producer" },
  { id: "ai-engineer", label: "AI Engineer" },
  { id: "automation", label: "Automation Engineer" },
  { id: "software", label: "Software Engineer" },
  { id: "data-engineer", label: "Data Engineer" },
  { id: "data-analyst", label: "Data Analyst" },
];

/**
 * Four builds. The films are not here, they are the reel in FilmReel.tsx.
 *
 * WRITE THESE IN HIS VOICE, FIRST PERSON. They shipped in third-person brochure
 * voice ("Agents handle intake", "The operations layer behind") and his reaction
 * on 2026-09-12 was that the page read like "someone is advising me or someone
 * wrote it for me". A buyer is being shown work by the person who made it, so
 * the person has to be in the sentence. Short sentences, say what he did, and
 * own the unpaid and family parts rather than dressing them up.
 */
/**
 * ⚠ THE CARD IMAGES MUST BE THE REAL PRODUCT, NOT AN ILLUSTRATION. They shipped
 * as generated line-art clipart and his reaction on 2026-09-12 was "why is just
 * bland cards". A drawing of a mortar and pestle proves nothing; a screenshot of
 * the thing running is the whole point of the page.
 *
 * medband.webp and pharmaos.webp are real 1440x900 captures of the live sites,
 * taken 2026-09-12. Peaceway uses its own real capture and always has.
 *
 * ⛔ ALTARA ENERGY NETWORK WAS REMOVED, 2026-09-12, owner's decision. It has no
 * deployment and no images in its repo, so the only image available was clipart,
 * and a drawing standing in for a product is what made this page read as bland.
 * The repo is real and the card can come back the moment the app is deployed and
 * can be captured like the other two. Do not restore it with an illustration.
 *
 * ⚠ NOT altaraerial.com. That is the drone business, a different product.
 */
const PROJECTS: Project[] = [
  {
    title: "MedBand",
    category: "ai-engineer",
    eyebrow: "Multi-agent healthcare",
    description:
      "I built a set of agents that take a patient through intake, check the medication and find a pharmacy that actually has it. A licensed person signs off on every answer, and I put that gate in the code itself rather than in a prompt, so it cannot be talked around.",
    proof: "It is live, and the Python is public. Built for the Band of Agents hackathon, track 3.",
    image: "/proof/portfolio/medband.webp",
    imageAlt:
      "The MedBand site: Getting people to the right care, faster, with the live pharmacy workflow and coordinated agent roles.",
    href: "https://medband-landing.vercel.app",
    external: true,
  },
  {
    title: "Peaceway Online",
    category: "automation",
    eyebrow: "Pharmacy commerce and ordering",
    description:
      "My father's pharmacy had no website, so I built him one. Customers, staff and suppliers each get their own way in, people can request medicine and set reminders, and a Telegram bot carries an order from the first search to an itemised confirmation.",
    proof: "The site is live, the code is public, and there is a real ₦1,055 order on the record.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage with routes to order on Telegram or check medicine availability.",
    href: "/work/peaceway",
    disclosure: "My father's pharmacy. I never billed him for it.",
  },
  {
    title: "Nigeria Business Cost Intelligence",
    category: "data-analyst",
    alsoIn: ["data-engineer"],
    eyebrow: "Cost intelligence and data modelling",
    description:
      "Eight Nigerian government agencies publish business costs separately and nobody publishes the combined picture, so I built it. 342 source files hash-verified, cleaned into a PostgreSQL model, then an Excel workbook and a Power BI report on top. It says out loud what it cannot tell you.",
    proof:
      "110 analysis checks pass, the database has its own 245-check audit, and both dashboards are validated against the saved file rather than the build log.",
    image: "/proof/nbci/02-powerbi-fuel-and-power.webp",
    imageAlt:
      "The fuel and power page of the Power BI report, with the median price across 37 jurisdictions, the gap between the cheapest and dearest place, and a chart of diesel self-generation against the grid tariff.",
    href: "/work/nigeria-business-costs",
  },
  {
    title: "PharmaOS",
    category: "software",
    eyebrow: "Pharmacy operations platform",
    description:
      "The part a customer never sees. Stock, ordering and the daily running of a pharmacy, as a Python backend with a Next.js dashboard on top. I kept the two apart so the shop's internal work can never leak out to the people buying.",
    proof: "The app is live and both halves of the code are public.",
    image: "/proof/portfolio/pharmaos.webp",
    imageAlt:
      "The PharmaOS sign-in: AI-powered inventory, smart ordering, patient reminders and real-time analytics, built for Nigerian pharmacies.",
    href: "https://pharmaos-frontend.vercel.app",
    external: true,
  },
];

function inCategory(project: Project, category: CategoryId): boolean {
  return (
    category === "all" ||
    project.category === category ||
    (project.alsoIn?.includes(category as Exclude<CategoryId, "all">) ?? false)
  );
}

/** How each build's print sits on the board. */
const CARD_LAYOUT = [
  { tilt: -1.8, attach: "tape" as const, sticker: "gold" as const },
  { tilt: 1.4, attach: "clip" as const, sticker: "tint" as const },
  { tilt: 1, attach: "pin" as const, sticker: "tint" as const },
  { tilt: -1.3, attach: "tape-corners" as const, sticker: "gold" as const },
];

/**
 * One build: the real capture as a print, then the words beneath it on the
 * paper. The whole card is one link. External builds get the up-right arrow,
 * internal case studies the plain one.
 */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const l = CARD_LAYOUT[index % CARD_LAYOUT.length];
  const Arrow = project.external ? ArrowUpRight : ArrowRight;
  const card = (
    <article className="flex h-full flex-col">
      <PhotoPrint tilt={l.tilt} attach={l.attach} lift="group" mat="even" delay={index * 80}>
        <div className="relative aspect-[16/10]">
          <Image
            src={project.image}
            alt={project.imageAlt}
            fill
            sizes="(max-width: 768px) 92vw, (max-width: 1320px) 46vw, 600px"
            className="object-cover object-top"
          />
        </div>
      </PhotoPrint>

      <div className="mt-8 flex flex-1 flex-col px-1">
        <div>
          <Sticker shape="label" tone={l.sticker} tilt={index % 2 === 0 ? -2 : 2} decorative={false}>
            {project.eyebrow}
          </Sticker>
        </div>
        <div className="mt-5 flex items-start justify-between gap-5">
          <h2 className="font-didone text-[clamp(2.2rem,3.6vw,3rem)] font-semibold leading-[0.98] tracking-[-0.01em] text-ink">
            {project.title}
          </h2>
          <span
            aria-hidden="true"
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-ink bg-paper shadow-brutal-sm transition-[background-color,translate] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:bg-gold"
          >
            <Arrow className="h-5 w-5 text-ink" strokeWidth={2.5} />
          </span>
        </div>

        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-soft">{project.description}</p>

        <div className="mt-6 border-t-[3px] border-ink pt-5">
          <p className="flex gap-3 text-[15px] leading-relaxed text-ink">
            <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-ink bg-gold">
              <Check className="h-4 w-4 text-ink" strokeWidth={3} />
            </span>
            <span>{project.proof}</span>
          </p>
          {project.disclosure && (
            <MonoLabel as="p" caps={false} size="sm" tone="muted" className="mt-3">
              {project.disclosure}
            </MonoLabel>
          )}
        </div>
      </div>
    </article>
  );

  const className = "group block h-full";

  if (project.external) {
    return (
      <a href={project.href} target="_blank" rel="noopener noreferrer" className={className}>
        {card}
      </a>
    );
  }

  return (
    <Link href={project.href} className={className}>
      {card}
    </Link>
  );
}

export function PortfolioShowcase() {
  const [active, setActive] = useState<CategoryId>("all");
  /** The films are not in PROJECTS, so this tab renders the reel instead of cards. */
  const showFilmsOnly = active === "ai-video";
  const visibleProjects = PROJECTS.filter((project) => inCategory(project, active));
  const activeLabel = CATEGORIES.find((category) => category.id === active)?.label ?? "Work";

  return (
    <div>
      {/* The filter: square tabs. Wraps from sm up; on a phone it scrolls
          sideways inside itself, never the page. */}
      <div
        role="tablist"
        aria-label="Filter portfolio by discipline"
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((category) => {
          const selected = active === category.id;
          const count =
            category.id === "all"
              ? PROJECTS.length + FILM_COUNT
              : category.id === "ai-video"
                ? FILM_COUNT
                : PROJECTS.filter((project) => inCategory(project, category.id)).length;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(category.id)}
              className={cx(
                "paper-focus inline-flex min-h-[48px] shrink-0 cursor-pointer items-center gap-2.5 border-[3px] border-ink px-4 font-display text-[15px] font-bold text-ink transition-[background-color,translate,box-shadow] duration-150 ease-out",
                selected
                  ? "-translate-x-0.5 -translate-y-0.5 bg-gold shadow-brutal"
                  : "bg-paper shadow-brutal-sm hover:-translate-x-px hover:-translate-y-px hover:bg-gold-tint active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              )}
            >
              {category.label}
              <span
                className={cx(
                  "inline-flex h-6 min-w-6 items-center justify-center border-2 border-ink px-1 font-typewriter text-[12px] font-bold tabular-nums",
                  selected ? "bg-paper" : "bg-paper-alt"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-typewriter text-[15px] leading-snug text-ink-soft" aria-live="polite">
        {showFilmsOnly
          ? `${FILM_COUNT} films in ${activeLabel}`
          : visibleProjects.length > 0
            ? `${visibleProjects.length} ${visibleProjects.length === 1 ? "project" : "projects"} in ${activeLabel}`
            : `${activeLabel}: proof-of-work build in progress`}
      </p>

      {showFilmsOnly ? (
        <div className="mt-14">
          <PaperFilmReel headless />
        </div>
      ) : visibleProjects.length > 0 ? (
        <ul className="mt-14 grid gap-x-12 gap-y-20 md:grid-cols-2 lg:gap-x-20">
          {visibleProjects.map((project, i) => (
            <li key={project.title} className={cx(i % 2 === 1 && visibleProjects.length > 1 && "md:mt-24")}>
              <ProjectCard project={project} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-14 flex justify-center py-6 md:py-12">
          <div
            className="relative w-full max-w-[620px] border-[3px] border-ink bg-gold-tint p-8 shadow-brutal-lg sm:p-12"
            style={{ rotate: "-1.2deg" }}
          >
            <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-3} />
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center border-[3px] border-ink bg-gold">
                <Clock3 className="h-6 w-6 text-ink" strokeWidth={2.25} />
              </span>
              <Sticker shape="label" tone="paper" tilt={2} decorative={false} reveal={false}>
                Coming soon
              </Sticker>
            </div>
            <h2 className="mt-7 font-didone text-[clamp(2.2rem,4.6vw,3.4rem)] font-semibold leading-[1] tracking-[-0.01em] text-ink">
              I have not built one of these yet.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
              I can do the work. I have not shipped a {activeLabel.toLowerCase()} project I would put in front of you, so
              there is nothing here. When I have, it goes up with a link you can open.
            </p>
          </div>
        </div>
      )}

      {/* Under "All work" the films sit below the builds with their own heading.
          On a discipline tab they are either the whole answer (ai-video, handled
          above) or irrelevant, so they do not render at all. */}
      {active === "all" && (
        <div className="mt-24 border-t-[3px] border-ink pt-20 md:mt-32 md:pt-24">
          <PaperFilmReel />
        </div>
      )}
    </div>
  );
}
