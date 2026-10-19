/**
 * The ONE FAQ array. It feeds the visible FAQ and the FAQPage JSON-LD, so the two cannot
 * drift. Word for word from SALES-PAGE-COPY.md section 13 (and SEO-AND-META.md section 9).
 * scripts/check-companion-page.test.ts proves the page HTML and the JSON-LD match this array.
 */
export type FaqItem = { question: string; answer: string };

// Owner, 19 Oct 2026: short answers, no tool names, no setup detail ("not like a parrot").
export const FAQ: readonly FaqItem[] = [
  {
    question: "What is TheEditCompanion?",
    answer: "A set of skills for Claude Code. It runs one fixed workflow and stops for your approval before it builds.",
  },
  {
    question: "Do I need an editing app?",
    answer: "No. It builds in code. If you own an editing app, the system can use it.",
  },
  {
    question: "Does it work on Windows or Mac?",
    answer: "Windows first. Mac is not tested yet.",
  },
  {
    question: "Do I need a paid Claude plan?",
    answer: "Yes. It runs inside Claude Code, so you need a paid Claude plan that can run it.",
  },
  {
    question: "I can just use Claude myself. Why buy this?",
    answer: "You can. What this adds is the order and the stops. You still direct it.",
  },
  {
    question: "Will my video look generic?",
    answer: "No, it won't look generic. We have built detailed information into the setup that helps you avoid a generic look.",
  },
  {
    question: "Does it replace an editor, or my colour grading?",
    answer: "No. Claude does the building. You make the decisions.",
  },
  {
    question: "Can I use any aspect ratio?",
    answer: "Yes. 9:16 is the default. You can set any size.",
  },
  {
    question: "What if something fails?",
    answer: "Type /motion-rescue, or message us. For 30 days after you buy, we help you install and run it.",
  },
  {
    question: "What costs extra?",
    answer: "Your Claude plan. Paid image or video generation is optional, and the spend limit starts at $0.",
  },
  {
    question: "What do I get after I pay?",
    answer:
      "One download folder with the 3 skills, a START-HERE guide, an install guide and a quick-start card, plus install support from us for 30 days.",
  },
  {
    question: "Are all sales final?",
    answer: "Yes. For 30 days after you buy, we help you install and run it.",
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
