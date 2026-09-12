"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";

type CategoryId =
  | "all"
  | "ai-engineer"
  | "ai-video"
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
  { id: "ai-engineer", label: "AI Engineer" },
  { id: "ai-video", label: "AI Video Producer" },
  { id: "automation", label: "Automation Engineer" },
  { id: "software", label: "Software Engineer" },
  { id: "data-engineer", label: "Data Engineer" },
  { id: "data-analyst", label: "Data Analyst" },
];

/**
 * Five projects, selected by two rules: the work is publicly checkable and a
 * buyer can understand what they would be paying for. This intentionally does
 * not turn every repository or experiment into a portfolio card.
 */
const PROJECTS: Project[] = [
  {
    title: "MedBand",
    category: "ai-engineer",
    eyebrow: "Multi-agent healthcare",
    description:
      "Agents handle intake, medication checks and pharmacy availability. A licensed person approves every output, and that gate lives in the state machine—not in a prompt.",
    proof: "Public Python repository. The approval workflow is open to inspect.",
    image: "/proof/portfolio/medband-agents.png",
    imageAlt:
      "Illustration of connected AI agents passing healthcare work through a human approval checkpoint.",
    href: "https://github.com/Qui-vira/Tbr-Medband",
    external: true,
  },
  {
    title: "The Lagos Film",
    category: "ai-video",
    eyebrow: "Character-consistent AI film",
    description:
      "The same character moves from a Lagos street to a cockpit across a 162-second, three-part story. It proves continuity, direction and narrative control beyond a twelve-second generation.",
    proof: "The finished 2:42 film is published on a dated public timeline.",
    image: "/proof/aimastery/lagos.webp",
    imageAlt:
      "Poster frame from The Lagos Film showing the central character in a cinematic scene.",
    href: "https://x.com/_Quivira/status/2056297961617801722",
    external: true,
    disclosure: "Original portfolio film. Not commissioned client work.",
  },
  {
    title: "Peaceway Online",
    category: "automation",
    eyebrow: "Pharmacy commerce and ordering",
    description:
      "A live pharmacy platform with customer, staff and supplier portals, medicine requests, medication reminders, and a Telegram bot that carries an order from search to an itemised confirmation.",
    proof: "Live website, public code and a documented ₦1,055 test order.",
    image: "/proof/peaceway/00-homepage-hero.webp",
    imageAlt:
      "Peaceway Online homepage with routes to order on Telegram or check medicine availability.",
    href: "/work/peaceway",
    disclosure: "Built for my father's pharmacy and never billed as paid client work.",
  },
  {
    title: "PharmaOS",
    category: "software",
    eyebrow: "Pharmacy operations platform",
    description:
      "The operations layer behind pharmacy inventory and ordering: a Python backend paired with a Next.js dashboard, separated so the customer experience never has to expose internal pharmacy work.",
    proof: "Frontend and backend are both public and separately inspectable.",
    image: "/proof/portfolio/pharmaos.png",
    imageAlt:
      "Illustration of a pharmacy operations dashboard connected to inventory and ordering services.",
    href: "https://github.com/Qui-vira/pharmaos-backend",
    external: true,
  },
  {
    title: "Altara Energy Network",
    category: "software",
    eyebrow: "Solar project management",
    description:
      "A solar workflow that moves from site-readiness photos and appliance load calculations to quote building and pro-forma invoices in one application.",
    proof: "Public TypeScript repository with the complete workflow available to inspect.",
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
              ? PROJECTS.length
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
        {visibleProjects.length > 0
          ? `${visibleProjects.length} ${visibleProjects.length === 1 ? "project" : "projects"} in ${activeLabel}`
          : `${activeLabel}: proof-of-work build in progress`}
      </p>

      {visibleProjects.length > 0 ? (
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
              No borrowed credibility.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-text-secondary md:text-lg">
              I can do this work, but this page only publishes finished work with a public link or a
              result you can inspect. The first qualifying {activeLabel.toLowerCase()} case study
              will appear here when that proof exists.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

