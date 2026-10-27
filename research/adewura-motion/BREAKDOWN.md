# Adewura motion breakdown

Written 19 Oct 2026 for the BigQuiv Digitals v3 home page. Source: the Adewura repo (read only, cloned to the session scratchpad) and the live preview at https://adewura-preview.netlify.app, captured with Python Playwright at 1440x900 on the GPU (ANGLE D3D11).

Every number below comes from the code unless it says **measured**. Measured times come from the session videos at 10 frames a second. Where the code and the docs disagree, the code wins. One example: `docs/parent/DESIGN.md` says the parent stage is 560svh, but `site/src/style.css` sets 900svh.

## 0. What is in this folder

| Folder | Contents |
|---|---|
| `parent/` | Opener frames every 250 ms (`opener/o*.jpg`, file name = ms since navigation started), the overlay exit at 100 ms steps (`exit_*`), a returning-visitor reload (`returning_*`), 20 scroll steps of 5% (`scroll/`), hover/press states (`hover/`), phone at 390x844 (`phone/`), the session video (`video/parent-session.webm`, 79 s) and 10 fps video frames 0 to 11 s (`video_frames/`) |
| `natural/` | Same set for the Adewura Natural brand page, plus the phone menu open/close sequence |
| `ategbe/`, `farmers/` | Opener frames, scroll steps of 10%, phone menu, session video. These are for comparison only, with no hover set |
| `sheet_*.jpg` | Contact sheets, one per sequence (listed in section 11) |

Capture notes:
- The first run used software WebGL (SwiftShader). It took about 9 s per screenshot, so those frames were useless and were deleted. The final run used the GPU and took about 80 ms per screenshot.
- The parent's first two opener frames are late (0.8 s, then 2.3 s) because the page was still loading. After that the 250 ms grid holds.
- On Natural, no screenshot could be taken from 0.85 s to 4.4 s because the main thread was busy building the 3D bottle. The 10 fps video covers that gap.
- Natural's capture: `.welcome__quiet` (Enter without sound) was clicked at 9.5 s.

---

## 1. Loading sequence, parent page (`site/src/opening.js`, `main.js`)

### 1a. Second by second (measured, parent video `sheet_parent_video_0-11s_10fps.jpg`)

| Time | What is on screen | Code behind it |
|---|---|---|
| 0.0 to 1.4 s | White. HTML and CSS are still loading | |
| 1.4 to 2.1 s | **The real page flashes for about 0.7 s**: sky, "Three houses. One family." and the scroll cue, with no overlay. | The overlay is built by the bundled module (`dist/main.js`), so the first paint happens before it exists. `main.js` also sets `intro.style.opacity = '0'` at runtime, which is too late to prevent the flash. **This is a defect. Do not copy it.** |
| 2.1 s | Cream overlay (`--paper #F5EFE4`, 12% multiply grain) with "Adewura Group" in the middle | `.opening` is `position: fixed; inset: 0; z-index: 100`. The mark rises from opacity 0 and y +10px to y 0 over **0.6 s, `power3.out`**. Font: Noto Serif Display 500, `clamp(2.4rem, 7vw, 4.5rem)`, letter-spacing 0.02em |
| 2.1 to 3.1 s | The mark holds | `await wait(1000)`, counted from the start of the fade |
| 3.1 to 3.9 s | The mark glides up and shrinks into the header wordmark slot | FLIP-style move: `x`/`y` = the distance between the centres of the two boxes, `scale = header height / mark height`, **0.8 s, `expo.inOut`**. The target is `#wordmark` in the real fixed header (1.5rem). The overlay mark stays in the header until the overlay leaves. |
| 4.0 to 4.1 s | "load" and "ing" letters fade up | `font: 300 clamp(3.4rem, 9vw, 9.5rem)` Noto Serif Display. The word is about 42% of the screen width, matched to UNESCO. Each letter is its own span, `from {opacity:0, y:10}`, **stagger 0.03 s, 0.4 s, `power3.out`** |
| 4.1 to 6.5 s | Icons swap in the gap: flower, crown, bead fringe, leaf, cowrie/drum, whisk | One icon every **400 ms**. Each pops `scale 0.55→1, opacity 0→1` over **0.22 s, `power3.out`**. The gap is `1.6em × 1.1em`, and the icon SVG is 1.3em, so it is as tall as the letters. Icons interleave the three houses (Natural, Àtègbè, Farmers, Natural, ...) and are solid ink with "cut" shapes filled in the ground colour. |
| 6.3 to 6.6 s | The gap closes. "load ing" becomes "loading" | gap `width → 0` over **0.35 s, `power3.inOut`**, and the icon is cleared on start |
| 6.6 to 7.3 s | The word ripples | every letter `y −8px`, **0.16 s `power2.out`, yoyo, repeat 1, stagger 0.035 s** (a wave left to right) |
| 7.3 to 7.7 s | Letters break into dots | `scale 0.15, opacity 0`, **0.3 s `power2.in`, stagger 0.03 s**. Then the loader is removed |
| 7.7 to 9.1 s | The cream lifts off and the 3D cloud sky shows through | `.opening.is-sky`: background to `rgba(245,239,228,0)` over **1.4 s `power2.inOut`**. The grain fades over 1.2 s (CSS transition) |
| 7.8 to 8.8 s | The welcome builds up on the sky | Children of `.welcome__center` (title, "Three houses. One family.", the family logo tree, the Enter pill): `from {opacity:0, y:24}`, **0.8 s `power3.out`, stagger 0.09 s**. The title is `clamp(3.8rem, 13vw, 10rem)/0.9`. The subtitle is italic clay `#8E4F33`. |
| ~8.8 s | Welcome is complete and waiting | Focus goes to "Enter with sound" with no focus ring (`.no-ring`). The ring returns on the first keydown. The foot row reads "Best with sound on" on the left and "Enter without sound" (an underlined text button) on the right. |
| click | Overlay leaves | `opacity 0, filter blur(10px), scale 1.03`, **0.8 s `power2.out`**, then the overlay is removed. At the same moment the intro fades in: `opacity 0→1`, **1.1 s, delay 0.35 s, `power2.out`**. The page unlocks: `html overflow` is restored, then `lenis.start()` and `ScrollTrigger.refresh()` run. |

Total for a first visit: **about 7.8 s to the welcome, about 8.8 s until it is complete**. After the click there is 0.8 s of exit.

### 1b. How readiness is decided

- Parent: `ready = document.fonts.ready`. The loop runs `while (shown < 6 || !isReady)`, so there are **at least 6 icons (2.4 s)**. The cap is `Promise.race([ready, wait(7000)])`: the loop stops at whichever comes first, readiness or 7 s. The 3D scenes are not part of readiness. They load lazily on scroll (section 3).
- Brand pages: `ready = Promise.all([sceneReady, document.fonts.ready])`, where `sceneReady` resolves after the Three.js scene is built (one `requestAnimationFrame` plus `setTimeout(60)` after the opener starts). The minimum is **3 icons**, with the same 7 s cap.
- No percentage counter. The HTML holds all the text from the start, for SEO and screen readers.

### 1c. Enter and sound choice

The welcome has two choices: `.welcome__enter` resolves `true` (with sound) and `.welcome__quiet` resolves `false`. The welcome exists **only because browsers block audio until a tap** (UNESCO's "Visit now" does the same job). `onEnter(withSound)` sets the sound state, writes the session key, unlocks scroll and refreshes ScrollTrigger.

### 1d. Returning visitor

`sessionStorage['parent-entered'] = '1'` (per brand: `natural-entered`, `ategbe-entered`, `farmers-entered`). On a reload in the same tab session there is **no overlay at all**, sound is off and the page is live at once (measured: `returning_0..2.jpg` at 0.3, 0.7 and 1.5 s all show the intro with no overlay). A new tab or a new session plays the opener again.

### 1e. Reduced motion

The mark is hidden, the opener skips straight to `await ready`, the sky fade takes 0.01 s, the welcome appears without the stagger, and the exit is a 0.25 s opacity fade with no blur or scale.

## 2. Loading sequence, brand pages (how each differs)

All three brand pages use the same five steps (mark, move to header, load___ing, welcome, exit). The welcome has no sky. It sits on the brand ground and adds a **"Book a call" pill** next to Enter.

| Step | Natural (calm) | Àtègbè (ceremonial, slowest) | Trust Fund (punchy, fastest) |
|---|---|---|---|
| Ground | radial `#4f7a49` to forest `#467041`, mint `#F2F5EC` type | amber `#FFB100` with bead pattern, indigo `#301F93` type | butter `#F7F290`, olive `#403F2B` type |
| Mark in | opacity/y +16px/**blur 6px→0**, 0.9 s `power2.out` | y +14px, 0.9 s `power2.out` | y +12px, 0.5 s `power3.out` |
| Hold | 1200 ms | 1300 ms | 900 ms |
| Move to header | 0.95 s `power3.inOut` | 1.0 s `power3.inOut` | 0.75 s `expo.inOut` |
| Letters in | y 8px, stagger 0.04, 0.6 s `power2.out` | y 8px, stagger 0.05, 0.6 s | y 10px, stagger 0.03, 0.4 s `power3.out` |
| Icon swap | **460 ms**, pop `scale 0.7, rotate −8°→0`, 0.32 s `power2.out` | **520 ms**, `scale 0.8→1`, 0.35 s | **380 ms**, `scale 0.55→1`, 0.22 s `power3.out` |
| Min icons | 3 | 3 | 3 |
| Gap close | 0.45 s `power2.inOut` | 0.5 s | 0.35 s `power3.inOut` |
| Word out | ripple y −6px 0.22 s `sine.out` yoyo, then **lift and blur away** (y −10, blur 4px, 0.4 s `power2.in`, stagger 0.03) | **sinks like powder**: y +6, blur 6px, 0.6 s `power2.in`, stagger 0.05, no ripple | same ripple and dot-scatter as the parent |
| Welcome in | y 18px **blur 6px**, 0.9 s, stagger 0.1 | y 18px, 1.1 s, stagger 0.14 | y 24px, 0.7 s `power3.out`, stagger 0.08 |
| Exit | opacity 0, blur 12px, 0.9 s `power2.out` | blur 8px, 1.0 s `power2.inOut` | blur 10px, 0.7 s `power2.out` |

**Natural, measured** (`sheet_natural_video_0-12s_10fps.jpg`): the page shows for 0.2 s with no overlay. The mark appears at 0.3 s but **stalls at half fade from 0.3 to 2.4 s** while Three.js builds the bottle and its 2560x1000 label texture on the main thread. It then finishes, moves at 2.8 to 3.1 s, the loader starts at 3.4 s, icons show at 3.6, 4.0 and 4.4 s, the gap closes at 4.8 s, "loading" holds until 6.6 s, the welcome builds at 6.8 to 7.6 s and the exit ends at about 8.4 s. **Lesson: build heavy 3D off the critical frames, or in a worker. The stall shows.**

---

## 3. Parent page structure and scroll

### 3a. Sections in order

| # | Section | Height | Ground | Pinned? |
|---|---|---|---|---|
| — | Fixed header `.nav`, 4.5rem (72px) | fixed | transparent; colour changes per house | always |
| 1 | `.stage#top` | **900svh = 8100px** at 900px tall | Inside `.stage__sticky` (`position: sticky; top: 0; height: 100svh; overflow: hidden`): CSS sky gradient, WebGL clouds canvas, rays, intro, three "doors" stacked absolutely, a white veil | **yes, for 7200px of scroll** |
| 2 | `.foot` | ~475px | `--paper-2 #EBE2D2` | no |

Scroll length: scrollHeight 8575, max scrollY 7675. Stage progress `p = scrollY / 7200`, through one `ScrollTrigger` (`start: top top, end: bottom bottom`, `onUpdate → setProgress(self.progress)`). In everything below, **px = scrollY at 1440x900**.

### 3b. Effects in scroll order

**Intro sentence (word-by-word blow-away).** The four words of "Three houses. One family." Word *i* runs `t = range(p, 0.01 + 0.008i, 0.06 + 0.008i)`, from 72 to 432px for word 0 and from 245 to 605px for word 3. Each word gets `translate3d(4rem·t, −2.6rem·t, 0) rotate(6°·t)`, `opacity 1 − 1.7t` and `blur(5t px)`. The scroll cue fades over `p 0 → 0.03` (0 to 216px).

**Scroll cue.** A 4.5rem ring with a 1.1x1.65rem mouse. The ring loops on 2.6 s `ease-in-out`: opacity 0.35, out to 0 at 32%, shrinks to 0.88 at 55%, back to 0.9 opacity at 76%. The wheel dot drops 0.4rem and fades over the first 45% of the same 2.6 s, `cubic-bezier(0.23,1,0.32,1)`. This copies UNESCO's measured 2.5 s cycle.

**Particles (2D canvas over the intro).** 200 particles, or 120 in low power. 45% soil dust (r 0.6 to 1.8, browns), 20% hibiscus petals (ellipses r 3 to 5.5, reds, spin 1.4 rad/s) and 35% divination powder (r 0.5 to 1.3, tan). They drift right at 16 to 50 px/s with a sine bob of ±12 px/s. Scroll adds a gust: `gust = p/0.08` (0 to 576px) multiplies the x speed by `(1 + 8·gust)` and adds a lift of −26 px/s. They fade over `p 0.06 → 0.12` (432 to 864px).

**Cloud fly-through (WebGL, `clouds.js`).** About 560 instanced billboard puffs (300 in low power): a sea below (46%), side walls (30%), high wisps (8%) and **three cloud banks across the path** (16%). Each puff texture is 22 soft radial blobs drawn once on a 256px canvas. Shading is lit from above: `mix(shade, lit, 0.3 + uv.y·0.7)`, with distance fog to `uFar` from 35% to 100% of 220 units. Puffs fade as the camera passes within 0.6 to 7 units. Camera: 55° FOV (68° on portrait screens), tilted −0.06 rad, an idle bob of `sin(t·0.13)·0.8` on x and `sin(t·0.21)·0.35` on y, and puffs drift `sin(t·0.05 + phase)·1.6`. Pixel ratio is capped at 1.5 (1 in low power), with no antialias.

Camera z follows a keyed path with smoothstep between keys, and the render eases towards it at `1 − e^(−6·dt)`:

| p | 0 | 0.07 | 0.20 | 0.34 | 0.47 | 0.61 | 0.74 | 1.0 |
|---|---|---|---|---|---|---|---|---|
| px | 0 | 504 | 1440 | 2448 | 3384 | 4392 | 5328 | 7200 |
| z | 10 | 10 | −110 | −128 | −238 | −256 | −366 | −392 |

So the camera **holds for the intro, flies 120 units into each house, drifts only 18 to 26 units while a house is on screen, then flies again.**

**The white flash (cloud bank).** Banks sit at z −55, −183 and −311. `fog = 1 − |z − bank| / 26`, and `veil.opacity = smoothstep(fog) × 0.94`. The veil is a radial `#fffaf3 → #f6ece2`. Computed windows: **bank 1 from 864 to 1131px (peak 998)**, **bank 2 from 2758 to 3074px (peak 2916)** and **bank 3 from 4702 to 5018px (peak 4860)**. Each bank fires `sound.passage()` once per pass (when fog > 0.2, re-armed below 0.02).

**Sky tint per house.** CSS custom properties on `.sky` feed `linear-gradient(top, mid 48%, low)` plus a warm radial at the top. The cloud shader gets `lit/shade/far`. Keys: dawn at p 0.07 (`#c3d6e6 / #f3e2d6 / #f8eee4`), amber for Àtègbè at 0.20 (`#f2d9a6 / #fae8c9 / #f8efe1`), butter for the farm at 0.47 (`#cfe0e9 / #f7efc4 / #f7f2dd`) and sage for Natural at 0.74 (`#cde2d5 / #e8f0e0 / #f4f6ee`). The colour changes only from `at_i + 0.03` to `at_j − 0.02`, so it shifts mostly while hidden in a bank.

**Light rays.** Four blurred (8px) screen-blended linear-gradient beams at 101°, 83°, 94° and 107°. They sway `rotate(−2.5° ↔ 2.5°)` with opacity 0.7 to 1 on a **16 s `ease-in-out` alternate** loop.

**Doors (the three houses arriving out of the clouds).** Each door has its own canvas with the brand's own Three.js scene, `import()`ed when `p > at − 0.14`. On desktop the canvas sits at `left 36%, width 64%`. On phone it fills the top 48%.

| | Àtègbè `at [0.20, 0.34]` | Farmers `at [0.47, 0.61]` | Natural `at [0.74, 2]` |
|---|---|---|---|
| Scene import | p > 0.06 (432px) | 0.33 (2376px) | 0.60 (4320px) |
| Arrive `e` (a−0.06 → a+0.005) | 1008 → 1476px | 2952 → 3420px | 4896 → 5364px |
| Text in (a−0.012 → a+0.02) | 1354 → 1584px | 3298 → 3528px | 5242 → 5472px |
| Text out (b ± 0.015) | 2340 → 2556px | 4284 → 4500px | never |
| Rush past `l` (b → b+0.055) | 2448 → 2844px | 4392 → 4788px | never |

- Canvas scale = `(0.45 + 0.55·easeOut(e)) × (1 + 1.5·l²)`. It **arrives at 45% size and grows to 100%, then rushes past the camera to 250%** while fading (`opacity = e·(1−l)`).
- Text block: `opacity tIn·(1−tOut)`, `translateY((1 − easeOut(tIn))·6vh − tOut·4vh)`. It rises 6vh in and leaves 4vh up. `.is-open` (pointer events on) only applies while `tIn > 0.9 && tOut < 0.1`.
- Object pose: each scene's own progress goes from 0.07 to a rest pose with `easeOut(e)` (rest: Àtègbè 0.32, Farmers 0.4, Natural 0.315). It then idles `sin(time·0.35 + i·1.7)·sway` (sway 0.05, 0.045, 0.012). The idle runs on the GSAP ticker, not the scroll.
- Arrival fires `sound.house(i)` (its bowl plus a 4-bell jingle) once per arrival.
- Only doors on screen render (`setRunning(door, shown > 0)`). Clouds and particles stop when the stage leaves view.
- Door type is each brand's own: Cormorant Garamond 600, Archivo 900 at 125% width in uppercase, and Young Serif. The names are `clamp(2.8rem, 6.8vw, 6.5rem)/0.95`.

**Nav colour by section (parent).** `nav.dataset.on` = the brand whose door is more than 50% shown. Colour changes over **400ms `ease`**: ink `#2B2420` with no house, indigo `#301F93` for Àtègbè, olive `#403F2B` for Farmers and forest `#467041` for Natural. The 1px rule under the nav is `currentColor` at 25%. The matching nav link gets `aria-current` (opacity 1 plus underline). **Measured** at 15% (1286px) indigo, 40% olive, 60% onwards forest, and ink inside the banks at 35% and 55%.

**Visit, the colour flood.** Clicking "Visit" floods a fixed div of the house ground out from the pointer: `clip-path circle(0% at x y) → circle(150% at x y)`, **0.7 s `power3.inOut`**, then `location.href`. Sound stops. `pageshow` removes a stale flood after the Back button. The brand page's own opener then takes over.

**Nav link jump.** It runs `lenis.scrollTo(stageTop + 7200·(at + 0.03))` over **2.2 s**, which lands exactly when the house has arrived.

**End of the page.** After p = 1 the stage unpins and the footer (family logo tree, `#EBE2D2`) scrolls up. Measured at 90 to 100%: the fixed transparent nav **overlaps the Natural door text** as it scrolls under the header. That is a small defect.

---

## 4. Brand page structure and scroll (Adewura Natural, captured in full)

### 4a. Sections in order

| # | Section | Height (1440x900) | Ground | Pinned? | `data-nav` |
|---|---|---|---|---|---|
| 1 | `.stage` | **640svh = 5760px**, scroll span 4860px | radial `#4f7a49` at 50% 62% → forest `#467041` 58% | **sticky 100svh** | (none: transparent nav, mint type) |
| 2 | `.restoria` | ~1100px | hibiscus `#B4262E`, blush type `#FFE3E0` | no. It has `margin-top: −6svh` and an **arched top** (`border-radius: 50% 50% 0 0 / clamp(2rem,6vw,5rem)`), so the red panel rises over the pinned green stage as a dome | `rose` |
| 3 | `.range` | ~1700px (float area `clamp(52rem, 92vw, 74rem)`) | leaf `#E4EBDC` | no | `leaf` |
| 4 | `.director` | ~900px | paper `#F8F6F3` | no | `paper` |
| 5 | `.closing` | ~800px | forest | no | `forest` |
| 6 | `.foot` | ~200px | forest, 1px mint rule at 20% | no | |

The page is 10622px tall. Stage `px = p × 4860`.

### 4b. Stage, beat by beat (scroll position → what happens)

| px | p | Bottle pose (y, x, rx, ry, rz) | Overlay |
|---|---|---|---|
| 0 → 243 | 0 → 0.05 | below frame `y −4.8`, rx 0.25, ry −0.6, rz 0.1 | "Rest is not a luxury." Hibiscus petals drift. |
| 73 → 646 | | | **Words lift away**: word *i* `range(p, 0.015 + 0.012i, 0.085 + 0.012i)`, `translateY(−3.5rem·t)`, opacity `1 − 1.4t`, `blur(8t px)` |
| 97 → 680 | 0.02 → 0.14 | | **Petals part** left and right from the middle: push `side × part × (120 + near·w·0.35)` px, eased at `dt·3` |
| 243 → 826 | 0.05 → 0.17 | **rises** to y 0, rx −0.15, ry −0.35 | Air sound follows scroll speed from p 0.03 to 0.2. Petals fade from 583 to 972px. |
| 729 → 1021 | 0.15 → 0.21 | | Ghost headline 1 "Quiet your mind at night" in |
| 826 → 1507 | 0.17 → 0.31 | **tumbles a full turn** forward (rx −0.15 → 3.0 at 0.24 → 6.23 at 0.31) and lands label-forward | Side note fades in from 1166 to 1458px (`translateY 0.75rem → 0`) |
| 1507 → 1701 | 0.31 → 0.35 | | Ghost 1 out |
| 1507 → 1847 | 0.31 → 0.38 | slides left: x −2.1, ry −0.25 | |
| 1701 → 2041 | 0.35 → 0.42 | | **3D hibiscus** scales in to the right of the bottle, rising 0.8 units, three-quarter view, idling `sin(t·0.5)·0.08` and `sin(t·0.3)·0.25`. Ghost 2 "Hibiscus" enters from 1750 to 2041px. |
| 1847 → 2430 | 0.38 → 0.50 | holds left, ry turns −0.25 → 0.35 | |
| 2430 → 2819 | 0.50 → 0.58 | back to centre, rx 6.73 (tilts to show the top) | Ghost 2 out 2430 → 2624. Hibiscus out 2527 → 2867 |
| 2673 → 3062 | 0.55 → 0.63 | | **Peperomia leaves** (14 instanced, 8 in low power) spiral in on a ring of radius 1.15 to 1.7 with staggered delays (0 to 0.35). Ghost 3 "Peperomia pellucida" enters from 2673 to 2965px. |
| 2819 → 3402 | 0.58 → 0.70 | ry −0.4 | |
| 3353 → 3548 | | | Ghost 3 out. Leaves spin out and drop from 3402 to 3791px |
| 3402 → 3791 | 0.70 → 0.78 | **lies on its side** (rz −1.57), y −0.8 | Ghost 4 "350 mg of botanicals" enters from 3596 to 3888px |
| 3791 → 4277 | 0.78 → 0.88 | rests sideways, rz −1.62 | |
| 4277 → 4520 | | | Ghost 4 out. The side note fades from 4180 to 4471px |
| 4277 → 4860 | 0.88 → 1.0 | **drops away**, y −5.6 | The hibiscus panel arch rises over the stage (measured at 50%, 5307px) |

The pose follows the target with `cur += (target − cur)·(1 − e^(−4.5·dt))`, so fast back-and-forth scrolling never jumps. It floats `sin(t·0.8)·0.035`. Sideways moves scale to 0 on narrow screens (`xs = clamp((aspect − 0.8)/0.75)`). A CSS elliptical shadow under the bottle scales `0.35 + 0.65·near` and fades with height. The camera is 26° FOV at z 10. Lighting: key `#fff8ee` 2.1, rim `#e9f5dd` 1.6, hemisphere 0.55, RoomEnvironment at 0.7 and Neutral tone mapping. The bottle is lathe-built with a ribbed cap, plus a canvas-drawn label transcribed from the real one.

### 4c. Ghost-trail headlines (`ghost.js`)

- **Layers:** the main line plus **4 copies** (Natural and Farmers) or **3 copies** (Àtègbè). The copies are sage `#c8ddb0` behind the mint line. Font Young Serif `clamp(3rem, 9.4vw, 8.75rem)/0.96`, letter-spacing −0.025em. Each headline auto-shrinks by 5% steps until its longest word fits.
- **Enter `e` and exit `x`** are scroll ranges (Natural `GHOST_TIMES`: [0.15, 0.21, 0.31, 0.35], [0.36, 0.42, 0.50, 0.54], [0.55, 0.61, 0.69, 0.73], [0.74, 0.80, 0.88, 0.93]). That gives about 290px of scroll to arrive, about 480px to hold and about 200px to leave.
- **Main line:** `settle = backOut(e, s = 1.6)`, a small overshoot. `y = (1 − settle)·0.55em − x·0.7em`, opacity `min(1, 1.8e)·(1 − x)`.
- **Copies:** offset `(1 − e)·i·0.3em + x·i·0.24em` below the line, alpha `max(4e(1−e), 4x(1−x))·(0.42 − 0.075i)`, blur `i × 1.1px`. The smear peaks mid-arrival and mid-exit and is zero at rest.
- Àtègbè uses a cubic `easeOut` with **no overshoot**: y offset 0.4em in and 0.45em out, copies at 0.2em and 0.16em, alpha `0.3 − 0.07i`, blur `i × 1.6px`.
- Landing (the first frame where `e ≥ 1`) fires `sound.chime()`. It re-arms when `e < 0.9`.
- Fully reversible: scrolling back plays it in reverse.

### 4d. After the stage

- **Restoria panel (sliding colour panel):** it has no tween. It works through layering: `z-index 5`, `margin-top −6svh` and an arched top, so the hibiscus-red dome climbs over the pinned green stage as the stage releases. The **label card** inside (paper, `rotate(−1.2°)`, with a deep red shadow) scrubs `from {rotate −6°, y 60, opacity 0}` from `top bottom` to `top 65%`.
- **Glitch headline "Why plants first" (used once):** ScrollTrigger from `top 88%` to `top 40%`, `g = max(0, sin(π·p)·(0.55 + 0.45·sin(46p)))`. `::before` is hibiscus, shifted `(−0.06em, +0.02em)·g` and clipped to `inset(10% 0 52% 0)`. `::after` is forest, shifted `(+0.05em, −0.02em)·g` and clipped to `inset(58% 0 6% 0)`. Both are at opacity `g`. It peaks mid-range with about 7 flickers and settles to zero. It is off under reduced motion.
- **Floating photos at depth:** seven product bottles absolutely placed in `.range__float`. Each moves `y = depth × −520px` (wide) or `× −180px` (≤760px) with `ease: none`, scrubbed from `#float top bottom` to `bottom top`. Depths 0.16, −0.10, 0.24, −0.18, 0.08, −0.06, 0.20 give **−83, +52, −125, +94, −42, +31, −104px** over the pass. Some rise and some sink, which reads as parallax. Each image has a 1rem radius and a green-tinted drop shadow. On phones it becomes a 2-column grid with even items offset by 2.5rem.
- **Nav colour by section:** `navTheme()` runs on every Lenis and native scroll. It picks the `[data-nav]` section under the nav's mid-line. `.is-solid` turns on when the stage bottom is at or above the nav height, and from then on the nav gets a **solid background** of that section's ground. Colour and background change over **400ms `cubic-bezier(0.22,0.61,0.36,1)`**. Measured: transparent with mint type through 50%, solid hibiscus with blush type at 55 to 60%, a mid-transition frame at 65%, leaf with forest-deep type at 70 to 80%, paper at 85 to 90% and forest with mint at 95 to 100%. On leaf and paper the "Book a call" pill flips to a forest fill.
- **Section "door" sounds:** each section after the stage has a trigger from `top 55%` to `bottom 45%`. Entering fires `sound.section(i)` (a whoosh and a bowl) with a **1500ms cooldown** between doors.

### 4e. How the other two brand pages differ

| | Natural | Àtègbè | Trust Fund |
|---|---|---|---|
| Lenis lerp | **0.075** | **0.075** | **0.1** |
| 3D follow rate | `e^(−4.5dt)` | `e^(−4dt)` (ceremonial) | `e^(−7dt)` (snappy) |
| Stage | 640svh | 600svh | 600vh |
| Object | Restoria bottle: rise, tumble, aside, sideways, drop | beaded crown: rise, slow turn ry −0.5 → 4.1, tilt rx 0.58 to show the top at 0.46, **rises away** y +6.8. The bead fringe hangs on a damped spring driven by the crown's motion. | maize cob: rise, turn ry to 5.6, **husk peels** (peel 0 → 1 by 0.46), lies sideways (rz −1.75), **kernels fall** (fall 0.12 → 1 from 0.72 to 1.0) |
| Particles | 34 hibiscus petals (20 low) that **part** | 320 powder grains (180) that **thicken, then sink and settle**. No gusts. | 230 soil dust (130) that **blows harder** with scroll |
| Sentence exit | lift −3.5rem, blur 8 | **sink +1.6rem**, faster stagger 0.006 | blow right 5rem, up 3.2rem, rotate 8°, blur 6 |
| Ghosts | 4 copies, overshoot | 3 copies, no overshoot, "never glitch" | 4 copies, overshoot |
| Panels | hibiscus dome overlap, label scrub | **laterite services panel wipes up**: `clip-path inset(12% 0 0 0 round 2.5rem 2.5rem 0 0) → inset(0 round 0)` scrubbed from `top bottom` to `top 30%`. List items fade up 24px over 1.1s, once, at `top 88%`. | "Programs" headings slide `xPercent ±14 → 0` (alternating sides) from `top bottom` to `top 50%`, desktop only. The field collage tiles float at depth ×−520 / −200. **Videos load and play only on screen** (IntersectionObserver, 200px margin). |
| Glitch | one ("Why plants first") | **none** (sacred words) | none in code |
| Nav theme | by `[data-nav]` + `is-solid` | indigo by default, `laterite` while `#services` passes the top 8% | always solid. The ground follows #programs maize, #field and #mission cream, #involved leaf, with a **300ms** transition |

---

## 5. Mouse and touch

| Element | Rest | Hover (only `(hover: hover) and (pointer: fine)`) | Press |
|---|---|---|---|
| Pill button (parent `.pill`) | ink fill, min-height 2.75rem, radius 999px, 1.5px border | `.pill--solid`: the round arrow dot slides **+3px** over **220ms `cubic-bezier(0.23,1,0.32,1)`**. `.pill--line`: should fill with the line colour, **but inside doors `.door .pill--line` (same specificity, later in the file) overrides it, so the parent "Book a call" shows no visible hover**. Measured in `hover_crops`. Bug: do not copy. | `scale(0.97)`, **160ms** ease-out |
| Pill (Natural) | mint `#F2F5EC` on forest, min-height 3rem | `.pill--mint` → **blush `#FFE3E0`** fill. `.pill--mint-ghost` → fills mint with forest-deep text. `.pill--forest` → forest-deep. Colour over **260ms `cubic-bezier(0.22,0.61,0.36,1)`**, arrow dot +3px over 260ms. Measured. | `scale(0.97)`, 160ms |
| Nav links | parent: opacity 0.8 | parent: opacity 1 over 200ms. Natural: an underline fades in from transparent to `currentColor` over 200ms (measured) | |
| Logo / wordmark | Noto Serif Display 500 1.5rem (parent), Young Serif 1.5rem (Natural) | **no hover state** (measured) | links to `#top` |
| Family logos (footer) | | `translateY(−3px)`, 200ms ease-out | `scale(0.97)` |
| Sound toggle | 2.75rem circle, 1.5px border. Parent: 4 bars at `scaleY(0.28)`. Natural: a flat line | none | `scale(0.94)`, 160ms. When on: the parent bars bounce `scaleY 0.2 ↔ 1` at **1100ms alternate** with offsets −350/−700/−180ms. Natural's line **morphs** (`d` path, 300ms) to a sine wave drifting ±1px over 2.4s. |
| Text link (Natural) | underline at 50% mint | underline at full colour, 200ms | |
| Cursor | **default system cursor**; no custom cursor anywhere | | |
| Pointer parallax | **none**. Nothing reacts to mouse position (measured with `pointer_tl` and `pointer_br`). All idle motion is time-based. | | |
| Focus | `:focus-visible`: 3px clay outline (parent) or 2px hibiscus (Natural), offset 3 to 4px | | |
| Tap sound | every `pointerdown` on `.pill`/`.sound` (and `.navlink` on Àtègbè) plays `sound.tap()` when sound is on | | |

**Phone menu (brand pages only, ≤860px).** It is a native `<details class="menu">` with no script needed to open it.
- Summary: a 2.75rem circle (2.5rem under 480px). The burger is three 1rem by 1.5px bars spaced ±5px. When open, the middle bar goes transparent and the outer bars rotate ±45° over **200ms `cubic-bezier(0.23,1,0.32,1)`**.
- Panel: fixed under the nav at `nav-h + 0.25rem`, full width inside the gutters, 1.25rem radius, forest-deep `#2F4F2B` with mint type and a soft shadow. **`menu-in` 200ms `ease-out`: from opacity 0, translateY(−0.4rem), scale 0.98**, origin top right. Items are Young Serif 1.25rem with 0.95rem padding. The current page has a white 12% fill. A parent back-link sits below a 1px rule.
- `menu.js`: **a tap outside closes it**, and **Escape closes it and returns focus to the summary**. Measured in `sheet_natural_phone.jpg`: the menu is open by 250ms, an outside tap closes it, and Escape closes it with the focus ring left on the burger.
- There is no close animation (`<details>` snaps shut).
- **Parent page on phone:** below 860px the three house links are simply hidden and there is no menu. Only the wordmark and sound toggle remain. That is a gap: the houses are reachable only by scrolling.

## 6. Smooth scroll, reduced motion, low power, WebGL fallback

- **Lenis** with `autoRaf: false`, driven by the GSAP ticker (`lenis.raf(t·1000)`), `lagSmoothing(0)`, with `lenis.on('scroll', ScrollTrigger.update)`. **Lerp: parent 0.1, Natural 0.075, Àtègbè 0.075, Farmers 0.1.** It is 1 (off) under reduced motion. Parent `anchors: false` (nav links use `scrollTo`). Brands `anchors: true`. Scroll is locked during the opener (`lenis.stop()` plus `html { overflow: hidden }`).
- **Reduced motion:** Lenis off. The opener has no animation (it waits for readiness, then shows the welcome). There is no word blur, ghost blur, glitch, floating parallax, idle sway or 3D tumble (3D follow `k = 1`, float 0). Particles draw one static frame. Door scale is fixed at 1. All CSS animations are forced to 1ms and 1 iteration. The Visit flood is skipped (direct navigation).
- **Low power** = `hardwareConcurrency ≤ 4` or `deviceMemory ≤ 4` or `innerWidth < 760`. Effects: fewer particles (parent 120, petals 20, powder 180, dust 130), 300 cloud puffs, cloud pixel ratio 1 (otherwise 1.5), object pixel ratio 1.25 (otherwise 1.75), no 3D antialias, fewer leaves (8), and **no blur filter on ghost copies**.
- **WebGL fallback:** every scene is built inside `try/catch`. Parent clouds fail → `.sky.no-gl` and a plain CSS gradient sky. A door scene fails → `.door.no-gl` and the text and buttons still work. A brand scene fails → `html.no-gl`, the shadow is hidden, and the headlines and copy carry the page. The planned scroll-scrubbed flipbook fallback for phones without WebGL is **not built yet** (handoff, next steps).
- Rendering is gated. Scenes, clouds and particles `start()`/`stop()` with the stage ScrollTrigger's `onToggle`, and doors render only while visible.

## 7. Sound design (summary only: **BigQuiv Digitals uses no sound**)

Everything is synthesized in Web Audio (`site/src/soundkit.js`) with no files. Nothing plays until the Enter tap. Silence is the default for the "without sound" path and for returning visitors.

| Moment | Parent | Brand pages |
|---|---|---|
| Enter with sound | a whoosh (0.25, 2.8 s), a bowl at 146.83 Hz after 1.4 s | bed starts. Natural: a bowl at 220 Hz after 0.8 s |
| Bed | throat-sung drone at D 73.42 Hz (level 0.05), singing bowls every 14 to 24 s, pentatonic gayageum-style plucks every 7 to 14 s, shaman bell bursts every 22 to 40 s | Natural: drone A 55 Hz at 0.022, bowls 10 to 18 s, A-minor pentatonic plucks, bells 40 to 70 s. Àtègbè: deepest drone, more bells, a bead-fringe rustle only while the crown is on screen. Farmers: C-major plucks more often, birds |
| Scrolling | wind follows Lenis velocity (`velocity/40`), 160ms idle reset | air (Natural) or wind (Farmers) only while the object rises (p 0.03 to 0.2) |
| Cloud bank / new section | door whoosh (bandpass sweep 180 → 2600 → 320 Hz, pan −0.6 → 0.6, a 48 → 34 Hz sub) | whoosh plus a bowl or pluck at 55% of the screen, with a 1.5 s cooldown |
| House arrives / headline lands | that house's bowl and 4 bells | `chime()`: a high bowl (Natural), bowl and 3 bells (Àtègbè), pluck and bell (Farmers) |
| Button press | one small bell | a water drop, a 1400 → 380 Hz sine over 70ms (Natural), a bead click (Àtègbè) or a bell (Farmers) |
| Visit / Stop | `sound.stop()`, master gain to 0 over a 0.3 s time constant | |

**Owner's ruling for bigquivdigitals.com: no sound.** That removes the reason the welcome screen and its Enter button exist. Keep the timing ideas and drop the audio layer, the toggle and the welcome gate.

---

## 8. Defects seen on the live site (do not copy)

1. **The real page flashes before the opener** (parent 0.7 s, Natural 0.2 s) because the overlay is created by JS. Fix: render the overlay in the server HTML and remove it with JS.
2. **The opener stalls about 2 s on brand pages** while Three.js builds on the main thread. Fix: show the opener first, build the scene after the wordmark's move (or with `requestIdleCallback`), and keep readiness capped.
3. Parent "Book a call" pills inside doors have **no hover** (a specificity clash).
4. The parent has **no phone navigation** to the houses.
5. On the parent, the transparent fixed nav **overlaps the last door's text** at the end of the stage.
6. The parent DESIGN.md is out of date (560svh vs 900svh in the code).

---

## 9. What BigQuiv Digitals takes

Home page: his 3D portrait on navy. Brand: navy `#1B2433`, cloud `#F4F5F7`, gold `#E8A33D`. **No black, no neon, no glow, a short opener, no sound.** bigquivdigitals.com is Next.js 16, so the GSAP, ScrollTrigger, Lenis and Three.js parts go in client components, and the opener overlay goes in the server-rendered layout so it is the first paint.

| Adewura motion (exact values) | bigquivdigitals.com equivalent |
|---|---|
| Opener overlay built by JS (flashes the page first) | **Overlay in the server HTML**: a navy `#1B2433` full-screen layer at `z-index 100`, removed by JS. No flash. Skipped on reduced motion and on return visits. |
| Wordmark fade 0.6 s `power3.out`, hold 1.0 s, FLIP into the header 0.8 s `expo.inOut` | "BigQuiv Digitals" in cloud `#F4F5F7`: fade and rise 10px over **0.5 s `power3.out`**, hold **0.6 s**, FLIP into the header over **0.7 s `expo.inOut`** (Farmers' punchy timing). About 1.8 s total. |
| "load ___ ing" with brand icons every 400 ms, min 6, cap 7 s | **Optional and short.** If kept: "load ___ ing" in cloud with **3 icons max at 380ms** (his work: a frame, a chart line, a play triangle, solid cloud fills with navy cuts), gap close 0.35 s, ripple, dot scatter. **Cap readiness at 2.5 s, not 7 s.** If the portrait model is ready earlier, skip the loader entirely. |
| Readiness = `document.fonts.ready` (+ scene built on brands) | `Promise.all([fonts.ready, portraitGLB loaded])`, raced against **2.5 s**. The portrait rises when it is ready, even if that is after the overlay leaves (rise from below, as the bottle does). |
| Cream lifts off over 1.4 s to show the cloud sky | Navy overlay **dissolves into the navy hero** (same colour), so the hand-off is just the type and portrait appearing: overlay opacity 0 over **0.6 s `power2.out`** with no blur and no scale (blur reads as glow on navy). |
| Welcome screen and Enter with or without sound | **Removed.** It existed only to unlock audio. There is no sound, so there is no gate. Scroll unlocks the moment the overlay starts to leave. |
| `sessionStorage` returning-visitor skip | Same: `sessionStorage['bqd-entered']`. Returning visitors land straight on the live hero. |
| Sticky stage 640 to 900svh, object pose keyed to scroll progress | Hero stage **about 400svh** (shorter, since one object and fewer beats), `position: sticky` with 100svh. His **3D portrait** on keyed poses: rise from y −4.8 (0 to 0.15), quarter-turn to three-quarter view (0.15 to 0.35), slide aside x −2.1 to leave room for text (0.35 to 0.6), back to centre, front view for the CTA (0.6 to 0.85), drop away (0.85 to 1). Follow at `1 − e^(−6·dt)` (between Natural's 4.5 and Farmers' 7), idle float `sin(t·0.8)·0.03`. No spin of a face past ±0.6 rad: a person does not tumble like a bottle. |
| Intro sentence lifts word by word (`−3.5rem·t`, opacity `1 − 1.4t`, blur 8t) | His opening line in cloud lifts word by word over the first ~650px: `translateY(−3rem·t)`, opacity `1 − 1.5t`, **blur up to 4px** (subtle, not a glow). |
| Particles: petals, dust, powder | **Fine gold `#E8A33D` and cloud specks** (r 0.6 to 1.6px, alpha 0.3 to 0.7, **no glow, no additive blend**), 120 desktop / 60 phone, drifting right. They part as the portrait rises and fade by p 0.15. Or drop them entirely if they read as noise. |
| Ghost-trail headlines (4 copies, offset `i·0.3em`, alpha `0.42 − 0.075i`, blur `i·1.1px`, `backOut 1.6`) | **Keep, the signature move.** Main line cloud `#F4F5F7`. Copies in a muted navy tint (e.g. `#8A93A6`) **never gold, never glow**. 3 copies, no blur on phones. Headlines are his offer lines. Each gets ~290px to arrive, ~480px to hold, ~200px to leave, and plays in reverse on scroll-up. |
| Cloud fly-through and white veil between houses | One **cloud-colour wipe** between hero and next section instead of a 3D sky: the next panel arrives from the bottom (as below). No 3D clouds: they cost a WebGL context and add nothing for a single-brand home. |
| Sliding colour panels (Restoria arched dome at −6svh, Àtègbè clip-path `inset(12% … round 2.5rem) → 0`) | **The cloud `#F4F5F7` services panel wipes up over the navy hero**: `clip-path inset(12% 0 0 0 round 2.5rem 2.5rem 0 0) → inset(0)` scrubbed from `top bottom` to `top 30%`. Then panels alternate navy and cloud, never black. |
| Floating photos at depth (`depth × −520px`, depths −0.18 to +0.24) | **Case-study screens float at depth**: Peaceway, the signals channel and the site build, as screenshots with 1rem radius and a navy-tinted shadow (no glow), `y = depth × −480px` desktop / `−160px` phone, scrub over the section. 2-column grid on phones. |
| Glitch headline once (hibiscus + forest split, `sin(πp)·(0.55 + 0.45·sin 46p)`) | **One glitch, used once**, on a contrarian line. Split into **gold `#E8A33D` and cloud** copies offset ±0.05em with the same clip bands. Range `top 88% → top 40%`. Off under reduced motion. No RGB/neon colours. |
| Nav colour by section, solid after the stage, 400ms | Same mechanism (`data-nav` on each section): on navy, cloud type and a transparent nav; on cloud panels, navy type with a cloud solid bar; gold for the CTA pill only. **Add a solid background from the start of any section whose text could slide under it** (fixes defect 5). |
| Section "door" sounds | **None** (no sound). Optionally, a section's heading lifts 24px over 1.1 s once at `top 88%` (Àtègbè list items). |
| Pills: press `scale(0.97)` 160ms, arrow dot +3px 220ms, colour 200 to 260ms | Same values. Gold `#E8A33D` pill with navy text, which goes cloud on hover (no glow, no shadow bloom). Ghost pill: a cloud line that fills cloud with navy text. Hover only on `(hover: hover) and (pointer: fine)`. **Check specificity so hover works inside every section** (defect 3). |
| Nav links: underline fades in over 200ms. Logo: no hover | Same underline fade. Logo stays still. |
| Cursor: default. Pointer parallax: none | Keep the default cursor. **Optional**: the portrait turns towards the pointer, max ±0.08 rad, eased at `e^(−4dt)`, desktop only, off under reduced motion. Adewura has none, so this is an addition, not a copy. |
| Phone menu: `<details>`, 200ms `menu-in`, burger bars ±45°, outside tap and Escape close it | Copy as is, in navy (panel `#1B2433`, cloud type, gold current-page marker). **Give the home page the menu too** (defect 4). |
| Lenis lerp 0.075 (calm) / 0.1 (punchy) | **Lerp 0.1**, ticker-driven, `lagSmoothing(0)`, off under reduced motion. Locked only during the ~1.8 s opener. |
| Reduced motion: no opener animation, no blur, no parallax, fades only | Same. |
| Low power: `cores ≤ 4 or memory ≤ 4 or width < 760` → fewer particles, pixel ratio 1 to 1.25, no ghost blur | Same rule. Portrait pixel ratio capped at 1.25 on low power and 1.75 otherwise. Stop rendering when the stage is off screen. |
| WebGL fallback: `try/catch`, `.no-gl`, text carries the page | Same, **plus a pre-rendered portrait image** (still or a short scrubbed flipbook) so the hero is never empty. Adewura never built its flipbook. |
| Visit flood: house ground floods out from the click point, `circle(0→150%)` 0.7 s `power3.inOut` | Use it for the **main CTA to a course or case-study page**: a navy (or cloud) flood from the click point, 0.6 s, then navigate. Remove it on `pageshow`. |
| Heavy scene built during the opener (2 s stall) | **Start loading the portrait GLB in parallel with the wordmark but compile it only after the wordmark's move**, so the opener frames never freeze (defect 2). |

## 10. One-paragraph spec for the BigQuiv opener (for the build)

First paint: navy overlay with "BigQuiv Digitals" in cloud. 0 to 0.5 s fade-and-rise 10px. Hold to 1.1 s. 1.1 to 1.8 s FLIP into the header (`expo.inOut`). If the portrait and fonts are ready, the overlay fades over 0.6 s and the portrait rises from below as the first scroll beat would. If not, "load ___ ing" with up to 3 icons at 380ms until ready, capped at 2.5 s. No welcome, no sound, no Enter. Session skip for returning visitors. Reduced motion: no overlay animation, straight to the page.

## 11. Contact sheets

- `parent/sheet_parent_opener.jpg`: 32 frames, 250 ms grid
- `parent/sheet_parent_video_0-11s_10fps.jpg`: 110 frames, the precise timeline
- `parent/sheet_parent_enter_exit_returning.jpg`: welcome, exit at 100 ms steps, returning visitor
- `parent/sheet_parent_scroll.jpg`: 0 to 100% in 5% steps
- `parent/sheet_parent_hover.jpg`, `parent/sheet_parent_hover_crops.jpg`
- `parent/sheet_parent_phone.jpg`
- `natural/sheet_natural_opener.jpg`, `natural/sheet_natural_video_0-12s_10fps.jpg`, `natural/sheet_natural_enter_exit_returning.jpg`
- `natural/sheet_natural_scroll.jpg`, `natural/sheet_natural_hover.jpg`, `natural/sheet_natural_hover_crops.jpg`, `natural/sheet_natural_phone.jpg`
- `ategbe/sheet_ategbe_opener.jpg`, `ategbe/sheet_ategbe_scroll.jpg`, `ategbe/sheet_ategbe_phone.jpg`, `ategbe/sheet_ategbe_enter_exit_returning.jpg`
- `farmers/sheet_farmers_opener.jpg`, `farmers/sheet_farmers_scroll.jpg`, `farmers/sheet_farmers_phone.jpg`, `farmers/sheet_farmers_enter_exit_returning.jpg`
- `sheet_ategbe_farmers_scroll.jpg`: both brand pages side by side, 10% steps
- Videos: `parent/video/parent-session.webm` (79 s), `natural/video/natural-session.webm`, `ategbe/video/ategbe-session.webm`, `farmers/video/farmers-session.webm`
