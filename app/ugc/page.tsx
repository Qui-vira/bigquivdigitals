import type { Metadata } from "next";
import Image from "next/image";
import { PhoneTile, type PhoneVideo } from "@/components/PhoneTile";
import { FILMS } from "@/lib/films";
import {
  BrutalButton,
  HandNote,
  MonoLabel,
  PaperSection,
  PhotoPrint,
  StatStamp,
  Sticker,
  Tape,
  cx,
} from "@/components/ui-paper";

/**
 * /ugc — the UGC portfolio. Approved by the owner 2026-10-04: "Build it now".
 *
 * Layout follows the class UGC portfolios reviewed on 2026-10-04 (Toni's
 * Canva template, Elle's deck, Iman's Canva site): open on the face, every
 * video in a phone frame grouped by category with "Client:" and "Brief:"
 * under it, real reach numbers, end on contact.
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

/** How each phone in the work wall sits: a small tilt, alternating. */
const PHONE_TILT = [-2, 1.6, -1.2, 2.2, -1.8, 1.2, -2.4, 1.8];
const STAMP_TONE = ["gold", "paper", "tint", "paper"] as const;
const STAMP_TILT = [-2.2, 1.6, -1.4, 2];

/** Star points for a 5-point star in a 100x100 box. */
function starPoints() {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 47 : 20;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    pts.push([50 + r * Math.cos(a), 52 + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * The faceted silver star from the reference deck, drawn as ten triangles
 * from the centre so it reads as a pressed metal object. Decorative only.
 * `id` keeps each gradient unique on the page.
 */
function SilverStar({ id, size = 56, tilt = 0, className }: { id: string; size?: number; tilt?: number; className?: string }) {
  const pts = starPoints();
  const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      aria-hidden="true"
      viewBox="-4 -4 110 110"
      className={cx("pointer-events-none absolute z-[5] overflow-visible", className)}
      style={{ width: size, height: size, rotate: `${tilt}deg` }}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F7F8FA" />
          <stop offset="0.45" stopColor="#B9BEC5" />
          <stop offset="0.7" stopColor="#E9ECEF" />
          <stop offset="1" stopColor="#7F858D" />
        </linearGradient>
      </defs>
      <polygon points={poly} transform="translate(3.5 3.5)" fill="#111111" />
      <polygon points={poly} fill={`url(#${id}-g)`} />
      {pts.map(([x, y], i) => {
        const [nx, ny] = pts[(i + 1) % pts.length];
        return (
          <polygon
            key={i}
            points={`50,52 ${x.toFixed(1)},${y.toFixed(1)} ${nx.toFixed(1)},${ny.toFixed(1)}`}
            fill={i % 2 === 0 ? "rgba(255,255,255,0.42)" : "rgba(17,17,17,0.22)"}
          />
        );
      })}
      <polygon points={poly} fill="none" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function EmailLink({ className = "" }: { className?: string }) {
  return (
    <a href={`mailto:${EMAIL}`} className={cx("paper-link select-all break-all", className)}>
      {EMAIL}
    </a>
  );
}

/** A section tag in the reference's wavy pill shape. Decorative: the heading carries the meaning. */
function Tag({ children, tilt = -7, className }: { children: string; tilt?: number; className?: string }) {
  return (
    <Sticker
      shape="wavy"
      tone="soft"
      size={46}
      bumps={5}
      tilt={tilt}
      className={className}
      textClassName="text-[13px]! normal-case! tracking-[0.02em]!"
    >
      {children}
    </Sticker>
  );
}

const sectionTitle =
  "font-didone text-[clamp(2.6rem,6.4vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.005em] text-ink text-balance";

export default function UgcPage() {
  return (
    <div className="paper-scope overflow-x-clip bg-paper text-ink">
      {/* ───────── 1. COVER ─────────
          The deck's first slide: a print of him, the big two-word title, a
          starburst, and the "by" pill. The niches run underneath in the
          typewriter, then the one-line description. */}
      <PaperSection
        as="header"
        ground="grid"
        pad="none"
        aria-labelledby="ugc-title"
        innerClassName="pb-16 pt-[calc(4rem+2.5rem)] md:pb-24 md:pt-[calc(4.5rem+3.5rem)]"
      >
        <div className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          {/* Title block. First on phones, right column from lg. */}
          <div className="relative @container lg:order-2">
            <h1 id="ugc-title" className="relative text-ink">
              <span className="load-drop flex items-start font-display text-[34cqw] font-bold leading-[0.8] tracking-[-0.05em]">
                UGC
                <Sticker
                  shape="starburst"
                  tone="gold"
                  size={150}
                  tilt={14}
                  reveal={false}
                  className="load-settle ml-[0.06em] mt-[0.02em] size-[0.5em]! shrink-0"
                />
              </span>
              <span
                className="load-drop block font-didone text-[30cqw] font-semibold uppercase leading-[0.9] tracking-[-0.01em]"
                style={{ "--rv-delay": "120ms" } as React.CSSProperties}
              >
                Portfolio
              </span>
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-6">
              <Tag tilt={-6} className="load-settle shrink-0">
                by Big Quiv
              </Tag>
              <MonoLabel as="p" tone="ink" size="sm" className="font-bold">
                {NICHES.join(" • ")}
              </MonoLabel>
            </div>

            <p className="mt-9 max-w-[34ch] text-[1.2rem] leading-relaxed text-ink-soft md:text-[1.35rem]">
              {DESCRIPTION}
            </p>
            <MonoLabel as="p" tone="soft" className="mt-4">
              Lagos, Nigeria
            </MonoLabel>
          </div>

          {/* The print. Below the title on phones, left column from lg. */}
          <div className="relative mx-auto w-full max-w-[330px] sm:max-w-[380px] lg:order-1 lg:mx-0 lg:max-w-none">
            <span
              aria-hidden="true"
              className="load-tilt absolute inset-0 border-[3px] border-ink bg-gold [rotate:-1deg] [translate:14px_14px]"
            />
            <PhotoPrint tilt={-4} attach="clip" mat="polaroid" caption="Big Quiv" reveal={false} className="load-drop">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/quivira-hero.webp"
                  alt="Big Quiv"
                  fill
                  priority
                  sizes="(max-width: 1024px) 380px, 460px"
                  className="object-cover"
                  style={{ objectPosition: "76% 30%" }}
                />
              </div>
            </PhotoPrint>
            <SilverStar id="cover-star" size={62} tilt={-12} className="-right-4 -top-7 lg:-bottom-6 lg:-left-7 lg:right-auto lg:top-auto" />
            <HandNote
              load
              delay={700}
              tilt={-5}
              arrow="down-left"
              arrowAt="above"
              arrowClassName="!w-[64px] ml-8"
              className="absolute -right-2 -top-24 hidden xl:inline-flex"
            >
              hi, that&rsquo;s me
            </HandNote>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 2. ABOUT ME ─────────
          The scrapbook spread: the "about me" pill, the name set huge, the
          lines typed underneath, a contact card taped in, and two prints
          overlapping on the right. */}
      <PaperSection ground="paper" checker="top" pad="lg" aria-labelledby="about">
        <div className="grid gap-x-16 gap-y-20 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
          <div>
            <Tag tilt={-9}>about me</Tag>
            <h2
              id="about"
              className="mt-6 font-didone text-[clamp(3.4rem,11vw,6rem)] font-semibold leading-[0.92] tracking-[-0.01em] text-ink text-balance"
            >
              Hi, I&rsquo;m Big Quiv.
            </h2>

            <h3 className="mt-10 font-display text-xl font-bold tracking-[-0.01em] text-ink">What I do.</h3>
            <div className="mt-5 max-w-[58ch] space-y-5 font-typewriter text-[15.5px] leading-[1.75] text-ink-soft md:text-base">
              {ABOUT.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>
                I have taught 3,000+ students, and I build products too, like Peaceway Online (
                <a
                  href="https://peacewayonline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="paper-link font-bold text-ink underline decoration-ink decoration-2 underline-offset-4"
                >
                  peacewayonline.com
                </a>
                ).
              </p>
            </div>

            {/* The contact card: handles and email, taped into the spread. */}
            <div className="relative mt-14 max-w-[460px] border-[3px] border-ink bg-gold-tint p-6 pt-8 shadow-brutal [rotate:-1.2deg] sm:p-7 sm:pt-9">
              <Tape className="-top-3.5 left-8" tilt={-5} width={96} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {HANDLES.map((h) => (
                  <div key={h.platform}>
                    <dt className="font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                      {h.platform}
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={h.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="paper-link inline-flex min-h-[32px] items-center font-display font-bold text-ink"
                      >
                        {h.handle}
                      </a>
                    </dd>
                  </div>
                ))}
                <div className="col-span-2 border-t-2 border-dashed border-ink/40 pt-4 sm:col-span-3">
                  <dt className="font-typewriter text-[12px] font-bold uppercase tracking-[0.1em] text-ink-soft">Email</dt>
                  <dd className="mt-1">
                    <EmailLink className="font-display font-bold text-ink" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Two prints, the big one taped at the corners, the small one
              clipped over its lower edge. */}
          <div className="relative mx-auto w-full max-w-[460px] pb-24 sm:pb-28 lg:mt-8 lg:max-w-none lg:pb-36">
            <PhotoPrint tilt={2.6} attach="tape-corners" mat="even" lift="self" className="ml-auto w-[88%] sm:w-[84%]">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/hero/king-base-1600.webp"
                  alt="Big Quiv in a studio portrait, wearing black glasses."
                  fill
                  sizes="(max-width: 1024px) 400px, 460px"
                  className="object-cover"
                  style={{ objectPosition: "50% 28%" }}
                />
              </div>
            </PhotoPrint>
            <PhotoPrint
              tilt={-6}
              attach="clip"
              mat="polaroid"
              caption="the early days"
              lift="self"
              delay={160}
              className="absolute bottom-0 left-0 w-[56%] sm:w-[50%]"
            >
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/about-journey.jpg"
                  alt="A selfie of Big Quiv with classmates at his web design class graduation."
                  fill
                  sizes="240px"
                  className="object-cover"
                  style={{ objectPosition: "0% 50%" }}
                />
              </div>
            </PhotoPrint>
            <SilverStar id="about-star" size={54} tilt={18} className="-left-2 top-[18%] sm:left-[4%]" />
          </div>
        </div>
      </PaperSection>

      {/* ───────── 3. SHOWREEL ─────────
          One framed spread: the words on paper, the phone on a gold panel.
          The one video on the page that loads before a tap. */}
      <PaperSection ground="alt" pad="lg" aria-labelledby="showreel">
        <div className="grid border-[3px] border-ink bg-paper shadow-brutal-lg lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="relative flex flex-col justify-center border-b-[3px] border-ink p-6 py-10 sm:p-10 lg:border-b-0 lg:border-r-[3px] lg:p-14">
            <Sticker shape="label" tone="gold" tilt={-3} decorative={false} className="self-start">
              Showreel
            </Sticker>
            <h2
              id="showreel"
              className="mt-7 max-w-[14ch] font-didone text-[clamp(2.7rem,7vw,4.9rem)] font-semibold leading-[0.95] tracking-[-0.005em] text-ink text-balance"
            >
              Start with the one a client paid for.
            </h2>
            <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-ink-soft">
              VestaScan, a Web3 project. Made with AI, no camera, no crew. Sound is off until you turn it on.
            </p>
            <HandNote arrow="right" arrowAt="end" tilt={-3} className="mt-10 hidden lg:inline-flex" arrowClassName="!w-[110px]">
              watch this one first
            </HandNote>
          </div>
          <div className="relative flex items-center justify-center overflow-hidden bg-gold px-6 py-14 sm:py-16">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(#111111 1px, transparent 1px), linear-gradient(90deg, #111111 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            {/* The one video on the page that loads before a tap. */}
            <PhoneTile video={VESTASCAN.video} autoPlay tilt={2} className="max-w-[270px] sm:max-w-[290px]" />
            <SilverStar id="reel-star" size={58} tilt={-10} className="right-[10%] top-[9%]" />
            <Sticker
              shape="circle"
              tone="paper"
              size={92}
              tilt={-12}
              className="absolute bottom-[8%] left-[7%] hidden sm:inline-flex"
            >
              play me
            </Sticker>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 4. WORKED WITH + CLIENT WORDS ─────────
          A sticker wall: the open YOUR BRAND slot and VestaScan, nothing
          else. The client's approval sits beside it as a taped note. */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="worked-with">
        <div className="grid items-center gap-x-16 gap-y-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <h2 id="worked-with" className={sectionTitle}>
              Worked with
            </h2>
            <ul className="relative mt-12 flex flex-wrap items-center gap-x-10 gap-y-12 sm:gap-x-16">
              <li className="relative flex items-center gap-5">
                <span className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full border-[3px] border-dashed border-ink bg-paper text-center font-typewriter text-[15px] font-bold uppercase leading-tight tracking-[0.12em] text-ink [rotate:-6deg] sm:h-44 sm:w-44 sm:text-base">
                  <span>
                    Your
                    <br />
                    brand
                  </span>
                  <span aria-hidden="true" className="absolute inset-[9px] rounded-full border-[1.5px] border-dashed border-ink/40" />
                </span>
                <span className="font-hand text-[1.55rem] font-bold leading-[1.05] text-ink [rotate:-4deg] sm:text-[1.75rem]">
                  <span aria-hidden="true" className="mr-1 font-typewriter text-[1.1rem]">
                    &larr;
                  </span>
                  This spot
                  <br />
                  is open
                </span>
              </li>
              <li>
                <Sticker
                  shape="circle"
                  tone="gold"
                  size={176}
                  tilt={8}
                  decorative={false}
                  textClassName="font-display! text-[1.55rem]! normal-case! tracking-[-0.02em]!"
                >
                  VestaScan
                </Sticker>
              </li>
            </ul>
          </div>

          <figure
            aria-labelledby="client-words"
            className="relative m-0 border-[3px] border-ink bg-gold-tint p-7 pt-10 shadow-brutal [rotate:1.8deg] sm:p-9 sm:pt-11"
          >
            <Tape className="-top-3.5 left-1/2 -translate-x-1/2" tilt={-4} />
            <h3 id="client-words" className="font-typewriter text-[13px] font-bold uppercase tracking-[0.1em] text-ink">
              Client words
            </h3>
            <blockquote className="mt-5 font-didone text-[clamp(2rem,4.4vw,2.9rem)] font-medium leading-[1.08] text-ink">
              &ldquo;Yes video is <span className="hl-mark">approved!</span>{" "}It looks great.&rdquo;
            </blockquote>
            <figcaption className="mt-7 border-t-2 border-dashed border-ink/40 pt-4 font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
              VestaScan team, Aug 2026
            </figcaption>
          </figure>
        </div>
      </PaperSection>

      {/* ───────── 5. MY WORK ─────────
          Every video in a phone, grouped by category, the client and the
          brief under each one. Groups flow on one wall, so the short
          categories share a row instead of leaving gaps. */}
      <PaperSection ground="grid" checker="top" pad="lg" aria-labelledby="work">
        <div className="relative">
          <Tag tilt={-8}>my work</Tag>
          <h2 id="work" className={cx(sectionTitle, "mt-6")}>
            Tap any video to play it.
          </h2>
          <HandNote arrow="down-right" tilt={4} className="absolute -bottom-16 left-[48%] hidden lg:inline-flex">
            sound on for these
          </HandNote>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-16 sm:flex sm:flex-wrap sm:gap-x-16 sm:gap-y-20 md:mt-24">
          {CATEGORIES.map((c, ci) => (
            <section
              key={c.name}
              aria-labelledby={`cat-${ci}`}
              className={cx("min-w-0 sm:w-auto", c.items.length > 1 ? "col-span-2" : "col-span-1")}
            >
              <h3 id={`cat-${ci}`}>
                <Sticker shape="label" tone={ci % 2 === 0 ? "tint" : "gold"} tilt={ci % 2 === 0 ? -2 : 2} decorative={false}>
                  {c.name}
                </Sticker>
              </h3>
              <ul
                className={cx(
                  "mt-10 grid gap-x-4 gap-y-12 sm:flex sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-10 sm:gap-y-16",
                  c.items.length > 1 ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {c.items.map((w, i) => {
                  const n = CATEGORIES.slice(0, ci).reduce((sum, g) => sum + g.items.length, 0) + i;
                  return (
                    <li key={w.video.file} className="min-w-0 sm:w-[15.5rem]">
                      <figure className="m-0">
                        {/* No phone here autoplays: the first video on the page
                            is the VestaScan showreel above, and this grid's
                            VestaScan tile is the same file. Autoplaying it again
                            would download it twice. */}
                        <PhoneTile
                          video={w.video}
                          label={w.video.title}
                          tilt={PHONE_TILT[n % PHONE_TILT.length]}
                          delay={i * 90}
                          className="max-w-none"
                        />
                        <figcaption className="mt-4 space-y-2 border-t-2 border-dashed border-ink/35 pt-4 text-[14px] leading-relaxed sm:text-[15px]">
                          <p>
                            <span className="font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-gold-deep sm:text-[13px]">
                              Client:{" "}
                            </span>
                            <span className="font-display font-bold text-ink">{w.client}</span>
                          </p>
                          <p>
                            <span className="font-typewriter text-[12px] font-bold uppercase tracking-[0.06em] text-gold-deep sm:text-[13px]">
                              Brief:{" "}
                            </span>
                            <span className="text-ink-soft">{w.brief}</span>
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
      </PaperSection>

      {/* ───────── 6. REACH ─────────
          Each platform as a stamped ticket, the platform tag stuck on top. */}
      <PaperSection ground="paper" pad="lg" aria-labelledby="reach">
        <Tag tilt={-6}>reach</Tag>
        <h2 id="reach" className={cx(sectionTitle, "mt-6")}>
          Real numbers.
        </h2>
        <MonoLabel as="p" tone="soft" className="mt-4">
          As of {REACH_DATE}
        </MonoLabel>

        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">
          {REACH.map((r, i) => (
            <li key={r.platform} className="relative max-sm:px-1.5">
              <Sticker
                shape="label"
                tone="ink"
                tilt={i % 2 === 0 ? -4 : 3}
                decorative={false}
                delay={i * 90 + 200}
                className="absolute -top-4 left-4 z-[5]"
              >
                {r.platform}
              </Sticker>
              <StatStamp
                value={r.main}
                label={r.mainLabel}
                tone={STAMP_TONE[i % STAMP_TONE.length]}
                tilt={STAMP_TILT[i % STAMP_TILT.length]}
                delay={i * 90}
              />
              <p className="mt-6 px-1 font-display text-[1.05rem] font-bold text-ink">{r.handle}</p>
              {r.sub && <p className="mt-1 px-1 text-[15px] leading-relaxed text-ink-soft">{r.sub}</p>}
            </li>
          ))}
        </ul>
      </PaperSection>

      {/* ───────── 7. WHAT I MAKE + GOOD TO KNOW ─────────
          Two objects side by side: a typed list and a ruled note. */}
      <PaperSection ground="alt" pad="lg" aria-label="What I make, and good to know">
        <div className="grid gap-x-16 gap-y-24 lg:grid-cols-2">
          <div>
            <Tag tilt={-7}>what I make</Tag>
            <h2
              id="services"
              className="mt-6 font-didone text-[clamp(2.4rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.005em] text-ink"
            >
              For pricing, <span className="hl-mark">email me.</span>
            </h2>

            <div className="relative mt-12 border-[3px] border-ink bg-paper px-6 pb-8 pt-10 shadow-brutal [rotate:-1deg] sm:px-9">
              <span
                aria-hidden="true"
                className="absolute inset-x-6 top-3 h-[3px]"
                style={{ background: "radial-gradient(circle, #111111 1.2px, transparent 1.6px) 0 0 / 9px 3px repeat-x" }}
              />
              <ul aria-labelledby="services" className="space-y-3.5 font-typewriter text-[15.5px] leading-snug text-ink">
                {SERVICES.map((s, i) => (
                  <li key={s} className="grid grid-cols-[auto_1fr] gap-4">
                    <span aria-hidden="true" className="font-bold tabular-nums text-gold-deep">
                      [{String(i + 1).padStart(2, "0")}]
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <Tag tilt={5}>good to know</Tag>
            <h2
              id="good-to-know"
              className="mt-6 font-didone text-[clamp(2.4rem,5vw,3.75rem)] font-semibold leading-[0.98] tracking-[-0.005em] text-ink"
            >
              Before you book.
            </h2>

            {/* A sheet of ruled notebook paper. The line-height matches the
                ruling, so wrapped lines still sit on the rules. */}
            <div
              className="relative mt-12 border-[3px] border-ink bg-paper pb-8 pr-6 pt-8 shadow-brutal [rotate:1.2deg] sm:pr-9"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 2.6rem, #E7BB88 2.6rem, #E7BB88 calc(2.6rem + 2px), transparent calc(2.6rem + 2px)), repeating-linear-gradient(180deg, transparent 0, transparent calc(2rem - 1px), #D5DBE2 calc(2rem - 1px), #D5DBE2 2rem)",
              }}
            >
              <Tape className="-top-3.5 right-10" tilt={5} width={92} />
              <ul aria-labelledby="good-to-know" className="pl-[3.6rem] text-[16px] leading-[2rem] text-ink">
                {GOOD_TO_KNOW.map((g) => (
                  <li key={g} className="relative">
                    <span aria-hidden="true" className="absolute -left-6 font-typewriter font-bold text-gold-deep">
                      &#x2713;
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PaperSection>

      {/* ───────── 8. LET'S WORK TOGETHER ─────────
          The closing statement: a pinned print, the words set huge, the
          email and handles typed underneath, one button. */}
      <PaperSection ground="grid" pad="lg" aria-labelledby="contact">
        <div className="grid items-center gap-x-16 gap-y-20 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div className="relative order-2 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:order-1">
            <PhotoPrint tilt={-5} attach="pin" mat="polaroid" caption="see you soon" lift="self">
              <div className="relative aspect-[4/5] bg-black">
                <Image
                  src="/hero/king-base-1024.webp"
                  alt="Big Quiv"
                  fill
                  sizes="340px"
                  className="object-cover"
                  style={{ objectPosition: "50% 30%" }}
                />
              </div>
            </PhotoPrint>
            <SilverStar id="contact-star" size={56} tilt={14} className="-bottom-5 -right-3" />
            <Sticker shape="starburst" tone="soft" size={74} tilt={-10} className="absolute -left-6 top-[30%]" delay={150} />
          </div>

          <div className="order-1 lg:order-2">
            <h2
              id="contact"
              className="relative font-didone text-[clamp(3.6rem,13vw,7.6rem)] font-semibold uppercase leading-[0.88] tracking-[-0.01em] text-ink"
            >
              Let&rsquo;s work
              <br />
              <span className="inline-flex items-start">
                together
                <Sticker
                  shape="starburst"
                  tone="gold"
                  size={96}
                  tilt={12}
                  className="ml-[0.08em] -mt-[0.18em] size-[0.62em]! shrink-0"
                />
              </span>
            </h2>
            <p className="mt-8 max-w-[30ch] font-display text-[1.45rem] font-bold leading-snug tracking-[-0.01em] text-ink sm:text-[1.7rem]">
              I&rsquo;m taking bookings for brand collaborations.
            </p>

            <div className="mt-8 space-y-2 font-typewriter text-[15px] font-bold uppercase tracking-[0.06em] text-ink sm:text-base">
              <p>
                <EmailLink className="normal-case tracking-normal" />
              </p>
              <p className="flex flex-wrap gap-x-5 gap-y-1">
                {HANDLES.map((h) => (
                  <a
                    key={h.platform}
                    href={h.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-link inline-flex min-h-[36px] items-center"
                  >
                    {h.platform} {h.handle}
                  </a>
                ))}
              </p>
            </div>

            <div className="mt-10">
              <BrutalButton href={`mailto:${EMAIL}`} size="lg">
                Email me
              </BrutalButton>
            </div>
          </div>
        </div>
      </PaperSection>
    </div>
  );
}
