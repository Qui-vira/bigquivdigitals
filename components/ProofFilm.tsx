"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A proof film card. Poster frame, one line, runtime, and the real work behind it.
 *
 * TWO STATES, and the first one costs nothing.
 *
 * Before the click there is no `<video>` element in the DOM at all. The browser
 * has not opened a connection, sent a range request or read a byte of the file.
 * That is stricter than `preload="none"`, which still resolves the poster
 * attribute and, in several browsers, fetches the first metadata range anyway.
 * A visitor who scrolls past ten films downloads ten WebP stills, about 900KB
 * total, and no video.
 *
 * After the click a `<video autoPlay controls>` mounts with the same poster set,
 * so the frame they were already looking at stays on screen while the file opens
 * instead of flashing to black.
 *
 * ⚠ THE FILMS ARE NOT ALL THE SAME SHAPE. Measured with ffprobe against the
 * archive masters: four are 1080x1920 vertical (Lexus, Lagos, Peaceway, Amara),
 * four are 1920x822 cinemascope, two are 1882x1080. The page used to force all
 * ten into `aspect-[16/9]` with `object-cover`, which showed roughly the middle
 * third of every vertical film and cut about a quarter off each side of the
 * cinemascope ones. Never reintroduce a single fixed aspect here.
 *
 * ⚠ IF `NEXT_PUBLIC_PROOF_VIDEO_BASE` IS UNSET THIS DEGRADES TO A PLAIN LINK,
 * which is exactly what the card was before. That is deliberate. The component
 * ships before the bucket exists, and nothing on the page breaks in the gap. Do
 * not "simplify" the fallback away.
 */

export type FilmAspect = "vertical" | "wide" | "scope";

export type Film = {
  img: string;
  title: string;
  line: string;
  runtime: string;
  url: string;
  /** Filename inside the video bucket. No leading slash. */
  file: string;
  /** Off the real file dimensions, not guessed. */
  aspect: FilmAspect;
  note?: string;
};

/**
 * Base URL of the bucket holding the web encodes, no trailing slash.
 * e.g. https://proof.bigquivdigitals.com
 *
 * Read at module scope because it is a build-time public var — Next inlines it,
 * so there is no runtime lookup and no reason to read it per render.
 */
const VIDEO_BASE = (process.env.NEXT_PUBLIC_PROOF_VIDEO_BASE || "").replace(/\/+$/, "");

/**
 * Vertical films are capped rather than run full bleed. At the 820px content
 * width a true 9:16 box is 1458px tall, which is taller than most phones and
 * pushes the price and the button an entire screen further down the page. The
 * cap keeps a vertical film about the same height as a cinemascope one, so the
 * rhythm of the page survives the mixed shapes.
 */
const BOX: Record<FilmAspect, string> = {
  vertical: "aspect-[9/16] mx-auto w-full max-w-[360px]",
  wide: "aspect-[1882/1080] w-full",
  scope: "aspect-[1920/822] w-full",
};

export function ProofFilm({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false);
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;

  const frame = (
    <div className={`relative overflow-hidden bg-black ${BOX[film.aspect]}`}>
      {playing && src ? (
        <video
          src={src}
          poster={film.img}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <>
          <Image
            src={film.img}
            alt={film.title}
            fill
            sizes="(max-width: 768px) 100vw, 820px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {/* Sits above the still so the play affordance never depends on the
              frame underneath being dark. Several of these open on white. */}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-medium text-white">
            {film.runtime}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="group mt-10 overflow-hidden rounded-2xl border border-border transition-colors hover:border-border-hover">
      {src ? (
        /* A button, not a link. It plays in place and never leaves the page —
           losing a buyer to x.com halfway down a sales page is the whole reason
           the videos are being self-hosted. */
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play ${film.title}`}
          className="block w-full cursor-pointer"
        >
          {frame}
        </button>
      ) : (
        <a href={film.url} target="_blank" rel="noopener noreferrer" className="block">
          {frame}
        </a>
      )}

      <div className="p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-bold text-text-primary">{film.title}</h3>
          {/* Always present, even once the film plays inline. It is the only
              thing on the card a stranger can independently verify: a public
              post, on a public timeline, with a date on it. */}
          <a
            href={film.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm text-accent hover:underline"
          >
            {src ? "See the post →" : "Watch it →"}
          </a>
        </div>
        <p className="mt-2 leading-relaxed text-text-secondary">{film.line}</p>
        {film.note && <p className="mt-3 text-sm text-text-muted">{film.note}</p>}
      </div>
    </div>
  );
}
