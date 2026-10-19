# bigquivdigitals.com: full rebuild plan

Status: DRAFT for your approval. Nothing below gets built until you approve this plan, then the design system, then the page comps.

## What you decided (19 Oct 2026)

| Question | Your answer |
|---|---|
| Rebrand depth | Keep your colours and fonts. Everything else is new: layout, motion, 3D, components. |
| Ground | Your brand colours. No red. No neon light, no glowing edges, no AI black. |
| Build | GSAP, plus pages written by hand in HTML, CSS and Three.js inside the current site. Payments, admin, the course gate and articles keep working with no migration. |
| 3D | You, in 3D, on the homepage. Every other page gets its own 3D object built in code. |
| Claude Design | Design system first, then a comp of every page on a Claude Design canvas, before any code. |
| Pages | Every public page, organised as one system. |
| Copy | Your words stay word for word. |
| Opener | Short opener, no sound (answered earlier). |

## The method, from the two references

**Adewura (github.com/Qui-vira/adewura-sites)**: one 3D hero object per page, scroll-pinned on a tall sticky stage, pose keyframed over scroll; ghost-trail headlines; Lenis smooth scroll feeding GSAP ScrollTrigger; a logo-first opener; sections that slide in as colour panels; floating photos at different depths; one glitch headline per site; reduced-motion and no-WebGL fallbacks.

**The Hungry Tiger reel (instagram.com/reel/DbgjytGySiQ)**, beat by beat:

| Beat | What it does | What your site takes |
|---|---|---|
| 1 | The product rises from the bottom of a full colour ground with grain | Your 3D object rises out of a brand-colour ground with a fine paper grain |
| 2 | Huge heavy headline arrives as smeared copies while the jar tumbles | Ghost-trail headlines in Bricolage 800, the object turning |
| 3 | Big centred statement, small text block and a pill button at the side | One big line, one small paragraph, one button |
| 4 | Object pinned in the middle, headlines swap around it, each with its own pose | Each of your lines gets its own pose of the object |
| 5 | Type is a lighter tint of the ground, never white | Tone-on-tone: navy-2 type on navy, deep gold on gold-tint, navy on cloud |
| 6 | Colour panels slide in as the object drops away | Cloud, navy and paper panels slide in by section |
| 7 | Photos float past at different depths | Your proof screenshots float at depth |
| 8 | One headline glitches once | One glitch line on the whole site |
| 9 | Cards over photos, then a photo strip | Case study cards, proof strip |
| 10 | One full-bleed product photo moment | One full-bleed moment per page (your real screens) |
| 11 | A colour close with a call to action | Every page ends on one close with one action |

Not taken from the reel: its red, its black panel, any glow.

## Skills, and what each one does here

| Skill | Job in this rebuild |
|---|---|
| /impeccable | PRODUCT.md (written), the direction contract per page, the craft floor, the design detector on every page, the finish reviewer, then DESIGN.md from the built site |
| /apple-design | The product scroll: motion always from the current value, spring-like settles, reduced motion, materials (frosted nav), type tracking by size |
| /emil-design-eng | Every UI motion value: custom ease-out curves, buttons scale 0.97 on press, under 300ms for UI, hover only on mouse devices, stagger 30-80ms, transitions not keyframes for UI |
| Claude Design | The Big Quiv Design System artifact gets the web layer; a Design canvas holds a comp of every page |
| Scrapling | Every live page downloaded (text, meta, images, screenshots) into `research/live-site/` as the content source |

## The design system: what gets added

Your Big Quiv Design System artifact (claude.ai/artifact/DDLYcu1q4urH8zZhgh3Bxa) already holds colour, type, spacing and radius. It has no web layer. I add one section and its tokens:

1. **Grounds for the web.** Cloud and paper for reading. Navy as a matte coloured field with a fine grain, never black, never a glow. Gold stays the 10% accent (buttons, one marked phrase, ticks, numbers). Tone-on-tone headlines on each ground. A ground rule per section type.
2. **Web type scale.** Bricolage Grotesque 800, condensed (width 80 to 92) for display; size-specific tracking; Karla for body at 18px / 1.75; Caveat once per page at most; Courier Prime only in prompt boxes.
3. **Motion tokens.** Ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`, press 140ms at scale 0.97, UI under 300ms, scroll scenes scrubbed by scroll, stagger 50ms, reduced-motion equivalents.
4. **The 3D stage.** Sticky stage spec (height per page, pose keyframes, lighting without glow: matte key light and soft contact shadow), WebGL fallback image, low-power rules.
5. **Components.** Nav (bone on navy, navy on cloud, frosted), primary button (gold fill, ink label), secondary link, ghost headline, aside, proof card, case study card, stat row (only rows with evidence), step row, FAQ, form fields, price block, footer, article reading layout.

## Every page, its 3D object, its story

All copy comes from the live page, word for word. The 3D objects are built in Three.js from code, textured with your real screens where a screen appears.

| # | Page | 3D object | Scroll story (beats from your existing copy) |
|---|---|---|---|
| 1 | Home `/` | **You** (the hero photo, cut out, depth-mapped) | Hook, then you turn as the lines land, push in, settle on the call to action; then receipts, builds, problem, offer, process, testimonials, close |
| 2 | Services `/services` | **The system**: five blocks (site, content, Telegram, strategy, report) that fly in and lock into one cube | "One system" assembles as you scroll; each block opens its offer line |
| 3 | About `/about` | **The journey card stack**: your real story images as physical cards that fan out | Your story beats in order, each card turning to face you |
| 4 | Work `/portfolio` | **A device rack**: phone and laptop, screens showing each case study | The rack rotates to each build; click opens its case study |
| 5-8 | Case studies `/work/peaceway`, `/work/alpha-plays`, `/work/nigeria-business-costs`, `/work/content-engine` | **One device each** with the real screen: phone with the Telegram order, phone with the channel, laptop with Power BI, phone with the X post | Claim, the device turns to the evidence, the numbers, the next case |
| 9 | Contact `/contact` | **A calendar block** that flips to the booking day | Book a call, other ways to reach you |
| 10 | The Great Work `/greatwork` | **The book**: a 3D course book that opens as you scroll | The seven modules page by page |
| 11 | Great Work waitlist `/greatwork-waitlist` | The same book, closed, small | Form first, one line, done |
| 12 | AI class `/aimastery` | **A phone playing your AI ads** (your real videos as the screen) | The skill, the proof reel, the offer |
| 13 | AI class waitlist `/aimastery-waitlist` | The same phone, small | Form first |
| 14 | TheEditCompanion `/theeditcompanion` | **The product box**, opening to show the pack | What it is, what is inside, price, checkout |
| 15 | Companion thanks and download | The box, open | Status, download |
| 16 | UGC `/ugc` | **A phone in a hand-held angle** playing UGC work | The offer, the work, WhatsApp |
| 17 | Articles `/articles` | **A stack of documents** that deals out as cards | The index, by topic |
| 18 | Article `/doc/[slug]` (25 articles, plus access-code gate) | No object: a calm reading page in the same system | Reading progress, the article, related |
| 19 | Waitlist `/waitlist` | Small book or phone, matching the course | Form |
| 20-22 | Privacy, Terms, Licence | No object | One reading layout for all legal pages |
| 23 | 404, error, loading | A small 3D "lost" object (your wordmark dot rolling) | Back home |

Shared across every page: the nav, the footer, the opener (first visit only, homepage only), smooth scroll, the button and card system, reduced motion, and a flat image when WebGL is not available.

## The homepage hero, from the first pass

The 3D portrait works and stays as the homepage object. Two changes from your feedback: the gold rim around your head and shoulders comes off (it reads as a glow), replaced by a matte key light and a soft shadow; and the ground is decided on the comps (see below).

## Order of work and your approval points

1. **Content source** (running now): Scrapling downloads every live page into `research/live-site/`.
2. **This plan**: you approve or change it. **Approval 1.**
3. **Design system**: I add the web layer to your Big Quiv Design System artifact. **Approval 2.**
4. **Comps**: one Claude Design canvas, one artboard per page (desktop, plus phone for home and one offer page), each showing the first viewport and the 3D object's key poses. The homepage ground gets two versions side by side (navy matte, cloud) for you to pick. **Approval 3.**
5. **Build**: shared shell first (nav, footer, buttons, stage engine, smooth scroll, opener), then pages in this order: Home, Services, Work and the 4 case studies, About, Contact, The Great Work and waitlist, AI class and waitlist, TheEditCompanion and its thanks page, UGC, Articles and the doc template, legal and small pages.
6. **Checks on every page**: impeccable design detector, desktop and phone screenshots at the key scroll positions, keyboard and reduced motion, no-WebGL fallback, every claim checked against the positioning doc, payments, admin, the course gate and /doc tested, `next build` passing.
7. **Finish review**: impeccable's finish reviewer, fixes, then DESIGN.md written from the built site.
8. **Preview**: a Vercel preview deployment only after you say so, and production only after you approve the preview. Before any vercel command: `cat .vercel/project.json` must say `website`.

## Where the work lives

- Code: `C:\Projects\bigquivdigitals-v3`, branch `rebuild/site`. Your main folder and the TheEditCompanion work are untouched.
- Live-site download: `research/live-site/`.
- Hero texture build: `scripts/hero3d/export.py`.
- Plan, product record and direction: this file, `PRODUCT.md`, `.impeccable/surfaces/`.

## Merging with the TheEditCompanion checkout (selling now)

The checkout lives uncommitted in `C:\Projects\bigquivdigitals` on `feat/companion-product-page`. This rebuild never edits, stashes, resets or switches branch in that folder.

- The rebuild branch was cut from that branch's commit plus a copy of its uncommitted files, so the checkout, its payment routes, `/terms`, `/privacy` and `/licence` are all present here unchanged.
- The rebuilt nav keeps the Companion link to `/theeditcompanion`. The rebuilt footer keeps Terms, Privacy and Licence, and adds a Companion link (the footer has none today).
- Only two shared files overlap: `components/Navbar.tsx` and `components/FooterClient.tsx`. When the checkout is committed, I rebase this branch onto it and resolve those two by hand: the checkout's links win, the rebuild's markup wraps them. The payment routes and `app/sitemap.ts` are not edited by the rebuild.
- Order: the checkout ships first. The rebuild merges after it, never over it.
- The checkout is now committed locally as `2a48e5d` on `feat/companion-product-page` (19 Oct 2026, not pushed, not deployed). The rebuild rebases onto that commit, not onto this morning's uncommitted snapshot.
- The checkout adds TEC- guard lines to the Flutterwave verify and webhook routes and the Blockradar webhook. The rebase keeps the checkout's version of those three routes byte for byte.
- The local copy's `.env.local` points at the live database. No form is ever submitted on the local rebuild server. Testing forms and payments waits for a Neon test branch and a Preview deploy you approve.

## Open items I will not guess

- The 3D object for each page in the table above is a proposal. Change any of them at Approval 1.
- The homepage ground (navy matte or cloud) is picked on the comps.
- The AI class has no public name yet. Pages use the name the live site uses today, and I add none.
