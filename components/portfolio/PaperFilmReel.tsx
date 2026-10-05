"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { VIDEO_BASE, type Film } from "@/components/ProofFilm";
import { FILMS } from "@/lib/films";
import { MonoLabel, PhotoPrint, Sticker, cx } from "@/components/ui-paper";

/**
 * The film reel on /portfolio, on the paper system (redesign 2026-10).
 * Replaces components/FilmReel.tsx, whose rules carry over unchanged:
 *
 * WHY THE FILMS PLAY IN PLACE. A project card is a link; a film is not. The
 * work IS the sixty seconds of video, so anything that sends a visitor to
 * x.com to watch it has lost them. Owner, 2026-09-12: "the reference link i
 * sent actully played the video on his site".
 *
 * ⚠ ORDER IS BRAND RECOGNITION, NOT HIS FAVOURITES. A buyer scans for a name
 * they know before they read a title, which is why `brand` renders above the
 * title and why these six are the six with a recognisable name on them. The
 * four unnamed films stay on /aimastery.
 *
 * ⚠ EVERY BRAND HERE IS UNOFFICIAL EXCEPT PEACEWAY, and each carries that in
 * its own `note` from lib/films.ts. The note renders on every card, in a
 * ruled box, at body contrast. Do not drop or shrink it to tidy the grid.
 *
 * LAYOUT. The six films are three shapes (lib/films.ts `aspect`, off ffprobe).
 * The vertical ones stand in a row of phones; the wide and cinemascope ones
 * hang as prints. Each row keeps the REEL order. Nothing is ever cropped to a
 * shape it was not made in.
 *
 * BEFORE THE CLICK no <video> exists (the ProofFilm rule): a visitor who
 * scrolls past downloads six WebP stills and no video. Without
 * NEXT_PUBLIC_PROOF_VIDEO_BASE the poster degrades to a link to the post.
 */
const REEL = ["lagos", "gucci", "burgerking", "lexus", "mcdonalds", "peaceway"] as const;

/** Single source for the AI Video Producer tab count in PortfolioShowcase. */
export const FILM_COUNT = REEL.length;

const SCREEN_BOX = { wide: "aspect-[1882/1080]", scope: "aspect-[1920/822]", vertical: "aspect-[9/16]" } as const;

function Poster({ film, playing, onPlay }: { film: Film; playing: boolean; onPlay: () => void }) {
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  const box = cx("relative overflow-hidden bg-black", SCREEN_BOX[film.aspect]);

  const still = (
    <>
      <Image
        src={film.img}
        alt={film.title}
        fill
        sizes={film.aspect === "vertical" ? "(max-width: 768px) 70vw, 300px" : "(max-width: 768px) 92vw, 600px"}
        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/film:scale-[1.03]"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center border-[3px] border-ink bg-gold shadow-brutal-sm transition-transform duration-200 ease-out group-hover/film:-translate-y-0.5 group-hover/film:scale-105">
          <Play aria-hidden="true" className="ml-0.5 h-7 w-7 fill-ink text-ink" strokeWidth={2} />
        </span>
      </span>
      <span className="absolute bottom-3 right-3 border-2 border-ink bg-paper px-2 py-0.5 font-typewriter text-[12px] font-bold text-ink">
        {film.runtime}
      </span>
    </>
  );

  if (playing && src) {
    return (
      <div className={box}>
        <video src={src} poster={film.img} controls autoPlay playsInline preload="auto" className="absolute inset-0 h-full w-full object-contain" />
      </div>
    );
  }
  if (src) {
    return (
      <button type="button" onClick={onPlay} aria-label={`Play ${film.title}`} className={cx("group/film block w-full cursor-pointer", box)}>
        {still}
      </button>
    );
  }
  return (
    <a href={film.url} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${film.title}`} className={cx("group/film block", box)}>
      {still}
    </a>
  );
}

function FilmMeta({ film }: { film: Film }) {
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
  return (
    <div className="mt-6 px-1">
      {film.brand && (
        <Sticker shape="label" tone="tint" tilt={-2} decorative={false} reveal={false}>
          {film.brand}
        </Sticker>
      )}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-[1.3rem] font-bold leading-tight tracking-[-0.015em] text-ink">{film.title}</h3>
        {/* Always present, even once the film plays inline: the public post is
            the one thing on the card a stranger can verify. */}
        <a
          href={film.url}
          target="_blank"
          rel="noopener noreferrer"
          className="paper-link inline-flex min-h-[44px] shrink-0 items-center font-typewriter text-[13px] font-bold text-ink underline decoration-2 underline-offset-4"
        >
          {src ? "See the post →" : "Watch it →"}
        </a>
      </div>
      <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">{film.line}</p>
      {film.note && (
        <p className="mt-4 border-2 border-dashed border-ink/60 px-3 py-2 font-typewriter text-[13px] leading-snug text-ink-soft">
          {film.note}
        </p>
      )}
    </div>
  );
}

function PhoneFilm({ film, tilt }: { film: Film; tilt: number }) {
  const [playing, setPlaying] = useState(false);
  return (
    <li className="mx-auto w-full max-w-[300px]">
      {/* The phone is an object on the page (a dark bezel is allowed; the
          page never is). Gold hard shadow so it reads on white. */}
      <div
        className="rounded-[2.4rem] border-[3px] border-ink bg-ink p-2.5 [filter:drop-shadow(8px_8px_0_#E8A33D)] transition-[rotate] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [rotate:var(--tilt)] hover:[rotate:0deg]"
        style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}
      >
        <div className="relative overflow-hidden rounded-[1.85rem]">
          <Poster film={film} playing={playing} onPlay={() => setPlaying(true)} />
          {!playing && (
            <span aria-hidden="true" className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
          )}
        </div>
      </div>
      <FilmMeta film={film} />
    </li>
  );
}

const SCREEN_LAYOUT = [
  { tilt: -1.6, attach: "tape" as const },
  { tilt: 1.2, attach: "clip" as const },
  { tilt: -0.8, attach: "tape-corners" as const },
];

function ScreenFilm({ film, i }: { film: Film; i: number }) {
  const [playing, setPlaying] = useState(false);
  const l = SCREEN_LAYOUT[i % SCREEN_LAYOUT.length];
  return (
    <li>
      <PhotoPrint tilt={playing ? 0 : l.tilt} attach={l.attach} mat="thin" delay={i * 80}>
        <Poster film={film} playing={playing} onPlay={() => setPlaying(true)} />
      </PhotoPrint>
      <FilmMeta film={film} />
    </li>
  );
}

/**
 * `headless` drops the heading block. The AI Video Producer filter tab already
 * names the discipline above the grid, so repeating it there reads as a bug.
 */
export function PaperFilmReel({ headless = false }: { headless?: boolean }) {
  const films = REEL.map((k) => FILMS[k]);
  const phones = films.filter((f) => f.aspect === "vertical");
  const screens = films.filter((f) => f.aspect !== "vertical");

  return (
    <div>
      {!headless && (
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <MonoLabel as="p" tone="gold-deep">
              AI Video Producer
            </MonoLabel>
            <h2 className="mt-4 max-w-[16ch] font-didone text-[clamp(2.6rem,5.6vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.01em] text-ink text-balance">
              Six films. Press play on any of them.
            </h2>
          </div>
          <p className="max-w-[420px] text-base leading-relaxed text-ink-soft">
            Made on a laptop, start to finish. Nothing here was commissioned except the pharmacy, and that one was my
            father&rsquo;s brief.
          </p>
        </div>
      )}

      <ul className={cx("grid items-start gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3", !headless && "mt-16")}>
        {phones.map((f, i) => (
          <PhoneFilm key={f.file} film={f} tilt={[-2.5, 1.8, -1.2][i % 3]} />
        ))}
      </ul>

      <ul className="mt-20 grid items-start gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        {screens.map((f, i) => (
          <ScreenFilm key={f.file} film={f} i={i} />
        ))}
      </ul>
    </div>
  );
}
