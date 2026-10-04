import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { PhoneTile, type PhoneVideo } from "@/components/PhoneTile";
import { FILMS } from "@/lib/films";

/**
 * /ugc — the UGC portfolio. Approved by the owner 2026-10-04: "Build it now".
 *
 * Layout follows the class UGC portfolios reviewed on 2026-10-04 (Toni's
 * Canva template, Elle's deck, Iman's Canva site): open on the face, every
 * video in a phone frame grouped by category with "Client:" and "Brief:"
 * under it, real reach numbers, end on contact. Built in the site's own
 * design system, not a Canva look.
 *
 * ⚠ NOT IN THE NAV, ON PURPOSE. Linked from his bios and pitches only. Do not
 * add it to components/Navbar.tsx.
 *
 * ⚠ NO PRICES ANYWHERE ON THIS PAGE.
 *
 * ⚠ VESTASCAN IS THE ONLY BRAND THAT HIRED HIM. Every other brand piece says
 * "Spec ad, made on my own" in its Client line. The "Worked with" strip holds
 * the open YOUR BRAND slot and VestaScan, and nothing else: never put a spec
 * brand (Gucci, Burger King, McDonald's, Lexus, Air Peace, Bybit, Anthropic)
 * there. Never name the VestaScan contact, never show the receipt, never state
 * the amount. The company is named because the ad tags them.
 *
 * Reach numbers were read on 4 Oct 2026. Update numbers and REACH_DATE together.
 *
 * Videos: only the first tile autoplays (muted). Every other tile mounts no
 * <video> until tapped. Web encodes live in the Vercel Blob bucket at
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

const kicker = "text-xs font-semibold uppercase tracking-[0.16em] text-accent";
const h2 = "mt-4 max-w-2xl text-3xl font-bold tracking-tight text-text-primary md:text-5xl";
const section = "mx-auto max-w-[1200px] border-t border-border py-16 md:py-24";

function Portrait({ src, position, priority = false }: { src: string; position: string; priority?: boolean }) {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[300px] overflow-hidden md:max-w-[420px] rounded-[2rem] border border-border-hover bg-bg-secondary">
      <Image
        src={src}
        alt="Big Quiv"
        fill
        priority={priority}
        sizes="(max-width: 768px) 90vw, 420px"
        className={`object-cover ${position}`}
      />
    </div>
  );
}

function EmailLink({ className = "" }: { className?: string }) {
  return (
    <a href={`mailto:${EMAIL}`} className={`select-all break-all hover:text-accent ${className}`}>
      {EMAIL}
    </a>
  );
}

export default function UgcPage() {
  return (
    <div className="px-6 pb-28 pt-28 md:pt-40">
      {/* ───────── 1. HERO ───────── */}
      <header className="mx-auto grid max-w-[1200px] items-center gap-12 pb-16 md:grid-cols-[1fr_420px] md:gap-16 md:pb-24">
        <div className="md:order-2">
          <Portrait src="/quivira-hero.webp" position="object-right" priority />
        </div>
        <div className="md:order-1">
          <p className="text-sm font-semibold text-accent">UGC Portfolio</p>
          <h1 className="mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.045em] text-text-primary md:text-7xl">
            Hi, I&rsquo;m Big Quiv.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-text-secondary md:text-xl">
            Web3 and AI UGC creator. I turn crypto apps and AI tools into short videos people
            understand in under a minute.
          </p>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-text-primary">
            {NICHES.join(" • ")}
          </p>
          <p className="mt-3 text-sm text-text-secondary">Lagos, Nigeria</p>

          <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-7 sm:grid-cols-3">
            {HANDLES.map((h) => (
              <div key={h.platform}>
                <dt className="text-xs uppercase tracking-[0.16em] text-text-muted">{h.platform}</dt>
                <dd className="mt-1">
                  <a
                    href={h.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-text-primary hover:text-accent"
                  >
                    {h.handle}
                  </a>
                </dd>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-text-muted">Email</dt>
              <dd className="mt-1">
                <EmailLink className="font-semibold text-text-primary" />
              </dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ───────── 2. ABOUT ME ───────── */}
      <section className={section} aria-labelledby="about">
        <p className={kicker}>About me</p>
        <h2 id="about" className={h2}>
          What I do.
        </h2>
        <ul className="mt-10 grid max-w-3xl gap-5">
          {ABOUT.map((line) => (
            <li key={line} className="flex gap-4 text-lg leading-relaxed text-text-secondary">
              <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {line}
            </li>
          ))}
          <li className="flex gap-4 text-lg leading-relaxed text-text-secondary">
            <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>
              I have taught 3,000+ students, and I build products too, like Peaceway Online (
              <a
                href="https://peacewayonline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary underline decoration-border underline-offset-4 hover:text-accent"
              >
                peacewayonline.com
              </a>
              ).
            </span>
          </li>
        </ul>
      </section>

      {/* ───────── 3. SHOWREEL ───────── */}
      <section className={section} aria-labelledby="showreel">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_300px] md:gap-16">
          <div>
            <p className={kicker}>Showreel</p>
            <h2 id="showreel" className={h2}>
              Start with the one a client paid for.
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-text-secondary">
              VestaScan, a Web3 project. Made with AI, no camera, no crew. Sound is off until you
              turn it on.
            </p>
          </div>
          {/* The one video on the page that loads before a tap. */}
          <PhoneTile video={VESTASCAN.video} autoPlay />
        </div>
      </section>

      {/* ───────── 4. WORKED WITH ───────── */}
      <section className={section} aria-labelledby="worked-with">
        <p className={kicker}>Worked with</p>
        <h2 id="worked-with" className="sr-only">
          Worked with
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-8 md:gap-12">
          <div className="flex items-center gap-4">
            <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-accent text-center text-xs font-bold uppercase tracking-[0.14em] text-accent md:h-32 md:w-32">
              Your
              <br />
              brand
            </div>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <ArrowRight className="h-4 w-4 rotate-180 text-accent" aria-hidden="true" />
              This spot is open
            </p>
          </div>
          <div className="grid h-28 w-28 place-items-center rounded-full border border-border-hover bg-bg-secondary text-center font-display text-base font-bold text-text-primary md:h-32 md:w-32">
            VestaScan
          </div>
        </div>
      </section>

      {/* ───────── 5. CLIENT WORDS ───────── */}
      <section className={section} aria-labelledby="client-words">
        <p className={kicker}>Client words</p>
        <h2 id="client-words" className="sr-only">
          Client words
        </h2>
        <figure className="mt-10 max-w-2xl rounded-2xl border border-border bg-bg-secondary p-8 md:p-10">
          <blockquote className="font-display text-2xl font-bold leading-snug text-text-primary md:text-4xl">
            &ldquo;Yes video is approved! It looks great.&rdquo;
          </blockquote>
          <figcaption className="mt-6 text-sm text-text-secondary">VestaScan team, Aug 2026</figcaption>
        </figure>
      </section>

      {/* ───────── 6. MY WORK ───────── */}
      <section className={section} aria-labelledby="work">
        <p className={kicker}>My work</p>
        <h2 id="work" className={h2}>
          Tap any video to play it.
        </h2>
        <div className="mt-12 space-y-20">
          {CATEGORIES.map((c) => (
            <div key={c.name}>
              <h3 className="text-xl font-bold text-text-primary md:text-2xl">{c.name}</h3>
              <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {c.items.map((w) => (
                    <figure key={w.video.file}>
                      {/* No tile here autoplays: the first video on the page
                          is the VestaScan showreel above, and this grid's
                          VestaScan tile is the same file. Autoplaying it again
                          would download it twice. */}
                      <PhoneTile video={w.video} />
                      <figcaption className="mx-auto mt-5 max-w-[300px] space-y-1.5 text-sm leading-relaxed">
                        <p>
                          <span className="font-semibold text-accent">Client: </span>
                          <span className="text-text-primary">{w.client}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-accent">Brief: </span>
                          <span className="text-text-secondary">{w.brief}</span>
                        </p>
                      </figcaption>
                    </figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── 7. REACH ───────── */}
      <section className={section} aria-labelledby="reach">
        <p className={kicker}>Reach</p>
        <h2 id="reach" className={h2}>
          Real numbers.
        </h2>
        <p className="mt-4 text-sm text-text-muted">As of {REACH_DATE}</p>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {REACH.map((r) => (
            <li key={r.platform} className="bg-bg-primary p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{r.platform}</p>
              <p className="mt-1 text-sm text-text-secondary">{r.handle}</p>
              <p className="mt-5 font-display text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
                {r.main}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{r.mainLabel}</p>
              {r.sub && <p className="mt-4 text-sm font-semibold text-accent">{r.sub}</p>}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── 8. WHAT I MAKE ───────── */}
      <section className={section} aria-labelledby="services">
        <p className={kicker}>What I make</p>
        <h2 id="services" className={h2}>
          For pricing, email me.
        </h2>
        <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <li key={s} className="bg-bg-primary p-6 font-semibold text-text-primary">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── 9. GOOD TO KNOW ───────── */}
      <section className={section} aria-labelledby="good-to-know">
        <p className={kicker}>Good to know</p>
        <h2 id="good-to-know" className={h2}>
          Before you book.
        </h2>
        <ul className="mt-10 grid max-w-3xl gap-4">
          {GOOD_TO_KNOW.map((g) => (
            <li key={g} className="flex gap-4 leading-relaxed text-text-secondary">
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {g}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── 10. LET'S WORK TOGETHER ───────── */}
      <section
        className="mx-auto grid max-w-[1200px] items-center gap-12 border-t border-border pt-16 md:grid-cols-[420px_1fr] md:gap-16 md:pt-24"
        aria-labelledby="contact"
      >
        <Portrait src="/hero/king-base-1600.webp" position="object-center" />
        <div>
          <p className={kicker}>Let&rsquo;s work together</p>
          <h2 id="contact" className={h2}>
            I&rsquo;m taking bookings for brand collaborations.
          </h2>
          <p className="mt-6 text-lg">
            <EmailLink className="text-text-primary" />
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-black transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Email me
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
