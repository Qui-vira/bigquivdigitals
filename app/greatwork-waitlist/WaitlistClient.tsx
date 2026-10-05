"use client";

import Image from "next/image";
import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { OPPORTUNITY_MAP, OPPORTUNITY_MAP_HOW_TO } from "@/lib/opportunity-map";
import {
  BrutalButton,
  HandNote,
  Highlighter,
  MonoLabel,
  PaperSection,
  PhotoPrint,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

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
 *
 * PAPER REDESIGN 2026-10-05: the replies pinned up as prints with the words
 * taped under them, the promises as numbered tickets, the form in a framed
 * card. Copy, order and the signup flow are unchanged.
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

const REPLY_TILT = [-2.4, 1.8, -1.2];
const PROMISE_TONE = ["bg-paper", "bg-gold-tint", "bg-paper", "bg-gold"];
const PROMISE_TILT = [-1, 1.2, 0.8, -1.4];

export function WaitlistClient({ roomUrl }: { roomUrl: string | null }) {
  const [joined, setJoined] = useState(false);

  // The form sits at the bottom of a long pitch. When the signup lands the
  // pitch is swapped for the Opportunity Map, so bring the visitor to the top
  // of it and move focus to its heading, rather than leaving them mid-page.
  function onJoined() {
    setJoined(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("gww-unlocked")?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {joined ? <Unlocked roomUrl={roomUrl} /> : <Pitch onJoined={onJoined} />}
    </div>
  );
}

function Pitch({ onJoined }: { onJoined: () => void }) {
  return (
    <>
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        aria-labelledby="gww-title"
        innerClassName="pb-16 pt-[calc(4rem+2.75rem)] md:pb-24 md:pt-[calc(4.5rem+4rem)]"
      >
        <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
          The Great Work
        </Sticker>
        <h1
          id="gww-title"
          className="load-drop mt-7 max-w-[16ch] font-didone text-[clamp(3.1rem,9.4vw,6.6rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance"
        >
          You already have the skill. <Highlighter load delay={500}>Nobody showed you where the money is.</Highlighter>
        </h1>

        <p className="mt-9 max-w-[52ch] text-lg leading-relaxed text-ink-soft md:text-xl">
          On day one I asked one question. What skill do you have that is not paying you yet? This is some of what came
          back.
        </p>

        {/* Cropped to the bottom of each screenshot on purpose: in all three the
            reply that matters is the newest message, and the top of the frame is
            only a pixelated header. The verbatim words are taped under each. */}
        <ul className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-3">
          {REPLIES.map((r, i) => (
            <li key={r.src} className={cx(i === 1 && "md:mt-12", i === 2 && "md:mt-4")}>
              <figure className="m-0">
                <PhotoPrint
                  tilt={REPLY_TILT[i]}
                  attach={i === 1 ? "clip" : "pin"}
                  mat="even"
                  lift="self"
                  delay={i * 90}
                  className="mx-auto max-w-[340px]"
                >
                  <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={r.src}
                      alt={r.alt}
                      fill
                      sizes="(min-width: 768px) 30vw, 340px"
                      className="object-cover object-bottom"
                    />
                  </div>
                </PhotoPrint>
                <figcaption className="relative mx-auto mt-8 max-w-[340px] border-[3px] border-ink bg-gold-tint px-5 pb-5 pt-6 shadow-brutal-sm [rotate:0.8deg]">
                  <Tape className="-top-3.5 left-6" tilt={-6} width={72} />
                  <p className="font-didone text-[1.55rem] font-medium leading-[1.15] text-ink">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div className="mt-20 max-w-[60ch]">
          <p className="text-lg leading-relaxed text-ink-soft">
            Different people. Different skills. The same thing underneath every one of them. Nobody ever showed them where
            the money actually comes from.
          </p>
          <p className="mt-5 font-display text-[1.3rem] font-bold leading-snug tracking-[-0.01em] text-ink">
            So that is what I am building, and I am building it with those people in the room. This is the room.
          </p>
        </div>
      </PaperSection>

      {/* ── The offer ─────────────────────────────────────────────────────── */}
      <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="gww-offer">
        <h2
          id="gww-offer"
          className="max-w-[20ch] font-didone text-[clamp(2.4rem,5.4vw,4.2rem)] font-semibold leading-[0.98] tracking-[-0.005em] text-ink text-balance"
        >
          A small private list. Three things come with it.
        </h2>

        {/* Numbered tickets. These are the argument for joining today, so they
            settle on one at a time and the eye reads them in order. */}
        <ol className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2">
          {PROMISES.map((p, i) => (
            <li
              key={p.title}
              className={cx("relative border-[3px] border-ink p-6 pl-20 shadow-brutal sm:p-8 sm:pl-24", PROMISE_TONE[i])}
              style={{ rotate: `${PROMISE_TILT[i]}deg` }}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "absolute left-5 top-6 grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink font-didone text-[1.6rem] font-semibold leading-none text-ink shadow-brutal-sm sm:left-7 sm:top-8 sm:h-12 sm:w-12",
                  i === 3 ? "bg-paper" : "bg-gold"
                )}
              >
                {i + 1}
              </span>
              <h3 className="font-display text-[1.3rem] font-bold tracking-[-0.01em] text-ink">{p.title}</h3>
              <p className={cx("mt-2 leading-relaxed", i === 3 ? "text-ink" : "text-ink-soft")}>{p.body}</p>
            </li>
          ))}
        </ol>

        <div id="join" className="relative mt-20 max-w-[720px] border-[3px] border-ink bg-paper p-6 pt-10 shadow-brutal-lg sm:p-10 sm:pt-12">
          <Tape className="-top-3.5 left-10" tilt={-4} />
          <HandNote arrow="down-left" arrowAt="above" tilt={-4} className="absolute -top-24 right-6 hidden lg:inline-flex" arrowClassName="ml-12 !w-[64px]">
            your email goes here
          </HandNote>
          <WaitlistForm source="waitlist-page" onSuccess={onJoined} />
          <MonoLabel as="p" caps={false} tone="soft" className="mt-5 text-[14px] leading-relaxed">
            Email only. No spam, and you can leave whenever you want. The room opens on the next screen.
          </MonoLabel>
        </div>
      </PaperSection>
    </>
  );
}

function Unlocked({ roomUrl }: { roomUrl: string | null }) {
  return (
    <PaperSection
      ground="grid"
      pad="none"
      width="mid"
      aria-labelledby="gww-unlocked"
      innerClassName="pb-24 pt-[calc(4rem+2.75rem)] md:pt-[calc(4.5rem+4rem)]"
    >
      {/* This is the one moment on the site where something just happened
          because of the visitor, so the confirmation lands as a stamp. */}
      <Sticker shape="label" tone="gold" tilt={-3} decorative={false} reveal={false} className="load-settle">
        You are on the list
      </Sticker>

      <h1
        id="gww-unlocked"
        tabIndex={-1}
        className="load-drop mt-7 font-didone text-[clamp(2.9rem,7.4vw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.01em] text-ink text-balance outline-none"
      >
        Here is the first thing, right now.
      </h1>

      <p className="mt-8 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
        The Opportunity Map. It is an interview that finds the one skill you should already be getting paid for,
        including the one you keep dismissing because it comes easy to you.
      </p>

      <ol className="mt-9 space-y-3">
        {OPPORTUNITY_MAP_HOW_TO.map((step, i) => (
          <li key={step} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-2 leading-relaxed text-ink-soft">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center border-2 border-ink bg-gold font-typewriter text-sm font-bold text-ink"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {roomUrl ? <Room url={roomUrl} /> : null}

      <CopyBlock />

      <p className="mt-14 max-w-[60ch] border-t-[3px] border-ink pt-8 leading-relaxed text-ink-soft">
        Run it, then send me what it said. I read every one, and the answers are what this is being built from.
      </p>
    </PaperSection>
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
    <div className="relative mt-14 border-[3px] border-ink bg-gold-tint p-6 pt-9 shadow-brutal [rotate:-0.6deg] sm:p-8 sm:pt-10">
      <Tape className="-top-3.5 right-10" tilt={5} />
      <h2 className="font-display text-[1.4rem] font-bold tracking-[-0.01em] text-ink">One more thing. Come into the room.</h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Everything lands there first. Updates before they go public, the parts I am still figuring out, and launch day
        before anyone outside hears about it.
      </p>
      <p className="mt-3 leading-relaxed text-ink-soft">It is not a chat. I post, you read. No two hundred notifications a day.</p>
      <div className="mt-6">
        <BrutalButton href={url} newTab>
          Join the room on WhatsApp
        </BrutalButton>
      </div>
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
    <div className="mt-14">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <BrutalButton onClick={copy} arrow={false} variant={copied ? "paper" : "gold"}>
          {copied ? "Copied" : "Copy the whole prompt"}
        </BrutalButton>
        <span role="status" aria-live="polite" className="font-typewriter text-[14px] font-bold text-ink">
          {copied ? "Now paste it into any AI chat." : ""}
        </span>
      </div>

      {/* Scrolls inside itself rather than making the page enormous. Kept fully
          selectable so a blocked clipboard is never a dead end. Set like a typed
          sheet. */}
      <pre className="mt-7 max-h-[420px] overflow-auto whitespace-pre-wrap break-words border-[3px] border-ink bg-paper p-5 font-typewriter text-[14px] leading-relaxed text-ink shadow-brutal sm:p-7">
        {OPPORTUNITY_MAP}
      </pre>
    </div>
  );
}
