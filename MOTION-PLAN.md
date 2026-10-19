# bigquivdigitals.com: motion plan

Status: DRAFT for your approval, with the comps. Nothing gets built until you approve.

The site should feel like one long motion design: it loads like Adewura, every scroll moves something on purpose, the mouse gets a response everywhere, and your diary effects carry the pages. Sources: the Adewura breakdown (`research/adewura-motion/BREAKDOWN.md`, measured from its code and screen captures) and your effects diary (`research/EFFECTS-CATALOGUE.md`, 34 effects from the 8 @tenfoldmarc reels). The effect numbers below (#2 Orbit and so on) point into that catalogue.

Rules that hold everywhere: navy, cloud and gold only; no black, no neon, no glow, no gradient text; motion is driven by your scroll, so scrolling back plays it in reverse; your words never change.

## 1. Loading (first visit), the Adewura opener made short

Adewura takes about 7.8 s to its welcome screen and needs an Enter button only because it plays sound. You chose no sound, so the welcome screen goes and the opener is about 1.8 s.

| Time | What you see |
|---|---|
| 0.0 s | A navy screen (it is in the page's own HTML, so there is no white flash, a defect Adewura has). "BigQuiv Digitals." in cloud, centred. |
| 0 to 0.5 s | The wordmark fades in and rises 10px. |
| 0.5 to 1.1 s | Holds. |
| 1.1 to 1.8 s | The wordmark glides up and shrinks into its place in the nav. |
| If the 3D portrait is not ready yet | "load ___ ing" in cloud, and your work pops into the gap every 380 ms: a video frame, a chart line, a play button. Never more than 2.5 s in total. |
| End | The navy screen fades into the navy hero (0.6 s). You rise from below into the hero, the headline is already there, and the page scrolls. |

A returning visitor in the same browser session skips the opener. Reduced motion: no opener at all. The 3D portrait loads in parallel and builds only after the wordmark has moved, so the opener never freezes (Adewura's brand pages freeze for about 2 s here).

## 2. Motion on every page

**Scroll**
- Smooth scroll (Lenis, smoothing 0.1, the punchier Adewura setting).
- **The 3D stage**: every page except articles and legal opens on a pinned stage with its object. The object eases to each pose from where it is, so fast scrolling never jumps.
- **Ghost-trail headlines** on every stage: the line plus 3 to 4 trailing copies in a muted navy tint (never gold, never glow), about 290px of scroll to land, 480px to hold, 200px to leave.
- **Word-by-word lift**: each page's opening line lifts and softens away word by word as the first scroll begins.
- **Panel wipe**: the first cloud section rises over the navy stage with a rounded top edge (clip-path), and later panels alternate navy and cloud.
- **Split-text reveals** (#44) on section headings: each heading's lines rise into place once as it enters.
- **Parallax depth** (#35): screenshots and photos float at different speeds inside their sections.
- **Odometer** (#10) on every real number: it rolls to its value when it comes into view. Static under reduced motion.

**Mouse and touch**
- **Custom cursor** (#40), desktop only: a small navy dot with a ring. It grows over links, says "View" over a case study and "Play" over a video, and turns into a text bar over paragraphs. Touch screens keep the normal behaviour.
- **Magnetic buttons** (#39): primary buttons lean a few pixels towards the pointer and snap back.
- **Press**: every button shrinks to 97% on press (160 ms), the arrow slides 3px on hover, and the colour changes in about 200 ms. Hover effects only for a mouse.
- **The 3D object follows the pointer** a little (at most about 4 degrees), desktop only.
- **Image hover** (#43): case-study images tilt slightly towards the pointer.
- **Nav**: link underlines draw in on hover; the bar takes the colour of the section under it; a navy phone menu on every page, including home (Adewura's home has none).
- **Page transitions** (#47): clicking into a case study or a course floods the screen in navy from the click point (0.6 s), then the next page's stage rises in.

**Never moving**: legal pages, form fields while you type, anything a keyboard user triggers.

## 3. Page by page

| Page | Stage object and poses | Section effects (diary numbers) |
|---|---|---|
| **Home** | You in 3D: you turn, step left with "Same skills.", cross right with "One move.", the camera pushes in to your eyes while the receipts land, then you settle with the button | **#2 Orbit**: your four case-study cards circle your head and pass behind it as you scroll. **#23 Text behind subject**: the giant BIG QUIV sits behind you. **#1 Headline Wall**: the build cards fly in around you before the case-study grid. **#10 Odometer** on the receipts. **The one glitch on the site** on "Five freelancers, five invoices, and nobody answering for the result." **#4 Spotlight**: the page dims to navy around "You have seen the proof" before the last button |
| **Services** | Five blocks (website, content, Telegram, strategy, reporting) fly in and lock into one cube | **#9 UI World**: your real system screens float in 3D. **#26 Strike-Through**: "five freelancers" struck through. **#5 Checklist**: the five offer lines tick as you scroll. **#45 Stacking cards** for the process |
| **About** | Your story cards fan out, one per year | **#14 Frame Break**: your cut-out steps out of its card frame. **#28 Handwritten**: the one Caveat note draws itself in. **#32 Scan Card**: a line sweeps each timeline card as it lands |
| **Work** | A device rack (laptop and two phones) turns to each build | **#38 Horizontal pinned scroll** through the films. Filter tabs slide their gold marker. **#47 flood** into each case study |
| **Case studies** (4) | One device each, turning to the real screen | **#3 Digital Zoom**: a pinned screenshot punches in on the line that proves the claim, holds, pulls back. **#6 Freeze and Label**: labels with leader lines point at the details. **#11 Chart Grow** on the Alpha plays and Nigeria business costs charts. **#37 Clip-path reveals** on screenshots |
| **Contact** | A calendar block flips to the booking day | **#12 Comment Bubble**: the real form styled as a conversation. **#5 Checklist**: "what happens next" ticks |
| **The Great Work** | A book opens page by page, one module per page | **#22 Keyword slam** on the promise line. **#4 Spotlight** on the transformation. **#15 Type Wall**: the seven modules as a wall of words narrowing to the one you are on |
| **AI Mastery** | A phone playing your AI ads | **#27 Objection Cross-Off**: two objections crossed out, one real requirement ticked. **#30 Prompt Type-In**: a real prompt types itself out. **#8 Phone Mockup** for the film list. **#34 Viewfinder** frame on the showreel |
| **TheEditCompanion** | The product box opens | **#7 Before and After**: a draggable slider that sweeps once on its own. **#29 Run Card**: the pipeline steps tick through. **#30 Prompt Type-In**. **#25 Price Anchor Stack**: the price cards stack to the founders price |
| **UGC** | A hand-held phone playing your UGC work | **#8 Phone Mockup**, **#34 Viewfinder**, **#24 Look Swap** (the same clip in two styles) |
| **Waitlists** (3) | The book or the phone, small | The form is first. **#5 Checklist** on what you get. Nothing that slows the sign-up |
| **Articles** | A stack of documents deals out | **#44 Split-text** titles; cards lift and tilt on hover |
| **Article template** | No stage | A gold reading-progress bar; prompt boxes type in once (#30) |
| **Legal** | None | Plain and fast, no motion |
| **404** | A small gold dot rolls in | **#41 Number scramble** on "404" |

## 4. Diary effects left out, and why

- **Logo Wall** (#31): the Gucci, Burger King, McDonald's, Nike and Lexus spec ads are unofficial fan work, and Peaceway is your father's pharmacy and never billed. A wall of logos would read as clients.
- **Blackout** (#19): rebuilt as the navy Spotlight; black grounds are banned.
- **Green Screen** (#13) and **Clone** (#17): kept in reserve. They need extra photos of you.
- **Sparkle burst, near-black UI cards, black-box captions**: they break the no-glow, no-black rules.
- **Particles**: Adewura's petals and dust would become gold specks here. Left out unless you want them: on navy they risk reading as glitter.

## 5. Speed, phones and fallbacks

- Phones get the same story: fewer copies in the ghost lines, no blur, 3D at a lower resolution, no custom cursor, no magnetic buttons, no pointer follow.
- Low-power devices (4 cores or less, 4 GB or less): the same cuts.
- No WebGL: each stage shows a still image of its object in its first pose, and the page works.
- Reduced motion: no opener, no turning, no parallax, no ghost copies; things fade in.
- The 3D renders only while its stage is on screen. Text and buttons are in the page's HTML, so search engines and screen readers never wait for any motion.
