"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WorkFilms, FILM_COUNT } from "@/components/portfolio/WorkFilms";
import { Arrow } from "@/components/v3/Arrow";

/**
 * ⚠ "ai-video" HAS NO ENTRY IN PROJECTS AND THAT IS CORRECT. Its six items are
 * films, rendered by WorkFilms, not project cards. The tab is still real: it
 * counts the films and selecting it shows the reel.
 *
 * It was briefly deleted from this list, which was wrong twice over. AI video is
 * his strongest discipline, so a filter row that does not mention it tells a
 * visitor he does not do it. His words on seeing that row: "why is the ai video
 * producer not here?". Do not remove it again. If it ever renders the empty
 * state, the bug is in the count or the branch below, not in the tab existing.
 *
 * v3 (rebuild 19 Oct 2026): the tabs keep working, with a gold marker that
 * slides to the active one; internal case studies open with the navy flood
 * (data-flood); the films run as a horizontal pinned scroll.
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
 * Four builds. The films are not here, they are the reel in WorkFilms.tsx.
 *
 * WRITE THESE IN HIS VOICE, FIRST PERSON. They shipped in third-person brochure
 * voice and his reaction on 2026-09-12 was that the page read like "someone is
 * advising me or someone wrote it for me". Short sentences, say what he did,
 * and own the unpaid and family parts rather than dressing them up.
 *
 * ⚠ THE CARD IMAGES MUST BE THE REAL PRODUCT, NOT AN ILLUSTRATION ("why is just
 * bland cards", 2026-09-12). medband.webp and pharmaos.webp are real 1440x900
 * captures of the live sites, taken 2026-09-12. Peaceway uses its own capture.
 *
 * ⛔ ALTARA ENERGY NETWORK WAS REMOVED, 2026-09-12, owner's decision. It has no
 * deployment and no images. Do not restore it with an illustration.
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

function UpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6 14 14 6M7.5 5.5H14.5V12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

/** One build: the real capture, then the words beneath it. The whole card is one link. */
function ProjectCard({ project }: { project: Project }) {
  const body = (
    <>
      <div className="v3-case__frame" data-tilt>
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 768px) 92vw, (max-width: 1360px) 46vw, 640px"
          className="v3-case__img"
        />
      </div>
      <p className="v3-case__tag">{project.eyebrow}</p>
      <h2 className="v3-work__title">
        {project.title}
        {project.external ? <UpRight className="v3-work__ext" /> : <Arrow className="v3-work__ext" />}
      </h2>
      <p className="v3-case__support">{project.description}</p>
      <p className="v3-work__proof">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m4.5 10.5 3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.25" strokeLinecap="square" />
        </svg>
        <span>{project.proof}</span>
      </p>
      {project.disclosure && <p className="v3-work__disclosure">{project.disclosure}</p>}
    </>
  );

  if (project.external) {
    return (
      <a href={project.href} target="_blank" rel="noopener noreferrer" className="v3-case v3-work__card" data-cursor="View">
        {body}
      </a>
    );
  }
  return (
    <Link href={project.href} className="v3-case v3-work__card" data-flood data-cursor="View">
      {body}
    </Link>
  );
}

export function PortfolioShowcase() {
  const [active, setActive] = useState<CategoryId>("all");
  /** The films are not in PROJECTS, so this tab renders the reel instead of cards. */
  const showFilmsOnly = active === "ai-video";
  const visibleProjects = PROJECTS.filter((project) => inCategory(project, active));
  const activeLabel = CATEGORIES.find((category) => category.id === active)?.label ?? "Work";
  const filmsShown = active === "all" || showFilmsOnly;

  // the gold marker slides to the active tab
  const listRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const list = listRef.current;
      const mark = markRef.current;
      const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!list || !mark || !tab) return;
      mark.style.width = `${tab.offsetWidth}px`;
      mark.style.height = `${tab.offsetHeight}px`;
      mark.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
      mark.style.opacity = "1";
    };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  // the page below changes height when a tab changes: re-measure every trigger
  useEffect(() => {
    const r = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(r);
  }, [active]);

  return (
    <div className="v3-work">
      <div className="v3-work__filter">
        <div ref={listRef} role="tablist" aria-label="Filter portfolio by discipline" className="v3-work__tabs">
          <span ref={markRef} className="v3-work__mark" aria-hidden="true" />
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
                className="v3-work__tab"
              >
                {category.label}
                <span className="v3-work__count">{count}</span>
              </button>
            );
          })}
        </div>
        <p className="v3-hand v3-work__hand" aria-hidden="true">
          pick a tab
        </p>
      </div>

      <p className="v3-work__status" aria-live="polite">
        {showFilmsOnly
          ? `${FILM_COUNT} films in ${activeLabel}`
          : active === "all"
            ? // the All tab shows the builds and the films, so count both (its badge does)
              `${visibleProjects.length} projects and ${FILM_COUNT} films in ${activeLabel}`
            : visibleProjects.length > 0
            ? `${visibleProjects.length} ${visibleProjects.length === 1 ? "project" : "projects"} in ${activeLabel}`
            : `${activeLabel}: proof-of-work build in progress`}
      </p>

      {showFilmsOnly ? null : visibleProjects.length > 0 ? (
        <ul className="v3-work__grid">
          {visibleProjects.map((project) => (
            <li key={project.title}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="v3-work__empty">
          <h2 className="v3-h3">I have not built one of these yet.</h2>
          <p className="v3-label v3-work__soon">Coming soon</p>
          <p>
            I can do the work. I have not shipped a {activeLabel.toLowerCase()} project I would put in front of you, so
            there is nothing here. When I have, it goes up with a link you can open.
          </p>
        </div>
      )}

      {/* The films stay mounted (their pin must never be torn out by React);
          they show under "All work" with their heading, alone under AI Video
          Producer, and are hidden on the other discipline tabs. */}
      <div className={showFilmsOnly ? "v3-work__films is-alone" : "v3-work__films"} hidden={!filmsShown}>
        <WorkFilms headless={showFilmsOnly} enabled={filmsShown} />
      </div>
    </div>
  );
}
