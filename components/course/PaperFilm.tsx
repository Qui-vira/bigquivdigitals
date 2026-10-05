"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_BASE, type Film } from "@/components/ProofFilm";
import { PhoneFrame } from "@/components/ui-paper/PhoneFrame";
import { Tape, PaperClip } from "@/components/ui-paper/Attachments";
import { useReveal } from "@/components/ui-paper/useReveal";
import { cx } from "@/components/ui-paper/cx";

/**
 * A proof film on paper, for /aimastery. Added 2026-10-05 in the paper
 * redesign, alongside ProofFilm rather than over it, because ProofFilm also
 * renders the portfolio reel (FilmReel) on pages this redesign phase does not
 * own.
 *
 * Behaviour is ProofFilm's, unchanged:
 *   - No <video> element exists until the click. A visitor scrolling past ten
 *     films downloads ten stills and no video.
 *   - After the click a <video autoPlay controls> mounts with the same poster.
 *   - Without NEXT_PUBLIC_PROOF_VIDEO_BASE it degrades to a plain link to the
 *     live post, exactly as ProofFilm does.
 *   - The post link is always present, because a claim a stranger can check
 *     in one click is worth more than any paragraph.
 *
 * Shape follows the file: vertical films go in a phone (the same object as
 * /ugc), wide and cinemascope films go in a taped print. Never crop either to
 * a fixed aspect; ProofFilm's header explains what that cost before.
 */
export function PaperFilm({
  film,
  tilt = 0,
  attach = "tape",
  className,
}: {
  film: Film;
  tilt?: number;
  attach?: "tape" | "clip" | "none";
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const ref = useReveal<HTMLDivElement>();
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  const vertical = film.aspect === "vertical";
  const box = film.aspect === "scope" ? "aspect-[1920/822]" : film.aspect === "wide" ? "aspect-[1882/1080]" : "";

  const still = (
    <>
      <Image
        src={film.img}
        alt={film.title}
        fill
        sizes={vertical ? "300px" : "(max-width: 768px) 100vw, 820px"}
        className="object-cover"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid aspect-square w-[clamp(3rem,22%,4.25rem)] place-items-center rounded-full border-[3px] border-ink bg-gold shadow-[4px_4px_0_0_#111111] transition-[scale,translate,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/film:-translate-x-0.5 group-hover/film:-translate-y-0.5 group-hover/film:scale-105 group-hover/film:shadow-[6px_6px_0_0_#111111]">
          <svg viewBox="0 0 24 24" className="ml-[8%] h-[46%] w-[46%] fill-ink" aria-hidden="true">
            <path d="M7 4.5v15l12.5-7.5z" />
          </svg>
        </span>
      </span>
      <span className="absolute bottom-3 right-3 border-2 border-ink bg-paper px-2 py-0.5 font-typewriter text-[12px] font-bold tabular-nums text-ink">
        {film.runtime}
      </span>
    </>
  );

  const screen =
    playing && src ? (
      <video
        src={src}
        poster={film.img}
        controls
        autoPlay
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full"
      />
    ) : src ? (
      /* A button, not a link: it plays in place and never leaves the page. */
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play ${film.title}`}
        className="group/film absolute inset-0 block h-full w-full cursor-pointer focus-visible:-outline-offset-[3px]! focus-visible:shadow-[inset_0_0_0_8px_#E8A33D]!"
      >
        {still}
      </button>
    ) : (
      <a
        href={film.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch ${film.title} on X`}
        className="group/film absolute inset-0 block focus-visible:-outline-offset-[3px]! focus-visible:shadow-[inset_0_0_0_8px_#E8A33D]!"
      >
        {still}
      </a>
    );

  const caption = (
    <figcaption className={cx("mt-6", vertical ? "mx-auto max-w-[300px]" : "px-1")}>
      {film.brand && (
        <p className="font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-gold-deep">{film.brand}</p>
      )}
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-[1.2rem] font-bold tracking-[-0.01em] text-ink">{film.title}</h3>
        <a
          href={film.url}
          target="_blank"
          rel="noopener noreferrer"
          className="paper-link inline-flex min-h-[36px] shrink-0 items-center font-typewriter text-[13px] font-bold uppercase tracking-[0.06em] text-ink underline decoration-2 underline-offset-4"
        >
          {src ? "See the post →" : "Watch it →"}
        </a>
      </div>
      <p className="mt-2 leading-relaxed text-ink-soft">{film.line}</p>
      {film.note && (
        <p className="mt-3 border-l-0 font-typewriter text-[13px] leading-relaxed text-ink-soft">
          <span className="mr-2 inline-block border-2 border-ink bg-gold-tint px-1.5 font-bold uppercase tracking-[0.06em] text-ink">
            Note
          </span>
          {film.note}
        </p>
      )}
    </figcaption>
  );

  if (vertical) {
    return (
      <figure className={cx("m-0", className)}>
        <PhoneFrame tilt={tilt} lift="self" className="max-w-[300px]">
          {screen}
        </PhoneFrame>
        {caption}
      </figure>
    );
  }

  return (
    <figure className={cx("m-0", className)}>
      <div
        ref={ref}
        className="rv-drop relative border-[3px] border-ink bg-paper p-2 shadow-brutal transition-[rotate,translate,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] hover:-translate-y-1 hover:[rotate:0deg] hover:shadow-brutal-lg sm:p-3"
        style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
      >
        <div className={cx("relative overflow-hidden border-2 border-ink bg-black", box)}>{screen}</div>
        {attach === "tape" && <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-3} />}
        {attach === "clip" && <PaperClip className="-top-7 left-8" />}
      </div>
      {caption}
    </figure>
  );
}
