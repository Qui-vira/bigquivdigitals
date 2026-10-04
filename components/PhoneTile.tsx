"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_BASE } from "@/components/ProofFilm";

/**
 * A video in a vertical phone frame, for /ugc. Built 2026-10-04 off the class
 * UGC portfolios (Toni's Canva template, Elle's deck, Iman's site): every one
 * shows each video inside a phone, with the client and the brief under it.
 *
 * TWO MODES.
 *   autoPlay  muted, looping, inline, with controls. Use it on ONE tile per
 *             page: it is the only video that downloads before a tap.
 *   default   poster plus a play button. No <video> element exists until the
 *             tap, the same rule as ProofFilm, so a visitor scrolling past ten
 *             tiles downloads ten stills and no video.
 *
 * Films that are not 9:16 (the wide and cinemascope spec ads) sit letterboxed
 * inside the phone with object-contain. Never object-cover them: that crops a
 * cinemascope frame to its middle third.
 *
 * Without NEXT_PUBLIC_PROOF_VIDEO_BASE the tile shows the poster only.
 */
export type PhoneVideo = {
  file: string;
  poster: string;
  title: string;
  runtime: string;
  vertical: boolean;
};

export function PhoneTile({ video, autoPlay = false }: { video: PhoneVideo; autoPlay?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${video.file}` : null;
  const fit = video.vertical ? "object-cover" : "object-contain";

  let screen: React.ReactNode;
  if (src && autoPlay) {
    screen = (
      <video
        src={src}
        poster={video.poster}
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="auto"
        aria-label={`${video.title}, playing muted`}
        className={`absolute inset-0 h-full w-full ${fit}`}
      />
    );
  } else if (src && playing) {
    screen = (
      <video
        src={src}
        poster={video.poster}
        autoPlay
        controls
        playsInline
        preload="auto"
        className={`absolute inset-0 h-full w-full ${fit}`}
      />
    );
  } else {
    const still = (
      <>
        <Image
          src={video.poster}
          alt={video.title}
          fill
          sizes="(max-width: 640px) 80vw, 320px"
          className={fit}
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-black/75 px-2.5 py-0.5 text-xs font-medium text-white">
          {video.runtime}
        </span>
      </>
    );
    screen = src ? (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play ${video.title}`}
        className="group absolute inset-0 block h-full w-full cursor-pointer"
      >
        {still}
      </button>
    ) : (
      still
    );
  }

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2.4rem] border border-border-hover bg-bg-tertiary p-2.5 shadow-[0_24px_60px_-30px_rgba(232,163,61,0.35)]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.9rem] bg-black">
        {screen}
        {/* The speaker slot. Decorative, and above the video so the frame reads
            as a phone even while it plays. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-2 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-black/70"
        />
      </div>
    </div>
  );
}
