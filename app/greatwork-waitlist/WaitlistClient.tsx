"use client";

import Image from "next/image";
import { useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { OPPORTUNITY_MAP, OPPORTUNITY_MAP_HOW_TO } from "@/lib/opportunity-map";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import "@/components/v3/pages/course.css";
import "@/components/v3/pages/waitlist.css";

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
 * V3 REBUILD 2026-10-19 (comp: GreatWorkWaitlist.dc.html). Form first: the
 * form sits on the navy stage beside the closed book (scenes/book.ts,
 * preset "closed") before any scroll, and again at the close. The promises
 * tick as they pass (#5 checklist). Copy, order and the signup flow are
 * unchanged: both forms post the same source and both hand over to the
 * Opportunity Map.
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

const NOTE = "Email only. No spam, and you can leave whenever you want. The room opens on the next screen.";

export function WaitlistClient({ roomUrl }: { roomUrl: string | null }) {
  const [joined, setJoined] = useState(false);

  // The form sits at the top and again at the close. When the signup lands the
  // pitch is swapped for the Opportunity Map, so bring the visitor to the top
  // of it and move focus to its heading, rather than leaving them mid-page.
  function onJoined() {
    setJoined(true);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("gww-unlocked")?.focus({ preventScroll: true });
    });
  }

  return <div className="v3 v3-course v3-wl-page">{joined ? <Unlocked roomUrl={roomUrl} /> : <Pitch onJoined={onJoined} />}</div>;
}

function Pitch({ onJoined }: { onJoined: () => void }) {
  return (
    <>
      {/* ───────── STAGE: form first, the closed book ───────── */}
      <Stage
        scene="book"
        params={{ preset: "closed", cover: { title: "The Great Work", by: "Big Quiv" } }}
        ground="navy"
        height={420}
        heightPhone={380}
        mark="THE LIST"
        label="The Great Work waitlist"
      >
        <div className="v3-cintro">
          <div className="v3-cintro__main">
            <h1 id="gww-title" className="v3-cintro__h v3-wl-page__h v3-display" data-lift>
              You already have the skill. <span className="mark">Nobody showed you where the money is.</span>
            </h1>
            <div className="v3-wl-page__form" data-intro-rest>
              <p className="v3-hand v3-wl-page__hand" aria-hidden="true">
                your email goes here
              </p>
              <WaitlistForm source="waitlist-page" onSuccess={onJoined} />
              <p className="v3-formnote">{NOTE}</p>
            </div>
          </div>
        </div>

        <h2 className="v3-ghost v3-wl-page__ghost" data-ghost="0.16,0.21,0.37,0.41" data-side="left">
          What skill do you have that is not paying you yet?
        </h2>
        <h2 className="v3-ghost" data-ghost="0.44,0.49,0.63,0.67" data-side="right">
          Different people. Different skills.
        </h2>
        <p className="v3-wl-page__endline v3-display" data-at="0.8,0.85,0.97,1">
          This is the room.
        </p>
        <div className="v3-endcta" data-at="0.82,0.87,0.98,1">
          <a href="#join" className="v3-btn v3-btn--lg">
            Join the waitlist <Arrow />
          </a>
        </div>
      </Stage>

      {/* ───────── THE QUESTION AND THE REPLIES ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" data-panel aria-label="The question and the replies">
        <div className="v3-wrap">
          <p className="v3-wl-page__ask v3-title" data-fade>
            On day one I asked one question. What skill do you have that is not paying you yet? This is some of what came
            back.
          </p>
          {/* Cropped to the bottom of each screenshot on purpose: in all three the
              reply that matters is the newest message, and the top of the frame is
              only a pixelated header. The verbatim words sit under each. */}
          <ul className="v3-wl-page__replies">
            {REPLIES.map((r) => (
              <li key={r.src} data-parallax={r.src.includes("confident") ? "0.08" : undefined}>
                <figure>
                  <div className="v3-wl-page__shot" data-reveal="clip">
                    <Image src={r.src} alt={r.alt} fill sizes="(min-width: 768px) 30vw, 92vw" style={{ objectFit: "cover", objectPosition: "bottom" }} />
                  </div>
                  <figcaption>&ldquo;{r.quote}&rdquo;</figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <div className="v3-wl-page__after">
            <p data-fade>
              Different people. Different skills. The same thing underneath every one of them. Nobody ever showed them where
              the money actually comes from.
            </p>
            <p className="v3-wl-page__after-big v3-title" data-fade>
              So that is what I am building, and I am building it with those people in the room. This is the room.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── WHAT COMES WITH THE LIST: checklist (#5) ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="gww-offer">
        <div className="v3-wrap v3-wl-page__offer">
          <h2 id="gww-offer" className="v3-h2 v3-display" data-split>
            A small private list. Three things come with it.
          </h2>
          {/* These are the argument for joining today, so they tick one at a
              time as the list passes and the eye reads them in order. */}
          <ol className="v3-wl-page__promises" data-checklist>
            {PROMISES.map((p) => (
              <li key={p.title} data-check>
                <h3 className="v3-h3">{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── CLOSE: the form again ───────── */}
      <section id="join" className="v3-section v3-section--navy v3-grain v3-wl-page__close" data-nav="navy" aria-label="Join the waitlist">
        <div className="v3-wrap">
          <p className="v3-wl-page__room v3-display">This is the room.</p>
          <WaitlistForm source="waitlist-page" onSuccess={onJoined} />
          <p className="v3-formnote">{NOTE}</p>
        </div>
      </section>
    </>
  );
}

function Unlocked({ roomUrl }: { roomUrl: string | null }) {
  return (
    <section className="v3-section v3-section--cloud v3-grain v3-wl-page__unlocked" data-nav="cloud" aria-labelledby="gww-unlocked">
      <div className="v3-wrap v3-wl-page__narrow">
        {/* This is the one moment on the site where something just happened
            because of the visitor, so the confirmation leads. */}
        <p className="v3-wl-page__stamp" role="status">
          <span aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 10.5 8.2 14.5 16 5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
            </svg>
          </span>
          You are on the list
        </p>
        <h1 id="gww-unlocked" tabIndex={-1} className="v3-h2 v3-display v3-wl-page__unlocked-h">
          Here is the first thing, right now.
        </h1>
        <p className="v3-lede">
          The Opportunity Map. It is an interview that finds the one skill you should already be getting paid for,
          including the one you keep dismissing because it comes easy to you.
        </p>
        <ol className="v3-wl-page__steps">
          {OPPORTUNITY_MAP_HOW_TO.map((step, i) => (
            <li key={step}>
              <span aria-hidden="true">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {roomUrl ? <Room url={roomUrl} /> : null}

        <CopyBlock />

        <p className="v3-wl-page__last">
          Run it, then send me what it said. I read every one, and the answers are what this is being built from.
        </p>
      </div>
    </section>
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
    <div className="v3-wl-page__roombox">
      <h2 className="v3-h3">One more thing. Come into the room.</h2>
      <p>
        Everything lands there first. Updates before they go public, the parts I am still figuring out, and launch day
        before anyone outside hears about it.
      </p>
      <p>It is not a chat. I post, you read. No two hundred notifications a day.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="v3-btn">
        Join the room on WhatsApp <Arrow />
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
    <div className="v3-wl-page__copy">
      <div className="v3-wl-page__copy-row">
        <button type="button" onClick={copy} className={copied ? "v3-btn v3-btn--navy" : "v3-btn"}>
          {copied ? "Copied" : "Copy the whole prompt"}
        </button>
        <span role="status" aria-live="polite">
          {copied ? "Now paste it into any AI chat." : ""}
        </span>
      </div>

      {/* Scrolls inside itself rather than making the page enormous. Kept fully
          selectable so a blocked clipboard is never a dead end. */}
      <pre className="v3-wl-page__pre">{OPPORTUNITY_MAP}</pre>
    </div>
  );
}
