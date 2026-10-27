# bigquivdigitals.com: live site snapshot

- **Captured:** 2026-10-19, with Scrapling MCP. Pages were rendered with JavaScript and the fetch waited for the network to go idle.
- **Pages captured:** 47 live URLs.
  - 44 come from `sitemap.xml`: 13 top-level pages and 31 `/doc/*` pages.
  - 3 are linked from the site but missing from the sitemap: `/greatwork`, `/aimastery` and `/waitlist`.
- **Skipped on purpose:** `/admin` and `/api`. `robots.txt` disallows both.
- **What each folder holds:**
  - `page.md`: the rendered text, kept verbatim. It ends with the forms, inputs and buttons read from the rendered HTML.
  - `meta.json`: the title, meta description, canonical URL, Open Graph tags and Twitter tags.
  - `images.json`: every `<img>` with its alt text and absolute URL. It also lists `<picture>` sources and `<video>` elements.
  - `screenshot.png`: a full-page capture at 1440 px wide and 1x scale. Only top-level pages and 2 sample docs have one.
- **Global call to action on every page:**
  - Header button: "Book a Call", which goes to `https://calendly.com/_quivira/one-on-one-meeting`.
  - Footer links: Pages, Socials and Contact. The links are The Great Work Waitlist, AI Mastery Waitlist, X @_Quivira, linkedin.com/in/bigquiv, TikTok @big_quiv, Instagram big_quiv, t.me/Quivira_Ophir, contact@bigquivdigitals.com and Book a Call.

## Top-level pages (16)

| URL | Title | Primary call to action | Folder |
|---|---|---|---|
| https://bigquivdigitals.com/ | BigQuiv Digitals \| Growth systems that turn attention into revenue | "Join the waitlist" (/greatwork-waitlist), plus "Hire me" and "Book a call" (Calendly). 4 "Read the build" links go to /work/* | `home/` |
| /services | The Growth Operating System \| BigQuiv Digitals | "Book a call" (Calendly). Each case links to "See the ... build" | `services/` |
| /portfolio | Proof of Work \| BigQuiv Digitals | "Start a project" (Calendly). Filter tabs: All work 10, AI Video Producer 6, AI Engineer 1 | `portfolio/` |
| /work/peaceway | Peaceway Online \| BigQuiv Digitals | "Want this built for your brand?" with "Book a call" | `work-peaceway/` |
| /work/alpha-plays | Big_Quiv Alpha plays \| BigQuiv Digitals | "Want this built for your brand?" with "Book a call" | `work-alpha-plays/` |
| /work/content-engine | The Content Engine \| BigQuiv Digitals | "Want this built for your brand?" with "Book a call" | `work-content-engine/` |
| /work/nigeria-business-costs | Nigeria Business Cost Intelligence \| BigQuiv Digitals | "Want this built for your brand?" with "Book a call" | `work-nigeria-business-costs/` |
| /about | About Big Quiv \| From a shop floor in Lagos to systems that ship | "Book a call" (Calendly) | `about/` |
| /articles | Articles & Breakdowns \| BigQuiv Digitals | Article cards linking to /doc/* | `articles/` |
| /contact | Contact \| BigQuiv Digitals | "Send Message" form. It posts to formsubmit.co and asks for name, email, service (select) and message. Other routes: Telegram @Quivira_Ophir, email, "Book a Call" | `contact/` |
| /ugc | UGC Portfolio \| BigQuiv Digitals | "Email me" (mailto) and "WhatsApp me" (wa.me/2347065092434). The videos are hosted on Vercel Blob | `ugc/` |
| /greatwork | The Great Work \| BigQuiv Digitals | "Get instant access · ₦15,000" (was ₦35,000) | `greatwork/` |
| /aimastery | AI Mastery \| BigQuiv Digitals | "Get instant access" at ₦27,000 (was ₦50,000) | `aimastery/` |
| /greatwork-waitlist | The Great Work waitlist \| BigQuiv Digitals | Email field and "Join the waitlist" | `greatwork-waitlist/` |
| /aimastery-waitlist | AI Mastery waitlist \| BigQuiv Digitals | "Free for the first 100." Email field and "Join the waitlist" | `aimastery-waitlist/` |
| /waitlist | Join a waitlist \| BigQuiv Digitals | "Pick the one you came for": two "Join this waitlist" cards (AI Mastery and The Great Work) | `waitlist/` |

## Docs (31): `/doc/<slug>`

In the CTA column, "global only" means the body carries no call to action of its own. The header and footer CTAs still apply.

| Slug | Title | Primary call to action | Folder |
|---|---|---|---|
| claude-motion-workflow | My Claude motion graphics workflow | Code-word gate: "Code word" field and "Open it" | `doc-claude-motion-workflow/` |
| analyze-skill | The /analyze Skill: Workflow | "Join the AI masterclass waitlist" (/aimastery-waitlist?src=) | `doc-analyze-skill/` |
| class-to-plan-prompts | Class to Plan: The 3 Prompts | "Join the AI masterclass waitlist" (?src=) | `doc-class-to-plan-prompts/` |
| reel-cover-workflow | Reel Cover: Workflow | "Join the AI masterclass waitlist" (?src=). **Screenshot taken** | `doc-reel-cover-workflow/` |
| bullet-time-workflow | Bullet Time Effect: Workflow | "Join the AI masterclass waitlist" (?src=). **Screenshot taken** | `doc-bullet-time-workflow/` |
| remote-job-boards | 43 Remote Job Boards I Actually Used | global only | `doc-remote-job-boards/` |
| durex-what-if-chike-workflow | Day 8 of 30 Free Ads: How I Made What If Chike Wasn't Born? for Durex | Code-word gate: "Open it" | `doc-durex-what-if-chike-workflow/` |
| air-peace-last-bus-stop-workflow | Day 7 of 30 Free Ads: How I Made The Last Bus Stop Before the Sky for Air Peace | Code-word gate: "Open it" | `doc-air-peace-last-bus-stop-workflow/` |
| lexus-2m-ad-workflow | Day 6 of 30 Free Ads: How I Made a $2M Lexus Movie at Home | Code-word gate: "Enter the code word from the video" | `doc-lexus-2m-ad-workflow/` |
| affiliate-guide | Affiliate Guide | Referral link `bigquivdigitals.com/waitlist?ref=yourcode`. Contact @Quivira_Ophir on Telegram | `doc-affiliate-guide/` |
| comic-book-ad-prompt-template | How to Create a Cinematic Comic Book Ad for Your Brand Using ChatGPT | "AI Content Mastery" (goes to /waitlist) | `doc-comic-book-ad-prompt-template/` |
| day-5-nike-ad-prompts | Day 5, 30 Free Ads for My Favorite Brands | Comment "NIKE" to get the PDF | `doc-day-5-nike-ad-prompts/` |
| the-last-fry-mcdonalds-creative-guide | Day 4 Creative Guide: The Last Fry | Comment "GUIDE" | `doc-the-last-fry-mcdonalds-creative-guide/` |
| the-heist-burger-king-creative-guide | Day 3 Creative Guide: The Heist | Comment "BREAKDOWN" | `doc-the-heist-burger-king-creative-guide/` |
| raw-supercar-bystander-footage-prompt | RAW SUPERCAR BYSTANDER FOOTAGE | global only | `doc-raw-supercar-bystander-footage-prompt/` |
| caught-through-the-glass-concept-breakdown | CAUGHT THROUGH THE GLASS | global only | `doc-caught-through-the-glass-concept-breakdown/` |
| gravity-forgot-creative-breakdown | GRAVITY FORGOT | Comment "ADS" on the Day 2 post | `doc-gravity-forgot-creative-breakdown/` |
| metamorphosis-gucci-creative-breakdown | METAMORPHOSIS | global only | `doc-metamorphosis-gucci-creative-breakdown/` |
| the-cycle-man-cinematic-prompt-guide | The Cycle Man | Comment CYCLE / PROMPT / CYCLEMAN (suggested captions) | `doc-the-cycle-man-cinematic-prompt-guide/` |
| sea-giant-prompt | Sea Giant Prompt | global only | `doc-sea-giant-prompt/` |
| celebrity-airport-scene-prompt | Ultra Realistic Mass Celebrity Airport Entry Scene | global only | `doc-celebrity-airport-scene-prompt/` |
| ai-client-work-guide | How I Use AI for Client Work: Full Process | global only (has Copy buttons) | `doc-ai-client-work-guide/` |
| faceless-ai-income-guide | 3 Ways AI Pays Faceless Creators: Full Breakdown | global only (has Copy buttons) | `doc-faceless-ai-income-guide/` |
| ai-video-workflow-guide | The $0 AI Video Workflow: Full Blueprint | global only (has Copy buttons) | `doc-ai-video-workflow-guide/` |
| claude-competitor-intelligence-prompt | The Exact Claude Code Prompt I Use to Study My Competitors in Real Time | "Want more prompts like this? Follow me" | `doc-claude-competitor-intelligence-prompt/` |
| system-framework | The System Framework | DM @big_quiv on Instagram | `doc-system-framework/` |
| automate-tool-list | The Automate Tool List | DM @big_quiv on Instagram | `doc-automate-tool-list/` |
| build-framework | What I Built In Silence | DM @big_quiv on Instagram | `doc-build-framework/` |
| portfolio-ai-audit | AI Portfolio Audit: 3 Things You Are Missing | "Follow @big_quiv for more signal, zero noise." | `doc-portfolio-ai-audit/` |
| os-trading-system | The OS: How The Trading Machine Works | "Follow @big_quiv for daily breakdowns." | `doc-os-trading-system/` |
| alpha-3-cleared-tokens | The ALPHA: 3 SEC-Cleared Tokens | "Follow @big_quiv for more signal, zero noise." | `doc-alpha-3-cleared-tokens/` |

## Failed, missing and redirected URLs

| URL | Result |
|---|---|
| /pricing | Redirects to /services. No separate folder |
| /theeditcompanion | **404**. TheEditCompanion has no product page live |
| /companion, /edit-companion | 404 (guessed URLs for TheEditCompanion) |
| /courses | 404 |
| /privacy, /terms, /licence, /license | 404. **The site has no privacy policy or terms page**, yet it takes payments and email sign-ups |

The checks above found these problems. None of them cost any data:

- **Intermittent 500 errors.** `/doc/reel-cover-workflow`, `/doc/durex-what-if-chike-workflow`, `/doc/system-framework` and `/doc/the-heist-burger-king-creative-guide` returned 500 on the first fetch. Each one loaded on retry. The live server is flaky on these routes.
- **Asset files not downloaded.** `/docs/*` assets (zip and jpg downloads linked from some docs) were left out. Their URLs are in each doc's page.md and images.json.
- **Blank areas in screenshots.** Images that load lazily and sections that reveal on scroll can show as empty frames. Use page.md as the source of truth for text.
- **Inline images.** Some images are base64 data embedded in the HTML. images.json records their size but not their bytes.
