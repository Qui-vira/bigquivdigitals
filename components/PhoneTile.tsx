"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_BASE } from "@/components/ProofFilm";
import { PhoneFrame } from "@/components/ui-paper/PhoneFrame";

/**
 * A video in a vertical phone frame, for /ugc. Built 2026-10-04 off the class
 * UGC portfolios (Toni's Canva template, Elle's deck, Iman's site): every one
 * shows each video inside a phone, with the client and the brief under it.
 * Restyled 2026-10-05 onto the paper system's PhoneFrame; the play logic
 * below is unchanged.
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

export function PhoneTile({
  video,
  autoPlay = false,
  label,
  tilt = 0,
  delay = 0,
  className,
}: {
  video: PhoneVideo;
  autoPlay?: boolean;
  /** Typewriter caption under the phone. */
  label?: React.ReactNode;
  tilt?: number;
  delay?: number;
  className?: string;
}) {
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
          sizes="(max-width: 640px) 80vw, 300px"
          className={fit}
        />
        {/* Play control: a gold sticker button with a hard ink shadow, the
            same object language as the page. It carries its own frame, so it
            never depends on the poster underneath being dark. */}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid aspect-square w-[27%] max-w-16 place-items-center rounded-full border-[3px] border-ink bg-gold shadow-[4px_4px_0_0_#111111] transition-[scale,translate,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:-translate-x-0.5 group-hover/tile:-translate-y-0.5 group-hover/tile:scale-105 group-hover/tile:shadow-[6px_6px_0_0_#111111] group-active/tile:translate-x-[3px] group-active/tile:translate-y-[3px] group-active/tile:shadow-[0_0_0_0_#111111]">
            <svg viewBox="0 0 24 24" className="ml-[8%] h-[46%] w-[46%] fill-ink" aria-hidden="true">
              <path d="M7 4.5v15l12.5-7.5z" />
            </svg>
          </span>
        </span>
        <span className="absolute bottom-[4%] right-[6%] border-2 border-ink bg-paper px-2 py-0.5 font-typewriter text-[12px] font-bold tabular-nums text-ink">
          {video.runtime}
        </span>
      </>
    );
    screen = src ? (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play ${video.title}`}
        className="group/tile absolute inset-0 block h-full w-full cursor-pointer focus-visible:-outline-offset-[3px]! focus-visible:shadow-[inset_0_0_0_8px_#E8A33D]!"
      >
        {still}
      </button>
    ) : (
      still
    );
  }

  return (
    <PhoneFrame label={label} tilt={tilt} lift="self" delay={delay} className={className}>
      {screen}
    </PhoneFrame>
  );
}
