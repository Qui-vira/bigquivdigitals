/**
 * TheEditCompanion page copy. Every sentence here comes from
 * ContentBrain/business-blueprint/marketing/sales-page/SALES-PAGE-COPY.md, or from the
 * owner decisions of 15 Oct 2026 (naira price, 30 day support, no update promise, the
 * install status line, the three-way support contacts). Do not add a claim here. If a line
 * changes, change the copy file and CLAIMS-CHECK.md first.
 *
 * No em dashes anywhere in this file (the test script checks the rendered output).
 */

export const PRODUCT_SLUG = "theeditcompanion";
export const PAGE_PATH = "/theeditcompanion";
export const PRODUCT_NAME = "TheEditCompanion";

/** Hidden by default. Owner decision 15 Oct: the expertise block and the proof slot stay off. */
export const FLAGS = {
  /** Section 14 of the copy. Needs a filed note per video before it is shown. */
  expertiseBlock: false,
  /** Section 15 of the copy. Needs a filed video, a plan, a colour grade note. */
  proofSlot: false,
} as const;

export const CONTACTS = {
  telegram: { label: "Telegram", display: "@quivira_ophir", href: "https://t.me/quivira_ophir" },
  whatsapp: { label: "WhatsApp", display: "+234 706 509 2434", href: "https://wa.me/2347065092434" },
  email: { label: "Email", display: "contact@bigquivdigitals.com", href: "mailto:contact@bigquivdigitals.com" },
  instagram: { label: "Instagram", display: "@big_quiv", href: "https://www.instagram.com/big_quiv" },
} as const;

export const SUPPORT_LINE =
  "All sales are final. For 30 days after you buy, we help you install and run it. Updates are not promised.";

export const INSTALL_STATUS =
  "Tested on Windows 11 in a controlled setup. Not yet tested on a brand new computer. Mac is not tested yet.";

export const CRYPTO_LINE = "Message us to pay by crypto";

export const HERO = {
  h1: "Editing takes too long. One prompt gives you generic video. There is a better order.",
  promise1: "TheEditCompanion by BigQuiv Digitals takes your reference and your own script to a finished video.",
  promise2: "It stops at set points and waits for your decision.",
  seeHow: "See how it works",
} as const;

export const PROBLEMS = {
  heading: "Three problems with making video today",
  items: [
    {
      title: "First problem: getting attention is hard in business.",
      lines: [
        "Creators and small business owners use video to get noticed.",
        "A video that looks made on purpose is easier to stand behind.",
      ],
    },
    {
      title: "Second problem: editing by hand takes a lot of time.",
      lines: ["Every cut, caption and motion detail is manual work.", "A motion graphic is slower still."],
    },
    {
      title: "Third problem: one prompt to Claude often gives a generic result.",
      lines: ["With no reference, no plan and no checkpoints, the output has nothing specific to follow."],
    },
  ],
  closing: ["TheEditCompanion adds the missing structure.", "A reference to follow. A plan to approve. Checks at the end."],
} as const;

export const WHAT_IT_IS = {
  heading: "What TheEditCompanion is",
  lines: [
    "TheEditCompanion is a set of skills for Claude Code.",
    "It runs one fixed production workflow, in the same order every time.",
    "You give it a reference and your script. You decide at every stop.",
  ],
} as const;

export const HOW = {
  heading: "How it works: reference, plan, you approve, build, check",
  steps: [
    ["Reference", "it takes your reference video apart frame by frame, with measured motion and measured sound"],
    ["Plan", "it writes a full plan, with a time stamp for every part. Nothing is built yet"],
    ["You approve", "you accept, change or reject the plan"],
    ["Build", "it builds the video in code, using real footage and the tools you have"],
    ["Check", "it scores the finished video against the reference and the plan, and you review it"],
  ],
  stopsIntro: "The workflow has fixed stops. It cannot skip them. It waits for you.",
  stops: [
    [
      "Brand Gate",
      "If you name a brand, it researches the brand first. Every fact is fetched, dated and sourced. You approve before it goes on.",
    ],
    [
      "Gate 1",
      "It compares your reference with your script. It lists numbered suggestions. You accept, reject or change each one.",
    ],
    [
      "Gate 2",
      "It writes a full plan with a time stamp for every part. Nothing is produced until you approve it. A change later is a new version.",
    ],
    [
      "Spend Gate",
      "Paid image or video generation is staged first as prompts. Each paid batch needs your approval. The default spend limit is $0.",
    ],
  ],
  scriptHeading: "Your script stays yours",
  scriptLines: [
    "It locks your words exactly as you wrote them.",
    "It lists suggested changes in a separate table, each with a number.",
    "It changes your script only after you approve that number.",
    "It checks the locked text word for word before and after Gate 1, and again on the final video.",
    "It never rewrites, shortens, expands or reorders your lines.",
    "It never tidies your slang or your dialect.",
    "It never continues because you did not answer.",
  ],
} as const;

export const INSIDE = {
  heading: "What is inside the download",
  items: [
    "3 skills: motion-studio (the staged workflow), motion-reconstruct, and motion-rescue (the repair command)",
    "39 built-in modules for HyperFrames, captions, audio, media sourcing, reference analysis, motion graphics, explainer and launch videos, and design checks",
    "An installer for Windows, run with one command",
    "A doctor check that re-tests every tool, package, skill and hook",
    "A rescue command, /motion-rescue, for when something fails",
    "Reconstruct mode, for rebuilding a reference you have the right to copy",
    "Any aspect ratio you choose",
    "A START-HERE guide, an install guide and a quick-start card",
  ],
  installer: {
    title: "The installer",
    lines: [
      "It checks Node, Python, Git, FFmpeg and yt-dlp.",
      "It asks before it installs any system tool. It never does so silently.",
      "Its own tools install at user level and need no admin rights. A Windows admin prompt may appear only when you let it install system tools.",
      "It adds its hooks to your Claude settings without overwriting what is there. If it changes the file, it saves a backup first.",
    ],
  },
  doctor: {
    title: "The doctor",
    lines: [
      "It prints one table of what passes, what fails and what is optional.",
      "It ends with the single next fix.",
      "It writes a report file you can send to support.",
    ],
  },
  rescue: {
    title: "The rescue command",
    lines: [
      "Type /motion-rescue when something did not work.",
      "It asks for the failed request. It runs the doctor. It finds the cause. It fixes it or changes the route. Then it re-runs the check to prove the fix.",
    ],
  },
  reconstruct: {
    title: "Reconstruct mode",
    lines: [
      "Use it when you want to match a reference you have the right to copy.",
      "It is an 11-phase method. It ends with a measured comparison between your build and the reference.",
      'You choose how close to follow. "Style" takes the reference\'s grammar only. "Exact" matches its measured timing, easing, layout and motion.',
      "Either way, your own logos and text replace the reference's, unless you state in writing that you own the reference.",
    ],
  },
  ratioHeading: "Any aspect ratio",
  ratioLines: [
    "Portrait 9:16 is only the default.",
    "You set the ratio and the size once in your profile. The whole workflow follows it.",
  ],
  ratios: ["9:16", "4:5", "1:1", "16:9", "A custom size"],
  aeHeading: "With or without After Effects",
  aeLines: [
    "The default route is code. HyperFrames is the default. Remotion is the other code route.",
    "You need neither After Effects nor DaVinci Resolve.",
    "If you own them, say so in your profile and the system can use them.",
    "If you do not, every After Effects step is changed to HyperFrames, Remotion or FFmpeg. You approve the new route first.",
    "Limit: rotoscoping and true 3D camera moves with depth of field have no good code equivalent. Those parts go to paid generation or are redesigned at Gate 1.",
  ],
  extras:
    "3 optional extra skills are downloaded by the installer from their creators' own pages. They add to the 39 built-in modules. If you are offline, skip them. The pack works without them.",
} as const;

export const ROLES = {
  heading: "What you do and what Claude does",
  youTitle: "You do",
  you: [
    "Choose the reference",
    "Write the script",
    "Set the frame and the spend limit",
    "Approve or change the plan at each stop",
    "Check the result, and check the colour with your own eyes",
    "Make sure you have the right to use the reference",
  ],
  claudeTitle: "Claude does",
  claude: [
    "Takes the reference apart",
    "Locks your script and lists suggestions",
    "Writes the plan",
    "Builds the video in code",
    "Checks the finished video against the reference and the plan",
  ],
} as const;

export const FIT = {
  heading: "Who it is for and who it is not for",
  forTitle: "For you if",
  for: [
    "You make video as a creator, freelance editor, designer or small-business owner",
    "You want a process you can repeat, with approval points",
    "You will follow an install guide and use a terminal",
    "You have a paid Claude plan that runs Claude Code, or you will pay for one",
  ],
  notTitle: "Not for you if",
  not: [
    "You want one click to a finished video, with no decisions",
    "You have never edited and want a first editing course",
    "You will not read the plan before you approve it",
    "You plan to copy a reference you have no right to use",
    "You cannot or will not pay for a Claude plan",
  ],
} as const;

export const LIMITS = {
  heading: "What it does not do",
  items: [
    "It needs a paid Claude plan that can run Claude Code. Plan limits apply. Which plan is enough for heavy projects is still being tested",
    "It is built for Windows first. Mac is not tested yet. A Mac installer is written but has not been run on a Mac",
    "The result depends on your reference, your script and what you approve",
    "It does not replace your judgement on colour. Colour grading still needs a human eye",
    "It does not always deliver. That is why the rescue command exists",
    "It promises no views, no sales and no income. No result is claimed for any video",
    "Reference rights are yours to hold. Downloading a video from a social platform may breach that platform's terms",
  ],
} as const;

export const REQUIREMENTS = {
  heading: "What you need to run it",
  statusTitle: "Install status",
  help: "If anything fails, run the doctor or type /motion-rescue, or message us. For 30 days after you buy, we help you install and run it.",
  onYourComputer: "On your computer",
  list: [
    "Windows 10 or 11",
    "A paid Claude plan that can run Claude Code",
    "At least 15 GB of free disk space. The installer checks this first and stops before it installs anything if there is less",
    "An internet connection",
    "Node.js 22 or newer, Python 3.10 or newer, Git and FFmpeg. The installer checks them and asks before it installs any of them",
  ],
  optionalTitle: "Optional, and your own cost",
  optional: [
    "After Effects or DaVinci Resolve, if you own them",
    "Paid image or video generation. You set a spend limit. The default is $0",
    "Remotion is free for individuals and companies of up to 3 people. Larger companies need a Remotion licence",
  ],
  notIncluded: "Not included in the price: your Claude plan, and any optional paid tools above.",
} as const;

export const PRICE = {
  heading: "Price",
  product: "TheEditCompanion by BigQuiv Digitals",
  covers: [
    "The download: 3 skills, 39 built-in modules, installer, doctor and rescue command",
    "A START-HERE guide, an install guide and a quick-start card",
    "Install support from our team for 30 days after you buy",
    "Updates are not promised",
  ],
  coversTitle: "What the price covers",
  supportNote: "Updates are not promised. Support is for installing and running it, for 30 days after you buy.",
} as const;

export const HOW_TO_BUY = {
  heading: "How to buy",
  steps: [
    ["Step 1, choose.", "Click Get TheEditCompanion."],
    ["Step 2, pay.", "Check out on this site."],
    ["Step 3, install.", "Download the pack and follow the install guide."],
  ],
} as const;

export const CHECKOUT = {
  heading: "Your order",
  nameLabel: "Your name",
  emailLabel: "Your email",
  emailHelp: "We send your download link to this email. Check it is correct.",
  payChoice: "Choose how to pay",
  optionFlutterwave: "Pay with card or bank (Flutterwave)",
  working: "Processing your payment. Do not close this page.",
  errMissing: "Add your name and a valid email to continue.",
  errEmail: "This email does not look right. Check it and try again.",
  errConsent: "Tick both boxes to continue.",
  errPayment:
    "Your payment did not go through. Check your details, or try again. If money left your account, message us with your email and the time of payment. We will check it.",
  errNotConfirmed:
    "We could not confirm your payment. Do not pay again yet. Message us with your email and we will check.",
  helpLine: "Need help? Telegram @quivira_ophir. WhatsApp +234 706 509 2434. Email contact@bigquivdigitals.com.",
} as const;

export const AFTER = {
  heading: "What happens after you pay",
  items: [
    "You get the download: one folder named TheEditCompanion",
    "README.txt and START-HERE.pdf. Read these first",
    "A guides folder with the install guide and the quick-start card",
    "The installer files you run to set up",
    "The 3 skills: motion-studio, motion-reconstruct and motion-rescue",
    "Docs with resources, credits and notices",
    "The doctor check and the rescue command",
    "Install support from us for 30 days after you buy. Updates are not promised",
  ],
  contactsTitle: "Support contacts",
} as const;

export const EXPERTISE = {
  heading: "How I use it",
  lines: [
    "In my own videos, I direct the edits.",
    "My expertise decides what each edit should look like. That is why the instruction I give Claude matters.",
    "In my own videos, I do the colour grading myself. Claude still makes mistakes there.",
    "You do the same. Claude does the building. You make the decisions.",
  ],
  signed: "Signed: Big Quiv",
} as const;

export const CREDITS = {
  heading: "Credits",
  intro: "TheEditCompanion by BigQuiv Digitals uses tools and methods from other creators. We credit them.",
  items: [
    "Bundled under their own licences: HyperFrames and related modules by HeyGen, Inc. (Apache-2.0). impeccable by Paul Bakaus (Apache-2.0). ui-ux-pro-max by NextLevelBuilder (MIT)",
    "Required tools: HyperFrames by HeyGen. Remotion by the Remotion team. FFmpeg by the FFmpeg project. faster-whisper by SYSTRAN. yt-dlp by its contributors. Scrapling by D4Vinci",
    "Optional extras are downloaded from their creators' own pages",
    "Methods used with credit, in our own words: Sanji Nai-Chien, Mitchel Dumlao, Samson (@bolu_visuals1), Kane Kallaway, Higgsfield",
    "The full credits are in the download",
  ],
  thirdParty:
    "The resources named on the credit pages are third-party resources owned by their creators. They are not included or resold, apart from the licensed software and fonts listed in the credits.",
  notAffiliated:
    "Not affiliated: TheEditCompanion by BigQuiv Digitals is not affiliated with Anthropic, HeyGen or Remotion. Claude is a product of Anthropic.",
} as const;

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/licence", label: "Licence" },
] as const;

/** Metadata strings, from SEO-AND-META.md sections 3, 4 and 8. */
export const META = {
  title: "TheEditCompanion: Claude Code Video Pack | BigQuiv Digitals",
  descriptionFounders:
    "TheEditCompanion takes your reference and script to a finished video with Claude Code. You approve the plan first. Windows first. $67 founders price.",
  descriptionRegular:
    "TheEditCompanion takes your reference and script to a finished video with Claude Code. You approve the plan first. Windows first. $97.",
  ogTitle: "TheEditCompanion by BigQuiv Digitals",
  ogDescription:
    "Take your reference and your own script to a finished video with Claude Code. You approve the plan before anything is built.",
  twitterDescription: "Claude Code video pack. Reference in. Plan approved by you. Video out. Windows first.",
} as const;
