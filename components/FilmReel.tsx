import { ProofFilm } from "@/components/ProofFilm";
import { FILMS } from "@/lib/films";

/**
 * The film reel on /portfolio.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE PROJECT CARDS. A project card is a link:
 * you read it, you click out to a repository, you judge the work somewhere
 * else. A film is not like that. The work IS the sixty seconds of video, so
 * anything that sends a visitor to x.com to watch it has lost them — they land
 * on a timeline with a thousand other things on it and they do not come back.
 *
 * So the reel plays in place. Owner, 2026-09-12, on the reference site he
 * picked: "the reference link i sent actully played the video on his site".
 *
 * ⚠ ORDER IS BRAND RECOGNITION, NOT HIS FAVOURITES. A buyer scans for a name
 * they know before they read a title, which is why `brand` renders above the
 * title and why these six are the six with a recognisable name on them. The
 * four unnamed films (Chike, Third Mainland Bridge, Titan, Amara) are stronger
 * work and stay on /aimastery, where the argument is craft rather than clients.
 *
 * ⚠ EVERY BRAND HERE IS UNOFFICIAL EXCEPT PEACEWAY, and each carries that in
 * its own `note` from lib/films.ts. Do not drop the notes to tidy the grid up.
 * A recognisable logo with no disclaimer beside it is a claim of client work.
 */
const REEL = ["lagos", "gucci", "burgerking", "lexus", "mcdonalds", "peaceway"] as const;

export function FilmReel() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            AI Video Producer
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
            Six films. Press play on any of them.
          </h2>
        </div>
        <p className="max-w-[420px] text-sm leading-relaxed text-text-muted">
          Made on a laptop, start to finish. Nothing here was commissioned except the pharmacy,
          and that one was my father&rsquo;s brief.
        </p>
      </div>

      {/*
        Three columns at desktop. The films are mixed shapes — two vertical, two
        cinemascope, two wide — and `items-start` lets each keep its own height
        instead of stretching the short ones to match the tall ones, which is
        what made the earlier fixed-ratio version crop the verticals.
      */}
      <div className="mt-12 grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REEL.map((key) => (
          <ProofFilm key={key} film={FILMS[key]} inGrid />
        ))}
      </div>
    </div>
  );
}
