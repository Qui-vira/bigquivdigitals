# Effects catalogue: the effects diary, translated for bigquivdigitals.com

Built 2026-10-19. Internal research file. Source material is another creator's work (@tenfoldmarc, Marc Cleroux), analysed in the ContentBrain vault. Use it as a vocabulary of moves, never as copy: do not reuse his lines, his effect names or his pack names on any public page.

## Sources read

| Source | Status |
|---|---|
| `ContentBrain/business-blueprint/marketing/reference-analysis/marketing-reels/` INDEX, reel-01 to reel-08 (tenfoldmarc), marketing-patterns-playbook | Read in full |
| `.../reference-analysis/reels/` INDEX and `reel-03-DeXE2T0z7QW.md` (second teardown of the same effects reel) | Read |
| `.../reference-analysis/docs/` INDEX and `tenfold-course-structure.md` (sales page: FX Pack names) | Read |
| `D:\motion-studio-pack-build\_refs\marketing\reels\` | D: drive available. 10 mp4s, 10 contact sheets. All 8 tenfoldmarc sheets viewed. Extra frame strips cut from the mp4s for this file: reel 04 at 2.5 fps over each named effect, and 1 frame per second for reels 01, 06, 07, 08 |
| `motion-studio-pack/skills/motion-studio/` | Grepped for every effect name. No implementation is named after any diary effect. Closest building blocks listed per entry |
| `~/.claude/skills/motion-studio/` | No named diary effects |
| `~/.claude/skills/hyperframes-animation/` | No diary names, but 48 rules and 22 blueprints that already build most of these moves (named per entry as "Existing block") |

Reel key used below (marketing-reels numbering): R01 Dd-D7GEzDKx (24.9 s), R02 DWCPx0PkQzA, R03 DVaBP3wDAFE, R04 DeXE2T0z7QW (46.4 s, the numbered effects reel), R05 DeD1OcZzlLy (70.5 s), R06 DeGSnoWzZTi (28.5 s), R07 DeZ6k9mTj6- (26.5 s), R08 Dede6jJTHF- (37.0 s). R02 and R03 carry no designed effects (plain subtitles, handheld screen recording, one black-box headline), so they appear only as context.

Timestamps: R04 effects are exact to the transcript segment and the on-screen "#N" pill. Everything else is read off 1-frame-per-second grids, so treat those as plus or minus 1 s.

## Site rules every entry obeys

- Grounds are cloud `#F4F5F7` or navy `#1B2433`. Never black or near-black, never neon, no glow, no glowing rims, no gradient text. Where Marc goes black (Spotlight, Blackout, his dark UI cards), the site goes navy.
- Gold `#E8A33D` on cloud is about 2.0:1 contrast, which fails WCAG even for large text. Gold on navy is about 7.2:1 and passes. So gold words, ticks and pills live on navy. On cloud, gold is only for strokes, underlines, markers and fills behind navy text.
- Type: Bricolage Grotesque 800 for display, Karla for body. Tabular numbers for anything that counts.
- Stack: Next.js 16, GSAP 3.15 with ScrollTrigger, Lenis 1.3 (`lenis.on('scroll', ScrollTrigger.update)`, Lenis driven from `gsap.ticker`), Three.js 0.186 for the home portrait. One WebGL context on the site, the portrait's. Any 3D effect below joins that scene and does not open a second canvas.
- Reduced motion: every effect is wrapped in `gsap.matchMedia()` with a `(prefers-reduced-motion: reduce)` branch. The final state is always in the HTML, so with JavaScript off or motion reduced the page shows the finished content. Animation only enhances.
- Proof rule (positioning doc section 11): any number, logo, screenshot or claim an effect carries must come from a filed proof block. The effect never invents content.

---

## Part 1: Named and shown on screen (R04, numbered pills "#1" to "#7")

### 1. Headline Wall

**In the video.** R04 0.0 to 5.6 s, pill "#1 Headline Wall". Four phone-shaped cards of other creators' reels and headlines ("CLAUDE CODE JUST NUKED VIDEO EDITORS", "ChatGPT vs Claude") sit fanned and tilted around him on the sofa, two high, two low, framing his head. The cards are the proof that "everybody is talking about it". Related: R01 0 to 4 s (two phone cards pinned in the top corners with creator handles) and R06 0 to 1 s (he holds a phone card of a creator profile).

**Website version.** When the home page scrolls from the portrait into the proof section, five or six real proof cards fly in from off-screen and settle fanned around the 3D portrait: the 1M+ view pinned post, the 128K view video with 1.7K comments, the Deola and Haleem posts, the Peaceway order screenshot. Each card tilts a few degrees and drifts on scroll. Hover lifts a card to flat and full size; click opens the source post. Scrolling on, the cards part to clear the next heading.

**Build.** Absolutely positioned cards in a pinned section; one GSAP timeline with `scrub: true` animates `x, y, rotation, scale` from off-screen values with a stagger. Existing block: `overwhelm-surround` blueprint, `depth-scatter-assemble` rule. Reduced motion: cards render in a static 2 by 3 grid.

**Fits.** Home, proof section right after the portrait. Second choice: Work index header.

**Risk.** Screenshot text is unreadable at card size, so each card needs a short caption and a link. Only filed proof (section 4 of the positioning doc); never Marc-style "news headlines" from other people. Lazy-load the images or they hurt LCP. Never let a card sit over the H1.

### 2. Orbit

**In the video.** R04 5.6 to 9.2 s, pill "#2 Orbit". From about 7 s, a ring of small phone cards (his own reels) circles his head on a tilted ellipse. Cards on the far side are smaller and pass behind him; cards on the near side are larger and pass in front. The caption word "orbit" turns yellow at about 8.5 s.

**Website version.** On home, after the hero line, six to eight small cards (the four case studies plus the offers) orbit the 3D portrait on a tilted ellipse. Scroll drives the angle, so the ring turns as you scroll and stops when you stop. The portrait's real depth hides cards passing behind the head. Mouse movement tilts the ring a few degrees. Hovering a card pauses the ring and shows its label; clicking goes to that page. At the end of the section the ring collapses into a row of links.

**Build.** Three.js group of textured planes inside the existing portrait scene; `angle = base + progress * 2π` from a ScrollTrigger `onUpdate`; planes keep `lookAt(camera)`; depth test against the portrait mesh gives the occlusion for free. Existing block: `orbit-3d-entry` rule, `cta-orbit-collapse` example. Reduced motion: the ring is frozen at evenly spaced positions, and a plain link list sits underneath for everyone.

**Fits.** Home, portrait section, as the bridge into "what I build".

**Risk.** Moving targets are hard to click, so the plain link list is required, not optional. The vault's own motion-design notes rate 3D type orbiting a subject as "impressive and low-performing" in video: keep it short, one section. Texture memory on low-end Android: at most 8 compressed textures, 512 px.

### 3. Digital Zoom

**In the video.** R04 9.2 to 14.9 s, pill "#3 Digital Zoom". Wide shot, then at the words "digital zoom" (about 10.5 s) the frame punches in to a chest-up crop, holds through "I didn't have to open any fancy editing software", and returns to the wide shot at about 14.5 s. The step is fast, not a slow push.

**Website version.** A pinned case-study image zooms on scroll into one detail that proves the claim. Peaceway: the full Telegram order flow, then a punch-in on the confirmed N1,055 total. Alpha plays: the full call screenshot, then the entry and stop-loss line. A short caption fades in during the hold; continued scrolling zooms back out and releases the pin.

**Build.** Pinned section; GSAP `scale` 1 to 2.2 with `transformOrigin` set to the detail's coordinates, eased `power3.inOut` so it reads as a punch rather than a drift. Use a 2x image so the zoomed state stays sharp. Existing block: `coordinate-target-zoom` rule. Reduced motion: the full image and the cropped detail sit side by side, no zoom.

**Fits.** Work case studies (Peaceway, Alpha plays, technical engine). TheEditCompanion demo section.

**Risk.** Blurry zooms look cheap; source images need the resolution. Long pins frustrate: keep the pin under 120 vh. Test pinning with Lenis on iOS Safari.

### 4. Spotlight

**In the video.** R04 14.9 to 19.4 s, pill "#4 Spotlight". At "kill" (about 17 s) the room drops to a dark vignette and a soft pool of light stays on his face and the wall behind his head. "kill the lights" is the yellow keyword. The light stays down until the next effect.

**Website version.** One line per page earns the lights going out. As that sentence reaches the middle of the screen, the section ground shifts from cloud to navy, every other element fades to low opacity, and a soft radial mask keeps the sentence (and on home, the portrait's face) fully visible. Scrolling past brings the lights back. A hover version on Services: the cursor carries a soft lit circle across a navy card grid, revealing each card's detail where it passes.

**Build.** ScrollTrigger toggles a `.lights-out` class with a 400 ms colour transition; the lit area is a CSS `mask-image: radial-gradient(...)` driven by `--x`/`--y` custom properties (pointer position for the hover version). Soft mask edge only: no glow, no rim, no bloom. Existing block: `demo-page-scroll-spotlight` example. Reduced motion: the section is simply navy with full-opacity text, no mask and no transition.

**Fits.** About (the one-sentence mission), The Great Work hero promise, home just before the final CTA.

**Risk.** Marc goes to near-black; the site must stop at navy. Gold text inside the dark state must be large. Once per page or it stops meaning anything. The hover version does nothing on touch, so the cards must read fine without it.

### 5. Checklist

**In the video.** R04 19.4 to about 29 s, pill "#5 Checklist". A dark card in the upper left, headed "TO USE THESE EFFECTS" with a "0 of 3" counter. As he says each step ("record your videos", "drop the clips into Claude", "tell it to use the skill") the next row gets a yellow tick, its text appears, and the counter climbs to "3 of 3".

**Website version.** A sticky "3 steps" card sits beside a process section. As each step's block scrolls past, its row ticks: a gold check draws in, the row text goes full strength, and the counter climbs. On TheEditCompanion: install, drop your clips, approve the plan. On Services: brief, seven-day sprint, report. On Contact: what happens after you send the form.

**Build.** `position: sticky` card on navy; one ScrollTrigger per step with `onEnter` / `onLeaveBack`; SVG check drawn with `stroke-dashoffset`; counter swaps text. Existing block: `agent-progress-theater` blueprint, `svg-path-draw` rule. Reduced motion: ticks appear instantly, no draw. Under 768 px the card becomes inline at the top of the section.

**Fits.** TheEditCompanion "how it works", Services process, Contact.

**Risk.** Marc's card is near-black; recolour to navy. Sticky cards collide with content on narrow screens. Steps must match the real flow, including the gates, or the card becomes a claim.

### 6. Freeze and Label

**In the video.** R04 29.2 to 33.4 s, pill "#6 Freeze and Label". On "who can't edit" (about 30.5 s) the frame holds and dims a little, and a white pill reading "can't edit" appears with a yellow dot on his chest and a thin leader line up to the pill. The label is a joke about himself.

**Website version.** A looping case-study video or the portrait pauses at a scroll point, desaturates slightly, and one or two labels draw in, each a white pill joined by a thin navy line to a dot on the exact detail: "price hidden: ask pharmacist", "order confirmed in Telegram", "AI generated, checked frame by frame". Scrolling on, the labels retract and the video plays again.

**Build.** ScrollTrigger `onEnter` calls `video.pause()` and adds `filter: saturate(.6) brightness(.95)`; SVG leader line drawn with `stroke-dashoffset`; pill scales from 0.8 with a small spring. Existing block: `ai-tracking-box`, `svg-path-draw`, `spring-pop-entrance` rules. Reduced motion: a static poster frame with the labels already placed, no video.

**Fits.** Work case studies (Peaceway, AI films). AI Mastery portfolio section. Home portrait as a light "who is this" annotation.

**Risk.** Labels get tiny on phones: at most two per frame, 14 px minimum. Every label is a claim, so the Peaceway labels follow the regulatory line (service claims, never drug claims).

### 7. Before and After

**In the video.** R04 33.4 to 38.2 s, pill "#7 Before and After". The raw clip shows with a dark "before" pill at bottom right. A white vertical divider with a round "<>" handle sweeps across (about 35 to 37 s), revealing the edited version: yellow "after" pill, word captions, and a huge "edited" word at the top that sits behind his cap. Related: R07 about 5 to 8 s, a cream screen with the raw clip and the finished clip side by side, a render bar going from 0 to 794 frames, and "100% edited by Claude" in large serif.

**Website version.** A compare slider of his own raw take against his finished reel. When it enters view, the divider sweeps once from right to left on its own; after that, the visitor drags it or uses the arrow keys. "Before" and "after" pills sit on each side. Variants: Peaceway old site against new site; a raw AI generation against the finished film.

**Build.** Two stacked videos or images; the top one clipped with `clip-path: inset(0 0 0 var(--split))`; GSAP tweens `--split` once on enter; pointer events for dragging; the handle is `role="slider"` with `aria-valuenow` and arrow-key support. Both videos share one `currentTime` driver so they stay in sync. Existing block: `comparison-split` blueprint, `comparison-split-cards` example. Reduced motion: two panels side by side, no sweep.

**Fits.** TheEditCompanion (the main proof on the page), UGC, Work.

**Risk.** Two videos double the weight: posters first, load on intersection, short loops. The footage must be his own and the "after" must be what the tool produced plus his own fixes, stated as such (the owner's line is "human taste, Claude labour", not "100% Claude").

---

## Part 2: Named on the sales page (FX Pack list), 14 more

The sales page lists 26 effects and names 18 of them; 4 of those are already in Part 1 (Orbit, Digital Zoom, Checklist, Before and After). The other 14 are below. Where a frame in his reels plausibly shows the effect, it says so and marks the match as an inference, because only R04 puts names on screen. Seven have no confirmed frame anywhere and are marked "name only" (two of those have a possible match, noted).

### 8. Phone Mockup

**In the video.** Matched by inference. R01 0 to 4 s (two phone cards top corners), R01 about 8 to 9 s (four floating phones around him for the "cool girl" look), R07 about 13 to 14 s (three phones float in on "results like this"), R06 about 11 s (a phone card labelled "EDITED"), R08 about 30 to 31 s (a phone card slides in beside him). Real reels in phone frames, floating beside him, slightly tilted.

**Website version.** His real reels sit in phone frames beside the text they prove, drifting a little on scroll at different speeds. Only the phone nearest the centre of the screen plays (muted, looping); the others show posters. Tapping a phone opens it full size with sound.

**Build.** CSS phone frame (rounded rect, navy bezel); `<video preload="none">` with an IntersectionObserver that plays one at a time; GSAP `y` parallax at 0.85 to 1.15 speed. Existing block: `device-surface-showcase` blueprint. Reduced motion: posters only, no parallax, no autoplay.

**Fits.** UGC, AI Mastery portfolio, TheEditCompanion.

**Risk.** Several autoplaying videos destroy mobile data and battery: one at a time. AI pieces must be from the 21 verified AI clips; spec ads stay visibly unofficial.

### 9. UI World

**In the video.** Matched by inference. R01 about 6 s (a SKILL.md file window), 10 to 13 s (Claude desktop windows: chat with 5 clips, then a /video-edit run list); R05 throughout (Meta Ads screens, onboarding form, ad script card, optimizer); R06 about 17 to 19 s (skills settings panel, a toggle flips on); R08 about 14 to 18 s (a list of pasted links, then caption-style tiles). Real software windows floated over his footage.

**Website version.** The Growth OS shown as a world of real windows: the bigquivdigitals admin, the 200-lead scored pipeline, the Telegram course gate, the Peaceway bot. As you scroll, the windows assemble in 3D space at different depths, then the camera pushes into one, which becomes the section's full-size screenshot with callouts.

**Build.** CSS `perspective` container with windows at different `translateZ`; GSAP scrub on the container's `rotateX`/`translateZ`, then a scale-up of the chosen window. Existing block: `zoom-out-workspace-reveal`, `spatial-pan-stations` blueprints, `3d-page-scroll` rule. Reduced motion: windows stacked flat in a column.

**Fits.** Services (Growth Operating System). Work: the technical and content engine case study.

**Risk.** Screenshots must be scrubbed of client data, phone numbers and lead names. Text at an angle is unreadable, so the final flat state carries the reading. Image weight: AVIF, sized per breakpoint.

### 10. Odometer

**In the video.** Matched by inference. R07 about 5 to 8 s, the render counter rolls from "000 / 794" to "794 / 794" frames; R07 about 19 to 21 s, the red invoice total climbs through "$_20", "$750" to "$900". Numbers counting up to a final figure.

**Website version.** Proof numbers roll digit by digit when they enter view, each digit spinning like a counter wheel and settling right to left: 3,485 subscribers, 1M+ views, 128K views, 1.7K comments, N1,055 order total. The final number is already in the HTML.

**Build.** Each digit is a vertical strip of 0 to 9 inside an `overflow: hidden` cell; GSAP tweens `yPercent` to the target with a right-to-left stagger, `tabular-nums` so nothing jumps. Existing block: `counting-dynamic-scale`, `vertical-spring-ticker` rules, `hook-counter-burst` example. Reduced motion: the final number, static.

**Fits.** Home trust bar, case study headers, The Great Work and AI Mastery proof blocks.

**Risk.** The old site's count-up stuck at "0+" (positioning doc section 11, defect 3). Render the true number server-side and animate only on top. Only filed numbers: 8,874 is wrong and banned, "85% win rate" and "500+ members" are banned.

### 11. Chart Grow

**In the video.** Matched by inference. R05 about 38 to 58 s: a "Meta Ads Optimizer" panel with a cost-per-customer line falling to a target, followed by recommendation rows that tick. Labelled "EXAMPLE" on screen (a mock-up).

**Website version.** In a data case study, a line or bar chart draws itself as it scrolls in, with a readout that follows the line's head (month, value). Example: Alpha plays post views by month, honestly including the drop from about 3.5K in April to about 250 in August and September.

**Build.** SVG chart; path drawn with `stroke-dashoffset` on scrub; readout positioned with `getPointAtLength`. Existing block: `chart-scrub-readout`, `stat-bars-and-fills` rules, `dataviz-countup` blueprint. Reduced motion: the chart drawn, static, with the data table below it.

**Fits.** Alpha plays case study. Articles with data.

**Risk.** Trading numbers carry the rule: never a result without the original call beside it, risk note visible, no profit promise. Small axis labels on mobile.

### 12. Comment Bubble

**In the video.** Observed in every reel's ending, matched by name. R04 about 42 to 45 s (a comment pill "you VIDEO"), R07 about 24 to 26 s (comment box, "you EDIT"), R08 about 32 to 36 s (types "STUDIO", a DM reply "Sent you the invite, Open invite", then a Follow button presses to "Following"), R01 about 22 to 24 s (profile card and comments panel), R06 about 26 to 27 s (comments panel, then a DM card "Here's the link").

**Website version.** The site's real CTA, styled as a conversation: the contact or waitlist field types a suggested first message into its placeholder ("I want the Growth OS for my pharmacy"), and on a real submit, a reply bubble animates in confirming what happens next and when. No fake comments, no social-media chrome.

**Build.** A real `<form>` with a visible label; GSAP types the placeholder text once on enter; the reply bubble is the success state of the real request. Existing block: `prompt-type-submit-generate` blueprint, `cta-morph-press` blueprint. Reduced motion: static placeholder, instant reply state.

**Fits.** Contact, waitlist pages, TheEditCompanion buy block.

**Risk.** Imitating Instagram's UI or showing invented comments reads as fake proof. The input must be a working, accessible field, not a picture of one.

### 13. Green Screen

**In the video.** Matched by inference. R08 about 12 s, on "Green screen? Any day of the week": he appears cut out over a night city skyline next to another creator. Subject cut out, new background.

**Website version.** The cut-out portrait stays fixed while the world behind it changes chapter by chapter on scroll: a Lagos street, a desk with the dashboards, a pharmacy counter, a stage. Each background crossfades as its chapter heading arrives.

**Build.** Fixed cut-out layer (or the Three.js portrait) over background layers; ScrollTrigger crossfades `opacity` per chapter. Reduced motion: one background, no crossfade.

**Fits.** About (story chapters). Home portrait section.

**Risk.** Stock backgrounds look cheap. Never use any picture that could locate his home (standing rule).

### 14. Frame Break (name only)

**In the video.** Not seen in any frame. The name suggests the subject breaking out of a frame or card border.

**Website version.** The portrait sits inside a card on the About page; as you scroll, the card shrinks back while his head and shoulders stay full size and break over the card's top edge, as if stepping out of the frame.

**Build.** Two layers: the card background clipped to the card, the cut-out unclipped above it; GSAP scrub scales the card down and the cut-out up a little. Reduced motion: the final broken-out state, static.

**Fits.** About hero. Home if the 3D portrait is replaced by a 2D one on low-power devices.

**Risk.** Needs a clean cut-out with hair detail. Fine once; gimmicky if repeated.

### 15. Type Wall (name only)

**In the video.** Not seen. The name suggests the frame filled with words. Nearest observed: R06 0 to 4 s mixes script and heavy italic in one line ("you need EDITS").

**Website version.** A full-width wall of very large words, one row per idea (strategy, websites, AI video, community, reporting), rows sliding in opposite directions on scroll, then all but one word fade, and that word ("system") stays as the heading.

**Build.** Rows as flex lines with `xPercent` scrubbed in alternating directions; final fade via the same timeline. Existing block: `kinetic-type-beats` blueprint, `discrete-text-sequence` rule. Reduced motion: the one surviving heading only.

**Fits.** Services intro (the "one system, not five freelancers" argument). The Great Work transformation line (Confusion, Skill, Proof, Visibility, Monetization, Opportunities).

**Risk.** Overlaps with the marquee in Part 4: use one or the other per page. Text-as-texture is not read by screen readers properly; put the real sentence in the DOM and hide the wall with `aria-hidden`.

### 16. Zoom-Through Cut (name only)

**In the video.** Not seen. The name suggests zooming into an object until it becomes the next scene.

**Website version.** A section transition: scroll zooms into one letter of the hero word, or into the screen of a phone mockup, until it fills the viewport, and what was inside it becomes the next section's ground.

**Build.** Pinned section; an SVG text mask (or the phone screen) scales from 1 to about 40 with `transformOrigin` on the target; the next section's content sits behind the mask. Reduced motion: a plain cut to the next section.

**Fits.** Home hero to Work. TheEditCompanion hero to the demo.

**Risk.** Motion sickness at high scale speeds; keep it under one viewport of scroll. Pinned zooms are the most likely effect to stutter on mid-range phones.

### 17. Clone (name only, possible match)

**In the video.** Not confirmed. Possible match: R05 0 to 3 s, on the words "clone the", a "Media buyer, 10 years of experience" card with a red vertical line sweeping across it, the card appearing duplicated behind the line.

**Website version.** The portrait splits into three copies as you scroll, each labelled with a role (strategist, builder, producer), then they merge back into one with the line "one partner instead of five freelancers".

**Build.** Three.js: duplicate the portrait mesh with offsets, scrub the spread; or three copies of a 2D cut-out with GSAP `x` and opacity. Reduced motion: one portrait with the three role labels around it.

**Fits.** Services, Growth OS block. Home "what I do".

**Risk.** Three heads on screen can read as a gimmick; the merge back to one is the point and must land.

### 18. Couch Wall (name only)

**In the video.** Not seen. Probably a wall of content behind him on the sofa, a variant of Headline Wall. Nearest observed: R08 about 8 to 9 s, a full collage of reels behind him while he stays in front.

**Website version.** No separate effect. Build it as Knockout Tiles (21) or Headline Wall (1).

**Fits / Risk.** See 1 and 21.

### 19. Blackout (name only)

**In the video.** Not seen. Probably a hard cut to a black screen with one word.

**Website version.** "Navy out": a full-viewport navy panel with one sentence in Bricolage 800, arriving as a hard cut on scroll (no fade), held for one screen, then the page continues. Black is banned, so it is navy.

**Build.** A 100 vh section with `position: sticky` content; no animation at all, which is the effect. Reduced motion: identical (nothing moves).

**Fits.** Before the final CTA on The Great Work and AI Mastery. The 404 page as its whole layout.

**Risk.** Overlaps with Spotlight (4): one per page. Must not be black.

### 20. Timeline Burn (name only, likely match)

**In the video.** Likely match: R08 about 22 to 24 s, a clip timeline with its mistake segments shown in red, which are cut away while a label reads "6 cuts" and "39% of mistakes removed". Related: R07 about 2 to 3 s, a coloured editing timeline under the word "absolutely", and R06 about 15 to 16 s, a full editor timeline behind him.

**Website version.** A horizontal timeline that changes as you scroll. On TheEditCompanion: a raw take's waveform, the dead-air and mistake segments marked, then removed one by one so the bar shortens and a counter shows what was cut. On case studies: the project timeline from brief to live, each block filling in as you pass it.

**Build.** Flex row of blocks; GSAP scrub on each block's `flex-basis` to 0 with a stagger; counter via Odometer (10). Existing block: `panel-edit-live-sync` blueprint. Reduced motion: the before and after bars shown one above the other.

**Fits.** TheEditCompanion demo. Services process. Case studies.

**Risk.** The numbers on the counter must come from a real run, recorded.

### 21. Knockout Tiles (name only, possible match)

**In the video.** Possible match: R08 about 8 to 9 s, a collage of reels and screens fills the frame behind him while he stays cut out in front. R06 about 15 to 16 s does the same with an editor timeline.

**Website version.** A grid of his work thumbnails builds up behind the cut-out portrait on scroll, tile by tile from the centre outward, until it fills the section. Hovering a tile lifts it and shows the title; clicking opens the piece.

**Build.** CSS grid of tiles behind a cut-out layer; GSAP stagger `from: "center"` on `scale` and opacity. Existing block: `grid-card-assemble` blueprint, `center-outward-expansion` rule. Reduced motion: the full grid, static.

**Fits.** Work index. UGC.

**Risk.** Busy behind a face: tiles at reduced contrast so the portrait reads first.

---

## Part 3: In his reels, unnamed by him (13)

These are clearly designed effects that recur in the reels but never get a name on screen or on the sales page. The names are mine, descriptive.

### 22. Keyword Captions (word slam and font swap)

**In the video.** Every editing reel. R04 throughout: white bold words appear one by one, the key word in yellow ("kill the lights", "drop the clips"). R01 about 5 s: "no sense" in giant yellow; R07 about 4 s: "cooked." huge. R06 about 3 to 4 s: "you need" in script over "EDITS" in heavy italic; "fully", "boring", "100% for you" in script. R08: wide-tracked uppercase. Motion-blurred words on exit (R07 about 20 s).

**Website version.** Section headings reveal word by word as they enter, rising a few pixels with a short stagger, and each heading has exactly one keyword set apart: gold on navy sections, navy with a gold underline stroke on cloud sections. One "slam" word per page may come in at large size and settle. Optional soft word in Karla italic inside a Bricolage heading, used rarely.

**Build.** GSAP SplitText on `words`, stagger 0.04 s, `y: 12, opacity: 0`; the keyword is a `<span class="key">` in the markup, not chosen by script. Existing block: `kinetic-beat-slam` rule, `adapters/animate-text.md`. Reduced motion: headings fully visible, no split.

**Fits.** Every page heading. The slam word: home, The Great Work, AI Mastery heroes.

**Risk.** Gold text on cloud fails contrast (2.0:1), so on cloud the keyword is a stroke, not a colour. Split headings must keep the full sentence for screen readers (`aria-label` on the heading). No gradient text, ever.

### 23. Text Behind Subject

**In the video.** R01 about 1 to 3 s and 20 to 21 s ("claude", "course" in huge white letters with his cap and head in front), R04 about 35 to 38 s ("edited" behind his cap). Also listed in Part 4 because the brief asked for it as a standard effect: it is in the diary.

**Website version.** On home, a huge word sits behind the 3D portrait's head, and as you scroll the word slides sideways while the head stays in front, so the letters pass behind him.

**Build.** In the Three.js scene: the word as a plane or text mesh placed behind the portrait in depth; real occlusion. 2D pages: a cut-out PNG layer above the type layer. Existing block: `3d-text-depth-layers` rule. Reduced motion: the word static behind the head.

**Fits.** Home hero. About hero with a 2D cut-out.

**Risk.** The head can hide the letters that make the word readable: test the word at every scroll position, and keep the real H1 in the DOM elsewhere.

### 24. Look Swap

**In the video.** R01 about 8 to 10 s ("cool girl aesthetic": warm grade, gold serif italic, floating phones) against about 14 to 19 s ("cool dude aesthetic": cooler darker grade, wide-spaced uppercase sans, big serif "like this."). Same man, same room, two complete looks.

**Website version.** On TheEditCompanion and UGC, one demo clip with a two-way switch: Look A and Look B swap the caption style, type and grade of the same footage. It swaps on its own once when it scrolls into view, then the visitor toggles.

**Build.** Two pre-rendered versions of the clip, cross-faded with one shared `currentTime`; the switch is a real `<button aria-pressed>`. Reduced motion: two posters side by side, no auto-swap.

**Fits.** TheEditCompanion. UGC.

**Risk.** Only show looks the pack really produces, rendered by him.

### 25. Price Anchor Stack

**In the video.** R07 about 17 to 21 s: paper invoice cards ("Video editor, 1 video, $150") drop in and stack while a red counter tag climbs to "$900, every single video". R06 about 13 to 14 s: a quote card "Your video editor, monthly total $6,120", then a red X is drawn over it. R05 about 12 to 19 s: "Media buyer, monthly retainer" with "$4,000 every month" circled in red by hand.

**Website version.** On a pricing block, receipt cards for the old way drop and stack as you scroll, a total rolls up beside them, then the offer card lands on top with its own price. TheEditCompanion: cost of the alternative, then $67 founders, $97 after. Services: five freelancers and five invoices collapsing into one Growth OS card.

**Build.** GSAP stagger on `y` from -40 with a small random `rotation`; the total uses Odometer (10); a hand-drawn gold circle via `svg-path-draw`. Reduced motion: the finished stack and total, static.

**Fits.** TheEditCompanion pricing. Services Growth OS block.

**Risk.** High. Marc's own anchor numbers did not match his own sales page. Every anchor figure needs a source shown on the page; the positioning doc treats naira and dollar figures as planning assumptions, not a price list. Red is not a brand colour: use navy and gold.

### 26. Strike-Through Tools

**In the video.** R07 about 15 to 16 s: "CapCut", "Premiere Pro", "DaVinci" tags float in and get a red line through them. R08 about 6 to 7 s: the CapCut app icon with a red strike, next to the Edits app icon.

**Website version.** A short "the old way" list (five freelancers, five invoices, a timeline full of keyframes) where a gold hand-drawn line strikes through each item as it passes the middle of the screen, and the struck text drops to half strength.

**Build.** Items in `<del>` for meaning; an SVG path drawn with `stroke-dashoffset` over each; ScrollTrigger per item. Reduced motion: struck state, static.

**Fits.** Services. TheEditCompanion.

**Risk.** Third-party product logos and names struck out on a sales page invite trouble and read as petty: strike out situations, not brands.

### 27. Objection Cross-Off

**In the video.** R06 about 21 to 25 s: a card "To use this skill, you need to..." lists "Be a techie", "Know video editing", "Have Claude"; the first two get a red X and are struck through, the last gets a green tick.

**Website version.** On AI Mastery, a card for the buyer who has no skill yet: two things they think they need get crossed off, one real requirement gets a tick. It runs once as the card reaches the middle of the screen. This maps directly to the course promise (make things people pay for with AI without a camera, a crew or a budget).

**Build.** Same as Checklist (5): SVG X and tick drawn with `stroke-dashoffset`, text struck with a pseudo-element width tween. Reduced motion: final state.

**Fits.** AI Mastery hero or "is this for me". TheEditCompanion "what you need".

**Risk.** Never cross off a true requirement: TheEditCompanion needs a paid Claude plan and a computer, so those get ticks, not crosses. The AI class name is not locked, so the card names no course title until the owner picks one.

### 28. Handwritten Annotation

**In the video.** R07 about 10 to 12 s: yellow handwritten notes "can't edit" and "not techy" with curved arrows pointing at him.

**Website version.** Two or three handwritten notes with drawn arrows appear around the portrait or a case-study screenshot as it scrolls in: "built this", "real order, real total", "my dad's pharmacy". They draw on stroke by stroke.

**Build.** Arrow as an SVG path drawn with `stroke-dashoffset`; the note text revealed with a left-to-right `clip-path: inset()` tween. Handwritten face: Caveat, which the Big Quiv design system already carries (if the v3 site drops it, use an SVG of his own handwriting). Existing block: `svg-path-draw` rule. Reduced motion: notes shown, static.

**Fits.** Home portrait. About. Work case studies.

**Risk.** More than three notes per view is clutter. Gold strokes on cloud are fine as strokes; the note text itself goes navy on cloud.

### 29. Run Card

**In the video.** R01 about 10 to 13 s: a Claude window runs "/video-edit" and a list ticks ("Transcribing 5 clips", "Picking the best takes", "Cutting, captions, motion graphics", "Rendering"). R07 about 5 to 8 s: the same list beside the render panel. R06 about 5 s: "Editing your reel" with ticked chips (Best takes, Dead air, Cutout, Captions), then "Your reel is ready. 100%".

**Website version.** On TheEditCompanion, a card runs the real pipeline once as it enters view: each step spins, then ticks, a progress bar fills, and the last line reports the finished file. The steps are the pack's real stages, including the two approval gates.

**Build.** One GSAP timeline played on enter, not scrubbed; spinner as a CSS rotation; ticks via `svg-path-draw`. Existing block: `agent-progress-theater`, `transcript-scroll-artifact-reveal` blueprints. Reduced motion: the completed card.

**Fits.** TheEditCompanion hero or demo. Services (the seven-day sprint report).

**Risk.** It reads as a claim about speed and automation; label it as an illustration of steps, or drive it from a real recorded run.

### 30. Prompt Type-In

**In the video.** R08 0 to 2 s: a Claude input box where "edit it" types itself, beside the headline "Type 2 words, get a finished REEL". R06 about 6 s: a chat between Claude and him ("Hey! I see you dropped 4 new clips", "Yes, edit it!").

**Website version.** In the TheEditCompanion hero, a navy input bar types the real command, the send button presses, and the result (a finished reel in a phone frame) slides up from below.

**Build.** GSAP `text` plugin or character stagger for the typing; `press-release-spring` on the button; result enters with `y` and opacity. Existing block: `prompt-type-submit-generate` blueprint. Reduced motion: the typed command and the result, static.

**Fits.** TheEditCompanion hero. AI Mastery hero (a prompt typing into an AI tool, then the film it made).

**Risk.** A fake input looks clickable: mark it `aria-hidden` with a visible caption, or make it a real copy-to-clipboard command.

### 31. Logo Wall

**In the video.** R05 about 19 to 27 s: "BRANDS I HAVE RUN ADS FOR" over a grid of white logo tiles.

**Website version.** A wall of real clients and partners assembles tile by tile on scroll, each tile linking to its case study.

**Build.** Grid with stagger from the centre. Existing block: `proof-logo-chain` example, `grid-card-assemble` blueprint. Reduced motion: static grid.

**Fits.** Work index. Home trust section.

**Risk.** Highest claim risk in the catalogue. The spec ads (Gucci, Burger King, McDonald's, Nike, Lexus) are unofficial fan work and their logos must never appear on a "clients" wall. Peaceway is family and unpaid, never "client". Only logos with a filed proof block. If the wall would hold fewer than four honest logos, skip the effect.

### 32. Scan Card

**In the video.** R05 0 to 3 s: a profile card ("Media buyer, 10 years of experience") with a vertical red line sweeping across it as the card resolves.

**Website version.** A credential or case-study header card resolves behind a thin gold line that sweeps left to right as it scrolls in, like a scanner reading it: the IBM Data Analyst certificate on About, each case study's summary card on Work.

**Build.** `clip-path: inset(0 X% 0 0)` tween with a 2 px gold bar locked to the clip edge. Reduced motion: card visible, no sweep.

**Fits.** About credentials. Work case-study headers.

**Risk.** Low. The line is a plain stroke: no glow, no trail. One certificate only (the IBM one); never imply more.

### 33. Face Box Split

**In the video.** R05 throughout: his face in a rounded box in the lower third, motion graphics and screens filling the space above, uppercase captions between.

**Website version.** On long reading pages, a small rounded video of him explaining the page sits in the lower corner while the content scrolls above it; it can be collapsed to a dot and expanded again.

**Build.** `position: fixed` rounded video, captions burned or as a `<track>`; a ScrollTrigger hides it over the footer. Reduced motion: no autoplay; a poster with a play button.

**Fits.** The Great Work sales page, articles, doc template.

**Risk.** Covers content on phones: collapsed by default under 768 px. Video weight on every article: load only on demand.

### 34. Viewfinder Frame

**In the video.** R08 about 3 s: camera corner brackets, a "REC" dot and a running timecode framing him for a moment.

**Website version.** Corner brackets and a running timecode frame his UGC sample videos, so the section reads as "shot on a real camera, by a real person". The timecode ticks with the video's own time.

**Build.** Corner brackets as `::before`/`::after` borders; timecode from `video.currentTime` on `requestAnimationFrame`. The REC dot is gold, not red. Reduced motion: static brackets, no ticking.

**Fits.** UGC. AI Mastery (framing the films).

**Risk.** Gimmick if used beyond one section.

### Seen and rejected

- **Sparkle burst.** R07 about 4 s: "cooked." with gold sparkle particles and a glow. Glow is banned on the site; do not build.
- **Dark UI cards.** R04's checklist card and R08's input bar are near-black. Every UI card on the site is navy or cloud.
- **Black-box caption.** R02 0 s, white text on black boxes. Black ground, banned.

---

## Part 4: Standard premium scroll effects (not from the diary)

All marked "not from the diary", except text-behind-subject, which the diary turned out to contain (entry 23).

### 35. Parallax depth layers (not from the diary)

**Website version.** The home hero splits into three or four depth layers (ground shapes, portrait, foreground type, small proof chips) that move at different speeds as you scroll and shift a few pixels with the mouse, so the 3D portrait sits inside a real space.

**Build.** GSAP `y` per layer with speed factors (0.7, 1, 1.2) on scrub; mouse via `gsap.quickTo` on `x`/`y`. Reduced motion: layers fixed.

**Fits.** Home hero. Case study heroes.

**Risk.** Too much depth looks like a 2012 template. Small factors only.

### 36. Text behind subject (in the diary, see 23)

Covered in entry 23.

### 37. Clip-path reveals (not from the diary)

**Website version.** Case-study images and section photos open from a thin horizontal slit to full size as they enter, or from a small rounded rectangle to full bleed.

**Build.** `clip-path: inset(45% 0 45% 0 round 24px)` to `inset(0 0 0 0 round 0)` on scrub. Reduced motion: image shown.

**Fits.** Work, case studies, About.

**Risk.** Low. Do not clip the LCP image on load.

### 38. Horizontal pinned scroll (not from the diary)

**Website version.** The four case studies pinned in one section and moved sideways by vertical scroll, one full-width panel each, with a progress line.

**Build.** Pin the section; `xPercent: -100 * (panels - 1)` on scrub; `containerAnimation` for effects inside panels. Reduced motion: panels stacked vertically.

**Fits.** Work index. Home "selected work".

**Risk.** Breaks keyboard and screen-reader order if done badly; each panel needs to be reachable by Tab. Feels trapped on long sets: four panels maximum.

### 39. Magnetic buttons (not from the diary)

**Website version.** Primary CTAs (book a call, join the waitlist, buy TheEditCompanion) lean toward the cursor when it comes within about 80 px, and spring back when it leaves.

**Build.** `pointermove` on a wrapper; `gsap.quickTo(btn, "x")` with a 0.3 factor; elastic return. Reduced motion and touch: off.

**Fits.** All primary CTAs.

**Risk.** Low. Never on form submit buttons inside a form (the target moves while you aim).

### 40. Custom cursor (not from the diary)

**Website version.** A small navy dot follows the pointer; over a case-study card it grows into a labelled circle ("View case"); over the compare slider it becomes the "<>" handle.

**Build.** A fixed element moved with `gsap.quickTo`; state from `data-cursor` attributes. Keep the system cursor visible underneath, or hide it only on hover targets. Reduced motion and touch: off.

**Fits.** Work, home. Not on forms, legal or articles.

**Risk.** Hurts usability on reading pages and for low-vision users. Keep it out of anything with text input.

### 41. Number scramble (not from the diary)

**Website version.** Short labels and stats briefly cycle through random characters before resolving, e.g. the case-study number "03" or a status word.

**Build.** A small scramble function on `requestAnimationFrame` or GSAP ScrambleText. Reduced motion: final text.

**Fits.** Work index labels. 404 page.

**Risk.** On proof numbers it reads as "random" and undermines trust: use Odometer (10) for real figures, scramble only for labels.

### 42. Marquee (not from the diary)

**Website version.** A slow line of services or proof points runs across the page, and scroll velocity speeds it up or reverses it.

**Build.** Two copies of the row, `xPercent` loop; ScrollTrigger `onUpdate` reads `getVelocity()` to change `timeScale`. Reduced motion: static row, wrapped.

**Fits.** Home between sections. Services.

**Risk.** The old homepage's only visible element was a low-contrast marquee strip over a blank page (positioning doc section 11). Full contrast, and never the only content in view.

### 43. Image distortion on hover (not from the diary)

**Website version.** Hovering a case-study thumbnail ripples it slightly, as if under water, following the pointer.

**Build.** Needs WebGL; on this site it would have to render inside the portrait's single context or as a cheap CSS `filter: url(#displace)` SVG turbulence. Reduced motion and touch: off.

**Fits.** Work index only.

**Risk.** A second WebGL context per thumbnail is not allowed by the site rules and costs memory. The SVG filter version is cheaper. Most likely of all effects to read as gimmicky: optional.

### 44. Split-text reveals (not from the diary as such, see 22)

**Website version.** Large headings reveal line by line from behind a mask, each line rising into place.

**Build.** SplitText `lines` with `mask: "lines"`, `yPercent: 100` to 0, stagger 0.08 s. Reduced motion: heading visible.

**Fits.** All page heroes. Articles titles.

**Risk.** Combine with 22 per heading, not both on the same heading.

### 45. Stacking sticky cards (not from the diary)

**Website version.** The two courses or the Tier 3 entry points stack on scroll: each card sticks at the top while the next slides up over it, and the card underneath scales back a little.

**Build.** `position: sticky` cards with increasing `top`; GSAP scrub on the previous card's `scale` and `opacity`. Reduced motion: plain list.

**Fits.** Services (Tier 3 entry points). Home offer block.

**Risk.** The positioning doc forbids selling both courses to the same person in the same message: do not stack The Great Work and the AI class in one stack.

### 46. Scroll-scrubbed image sequence (not from the diary)

**Website version.** A short sequence (his hands on a keyboard, a render filling up) plays forward and back with scroll.

**Build.** 60 to 90 WebP frames drawn to a `<canvas>` by frame index from scroll progress. Reduced motion: one still.

**Fits.** TheEditCompanion. AI Mastery.

**Risk.** Frame weight adds up fast: under 3 MB total, preloaded only when the section is near.

### 47. Page transitions (not from the diary)

**Website version.** Moving from the Work index to a case study, the clicked card grows into the case study's hero image.

**Build.** View Transitions API with Next.js App Router (`view-transition-name` on the card and the hero), falling back to a plain navigation. Reduced motion: instant navigation.

**Fits.** Work to case study. Articles index to article.

**Risk.** Support differs by browser; the fallback must be clean.

---

## Page map (where each effect goes first)

| Page | Lead effects | Support |
|---|---|---|
| Home (3D portrait) | 2 Orbit, 23 Text behind subject, 1 Headline Wall | 10 Odometer, 22 Keyword Captions, 35 Parallax, 4 Spotlight before the CTA |
| Services | 9 UI World, 17 Clone, 25 Price Anchor Stack | 5 Checklist, 26 Strike-Through, 15 Type Wall, 45 Stacking cards |
| About | 14 Frame Break, 13 Green Screen chapters | 4 Spotlight, 28 Handwritten, 32 Scan Card |
| Work index | 38 Horizontal pinned scroll, 21 Knockout Tiles | 47 Page transitions, 31 Logo Wall only if honest |
| Case studies (4) | 3 Digital Zoom, 6 Freeze and Label | 11 Chart Grow (Alpha plays), 20 Timeline, 37 Clip-path |
| Contact | 12 Comment Bubble (real form) | 5 Checklist (what happens next) |
| The Great Work | 22 slam word, 4 Spotlight on the promise | 15 Type Wall (the transformation line), 33 Face Box, 19 Navy out |
| AI Mastery | 27 Objection Cross-Off, 30 Prompt Type-In | 8 Phone Mockup, 6 Freeze and Label, 34 Viewfinder |
| TheEditCompanion | 7 Before and After, 29 Run Card, 30 Prompt Type-In | 24 Look Swap, 20 Timeline Burn, 25 Price Anchor Stack, 5 Checklist |
| UGC | 8 Phone Mockup, 34 Viewfinder | 24 Look Swap, 21 Knockout Tiles, 7 Before and After |
| Articles | 44 Split-text title | 33 Face Box, 11 Chart Grow in data posts |
| Doc template | none beyond 44 | 33 Face Box if a video exists |
| Legal | none | none: plain, fast, readable |
| 404 | 19 Navy out | 41 Number scramble on the "404" |

## What could not be found

- **Seven sales-page effect names have no confirmed frame anywhere in the eight reels:** Frame Break, Type Wall, Zoom-Through Cut, Clone (one possible match), Couch Wall, Blackout, Knockout Tiles (one possible match). Their entries above are translations of the name, not of a seen effect. A further eight effects are counted on the sales page ("26 effects") but never named (18 named), so they could not be catalogued at all.
- **Six name-to-frame matches are inferences** (Phone Mockup, UI World, Odometer, Chart Grow, Timeline Burn, Green Screen): only R04 labels effects on screen.
- **No implementation of any diary effect exists in his pack or global skills** under these names. The building blocks exist in `hyperframes-animation` (rules and blueprints named per entry), which are video-composition code (seek-safe HyperFrames timelines), not website code; they translate to ScrollTrigger by replacing the paused timeline's time with scroll progress.
- **The paid FX Pack itself** (the real effect files and walkthroughs) is behind checkout and was never retrieved.
- **Unnamed-effect timestamps** are read from 1-frame-per-second grids, so they are plus or minus 1 s. R05 was read from its 12-frame contact sheet only, so its timings are coarser (plus or minus 3 s).
