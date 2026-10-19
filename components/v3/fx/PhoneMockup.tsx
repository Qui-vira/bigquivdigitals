"use client";

import Image from "next/image";
import { useState } from "react";
import { VIDEO_BASE } from "@/components/ProofFilm";
import type { PhoneVideo } from "@/components/PhoneTile";

/**
 * Phone Mockup (#8 in research/EFFECTS-CATALOGUE.md): a real video in a navy
 * phone frame. The play rules are PhoneTile's, unchanged:
 *
 *   autoPlay  muted, looping, inline, with controls. ONE per page: it is the
 *             only video that downloads before a tap.
 *   default   poster plus a play button. No <video> exists until the tap, so
 *             scrolling past ten phones downloads ten stills and no video.
 *
 * Films that are not 9:16 sit letterboxed (object-contain), never cropped.
 * Without NEXT_PUBLIC_PROOF_VIDEO_BASE the phone shows the poster only.
 * The drift at depth comes from the page (data-parallax on the wrapper).
 */
export function PhoneMockup({
  video,
  autoPlay = false,
  priority = false,
  className = "",
}: {
  video: PhoneVideo;
  autoPlay?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const src = VIDEO_BASE ? `${VIDEO_BASE}/${video.file}` : null;
  const fit = video.vertical ? "v3-phone__media--cover" : "v3-phone__media--contain";

  let screen: React.ReactNode;
  if (src && (autoPlay || playing)) {
    screen = (
      <video
        src={src}
        poster={video.poster}
        autoPlay
        muted={autoPlay}
        loop={autoPlay}
        playsInline
        controls
        preload="auto"
        aria-label={autoPlay ? `${video.title}, playing muted` : video.title}
        className={`v3-phone__media ${fit}`}
      />
    );
  } else {
    const still = (
      <>
        <Image src={video.poster} alt={video.title} fill priority={priority} sizes="(max-width: 640px) 70vw, 300px" className={`v3-phone__media ${fit}`} />
        <span className="v3-phone__play" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
        <span className="v3-phone__time">{video.runtime}</span>
      </>
    );
    screen = src ? (
      <button type="button" className="v3-phone__btn" onClick={() => setPlaying(true)} aria-label={`Play ${video.title}`} data-cursor="Play">
        {still}
      </button>
    ) : (
      still
    );
  }

  return (
    <div className={`v3-phone ${className}`}>
      <div className="v3-phone__screen">{screen}</div>
    </div>
  );
}
