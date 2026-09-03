"use client";

import Image from "next/image";
import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PopIn, RiseWords, Typewriter } from "@/components/TextMotion";
import { OPPORTUNITY_MAP, OPPORTUNITY_MAP_HOW_TO } from "@/lib/opportunity-map";

/**
 * The waitlist page has one job and carries nothing that competes with it.
 *
 * Three things are load-bearing:
 *
 * 1. It opens on the audience's own words, not on the product. Every quote
 *    below is verbatim from a real reply and is reproduced without a name.
 *    Cleaning up the spelling would make them read as invented, which is the
 *    opposite of what they are here to do. The screenshot is the proof and the
 *    transcription beneath it is the legible version: at phone width the text
 *    inside a screenshot is too small to read, and a screenshot alone is not
 *    reachable by a screen reader.
 * 2. The three promises are the reason to join today rather than later.
 *    "Updates along the way" is not a reason. First access and the founding
 *    price are commitments the owner has made; the Opportunity Map is a thing
 *    that arrives immediately, which is why it is third and why it is the one
 *    the page can actually prove on the spot.
 * 3. The tool is delivered on this page the moment the signup lands, not by
 *    email. Nothing sits between the promise and the thing promised.
 */

/**
 * Verbatim, from day one of the launch. Never paraphrase these.
 *
 * Every name is destroyed by pixelation in the source files, which is
 * irreversible, and that includes the sender's profile photo in the first one.
 * These are private messages; nobody is identifiable and nobody is named.
 */
const REPLIES = [
  {
    quote: "The truth is i don't even know if i have a skill atp",
    src: "/proof/waitlist/reply-no-skill.webp",
    alt: "A direct message reading: The truth is i don't even know if i have a skill atp. The sender's name and photo are pixelated.",
  },
  {
    quote:
      "I'm not confident enough. It's only when I send a design to someone and they appreciate it before I believe it's good",
    src: "/proof/waitlist/reply-not-confident.webp",
    alt: "A WhatsApp message reading: The Graphic Design part is more like I'm not confident enough. It's only when I send a design to someone and they appreciate it before I believe it's good. The sender's name is pixelated.",
  },
  {
    quote: "Where i'll bomb to get prospective projects and clients",
    src: "/proof/waitlist/reply-where-are-clients.webp",
    alt: "A WhatsApp message reading: Where i'll bomb to get prospective projects and clients. The sender's name is pixelated.",
  },
];

const PROMISES = [
  {
    title: "First access",
    body: "The list buys before it opens to anybody else. When the doors are public, the seats are already gone.",
  },
  {
    title: "The founding price",
    body: "What the list pays is the lowest this will ever cost. It does not go up on you later.",
  },
  {
    title: "Launch bonuses",
    body: "Buying at launch comes with extras. The list sees them first.",
  },
  {
    title: "The Opportunity Map, today",
    body: "The tool that finds the skill you are not counting. You get it on this page the second you join, not someday.",
  },
];

export function WaitlistClient({ roomUrl }: { roomUrl: string | null }) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="mx-auto max-w-[720px] px-6 py-20 md:py-28">
      {joined ? <Unlocked roomUrl={roomUrl} /> : <Pitch onJoined={() => setJoined(true)} />}
    </div>
  );
}

function Pitch({ onJoined }: { onJoined: () => void }) {
  return (
    <>
      {/* Types itself out. It is three words at the very top of the page, so
          it finishes long before anyone has finished reading the headline. */}
      <Typewriter
        as="p"
        text="The Great Work"
        speed={65}
        className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
      />

      <RiseWords
        as="h1"
        className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary md:text-6xl"
        stagger={0.035}
        delay={0.25}
      >
        You already have the skill. Nobody showed you where the money is.
      </RiseWords>

      <p className="mt-7 text-lg leading-relaxed text-text-secondary">
        On day one I asked one question. What skill do you have that is not
        paying you yet? This is some of what came back.
      </p>

      {/* Cropped to the bottom of each screenshot on purpose: in all three the
          reply that matters is the newest message, and the top of the frame is
          only a pixelated header. */}
      <ul className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
        {REPLIES.map((r) => (
          <li key={r.src}>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-bg-secondary">
              <Image
                src={r.src}
                alt={r.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover object-bottom"
              />
            </div>
            <p className="mt-4 border-l-2 border-accent/50 py-1 pl-4 text-base leading-relaxed text-text-primary">
              <span className="text-text-muted">&ldquo;</span>
              {r.quote}
              <span className="text-text-muted">&rdquo;</span>
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-lg leading-relaxed text-text-secondary">
        Different people. Different skills. The same thing underneath every one
        of them. Nobody ever showed them where the money actually comes from.
      </p>

      <p className="mt-4 text-lg leading-relaxed text-text-secondary">
        So that is what I am building, and I am building it with those people in
        the room. This is the room.
      </p>

      {/* ── The offer ─────────────────────────────────────────────────────── */}
      <div className="mt-14 border-t border-border pt-12">
        <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
          A small private list. Three things come with it.
        </h2>

        {/* Staggered pop. These three are the argument for joining today, so
            they arrive one at a time rather than as a block, which makes the
            eye read them in order instead of scanning past. */}
        <ol className="mt-8 space-y-7">
          {PROMISES.map((p, i) => (
            <PopIn key={p.title} as="li" delay={i * 0.12} className="flex gap-5">
              <span
                aria-hidden
                className="mt-0.5 shrink-0 font-display text-2xl font-bold leading-none text-accent"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {p.title}
                </h3>
                <p className="mt-1.5 leading-relaxed text-text-secondary">
                  {p.body}
                </p>
              </div>
            </PopIn>
          ))}
        </ol>

        <div className="mt-12">
          <WaitlistForm source="waitlist-page" onSuccess={onJoined} />
          <p className="mt-4 text-sm text-text-muted">
            Email only. No spam, and you can leave whenever you want. The room opens
            on the next screen.
          </p>
        </div>
      </div>
    </>
  );
}

function Unlocked({ roomUrl }: { roomUrl: string | null }) {
  return (
    <>
      {/* The confirmation types out. This is the one moment on the site where
          something just happened because of the visitor, so it is worth the
          half second of theatre. */}
      <Typewriter
        as="p"
        text="You are on the list"
        speed={55}
        className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
      />

      <RiseWords
        as="h1"
        className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-text-primary md:text-5xl"
        delay={0.4}
      >
        Here is the first thing, right now.
      </RiseWords>

      <p className="mt-7 text-lg leading-relaxed text-text-secondary">
        The Opportunity Map. It is an interview that finds the one skill you
        should already be getting paid for, including the one you keep
        dismissing because it comes easy to you.
      </p>

      <ol className="mt-8 space-y-2.5">
        {OPPORTUNITY_MAP_HOW_TO.map((step, i) => (
          <li key={step} className="flex gap-4 leading-relaxed text-text-secondary">
            <span aria-hidden className="shrink-0 font-semibold text-accent">
              {i + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {roomUrl ? <Room url={roomUrl} /> : null}

      <CopyBlock />

      <p className="mt-12 border-t border-border pt-10 leading-relaxed text-text-secondary">
        Run it, then send me what it said. I read every one, and the answers are
        what this is being built from.
      </p>
    </>
  );
}

/**
 * The room.
 *
 * Sits here rather than on the pitch, because the email is the thing the
 * business owns and a group can be lost overnight — so the durable capture
 * happens first and the room is what they walk into afterwards, at the moment
 * they are most willing to act.
 *
 * Deliberately NOT sold as a fourth promise on the pitch. Three promises is the
 * offer; this is the destination.
 *
 * THE ROOM IS LOCKED — announcements only, owner posts, members read. Copy here
 * must match that, and it is written to sell the lock rather than apologise for
 * it: the single biggest reason people refuse a WhatsApp group is the fear of
 * 200 notifications a day, so "I post, you read" removes the main objection
 * instead of creating one.
 *
 * It also means nothing here may invite a reply. An earlier draft asked people
 * to post their Opportunity Map result in the room, which is impossible in a
 * locked group and would have read as broken the moment they tried.
 */
function Room({ url }: { url: string }) {
  return (
    <div className="mt-10 rounded-lg border border-accent/30 bg-bg-secondary p-6">
      <h2 className="font-display text-xl font-bold tracking-tight text-text-primary">
        One more thing. Come into the room.
      </h2>
      <p className="mt-2 leading-relaxed text-text-secondary">
        Everything lands there first. Updates before they go public, the parts I
        am still figuring out, and launch day before anyone outside hears about
        it.
      </p>
      <p className="mt-3 leading-relaxed text-text-secondary">
        It is not a chat. I post, you read. No two hundred notifications a day.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="cta-emphasis group mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-base font-semibold tracking-wide text-[#0A0806] transition-colors hover:bg-accent-hover"
        data-variant="primary"
      >
        <span className="relative z-10">Join the room on WhatsApp</span>
      </a>
    </div>
  );
}

function CopyBlock() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(OPPORTUNITY_MAP);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked, denied, or no secure context. The text is on the
      // page and selectable, so there is still a way through; saying nothing
      // and leaving the button reading "Copy" is the honest state.
      setCopied(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer rounded-lg bg-accent px-7 py-3.5 text-base font-semibold tracking-wide text-[#0A0806] transition-colors hover:bg-accent-hover"
        >
          {copied ? "Copied" : "Copy the whole prompt"}
        </button>
        <span
          role="status"
          aria-live="polite"
          className="text-sm text-text-secondary"
        >
          {copied ? "Now paste it into any AI chat." : ""}
        </span>
      </div>

      {/* Scrolls inside itself rather than making the page enormous. Kept fully
          selectable so a blocked clipboard is never a dead end. */}
      <pre className="mt-6 max-h-[420px] overflow-auto rounded-lg border border-border bg-bg-secondary p-5 text-sm leading-relaxed whitespace-pre-wrap break-words text-text-secondary">
        {OPPORTUNITY_MAP}
      </pre>
    </div>
  );
}
