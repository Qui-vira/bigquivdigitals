"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { VIDEO_BASE, type Film } from "@/components/ProofFilm";

/**
 * A proof film in the v3 system, for /aimastery. Behaviour is ProofFilm's and
 * PaperFilm's, unchanged:
 *   - no <video> exists until the click, so scrolling past ten films costs
 *     ten stills and no video;
 *   - the click mounts <video autoPlay controls> with the same poster;
 *   - without NEXT_PUBLIC_PROOF_VIDEO_BASE it is a plain link to the live post;
 *   - the post link is always there, because the claim has to be checkable in
 *     one click.
 *
 * `frame` wraps the screen (the Viewfinder uses it). `showLine={false}` drops
 * the description when the page already shows it (the prompt type-in does).
 */
export const ASPECT: Record<Film["aspect"], string> = {
  vertical: "9 / 16",
  wide: "1882 / 1080",
  scope: "1920 / 822",
};

export function FilmScreen({ film, sizes }: { film: Film; sizes?: string }) {
  const [playing, setPlaying] = useState(false);
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  const still = (
    <>
      <Image src={film.img} alt={film.title} fill sizes={sizes ?? "(max-width: 768px) 92vw, 820px"} className="v3-film__img" />
      <span className="v3-film__play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        </svg>
      </span>
      <span className="v3-film__time">{film.runtime}</span>
    </>
  );
  if (playing && src)
    return <video src={src} poster={film.img} controls autoPlay playsInline preload="auto" className="v3-film__video" />;
  if (src)
    return (
      <button type="button" className="v3-film__btn" onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`} data-cursor="Play">
        {still}
      </button>
    );
  return (
    <a href={film.url} target="_blank" rel="noopener noreferrer" className="v3-film__btn" aria-label={`Watch ${film.title} on X`} data-cursor="Play">
      {still}
    </a>
  );
}

export function FilmCaption({ film, showLine = true }: { film: Film; showLine?: boolean }) {
  return (
    <figcaption className="v3-film__cap">
      {film.brand && <p className="v3-film__brand">{film.brand}</p>}
      <div className="v3-film__row">
        <h3 className="v3-h3">{film.title}</h3>
        <a href={film.url} target="_blank" rel="noopener noreferrer" className="v3-link v3-film__post">
          {VIDEO_BASE ? "See the post →" : "Watch it →"}
        </a>
      </div>
      {showLine && <p className="v3-film__line">{film.line}</p>}
      {film.note && (
        <p className="v3-film__note">
          <span>Note</span> {film.note}
        </p>
      )}
    </figcaption>
  );
}

export function V3Film({
  film,
  showLine = true,
  frame,
  className = "",
  sizes,
}: {
  film: Film;
  showLine?: boolean;
  frame?: (screen: ReactNode) => ReactNode;
  className?: string;
  sizes?: string;
}) {
  const screen = (
    <div className="v3-film__screen" style={{ aspectRatio: ASPECT[film.aspect] }} data-reveal="clip">
      <FilmScreen film={film} sizes={sizes} />
    </div>
  );
  return (
    <figure className={`v3-film v3-film--${film.aspect} ${className}`}>
      {frame ? frame(screen) : screen}
      <FilmCaption film={film} showLine={showLine} />
    </figure>
  );
}
