"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_BASE, type Film } from "@/components/ProofFilm";
import { FILMS } from "@/lib/films";
import { HorizontalScroll } from "@/components/v3/fx/HorizontalScroll";

/**
 * The six films on /portfolio, v3 (replaces PaperFilmReel on this page; the
 * rules carry over unchanged):
 *
 * WHY THE FILMS PLAY IN PLACE. A film is not a link. The work IS the video, so
 * anything that sends a visitor to x.com to watch it has lost them. Owner,
 * 2026-09-12: "the reference link i sent actully played the video on his site".
 *
 * ⚠ ORDER IS BRAND RECOGNITION. A buyer scans for a name they know first, which
 * is why `brand` renders above the title.
 *
 * ⚠ EVERY BRAND HERE IS UNOFFICIAL EXCEPT PEACEWAY, and each carries that in
 * its own `note` from lib/films.ts. The note renders on every card at body
 * contrast. Do not drop or shrink it.
 *
 * Nothing is cropped to a shape it was not made in: each poster keeps its own
 * aspect (lib/films.ts `aspect`). BEFORE THE CLICK no <video> exists; without
 * NEXT_PUBLIC_PROOF_VIDEO_BASE the poster degrades to a link to the post.
 *
 * Motion: a horizontal pinned scroll (#38) on wide screens; a plain grid on
 * phones and under reduced motion.
 */
const REEL = ["lagos", "gucci", "burgerking", "lexus", "mcdonalds", "peaceway"] as const;

/** Single source for the AI Video Producer tab count. */
export const FILM_COUNT = REEL.length;

const RATIO = { wide: "1882 / 1080", scope: "1920 / 822", vertical: "9 / 16" } as const;

function Poster({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false);
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  const style = { aspectRatio: RATIO[film.aspect] };

  const still = (
    <>
      <Image
        src={film.img}
        alt={film.title}
        fill
        sizes={film.aspect === "vertical" ? "(max-width: 900px) 70vw, 320px" : "(max-width: 900px) 92vw, 760px"}
        className="v3-film__img"
      />
      <span className="v3-film__play" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M6.5 4.5v11l9-5.5z" fill="currentColor" />
        </svg>
        {film.runtime}
      </span>
    </>
  );

  if (playing && src) {
    return (
      <div className="v3-film__screen" style={style}>
        <video src={src} poster={film.img} controls autoPlay playsInline preload="auto" />
      </div>
    );
  }
  if (src) {
    return (
      <button type="button" onClick={() => setPlaying(true)} aria-label={`Play ${film.title}`} className="v3-film__screen" style={style} data-cursor="Play">
        {still}
      </button>
    );
  }
  return (
    <a href={film.url} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${film.title}`} className="v3-film__screen" style={style} data-cursor="Play">
      {still}
    </a>
  );
}

function FilmCard({ film }: { film: Film }) {
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  return (
    <article className={`v3-film v3-film--${film.aspect}`}>
      <Poster film={film} />
      <div className="v3-film__meta">
        {film.brand && <p className="v3-film__brand">{film.brand}</p>}
        <h3 className="v3-film__title">{film.title}</h3>
        {/* Always present, even once the film plays inline: the public post is
            the one thing on the card a stranger can verify. */}
        <a href={film.url} target="_blank" rel="noopener noreferrer" className="v3-film__post">
          {src ? "See the post →" : "Watch it →"}
        </a>
        <p className="v3-film__line">{film.line}</p>
        {film.note && <p className="v3-film__note">{film.note}</p>}
      </div>
    </article>
  );
}

/** `headless` drops the heading (the AI Video Producer tab already names it). */
export function WorkFilms({ headless = false, enabled = true }: { headless?: boolean; enabled?: boolean }) {
  const films = REEL.map((k) => FILMS[k]);
  return (
    <HorizontalScroll
      enabled={enabled}
      className="v3-films"
      label="Six films"
      head={
        headless ? null : (
          <div className="v3-films__head">
            <h2 className="v3-h2 v3-display">Six films. Press play on any of them.</h2>
            <p className="v3-label v3-films__tag">AI Video Producer</p>
            <p className="v3-lede">
              Made on a laptop, start to finish. Nothing here was commissioned except the pharmacy, and that one was my
              father&rsquo;s brief.
            </p>
          </div>
        )
      }
    >
      {films.map((f) => (
        <FilmCard key={f.file} film={f} />
      ))}
    </HorizontalScroll>
  );
}
