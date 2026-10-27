/**
 * The ONE FAQ array. It feeds the visible FAQ and the FAQPage JSON-LD, so the two cannot
 * drift. Word for word from SALES-PAGE-COPY.md section 13 (and SEO-AND-META.md section 9).
 * scripts/check-companion-page.test.ts proves the page HTML and the JSON-LD match this array.
 */
export type FaqItem = { question: string; answer: string };

export const FAQ: readonly FaqItem[] = [
  {
    question: "What is TheEditCompanion?",
    answer:
      "It is a set of skills for Claude Code. It runs one fixed workflow: take your reference apart, lock your script, write a plan, wait for your approval, build the video in code, then check it against the reference and the plan.",
  },
  {
    question: "Do I need After Effects or DaVinci Resolve?",
    answer:
      "No. The default route builds motion in code with HyperFrames. Remotion is the other code route. If you own After Effects or DaVinci Resolve, you can say so in your profile and the system can use them. One limit: rotoscoping and true 3D camera moves with depth of field have no good code equivalent. Those parts go to paid generation or are redesigned at Gate 1.",
  },
  {
    question: "Does it work on Windows or Mac?",
    answer:
      "Windows first. A Mac installer is written but it has not been run on a Mac. Mac is not tested yet, so we do not say it works.",
  },
  {
    question: "Do I need a paid Claude plan?",
    answer:
      "Yes. TheEditCompanion runs inside Claude Code, and you need a paid Claude plan that can run Claude Code. Plan limits apply. Which plan is enough for heavy projects is still being tested.",
  },
  {
    question: "I can just use Claude myself. Why buy this?",
    answer:
      "You can. Claude is open to anyone. What this adds is the order and the stops. It takes your reference apart, locks your script, and stops for your approval before it builds. You still direct it. If you would rather not do that, ask us about done-for-you video.",
  },
  {
    question: "Will my video look generic?",
    answer:
      "It depends on three things you control: your reference, your script and what you approve. The workflow gives Claude a reference to follow and a plan to follow, which a single prompt does not. Your script is locked, so your words are not rewritten. We do not promise how any video will look.",
  },
  {
    question: "Does it replace an editor, or my colour grading?",
    answer:
      "No. Claude does the building. You set the taste. It can make mistakes, and colour is a place where a person needs to check. If you need an editor, hire one. If you already edit, this helps you build motion pieces in code.",
  },
  {
    question: "Can I use any aspect ratio?",
    answer:
      "Yes. Portrait 9:16 is only the default. You can set 4:5, 1:1, 16:9 or a custom size once in your profile, and the whole workflow follows it.",
  },
  {
    question: "Is it safe to install?",
    answer:
      "The installer runs on your own computer. It checks your tools and asks before it installs any system tool. Its own tools install at user level and need no admin rights. A Windows admin prompt may appear only when you let it install system tools. It adds its hooks to your Claude settings without overwriting what is there, and it saves a backup if it changes the file. Paid generation is off by default, because the spend limit starts at $0.",
  },
  {
    question: "What if it does not install or something fails?",
    answer:
      "Run the doctor. It shows what is wrong and ends with the single next fix. You can also type /motion-rescue in Claude Code, and it will diagnose and fix the problem or change the route. If you are still stuck, message us on Telegram @quivira_ophir, WhatsApp +234 706 509 2434, or email contact@bigquivdigitals.com. For 30 days after you buy, we help you install and run it.",
  },
  {
    question: "Can I copy any reference video?",
    answer:
      "No. You must hold the rights to the reference you use. Downloading a video from a social platform may breach that platform's terms. In style mode, only the reference's grammar is taken, and your own logos and text replace the reference's.",
  },
  {
    question: "What costs extra?",
    answer:
      "Your Claude plan. Optional paid image or video generation, where you set a spend limit and the default is $0. After Effects or DaVinci Resolve, only if you choose to use them. Remotion is free for individuals and companies of up to 3 people, and larger companies need a Remotion licence.",
  },
  {
    question: "Do you promise views, sales or income?",
    answer:
      "No. We do not claim any result for any video. TheEditCompanion is a production workflow. What you make, and what happens when you post it, is up to you.",
  },
  {
    question: "What do I get after I pay?",
    answer:
      "One download folder named TheEditCompanion. It holds README.txt, START-HERE.pdf, an install guide, a quick-start card, the installer, the 3 skills, and docs with resources and credits. You also get install support from us for 30 days after you buy. Updates are not promised.",
  },
  {
    question: "Are all sales final?",
    answer:
      "Yes. All sales are final. For 30 days after you buy, we help you install and run it. Message us on Telegram @quivira_ophir, WhatsApp +234 706 509 2434, or email contact@bigquivdigitals.com.",
  },
];

/** FAQPage JSON-LD built from the same array. No review or rating fields. */
export function faqJsonLd(items: readonly FaqItem[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}
