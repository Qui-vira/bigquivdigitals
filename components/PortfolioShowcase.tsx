"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import { FilmReel, FILM_COUNT } from "@/components/FilmReel";

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
  category: Exclude<CategoryId, "all">;
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
 * ⛔ altara-energy.png IS STILL CLIPART. Altara Energy Network has no deployment
 * and no images in its repo, so there was nothing real to capture. Deploy it or
 * drop the card; do not leave a drawing standing in for a product.
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
  {
    title: "Altara Energy Network",
    category: "software",
    eyebrow: "Solar project management",
    description:
      "Everything between a solar site visit and a signed quote, in one place. Photos of the site, the load each appliance draws, then the quote and the pro-forma invoice come out the other end.",
    proof: "Public TypeScript. The whole workflow is there to read.",
    image: "/proof/portfolio/altara-energy.png",
    imageAlt:
      "Illustration of a solar installation workflow with panels, project data and a generated quote.",
    href: "https://github.com/Qui-vira/altara-energy-network",
    external: true,
  },
];

function ProjectCard({ project }: { project: Project }) {
  const card = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-secondary transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-accent/50">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#11100e]">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-secondary to-transparent" />
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-3 md:px-7 md:pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {project.eyebrow}
        </p>
        <div className="mt-3 flex items-start justify-between gap-5">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">
            {project.title}
          </h2>
          <ArrowUpRight
            className="mt-1 h-5 w-5 shrink-0 text-text-muted transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden="true"
          />
        </div>

        <p className="mt-4 text-base leading-relaxed text-text-secondary">
          {project.description}
        </p>

        <div className="mt-6 border-t border-border pt-5">
          <p className="flex gap-2 text-sm leading-relaxed text-text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>{project.proof}</span>
          </p>
          {project.disclosure && (
            <p className="mt-3 text-xs leading-relaxed text-text-muted">{project.disclosure}</p>
          )}
        </div>
      </div>
    </article>
  );

  const className =
    "block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

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
  const visibleProjects =
    active === "all" ? PROJECTS : PROJECTS.filter((project) => project.category === active);
  const activeLabel = CATEGORIES.find((category) => category.id === active)?.label ?? "Work";

  return (
    <div>
      <div
        role="tablist"
        aria-label="Filter portfolio by discipline"
        className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CATEGORIES.map((category) => {
          const selected = active === category.id;
          const count =
            category.id === "all"
              ? PROJECTS.length + FILM_COUNT
              : category.id === "ai-video"
                ? FILM_COUNT
                : PROJECTS.filter((project) => project.category === category.id).length;

          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(category.id)}
              className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "border-accent bg-accent text-black"
                  : "border-border bg-bg-secondary text-text-secondary hover:border-border-hover hover:text-text-primary"
              }`}
            >
              {category.label}
              <span className={`ml-2 tabular-nums ${selected ? "text-black/60" : "text-text-muted"}`}>
                {count || "—"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-text-muted" aria-live="polite">
        {showFilmsOnly
          ? `${FILM_COUNT} films in ${activeLabel}`
          : visibleProjects.length > 0
            ? `${visibleProjects.length} ${visibleProjects.length === 1 ? "project" : "projects"} in ${activeLabel}`
            : `${activeLabel}: proof-of-work build in progress`}
      </p>

      {showFilmsOnly ? (
        <div className="mt-10">
          <FilmReel headless />
        </div>
      ) : visibleProjects.length > 0 ? (
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border-y border-border py-20 md:py-28">
          <div className="max-w-xl">
            <Clock3 className="h-7 w-7 text-accent" aria-hidden="true" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Coming soon
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
              I have not built one of these yet.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              I can do the work. I have not shipped a {activeLabel.toLowerCase()} project I would
              put in front of you, so there is nothing here. When I have, it goes up with a link you
              can open.
            </p>
          </div>
        </div>
      )}

      {/* Under "All work" the films sit below the builds with their own heading.
          On a discipline tab they are either the whole answer (ai-video, handled
          above) or irrelevant, so they do not render at all. */}
      {active === "all" && (
        <div className="mt-20 border-t border-border pt-16 md:mt-24 md:pt-20">
          <FilmReel />
        </div>
      )}
    </div>
  );
}

