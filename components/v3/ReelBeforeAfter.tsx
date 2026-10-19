"use client";

import { useEffect, useRef, useState } from "react";
import { BeforeAfter } from "@/components/v3/fx/BeforeAfter";
import { clip, poster } from "@/lib/ugc-challenge";

/**
 * A raw take under its finished reel in a 9:16 Before and After slider (#7),
 * the same seconds on both sides (lib/ugc-challenge.ts BEFORE_AFTER).
 *
 * Both videos load only when the slider nears the viewport, play muted while
 * it is on screen and pause when it leaves; the reel follows the raw take so
 * the two never drift. Reduced motion: the two posters, nothing plays.
 *
 * Sound (owner, 19 Oct 2026): a tap-for-sound button. The sound follows the
 * divider: more raw take on screen, you hear the raw take; more reel, you hear
 * the reel. Only one slider on the page has sound at a time. The clips with
 * audio are the "-snd" files (loudness matched, so switching sides is level).
 */
const SOUND_EVENT = "bq:reel-sound";

export function ReelBeforeAfter({
  before,
  after,
  label,
  beforeLabel = "Raw take",
  afterLabel = "The reel",
  className = "",
}: {
  /** clip names, without extension; the "-snd" file holds the same clip with audio */
  before: string;
  after: string;
  label: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`${before}:${after}`);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [a, b] = Array.from(el.querySelectorAll<HTMLVideoElement>("video"));
    if (!a || !b) return;
    const io = new IntersectionObserver(
      ([e]) => {
        [a, b].forEach((v) => {
          if (e.isIntersecting) {
            if (!v.src && v.dataset.src) v.src = v.dataset.src;
            v.play().catch(() => {});
          } else v.pause();
        });
      },
      { rootMargin: "120px 0px" }
    );
    io.observe(el);
    // a looser limit than for silent clips: re-seeking the reel too often makes its audio stutter
    const sync = window.setInterval(() => {
      if (!a.paused && Math.abs(a.currentTime - b.currentTime) > 0.25) b.currentTime = a.currentTime;
    }, 500);
    return () => {
      io.disconnect();
      window.clearInterval(sync);
    };
  }, []);

  // sound on: volumes follow the divider every frame; another slider turning sound on mutes this one
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const [a, b] = Array.from(el.querySelectorAll<HTMLVideoElement>("video"));
    if (!a || !b) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id.current) setSound(false);
    };
    window.addEventListener(SOUND_EVENT, onOther);
    if (!sound) {
      a.muted = b.muted = true;
      return () => window.removeEventListener(SOUND_EVENT, onOther);
    }
    const frame = el.querySelector<HTMLElement>(".v3-ba");
    const ease = (x: number) => x * x * (3 - 2 * x);
    let raf = 0;
    const tick = () => {
      const split = parseFloat(frame?.style.getPropertyValue("--split") || "50");
      // the raw take fills the frame left of the divider: the further right the divider, the more raw you hear
      const raw = ease(Math.min(1, Math.max(0, (split - 40) / 20)));
      a.volume = raw;
      b.volume = 1 - raw;
      raf = requestAnimationFrame(tick);
    };
    a.muted = b.muted = false;
    if (!a.src && a.dataset.src) a.src = a.dataset.src;
    if (!b.src && b.dataset.src) b.src = b.dataset.src;
    a.play().catch(() => {});
    b.play().catch(() => {});
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(SOUND_EVENT, onOther);
    };
  }, [sound]);

  const toggle = () => {
    const next = !sound;
    if (next) window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: id.current }));
    setSound(next);
  };

  return (
    <div ref={ref} className="v3-reelba">
      <BeforeAfter
        className={`v3-ba--reel ${className}`}
        label={label}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        before={<video data-src={clip(`${before}-snd`)} poster={poster(before)} muted loop playsInline preload="none" />}
        after={<video data-src={clip(`${after}-snd`)} poster={poster(after)} muted loop playsInline preload="none" />}
      />
      <button type="button" className="v3-reelba__sound" aria-pressed={sound} onClick={toggle}>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 8v4h3l4 3.5V4.5L6 8H3z" fill="currentColor" />
          {sound ? (
            <path d="M13 7.2a4 4 0 0 1 0 5.6M15.3 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M13.5 7.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        {sound ? "Sound on" : "Tap for sound"}
      </button>
    </div>
  );
}
