/**
 * TheEditCompanion sales copy, v2. The owner's own copy, pasted 20 Oct 2026,
 * word for word ("this is the sales copy i want"). Prices and the founders date
 * are NOT typed here: they come live from the product row through
 * components/companion/PriceContext.tsx, so the page switches to the regular
 * price on its own when the founders offer ends.
 *
 * The v1 copy (content.ts, faq.ts) stays for the old CompanionPage and its tests.
 * Source of record: ContentBrain/business-blueprint/marketing/sales-page/SALES-PAGE-COPY.md, "v2".
 */

export const V2_HERO = {
  h1: "Stop Spending Hours Trying to Make Your Videos Look Professional.",
  sub: "Create the kind of videos that make people stop scrolling, pay attention to your message, and take your brand seriously.",
} as const;

export const V2_MEET = {
  lines: [
    "You know those videos with smooth transitions, beautiful motion graphics, perfectly timed captions and clean, professional editing?",
    "The ones you save and think, “I wish I could make something like this.”",
    "Now imagine having a system that studies your favourite reference videos and helps you create your own, without starting every edit from scratch.",
  ],
  meet: "Meet TheEditCompanion.",
  intro: "Your AI-powered video production companion, built to help you turn your ideas, scripts and references into finished videos using Claude Code.",
} as const;

export const V2_IDEAS = {
  heading: "Your Ideas Deserve Better Videos.",
  lines: [
    "You have something valuable to say.",
    "But creating a video that communicates it beautifully is another story.",
  ],
  pains: [
    "You spend hours searching for editing tutorials.",
    "You struggle to recreate the transitions and effects you've seen online.",
    "You ask AI to edit something, and the result looks nothing like what you imagined.",
    "And before you know it, you've spent more time editing than actually creating.",
  ],
  turn: "What if you could spend less time figuring out how to edit and more time bringing your ideas to life?",
  answer: "That's what TheEditCompanion is designed to help you do.",
} as const;

export const V2_IMAGINE = {
  heading: "Imagine What You Could Create.",
  items: [
    ["Videos that look intentional.", "Create content with thoughtfully placed captions, motion graphics, transitions and visual storytelling that support your message."],
    ["Turn inspiration into something real.", "Found a video you love? Give TheEditCompanion the reference and your own script. It studies how the video was made and helps you build your version."],
    ["Get more out of your creative time.", "Instead of manually figuring out every animation, cut and effect, let AI handle supported production work while you direct the creative decisions."],
    ["Make videos that represent your brand beautifully.", "Whether you're promoting a product, explaining an idea, creating educational content or building your personal brand, your videos should look like you put thought into them."],
    ["Stay in creative control.", "Your words stay yours. Your decisions guide the result. You review the plan before production begins."],
  ],
} as const;

export const V2_DIFFERENCE = {
  heading: "See the Difference for Yourself.",
  sub: "Same footage. A completely different presentation.",
  lines: [
    "This is what becomes possible when creative direction, reference analysis, motion design and video production work together.",
    "See how an ordinary recording can become a more engaging, professionally presented video.",
  ],
  cta: "I Want to Create Videos Like This",
} as const;

export const V2_STEPS = {
  heading: "From Inspiration to Finished Video.",
  sub: "You don't have to work out every technical detail yourself.",
  steps: [
    ["Show it what inspires you.", "Share a reference video you love and the script you want to use."],
    ["Tell it what you want.", "TheEditCompanion studies your reference and prepares a creative editing plan. You review and approve it."],
    ["Bring your video to life.", "The system builds your video using code, your footage and available tools, then checks the result for you to review."],
  ],
  close: "You remain the creative director. TheEditCompanion helps with the production.",
} as const;

export const V2_KINDS = {
  heading: "Create More Than Just Talking-Head Videos.",
  sub: "Give your content the presentation it deserves.",
  items: [
    ["Personal brand videos", "Make your knowledge and personality stand out."],
    ["Product videos", "Showcase what you're selling with engaging visuals and motion."],
    ["Educational content", "Make complicated ideas easier to follow with visual explanations."],
    ["Promotional videos", "Present your offer in a more compelling way."],
    ["Motion graphics", "Add movement, captions and design that make your content feel more polished."],
  ],
  close: "One creative workflow. Different kinds of videos.",
} as const;

export const V2_SOFTWARE = {
  heading: "You Don't Need to Master Every Editing Software.",
  lines: [
    "TheEditCompanion can build videos through code, even without a traditional editing application.",
    "Already use editing software? You can configure the workflow to use supported tools you have available.",
    "You don't need to personally animate every element.",
    "You do need Claude Code, a compatible paid Claude plan, and the willingness to follow the setup instructions and approve creative decisions.",
  ],
} as const;

export const V2_PRICE = {
  heading: "Make Your Next Video Something You're Proud to Publish.",
  intro: "Introducing TheEditCompanion by BigQuiv Digitals.",
  lede: "A complete AI-assisted video production workflow designed to help you create with more direction, more consistency and less manual production work.",
  foundersTitle: "Get Founders Access Today",
  regularTitle: "Get TheEditCompanion",
  regularAfter: "Regular price after the founders offer.",
  includesTitle: "Your purchase includes:",
  // the one material requirement, stated once, plainly, before checkout (owner, 20 Oct 2026)
  requirement: "TheEditCompanion works with Claude Code. You'll need a compatible paid Claude plan to use it.",
  includes: [
    "The complete TheEditCompanion system.",
    "Setup instructions and quick-start guides.",
    "Video production, reference reconstruction and troubleshooting tools.",
    "30 days of installation and usage support.",
  ],
  fine: "Requires Claude Code and a compatible paid Claude plan. Results depend on your input, tools and creative decisions. Other production services may cost extra. All sales are final. Updates are not guaranteed.",
} as const;

export const V2_CLOSE = {
  heading: "Your Next Great Video Starts With an Idea.",
  lines: ["You bring the creativity.", "You bring the story.", "You bring the inspiration."],
  last: "Let TheEditCompanion help you bring it to life.",
  cta: "Start Creating With TheEditCompanion",
} as const;

/**
 * Owner, 20 Oct 2026: "put technical requirements, limitations and refund policies
 * in a clear FAQ", after the purchase. Every answer is his own line from the v2 copy
 * (the software section and the fine print) or an earlier ruling of his (Windows and
 * Mac, 19 Oct; the generic-look answer, 19 Oct; 30 days of support).
 */
export const V2_FAQ = [
  {
    question: "Do I need to know coding?",
    answer: "No. TheEditCompanion builds videos through code for you. You don't need to personally animate every element.",
  },
  {
    question: "Do I need editing software?",
    answer:
      "No. TheEditCompanion can build videos through code, even without a traditional editing application. Already use editing software? You can configure the workflow to use supported tools you have available.",
  },
  {
    question: "What do I need to use it?",
    answer:
      "You do need Claude Code, a compatible paid Claude plan, and the willingness to follow the setup instructions and approve creative decisions.",
  },
  { question: "Does it work on Windows and Mac?", answer: "Both. The setup covers it." },
  {
    question: "Will my videos look generic?",
    answer: "No, it won't look generic. We have built detailed information into the setup that helps you avoid a generic look.",
  },
  { question: "Does anything cost extra?", answer: "Your Claude plan is separate. Other production services may cost extra." },
  { question: "What if I get stuck?", answer: "Your purchase includes 30 days of installation and usage support." },
  { question: "Can I get a refund?", answer: "All sales are final." },
] as const;
