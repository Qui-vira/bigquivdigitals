# ui-paper: the paper design system

The public site's visual language since the October 2026 redesign. Light paper
grounds, grid paper, 3px ink rules, hard offset shadows, gold as a fill, a
condensed Didone for big words, a typewriter for labels, a marker pen for
margin notes. Brutalist structure, minimalist spacing, a few maximalist
scrapbook moments per page.

Reference: Elle Light's UGC portfolio deck (screens in the ContentBrain vault,
`UGC-Special-Edition-2026/07-Website-Redesign/ref-elle/`). Translate its
language, never its colours, images or words. The homepage (`components/HomeClient.tsx`)
is the worked example of everything below: copy its patterns before inventing new ones.

## Rules that do not bend

1. **No dark sections.** Grounds are `paper` (white), `grid` (grid paper) or
   `alt` (#F2F3F5). Never black, never cream (#F4F1EA family), never a
   full-bleed gold section. Gold is for OBJECTS: stickers, a framed panel, a
   button, a highlighter mark. A device bezel or a photo can be dark; the page cannot.
2. **Gold is never text at body size.** It is 2.2:1 on white. Text on paper is
   `ink`, `ink-soft` or `ink-muted`; text on a gold fill is `ink` or `ink-soft`
   only. For a gold-coloured word in small type use `text-gold-deep`.
3. **Didone (`font-didone`) at 24px and up only.** Its hairlines vanish below
   that. Reading text stays Karla (`font-sans`, the default).
4. **Handwriting (`font-hand`) is for asides.** Pointers, nudges, captions,
   labels. Never body copy, never a claim, under about six words.
5. **Never change copy or numbers.** This is a design system. Pen notes and
   sticker words are labels; if one states a fact it needs a proof block.
   No em dashes anywhere. No hashtags.
6. **Square corners** on every frame, button, input and print. The only round
   or organic shapes are stickers (starburst, wavy pill, circle stamp) and pins.
7. **Nothing animates opacity, and nothing hides content waiting for a trigger.**
   Default state is the finished state. See "Motion" below.
8. **Add the route to `lib/paper-routes.ts`** in the same commit you migrate a
   page. That switches off the legacy ParticleField and CustomCursor there.

## Tokens (app/globals.css)

| Token | Value | Use |
|---|---|---|
| `paper` | #FFFFFF | default ground |
| `paper-alt` | #F2F3F5 | alternate band (cool grey) |
| `grid-line` | #E6E9ED | grid paper lines (1.22:1, decorative) |
| `ink` | #111111 | text, rules, frames, shadows (18.9:1 on paper) |
| `ink-soft` | #383838 | secondary text (11.7:1 paper, 5.4:1 on gold) |
| `ink-muted` | #5A5A5A | tertiary text on paper/alt only (6.9:1) |
| `gold` | #E8A33D | brand fill: buttons, stickers, panels, marks |
| `gold-hover` | #F0B457 | gold hover |
| `gold-soft` | #E7BB88 | soft sticker / tape / selection |
| `gold-tint` | #FBEBCF | pale note paper, hover wash |
| `gold-deep` | #8A5A0E | gold-coloured TEXT (5.9:1 paper, 5.3:1 alt) |
| `bronze` | #6E4510 | reserve: deep accent if a moment needs it |

Fonts: `font-didone` (Imbue, variable), `font-typewriter` (Courier Prime 400/700),
`font-hand` (Caveat 700), `font-display` (Bricolage Grotesque, punch words,
card titles, buttons), `font-sans` (Karla, body). All self-hosted in `app/fonts`.
Note: `font-mono` is NOT the typewriter. It is left alone because the admin uses it.

Shadows: `shadow-brutal-sm` (3px), `shadow-brutal` (6px), `shadow-brutal-lg`
(10px), `shadow-brutal-gold`. Hard, unblurred, always down-right.

Utility classes: `bg-grid-paper`, `checker-strip`, `hl-mark` (highlighter),
`paper-link` (highlighter slides in on hover), `paper-scope` (focus ring +
selection colour for everything inside), `paper-focus` (same ring on one element),
`only-pointer` / `only-touch` (swap copy for mouse vs touch).

z-index scale: sticker 5, menu 40, nav 50, skip link 60. Nothing else.

## Primitives

Import from `@/components/ui-paper`.

### PaperSection
A page band. `ground` = `paper | grid | alt`. `width` = `wide` (1320) | `mid`
(1080) | `text` (820) | `full`. `pad` = `none | sm | md | lg`. `checker` =
`top | bottom | both`. Includes `paper-scope` and `overflow-x-clip`.
```tsx
<PaperSection ground="grid" checker="top" pad="lg" aria-labelledby="work-heading">...</PaperSection>
```
Alternate grounds down a page; do not put two checker strips back to back
(the footer already has one on top).

### SectionHead
Boxed index + Didone title + optional typewriter kicker. Number the sections of
one page in order; skip the index on a section that has its own numbered list.
`indexTone="paper"` when it sits on a gold panel. Sizes `md | lg | xl`.
```tsx
<SectionHead index="02" id="work-heading" title="Three builds. Go and check them." />
```

### BrutalButton
Square, 3px ink frame, hard shadow; hover lifts, press pushes in.
`variant` = `gold` (primary) | `paper` (secondary) | `ink`. `size` = `sm | md | lg`.
Internal hrefs use next/link; `https://` hrefs get an up-right arrow. One gold
button per screenful; the second action is `paper` or a `paper-link` text link.
Labels three words or fewer. `onClick` only from client parents.
```tsx
<BrutalButton href="/greatwork-waitlist" size="lg">Join the waitlist</BrutalButton>
<BrutalButton href={calendlyUrl} variant="paper">Book a call</BrutalButton>
```

### BrutalFrame
The framed container. `tone` = `paper | gold | tint | alt`, `shadow` = `none | sm | md | lg | gold`,
`tilt` in degrees (keep within +-3 when it holds reading text). Use only when a
block must read as an object; most content sits on the paper unframed.

### PhotoPrint
A printed photo stuck to the page. `tilt`, `attach` = `tape | tape-corners | clip | pin | none`,
`mat` = `polaroid | even | thin`, `caption` (handwritten), `lift` = `self | group | none`,
`delay` (ms, for staggering). The child is the photo window: give it a sized box.
```tsx
<Link href="/work/x" className="group block">
  <PhotoPrint tilt={-2} attach="tape" lift="group" mat="even">
    <div className="relative aspect-[16/10]"><Image src=... fill className="object-cover" alt=... /></div>
  </PhotoPrint>
</Link>
```
Never wrap something that measures itself with getBoundingClientRect (a canvas,
the hero shader) in a tilted print: rotation inflates the rect. The hero keeps
its frame axis-aligned and puts the tilt on sibling layers for this reason.

### Sticker
`shape` = `starburst | wavy | circle | label`, `tone` = `gold | soft | tint | paper | ink`,
`size` (px), `tilt`, `bumps` (wavy), `delay`. Decorative (aria-hidden) by
default; pass `decorative={false}` when the word is information (a category
tag). Labels size to their text; wavy pills fit short words only (about 14
characters at the default size).
```tsx
<Sticker shape="label" tone="gold" decorative={false}>Spec ad</Sticker>
<Sticker shape="starburst" tone="gold" size={96} tilt={12} className="absolute -right-4 top-6">try it</Sticker>
```

### HandNote / HandArrow
Marker-pen margin note; the words write on, then the arrow draws.
`arrow` = `down-left | down-right | up-left | up-right | down | up | left | right`,
`arrowAt` = `start | end | below | above`, `tilt`, `size` = `sm | md | lg`,
`tone` = `ink | gold-deep`, `load` (play on page load, for above-the-fold),
`delay`. Hide on small screens with `className="hidden lg:inline-flex"` when
the note would collide with content. `HandArrow` is the arrow on its own.
```tsx
<HandNote arrow="down-right" className="absolute -bottom-20 left-[44%] hidden lg:inline-flex">go on, open one</HandNote>
```

### HandMark
Pen marks on live text: `kind` = `underline | double-underline | circle | strike`,
`tone` = `gold | ink`. The phrase does not wrap, so keep it to a few words.
```tsx
Five freelancers, five invoices, and <HandMark kind="circle">nobody answering</HandMark> for the result.
```

### Highlighter
Gold highlighter behind live text, follows line breaks, sweeps in on view
(`load` for above the fold). Once or twice per page.

### StatStamp
A proof number as a stamped ticket. `value` (string, rendered as given),
`label`, `tone` = `paper | gold | tint`, `tilt`, `delay`. Only for numbers with
a receipt; no count-up animation, ever.

### MonoLabel
Typewriter text for labels and small print. `caps` (default true), `tone` =
`ink | soft | muted | gold-deep`, `size` = `xs | sm | md`. Short strings.

### CheckerStrip, Tape, PaperClip, Pin
Decorative edges and fasteners. All aria-hidden. Tape/clip/pin are already
`absolute`; place them with className.

### Helpers
`cx()` joins classes. `positioned(className)` and `display(className, "inline-flex")`
exist because two position or display utilities in one class list resolve by
stylesheet order: a caller's `absolute` or `hidden` would lose to a primitive's
own `relative` or `inline-flex`. Every primitive uses them; new primitives must too.

## Motion

- Above the fold: page-load classes (`load-drop`, `load-settle`, `load-tilt`,
  `load-write`, `load-stroke`, `hl-load`) with `--rv-delay`.
- Below the fold: primitives arm themselves through `useReveal()`, which only
  arms elements that are off screen at mount and plays each entrance once.
- Hover: prints lift and straighten, buttons lift, links get the highlighter.
  Tailwind v4's `hover:` already applies only on hover-capable devices.
- Easing tokens: `--ease-out-expo`, `--ease-out-back` (restrained overshoot).
  No bounce, no elastic, no infinite loops on paper pages.
- Reduced motion: every paper entrance resolves to its finished state (see the
  bottom of the paper block in globals.css). If you add a keyframe, add it there.

## Accessibility checklist for every migrated page

- Contrast from the token table above; nothing lighter than `ink-muted` on paper.
- Visible focus: wrap the page in `paper-scope` (PaperSection does it).
- Decorative primitives are aria-hidden; informational stickers are not.
- Touch targets 44px minimum. Test 375, 768, 1440 with no sideways scroll.
- One h1 per page, sections labelled by their heading id.
