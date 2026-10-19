import type { Metadata } from "next";
import Image from "next/image";
import type { PhoneVideo } from "@/components/PhoneTile";
import { FILMS } from "@/lib/films";
import { Stage } from "@/components/v3/stage/Stage";
import { Arrow } from "@/components/v3/Arrow";
import { PhoneMockup } from "@/components/v3/fx/PhoneMockup";
import { Viewfinder } from "@/components/v3/fx/Viewfinder";
import { UgcChallenge } from "@/components/v3/UgcChallenge";
import "@/components/v3/pages/ugc.css";

/**
 * /ugc — the UGC portfolio. Approved by the owner 2026-10-04: "Build it now".
 *
 * Layout follows the class UGC portfolios reviewed on 2026-10-04 (Toni's
 * Canva template, Elle's deck, Iman's Canva site): open on the face, every
 * video in a phone frame grouped by category with "Client:" and "Brief:"
 * under it, real reach numbers, end on contact.
 *
 * v3 REBUILD 2026-10-19 (comp: UGC.dc.html). A navy stage with the hand-held
 * phone (scene "phone", Builder C's object, given the VestaScan poster), then
 * about, the showreel in a Viewfinder (#34) (the Look Swap is out until real clips exist),
 * every video in a Phone Mockup (#8) drifting at depth, reach with odometers,
 * the services, the checklist, and a navy close. The paper-system notes below
 * are history; the rules marked with a warning sign still hold.
 *
 * REDESIGN 2026-10-05 (paper system, phase 2). This is the most Elle-like page
 * on the site, on purpose: a cover with the portrait as a print and the big
 * condensed "UGC PORTFOLIO", an about spread, a sticker wall for who hired
 * him, phones for every video, stamps for reach, a typed list, a ruled note,
 * and a big contact statement. Every fact, label and number below is the
 * owner's and is unchanged. The only new words are pen notes and sticker
 * labels, and none of them states a fact.
 *
 * ⚠ NOT IN THE NAV, ON PURPOSE. Linked from his bios and pitches only. Do not
 * add it to components/Navbar.tsx.
 *
 * ⚠ NO PRICES ANYWHERE ON THIS PAGE.
 *
 * ⚠ VESTASCAN IS THE ONLY BRAND THAT HIRED HIM. Every other brand piece says
 * "Spec ad, made on my own" in its Client line. The "Worked with" wall holds
 * the open YOUR BRAND slot and VestaScan, and nothing else: never put a spec
 * brand (Gucci, Burger King, McDonald's, Lexus, Air Peace, Bybit, Anthropic)
 * there. Never name the VestaScan contact, never show the receipt, never state
 * the amount. The company is named because the ad tags them.
 *
 * Reach numbers were read on 4 Oct 2026. Update numbers and REACH_DATE together.
 *
 * Videos: only the showreel phone autoplays (muted). Every other phone mounts
 * no <video> until tapped. Web encodes live in the Vercel Blob bucket at
 * NEXT_PUBLIC_PROOF_VIDEO_BASE; new posters in public/proof/ugc.
 */

const DESCRIPTION =
  "Web3 and AI UGC creator. I turn crypto apps and AI tools into short videos people understand in under a minute.";

export const metadata: Metadata = {
  title: "UGC Portfolio | BigQuiv Digitals",
  description: DESCRIPTION,
  alternates: { canonical: "/ugc" },
  openGraph: {
    title: "UGC Portfolio | BigQuiv Digitals",
    description: DESCRIPTION,
    url: "/ugc",
    images: [{ url: "/quivira-hero.webp", width: 1376, height: 768, alt: "Big Quiv" }],
  },
};

const EMAIL = "contact@bigquivdigitals.com";
const WHATSAPP = { display: "+234 706 509 2434", href: "https://wa.me/2347065092434" };

const NICHES = ["Crypto apps", "Wallets", "Exchanges", "AI tools", "Fintech", "Health tech"];

const HANDLES = [
  { platform: "X", handle: "@_Quivira", href: "https://x.com/_Quivira" },
  { platform: "TikTok", handle: "@big_quiv", href: "https://www.tiktok.com/@big_quiv" },
  { platform: "Instagram", handle: "@big_quiv", href: "https://www.instagram.com/big_quiv" },
];

type Work = { video: PhoneVideo; client: string; brief: string };

const fromFilm = (key: keyof typeof FILMS): PhoneVideo => ({
  file: FILMS[key].file,
  poster: FILMS[key].img,
  title: FILMS[key].title,
  runtime: FILMS[key].runtime,
  vertical: FILMS[key].aspect === "vertical",
});

const SPEC = "Spec ad, made on my own";

const VESTASCAN: Work = {
  video: {
    file: "ugc/vestascan.mp4",
    poster: "/proof/ugc/vestascan.jpg",
    title: "VestaScan AI ad",
    runtime: "1:53",
    vertical: true,
  },
  client: "VestaScan",
  brief: "A cinematic AI ad for a Web3 project, with full creative freedom.",
};

const CATEGORIES: Array<{ name: string; items: Work[] }> = [
  {
    name: "Crypto and Web3",
    items: [
      VESTASCAN,
      {
        video: {
          file: "ugc/bybit-ai.mp4",
          poster: "/proof/ugc/bybit-ai.jpg",
          title: "I tested Bybit AI",
          runtime: "1:04",
          vertical: true,
        },
        client: SPEC,
        brief: "Test the AI inside a crypto exchange on screen and show what it says.",
      },
    ],
  },
  {
    name: "AI tools",
    items: [
      {
        video: {
          file: "ugc/claude-class.mp4",
          poster: "/proof/ugc/claude-class.jpg",
          title: "A 5-hour class into a game plan with Claude",
          runtime: "1:30",
          vertical: true,
        },
        client: SPEC,
        brief: "Turn a 5-hour class into a game plan with 3 prompts.",
      },
    ],
  },
  {
    name: "Health",
    items: [
      {
        video: fromFilm("peaceway"),
        client: "Peaceway, my dad's pharmacy",
        brief: "My dad asked me to make an ad for his pharmacy, so I did.",
      },
    ],
  },
  {
    name: "AI ad films",
    items: [
      { video: fromFilm("lagos"), client: SPEC, brief: "Follow one man from a Lagos street to a cockpit." },
      { video: fromFilm("gucci"), client: SPEC, brief: "Leather becomes liquid gold, then glass, then birds." },
      { video: fromFilm("burgerking"), client: SPEC, brief: "A burger locked in a vault like a diamond, then stolen." },
      { video: fromFilm("lexus"), client: SPEC, brief: "A luxury car ad that looks like a budget nobody gave me." },
    ],
  },
];

const ABOUT = [
  "I make short videos for TikTok, Instagram Reels and X that show your product working on screen, with my face beside it.",
  "I specialise in app walkthroughs, problem and solution videos, and AI-generated ad films.",
  "I write, film and edit every video myself.",
];

/** Read live on 4 Oct 2026. Keep REACH_DATE in step with the numbers. */
const REACH_DATE = "4 Oct 2026";
const REACH = [
  { platform: "X", handle: "@_Quivira", main: "42.6K", mainLabel: "followers", sub: "1,750 median views on latest posts" },
  { platform: "TikTok", handle: "@big_quiv", main: "4,896", mainLabel: "followers", sub: "3.5% engagement" },
  { platform: "Instagram", handle: "@big_quiv", main: "2,996", mainLabel: "followers", sub: "7.0% engagement" },
  { platform: "Telegram", handle: "Big_Quiv Alpha plays", main: "3,485", mainLabel: "subscribers", sub: null },
];

const SERVICES = [
  "UGC videos for your channels and ads",
  "App walkthroughs and tutorials",
  "Problem and solution videos",
  "Testimonial-style reviews",
  "AI-generated ad films",
  "Hook variations for ad testing",
  "Spark and partnership ad codes",
  "Raw footage on request",
];

const GOOD_TO_KNOW = [
  "Videos are delivered in 9:16 unless the brief says otherwise.",
  "Length follows the brief.",
  "2 rounds of revisions included. Extra rounds are billed.",
  "Delivery in 3 to 4 working days after the brief and payment.",
  "Paid ad use is priced separately.",
  "Full terms come with every quote.",
];

function EmailLink({ className = "" }: { className?: string }) {
  return (
    <a href={`mailto:${EMAIL}`} className={`v3-ugc-email ${className}`}>
      {EMAIL}
    </a>
  );
}

function WhatsAppLink({ className = "" }: { className?: string }) {
  return (
    <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className={`v3-ugc-wa ${className}`}>
      {WHATSAPP.display}
    </a>
  );
}

/**
 * The stage phone's poses for this page's beats (Builder C's phone scene takes
 * them as params): held in the hand for the hero; tipped towards you on the
 * left for the paid ad; swung right for "Tap any video"; small in the middle
 * while the numbers land; small above the two actions.
 */
const UGC_POSES = [
  [0.0, { x: 0.3, y: 0.0, s: 0.95, rx: 0.18, ry: -0.32, rz: -0.12 }],
  [0.05, { x: 0.3, y: 0.0, s: 0.95, rx: 0.18, ry: -0.32, rz: -0.12 }],
  [0.15, { x: -0.3, y: 0.0, s: 1, rx: -0.04, ry: 0.22, rz: 0.03 }],
  [0.3, { x: -0.3, y: 0.0, s: 1, rx: -0.04, ry: 0.28, rz: 0.03 }],
  [0.38, { x: 0.3, y: 0.0, s: 0.98, rx: 0.08, ry: -0.36, rz: -0.08 }],
  [0.52, { x: 0.3, y: 0.0, s: 0.98, rx: 0.08, ry: -0.42, rz: -0.08 }],
  [0.6, { x: 0, y: 0.04, s: 0.62, rx: 0.05, ry: 0.1, rz: 0 }],
  [0.75, { x: 0, y: 0.04, s: 0.62, rx: 0.05, ry: -0.1, rz: 0 }],
  [0.84, { x: 0, y: -0.02, s: 0.5, rx: 0.06, ry: -0.18, rz: 0 }],
  [1.0, { x: 0, y: -0.02, s: 0.5, rx: 0.06, ry: 0.16, rz: 0 }],
];

/** Depth of each phone on the work wall (#35 parallax), cycled. */
const DRIFT = [0.06, 0.12, 0.03, 0.1, 0.08, 0.04, 0.11, 0.05];

export default function UgcPage() {
  let n = 0;
  return (
    <div className="v3 v3-ugc">
      {/* ───────── STAGE: a hand-held phone playing his UGC work ───────── */}
      <Stage
        scene="phone"
        params={{ screen: VESTASCAN.video.poster, keys: UGC_POSES }}
        ground="navy"
        height={520}
        heightPhone={460}
        mark="UGC"
        label="UGC Portfolio"
      >
        <div className="v3-intro v3-ugc-intro">
          <h1 id="ugc-title" className="v3-intro__line v3-display" data-lift>
            UGC <span className="mark">Portfolio</span>
          </h1>
          <div className="v3-ugc-intro__rest" data-intro-rest>
            <p className="v3-ugc-intro__by">
              <span>by Big Quiv</span>
              <span className="v3-ugc-intro__niches">{NICHES.join(" • ")}</span>
            </p>
            <p className="v3-ugc-intro__desc">{DESCRIPTION}</p>
            <div className="v3-intro__actions">
              <a href={`mailto:${EMAIL}`} className="v3-btn v3-btn--lg">
                Email me <Arrow />
              </a>
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="v3-link">
                WhatsApp me
              </a>
              <span className="v3-ugc-intro__place">Lagos, Nigeria</span>
            </div>
          </div>
        </div>

        <h2 className="v3-ghost" data-ghost="0.12,0.18,0.28,0.33" data-side="right" aria-hidden="true">
          Start with the one a client paid for.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.35,0.41,0.5,0.55" data-side="left" aria-hidden="true">
          Tap any video to play it.
        </h2>
        <h2 className="v3-ghost" data-ghost="0.57,0.62,0.72,0.76" data-side="high" aria-hidden="true">
          Real numbers.
        </h2>
        <ul className="v3-ugc-stage-nums" data-at="0.6,0.65,0.73,0.77" aria-hidden="true">
          {REACH.map((r) => (
            <li key={r.platform}>
              <span>{r.main}</span>
              {r.platform}
            </li>
          ))}
        </ul>
        <p className="v3-aside" data-at="0.8,0.85,0.95,0.99" data-side="center" style={{ bottom: "auto", top: "14svh" }}>
          I&rsquo;m taking bookings for brand collaborations.
        </p>
        <div className="v3-endcta" data-at="0.82,0.87,0.96,1">
          <a href={`mailto:${EMAIL}`} className="v3-btn v3-btn--lg">
            Email me <Arrow />
          </a>
          <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="v3-link">
            WhatsApp me
          </a>
        </div>
      </Stage>

      {/* ───────── THE 30-DAY CHALLENGE: first, it is what he is running now ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="challenge">
        <div className="v3-wrap">
          <UgcChallenge headingId="challenge" />
        </div>
      </section>

      {/* ───────── ABOUT ME ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" data-panel aria-labelledby="about">
        <div className="v3-wrap v3-ugc-about">
          <div>
            <h2 id="about" className="v3-h2 v3-display" data-split>
              Hi, I&rsquo;m Big Quiv.
            </h2>
            <h3 className="v3-h3 v3-ugc-about__h3">What I do.</h3>
            <div className="v3-ugc-about__lines">
              {ABOUT.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>
                I have taught 3,000+ students, and I build products too, like Peaceway Online (
                <a href="https://peacewayonline.com" target="_blank" rel="noopener noreferrer">
                  peacewayonline.com
                </a>
                ).
              </p>
            </div>

            <dl className="v3-ugc-card">
              {HANDLES.map((h) => (
                <div key={h.platform}>
                  <dt>{h.platform}</dt>
                  <dd>
                    <a href={h.href} target="_blank" rel="noopener noreferrer">
                      {h.handle}
                    </a>
                  </dd>
                </div>
              ))}
              <div className="v3-ugc-card__wide">
                <dt>Email</dt>
                <dd>
                  <EmailLink />
                </dd>
              </div>
              <div className="v3-ugc-card__wide">
                <dt>WhatsApp</dt>
                <dd>
                  <WhatsAppLink />
                </dd>
              </div>
            </dl>
          </div>

          <div className="v3-ugc-about__photos">
            <div className="v3-ugc-about__main" data-reveal="clip">
              <Image
                src="/hero/king-base-1600.webp"
                alt="Big Quiv in a studio portrait, wearing black glasses."
                fill
                sizes="(max-width: 1024px) 80vw, 520px"
                style={{ objectFit: "cover", objectPosition: "50% 28%" }}
              />
            </div>
            <figure className="v3-ugc-about__small" data-parallax="0.1">
              <div className="v3-ugc-about__small-img">
                <Image
                  src="/about-journey.jpg"
                  alt="A selfie of Big Quiv with classmates at his web design class graduation."
                  fill
                  sizes="260px"
                  style={{ objectFit: "cover", objectPosition: "0% 50%" }}
                />
              </div>
            </figure>
          </div>
        </div>
      </section>

      {/* ───────── SHOWREEL: the paid ad, framed in a viewfinder (#34) ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="showreel">
        <div className="v3-wrap v3-ugc-reel">
          <div className="v3-ugc-reel__text">
            <h2 id="showreel" className="v3-h2 v3-display" data-split>
              Start with the one a client paid for.
            </h2>
            <p className="v3-ugc-reel__line">
              VestaScan, a Web3 project. Made with AI, no camera, no crew. Sound is off until you turn it on.
            </p>
            <p className="v3-hand" aria-hidden="true">
              watch this one first
            </p>

            <div className="v3-ugc-worked">
              <h3 id="worked-with" className="v3-h3">
                Worked with
              </h3>
              <ul aria-labelledby="worked-with">
                <li className="v3-ugc-worked__open">
                  <span>Your brand</span>
                  <em>&larr; This spot is open</em>
                </li>
                <li className="v3-ugc-worked__brand">VestaScan</li>
              </ul>
            </div>

            <figure className="v3-ugc-words" aria-labelledby="client-words">
              <h3 id="client-words">Client words</h3>
              <blockquote>
                &ldquo;Yes video is <span className="mark">approved!</span> It looks great.&rdquo;
              </blockquote>
              <figcaption>VestaScan team, Aug 2026</figcaption>
            </figure>
          </div>

          <div className="v3-ugc-reel__phone">
            <Viewfinder className="v3-ugc-vf">
              {/* The one video on the page that loads before a tap. */}
              <PhoneMockup video={VESTASCAN.video} autoPlay priority />
            </Viewfinder>
          </div>
        </div>

        {/* Look Swap (#24) was here: one clip in two looks. Removed 19 Oct until he has
            a real clip in two looks; a placeholder must not ship. Put it back with
            <LookSwap a={...} b={...} /> from components/v3/fx/LookSwap.tsx. */}
      </section>

      {/* ───────── MY WORK: every video in a phone (#8), at depth ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="work">
        <div className="v3-wrap">
          <h2 id="work" className="v3-h2 v3-display" data-split>
            Tap any video to play it.
          </h2>
          <div className="v3-ugc-cats">
            {CATEGORIES.map((c, ci) => (
              <section key={c.name} aria-labelledby={`cat-${ci}`} className={c.items.length > 1 ? "is-wide" : undefined}>
                <h3 id={`cat-${ci}`} className="v3-ugc-cat__h">
                  {c.name}
                </h3>
                <ul className="v3-ugc-phones">
                  {c.items.map((w) => {
                    const d = DRIFT[n++ % DRIFT.length];
                    return (
                      <li key={w.video.file}>
                        <figure>
                          {/* No phone here autoplays: the VestaScan showreel above is the
                              one video that loads before a tap, and this grid's VestaScan
                              phone is the same file. */}
                          <div data-parallax={d}>
                            <PhoneMockup video={w.video} />
                          </div>
                          <figcaption>
                            <h4>{w.video.title}</h4>
                            <p>
                              <span>Client: </span>
                              <strong>{w.client}</strong>
                            </p>
                            <p>
                              <span>Brief: </span>
                              {w.brief}
                            </p>
                          </figcaption>
                        </figure>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── REACH ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="reach">
        <div className="v3-wrap">
          <div className="v3-ugc-reach__head">
            <h2 id="reach" className="v3-h2 v3-display" data-split>
              Real numbers.
            </h2>
            <p>As of {REACH_DATE}</p>
          </div>
          <ul className="v3-ugc-reach">
            {REACH.map((r) => (
              <li key={r.platform}>
                <p className="v3-ugc-reach__platform">{r.platform}</p>
                <p className="v3-ugc-reach__num">
                  <span data-odometer>{r.main}</span>
                  <span className="v3-ugc-reach__label">{r.mainLabel}</span>
                </p>
                <p className="v3-ugc-reach__handle">{r.handle}</p>
                {r.sub && <p className="v3-ugc-reach__sub">{r.sub}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── WHAT I MAKE ───────── */}
      <section className="v3-section v3-section--paper" data-nav="cloud" aria-labelledby="services">
        <div className="v3-wrap v3-ugc-make">
          <h2 id="services" className="v3-h2 v3-display" data-split>
            For pricing, <span className="mark">email me.</span>
          </h2>
          <ol aria-labelledby="services" className="v3-ugc-make__list">
            {SERVICES.map((s, i) => (
              <li key={s} data-fade>
                <span aria-hidden="true">[{String(i + 1).padStart(2, "0")}]</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── BEFORE YOU BOOK ───────── */}
      <section className="v3-section v3-section--cloud v3-grain" data-nav="cloud" aria-labelledby="good-to-know">
        <div className="v3-wrap v3-ugc-make">
          <h2 id="good-to-know" className="v3-h2 v3-display" data-split>
            Before you book.
          </h2>
          <ul aria-labelledby="good-to-know" className="v3-ugc-know" data-checklist>
            {GOOD_TO_KNOW.map((g) => (
              <li key={g} data-check>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── LET'S WORK TOGETHER ───────── */}
      <section className="v3-section v3-section--navy v3-grain v3-ugc-close" data-nav="navy" data-spotlight aria-labelledby="contact">
        <div className="v3-wrap v3-ugc-close__grid">
          <div>
            <h2 id="contact" className="v3-display v3-ugc-close__h" data-split>
              Let&rsquo;s work <span className="mark">together</span>
            </h2>
            <p className="v3-ugc-close__line">I&rsquo;m taking bookings for brand collaborations.</p>
            <div className="v3-ugc-close__contacts">
              <p>
                <EmailLink />
              </p>
              <p>
                WhatsApp <WhatsAppLink />
              </p>
              <p className="v3-ugc-close__handles">
                {HANDLES.map((h) => (
                  <a key={h.platform} href={h.href} target="_blank" rel="noopener noreferrer">
                    {h.platform} {h.handle}
                  </a>
                ))}
              </p>
            </div>
            <div className="v3-ugc-close__actions">
              <a href={`mailto:${EMAIL}`} className="v3-btn v3-btn--lg">
                Email me <Arrow />
              </a>
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="v3-link">
                WhatsApp me
              </a>
            </div>
          </div>
          <div className="v3-ugc-close__photo" data-parallax="0.1">
            <Image src="/hero/king-base-1024.webp" alt="Big Quiv" fill sizes="(max-width: 900px) 70vw, 420px" style={{ objectFit: "cover", objectPosition: "50% 30%" }} />
          </div>
        </div>
      </section>
    </div>
  );
}
