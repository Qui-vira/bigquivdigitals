/**
 * What each /classes product teaches, for the sales page. Display only: prices
 * live in lib/course-prices.ts and the server enforces them.
 *
 * SOURCE: ContentBrain/30-DAY-CONTENT-SYSTEM/COURSE-OUTLINES.md (draft v2,
 * 25 Nov 2026). Names and prices approved by the owner on 25 Nov 2026.
 *
 * ⚠ CLAIM DISCIPLINE. Left OFF the page on purpose, because the outline file
 * still lists them as open for the owner: the 2-week length, the number of live
 * calls, lifetime or 6-month access, and the order and pacing inside the combo.
 * Add them here only once he has ruled on them.
 *
 * Tool costs are the outline's "cheapest route": prices read from the vendors'
 * own pages on 25 Nov 2026 at about ₦1,400 to $1, so they are written as
 * "about". Trading and Web3 carry the outline's rule: education only, no
 * financial advice, no profit claims.
 */
export type NicheContent = {
  slug: string;
  /** One line: who it is for. */
  forWho: string;
  notFor: string;
  /** Lesson titles, week 1 then week 2. Lesson 1 is always prompting for this niche. */
  week1: { title: string; lessons: string[] };
  week2: { title: string; lessons: string[] };
  deliverable: string;
  toolCost: string;
  rule?: string;
};

export const NICHE_CONTENT: NicheContent[] = [
  {
    slug: "ai-video-editing",
    forWho: "Creators editing their own talking-head videos, and editors who want to work faster.",
    notFor: "Anyone after the full Claude Code motion pack. That is TheEditCompanion.",
    week1: {
      title: "The cut",
      lessons: ["Prompting for editing: the hook, the cuts and a b-roll list from your transcript", "Cut dead air and bad takes", "Auto captions, then fix them", "Clean the voice"],
    },
    week2: {
      title: "The finish",
      lessons: ["B-roll and cut-outs", "Music and sound effects on the beat", "The first 3 seconds: hook text and cover frame", "Export settings per platform"],
    },
    deliverable: "A 30 to 60 second edit of your own footage, shown before and after.",
    toolCost: "₦0. CapCut Free, Claude Free and your own footage.",
  },
  {
    slug: "ai-ugc-content",
    forWho: "People who want to make content for brands and get paid, filmed on a phone or made with AI.",
    notFor: "Anyone who wants brand deals without making a portfolio first.",
    week1: {
      title: "The brief and the hook",
      lessons: ["Prompting for UGC: 10 hook ideas and a 30-second script from a product page", "What brands want", "Film it on a phone: framing, light, sound", "AI UGC without your face, and when to say it is AI"],
    },
    week2: {
      title: "Portfolio and pitch",
      lessons: ["Edit it in CapCut", "Make 2 more hook versions", "A one-page portfolio and a rate card", "Pitching a brand by DM and spotting scams"],
    },
    deliverable: "One UGC video in 3 hook versions, a portfolio page and 3 sent pitches.",
    toolCost: "₦0 if you film on your phone. AI avatar UGC needs Higgsfield Plus, about ₦56,000 for the first month.",
  },
  {
    slug: "ai-web3-defi",
    forWho: "People already curious about crypto who want to research projects, airdrops and on-chain data safely with AI.",
    notFor: "Beginners who want crypto basics, or anyone looking for guaranteed income.",
    week1: {
      title: "Research a project",
      lessons: ["Prompting for research: make AI read a project's docs and list the risks, with sources", "Tokenomics in plain words", "Red flags: fake teams, copied code, paid hype", "Check claims on a block explorer"],
    },
    week2: {
      title: "Do it safely",
      lessons: ["Wallet safety: seed phrase, approvals, scam links", "Airdrop and points tracking with AI", "One small test transaction, live", "A weekly research routine"],
    },
    deliverable: "A one-page risk report on one project and a tracking sheet for 3 projects.",
    toolCost: "About ₦2,000 to ₦5,000 of gas for one test transaction. Claude Free, a free wallet and a block explorer.",
    rule: "Education only. No financial advice and no profit claims.",
  },
  {
    slug: "ai-video-creation",
    forWho: "People who want to make videos with AI without a camera, a crew or a budget.",
    notFor: "Anyone who wants a button that makes a finished film. It does not exist.",
    week1: {
      title: "Idea and character",
      lessons: ["Prompting for video: script, shot list and image prompts from one idea", "The concept: what makes a clip an ad", "One character, same face, from reference images", "Stills to moving shots"],
    },
    week2: {
      title: "Finish the film",
      lessons: ["The rest of the shots, and when to re-roll", "Voice and sound", "Assemble in CapCut: cut, captions, music", "Export for TikTok, Reels and X"],
    },
    deliverable: "A 15 to 30 second spec ad with one character held throughout, labelled as unofficial fan work.",
    toolCost: "About ₦26,600 for one month of Higgsfield Starter. Claude, CapCut and ElevenLabs on their free plans.",
  },
  {
    slug: "ai-trading",
    forWho: "People who already trade a little and want AI to help them research, plan trades, keep a journal and test ideas.",
    notFor: "Anyone looking for signals or a bot that makes money. This class does not sell that.",
    week1: {
      title: "Research and plan",
      lessons: ["Prompting for trading: make AI summarise the news and the chart, and say what it does not know", "A written trade plan: entry, stop, size, reason", "Risk: position size from the stop", "A trade journal AI can read"],
    },
    week2: {
      title: "Test before you trust",
      lessons: ["Ask AI to test a rule on past data", "Why most rules fail: luck, too few trades, costs", "Live chart call: plan one demo trade together", "A weekly review routine with AI"],
    },
    deliverable: "A written trading plan, 10 logged demo trades and one backtest, with an honest review of what the AI got wrong.",
    toolCost: "₦0. Claude Free, a free charting tool and an exchange demo account.",
    rule: "Education only. Demo accounts only. No financial advice and no profit claims.",
  },
  {
    slug: "vibe-coding",
    forWho: "People who want to build a page, a tool or a small app without being a programmer.",
    notFor: "Anyone who wants to become a software engineer in 2 weeks.",
    week1: {
      title: "Build the first thing",
      lessons: ["Prompting for code: describe what you want, one step at a time", "Set up Claude Code on a laptop", "Read what it made and ask for fixes", "Save your work with GitHub"],
    },
    week2: {
      title: "Put it online",
      lessons: ["Put it online for free", "Add a form that saves sign-ups", "When it breaks: give the AI the error", "Keep keys and passwords out of your code"],
    },
    deliverable: "A small live web page with a working sign-up form, on your own link.",
    toolCost: "About ₦28,000 a month for Claude Pro, which Claude Code needs. A laptop of your own.",
  },
  {
    slug: "ai-agents",
    forWho: "People who want AI to do a job on its own: answer messages, sort leads, send a daily brief.",
    notFor: "Anyone who wants a finished bot built for them. That is a service.",
    week1: {
      title: "What an agent is",
      lessons: ["Prompting for agents: its job, its rules, what it must never do", "Trigger, step, result: how an automation runs", "Give the agent tools: a sheet, a form, a message", "Test it before you trust it"],
    },
    week2: {
      title: "Make it run",
      lessons: ["Build it with Claude Code", "Keyword replies on WhatsApp and Instagram", "Logs: see what it did and why", "Costs and limits: keep the API bill small"],
    },
    deliverable: "One working agent that does one real task, such as a keyword auto-reply or a daily summary.",
    toolCost: "About ₦42,000: Claude Pro for a month and about $10 of API credit.",
  },
];

export const COMBO_CONTENT = {
  slug: "ai-mastery-combo",
  line: "All seven niches in one course, at one price below buying them one by one.",
  includes: NICHE_CONTENT.map((n) => n.slug),
};

export function nicheContent(slug: string): NicheContent | undefined {
  return NICHE_CONTENT.find((n) => n.slug === slug);
}
