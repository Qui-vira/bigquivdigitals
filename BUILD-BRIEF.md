# Build brief for the page builders (v3 rebuild of bigquivdigitals.com)

The owner approved the plan, the design system, the 23 comps and the motion plan on 19 Oct 2026. The shared engine and the homepage are built. You build your assigned pages on that engine, so the whole site is one system.

Work ONLY in `C:\Projects\bigquivdigitals-site` (branch `rebuild/site`). Never touch `C:\Projects\bigquivdigitals` (live checkout work) or `C:\Projects\bigquivdigitals-v3` (old copy). Never commit, push, deploy, run `vercel`, run `next build`, run `npm install`, start another dev server, submit a form, or click a payment button. A dev server is already running at http://localhost:3160 with hot reload.

## Read first
1. `REBUILD-PLAN.md` (the page table: each page's 3D object and story), `MOTION-PLAN.md` (section 2: motion on every page; section 3: your pages' effects).
2. `research/EFFECTS-CATALOGUE.md`: the spec of each numbered effect named for your pages.
3. The approved comp for each of your pages (exact layout and copy order): `C:\Users\Bigquiv\AppData\Local\Temp\claude\C--Projects-ContentBrain\88128334-1691-479a-84b8-16b82afc546c\scratchpad\canvas\project\<Board>.dc.html`.
4. The live page copy: `research/live-site/<folder>/page.md`. Not-live pages (TheEditCompanion, its thanks/download page, terms, privacy, licence) take copy from the code.
5. The engine and the reference page: `components/HomeClient.tsx` + `components/v3/pages/home.css` (copy this pattern), `components/v3/stage/Stage.tsx`, `components/v3/stage/kit.ts`, `components/v3/stage/scenes/portrait.ts`, `components/v3/Motion.tsx` (the attribute effects), `app/v3.css`, `app/v3-shared.css`.
6. The design system web section: `C:\Users\Bigquiv\AppData\Local\Temp\claude\C--Projects-ContentBrain\88128334-1691-479a-84b8-16b82afc546c\scratchpad\ds\project\web.md`.
7. The impeccable craft floor: `C:\Users\Bigquiv\.claude\skills\impeccable\reference\craft-floor.md`.

## Hard rules
- **Copy word for word** from the live page or the code. Never rewrite, shorten, or invent a line, number, price, name or testimonial. Owner ruling: income-promise lines stay as they are. You may drop purely decorative hand-drawn notes (Caveat at most once per page).
- **Keep every function working**: data fetching in `page.tsx` (keep queries, `revalidate`, metadata, JSON-LD), payments (PaymentModal, FlutterwaveButton, BlockradarPayment), waitlist and contact forms (WaitlistForm, the formsubmit form), the course gate, the /doc access-code gate, the companion checkout. Restyle around them; do not change their logic, props, endpoints, or field names. For the companion files (`components/companion/*`, `app/theeditcompanion/*`, `app/companion/*`, `app/terms|privacy|licence`) keep diffs minimal: prefer CSS that targets their existing markup; never touch `lib/companion/**` or any `app/api/**` route.
- **Brand**: navy #1B2433, navy-2 #26324A, cloud #F4F5F7, paper #FFFFFF, gold #E8A33D (fills, buttons, one marked phrase on NAVY), gold-deep #A2660F (gold text on cloud/paper, 24px+ or bold), ink #121722, ink-2 #4A5263, bone #F2EDE7, ash #A39C93. Gold text on cloud or paper is banned (2:1). Bricolage Grotesque 800 condensed for display (`.v3-display`), Karla body. No black or near-black grounds, no neon, no glow, no glowing rims, no gradient text, no hard offset shadows, no eyebrows above headings, no emoji, no stock imagery. 6px corners (14px only on proof cards).
- **Real images only**: use the real screenshots already in `public/proof/**`, `public/**` and the images the live page uses. Never a stock photo. A screenshot that does not exist stays a labelled `.v3-placeholder` (as in the comps).
- **Claims**: every number shown must already be on the live page (or be a backed stat from the database). Never add one.

## How a page is built (the pattern)
- The page component renders `<div className="v3 v3-<page>">`, then `<Stage scene="<id>" params={...} ground="navy|cloud" height={..} mark=".." label=".." particles?>` with the stage layers as children, then sections. Use attribute effects: `data-split` (headings), `data-fade`, `data-odometer` (real numbers only), `data-parallax="0.15"`, `data-reveal="clip"` (screenshots), `data-panel` (a section rising over the stage), `data-checklist` + `data-check`, `data-typein` (prompts), `data-strike`, `data-tilt`, `data-stack` + `data-stack-card`, `data-hscroll` + `data-hscroll-track`, `data-spotlight`, `data-scramble`. Stage layers: `data-lift` (the h1), `data-intro-rest`, `.v3-ghost[data-ghost="a,b,c,d"][data-side]`, `.v3-aside[data-at="a,b,c,d"][data-side]`, `.v3-endcta[data-at]`. Every section carries `data-nav="navy"` or `data-nav="cloud"` matching its ground.
- Internal links into a course, a case study or TheEditCompanion get `data-flood` (the navy page transition). Case study cards get `data-cursor="View"`, video players `data-cursor="Play"`.
- Buttons: `.v3-btn` (gold primary, ink label) and `.v3-btn--navy`, `.v3-link` for the second action, `Arrow` from `components/v3/Arrow`. One gold primary per screen.
- Page-only CSS goes in `components/v3/pages/<page>.css`, imported by the page component. Use the CSS variables in `app/v3.css`.
- A new effect that only your pages use goes in `components/v3/fx/<Name>.tsx` (client component, GSAP + ScrollTrigger, reduced-motion fallback, cleaned up on unmount). Name it after the catalogue entry.
- **Your 3D object**: replace the stand-in in `components/v3/stage/scenes/<id>.ts` (owned by exactly one builder, listed below) with the real object, built in Three.js from code on `kit.ts`: `createStage`, `keyframes`, `follow`, `loop`, `contactShadow`, `loadTexture`, `disposeTree`. Matte materials (MeshStandardMaterial, roughness 0.6 to 0.9) in brand colours, real screenshots as screen textures, a contact shadow, NO emissive glow, no rim light, no bloom. Pose keyframes over p 0..1 matching your page's beats; ease with `follow`; pointer tilt small; dispose everything. Lowpower: fewer segments, smaller textures. Each object should look crafted: rounded edges (RoundedBoxGeometry from `three/examples/jsm/geometries/RoundedBoxGeometry.js`), bevels, believable proportions.
- Do NOT edit shared files: `kit.ts`, `Stage.tsx`, `registry.ts`, `ghost.ts`, `Motion.tsx`, `Cursor.tsx`, `Transitions.tsx`, `Opener.tsx`, `SmoothScroll.tsx`, `app/v3.css`, `app/v3-shared.css`, `app/layout.tsx`, `components/Navbar.tsx`, `components/FooterClient.tsx`, `components/PublicShell.tsx`, `components/HomeClient.tsx`, or another builder's files. If you need an engine change, say so in your report.

## Checks before you report (two rounds at most)
1. `npx tsc --noEmit -p .` from the site folder: no errors in your files.
2. Screenshots: `MSYS_NO_PATHCONV=1 python "C:/Users/Bigquiv/AppData/Local/Temp/claude/C--Projects-ContentBrain/88128334-1691-479a-84b8-16b82afc546c/scratchpad/shoot2.py" .impeccable/review/<page> /<path> <page>` (desktop) and again with `... <page>-m 390 844` (phone). Look at the contact sheet you make from them. Fix what is wrong: overlapping text, unreadable contrast, empty stage, broken layout at 390px, horizontal scroll, missing copy. Note the database is a slow remote: if a page 500s, curl it once to warm it and retry.
3. No console errors from your page in the capture output.

## Report back
For each page: the files you changed or created, which effects you built, the 3D object, any copy you could not place, any engine change you need, and the screenshot folder.

## Who owns what
- **Builder A**: `/services`, `/about`, `/portfolio`, `/contact`. Scenes: `systemCube`, `storyCards`, `deviceRack`, `calendar`.
- **Builder B**: `/work/peaceway`, `/work/alpha-plays`, `/work/nigeria-business-costs`, `/work/content-engine` (MDX pages under `app/work/*`, `app/work/layout.tsx`, `app/work/work.css`, `components/work/*`). Scene: `device` (params: `{ kind: "phone" | "laptop", screen: "/proof/..." }`).
- **Builder C**: `/greatwork`, `/greatwork-waitlist`, `/aimastery`, `/aimastery-waitlist`, `/waitlist` (`components/CourseClient.tsx`, `components/AiMasteryClient.tsx`, `components/course/*`, their `app/*/page.tsx`). Scenes: `book`, `phone` (params: `{ screen?: "/path.webp" or video poster }`). UGC (Builder D) also uses `phone`.
- **Builder D**: `/theeditcompanion`, its `/thanks`, `/companion/download/[token]`, `/ugc`, `/articles`, `/doc/[slug]` (template + access-code gate), `/terms`, `/privacy`, `/licence`, `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`. Scenes: `box`, `docStack`, `dot`.
