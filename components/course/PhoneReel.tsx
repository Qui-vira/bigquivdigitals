"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { VIDEO_BASE, type Film } from "@/components/ProofFilm";
import { FilmCaption } from "./V3Film";

/**
 * Phone Mockup (#8 in research/EFFECTS-CATALOGUE.md): his vertical films in
 * phone frames, drifting at different depths as the section passes. Only the
 * phone nearest the middle of the screen plays, muted and looping, and only
 * on a desktop with motion allowed and data saver off; the rest hold their
 * posters. A tap plays that film in place with sound and controls.
 *
 * Nothing loads video until a phone is the one in the middle, so a phone on
 * mobile data downloads stills only.
 */
export function PhoneReel({ films, className = "" }: { films: Film[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(-1);
  const [playing, setPlaying] = useState(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el || !VIDEO_BASE) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const ok =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !conn?.saveData;
    if (!ok) return;
    const phones = [...el.querySelectorAll<HTMLElement>("[data-phone]")];
    const seen = new Set<HTMLElement>();
    const pick = () => {
      let best = -1;
      let bestD = Infinity;
      const mid = window.innerHeight / 2;
      phones.forEach((p, i) => {
        if (!seen.has(p)) return;
        const r = p.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setPreview(best);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? seen.add(e.target as HTMLElement) : seen.delete(e.target as HTMLElement)));
        pick();
      },
      { threshold: [0, 0.5, 1] }
    );
    phones.forEach((p) => io.observe(p));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(pick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className={`v3-reel ${className}`}>
      {films.map((film, i) => {
        const src = VIDEO_BASE ? `${VIDEO_BASE}/${film.file}` : null;
        return (
          <figure key={film.file} className="v3-reel__item" data-parallax={films.length > 1 ? String([0.05, 0.14, 0.08][i % 3]) : undefined}>
            <div className="v3-phone" data-phone data-tilt>
              <div className="v3-phone__screen">
                {playing === i && src ? (
                  <video src={src} poster={film.img} controls autoPlay playsInline preload="auto" className="v3-film__video" />
                ) : (
                  <>
                    <Image src={film.img} alt={film.title} fill sizes="320px" className="v3-film__img" />
                    {preview === i && src && playing !== i && (
                      <video src={src} poster={film.img} muted loop autoPlay playsInline preload="auto" className="v3-film__video" aria-hidden="true" />
                    )}
                    {src ? (
                      <button type="button" className="v3-film__btn v3-film__btn--over" onClick={() => setPlaying(i)} aria-label={`Play ${film.title}`} data-cursor="Play">
                        <span className="v3-film__play" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                          </svg>
                        </span>
                        <span className="v3-film__time">{film.runtime}</span>
                      </button>
                    ) : (
                      <a href={film.url} target="_blank" rel="noopener noreferrer" className="v3-film__btn v3-film__btn--over" aria-label={`Watch ${film.title} on X`} data-cursor="Play">
                        <span className="v3-film__play" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                          </svg>
                        </span>
                        <span className="v3-film__time">{film.runtime}</span>
                      </a>
                    )}
                  </>
                )}
                <span className="v3-phone__notch" aria-hidden="true" />
              </div>
            </div>
            <FilmCaption film={film} />
          </figure>
        );
      })}
    </div>
  );
}
