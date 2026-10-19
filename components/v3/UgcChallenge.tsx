"use client";

import { useEffect, useRef } from "react";
import { ReelBeforeAfter } from "@/components/v3/ReelBeforeAfter";
import { Arrow } from "@/components/v3/Arrow";
import { BEFORE_AFTER, CHALLENGE_DAYS, INSTAGRAM, clip, poster } from "@/lib/ugc-challenge";
import "@/components/v3/pages/ugc-challenge.css";

/**
 * The 30-day UGC challenge (data: lib/ugc-challenge.ts). Home puts it straight
 * after the stage; /ugc carries it too.
 *
 * Two Before and After sliders (#7, ReelBeforeAfter): his raw take under the
 * reel, the same seconds on both sides, playing in step. Then every posted day as
 * a 9:16 card that plays its clip only while it is on screen and opens the
 * reel on Instagram.
 *
 * Videos are muted, inline and preload nothing until they are near the
 * viewport. Reduced motion: posters only, nothing plays.
 */
export function UgcChallenge({ headingId = "ugc-challenge-heading" }: { headingId?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // play each day's clip while it is on screen, pause it when it leaves
    const groups = Array.from(el.querySelectorAll<HTMLElement>("[data-play]"));
    const start = (g: HTMLElement) => {
      const vids = Array.from(g.querySelectorAll<HTMLVideoElement>("video"));
      vids.forEach((v) => {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      });
    };
    const stop = (g: HTMLElement) => g.querySelectorAll<HTMLVideoElement>("video").forEach((v) => v.pause());
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start(e.target as HTMLElement) : stop(e.target as HTMLElement))),
      { rootMargin: "120px 0px" }
    );
    groups.forEach((g) => io.observe(g));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className="v3-ugcc">
      <div className="v3-ugcc__top">
        <div className="v3-ugcc__head">
          <h2 id={headingId} className="v3-h2 v3-display" data-split>
            Raw take on one side. The reel on the other.
          </h2>
          <p className="v3-ugcc__lede" data-fade>
            My 30-day UGC challenge: I film and edit a reel every day, in public. Drag the line and watch the raw take turn into the post.
          </p>
        </div>

        <div className="v3-ugcc__pairs">
          {BEFORE_AFTER.map((p) => (
            <figure key={p.day} className="v3-ugcc__pair" data-fade>
              <ReelBeforeAfter before={p.before} after={p.after} label={`Day ${p.day}: raw take and finished reel`} />
              <figcaption>
                <span className="v3-ugcc__day">Day {p.day}</span> {p.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="v3-ugcc__rail-head">
        <h3 className="v3-h3">Every day so far</h3>
        <a className="v3-link" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
          Follow it on Instagram <Arrow />
        </a>
      </div>
      <ol className="v3-ugcc__rail">
        {CHALLENGE_DAYS.map((d) => {
          const card = (
            <>
              <span className="v3-ugcc__frame" data-play>
                <video data-src={clip(d.file)} poster={poster(d.file)} muted loop playsInline preload="none" />
              </span>
              <span className="v3-ugcc__day">Day {d.day}</span>
              <span className="v3-ugcc__title">{d.title}</span>
            </>
          );
          return (
            <li key={d.day}>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noopener noreferrer" data-cursor="Watch" aria-label={`Day ${d.day}: ${d.title}, on Instagram`}>
                  {card}
                </a>
              ) : (
                <div>{card}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="v3-ugcc__note">Made on my own for the challenge.</p>
    </div>
  );
}
