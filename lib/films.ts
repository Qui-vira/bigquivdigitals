/**
 * films.ts — the ten proof films, in one place.
 *
 * ⚠ THIS IS THE ONLY COPY. It was local to components/AiMasteryClient.tsx until
 * 2026-09-12, when the portfolio reel needed the same films. Duplicating it
 * would have meant two sets of runtimes, notes and post URLs drifting apart,
 * and the notes are claim-bearing: they are what keeps an unofficial brand film
 * from reading as commissioned client work. One copy, imported twice.
 *
 * `file` is the name inside the bucket at NEXT_PUBLIC_PROOF_VIDEO_BASE.
 * `aspect` is off real ffprobe dimensions, never guessed.
 * `brand` is only set where a recognisable name exists; the reel shows it above
 * the title and the sales page ignores it.
 */
import type { Film } from "@/components/ProofFilm";

export const FILMS: Record<string, Film> = {
  chike: {
    img: "/proof/aimastery/chike.webp",
    file: "chike.mp4",
    aspect: "scope",
    title: "What If Chike Wasn't Born",
    line: "One character, held for three and a half minutes. Most people using these tools cannot hold a face across two shots.",
    runtime: "3:26",
    url: "https://x.com/_Quivira/status/2056757338996924676",
  },
  burgerking: {
    brand: "Burger King",
    img: "/proof/aimastery/burgerking.webp",
    file: "burgerking.mp4",
    aspect: "wide",
    title: "The Heist",
    line: "A Whopper locked in a vault like a ten million dollar diamond. Lasers, gloves, sirens, slow-motion escape.",
    runtime: "0:30",
    url: "https://x.com/_Quivira/status/2053547582912336233",
    note: "Unofficial. Burger King commissioned, approved and paid for none of it.",
  },
  lexus: {
    brand: "Lexus",
    img: "/proof/aimastery/lexus.webp",
    file: "lexus.mp4",
    aspect: "vertical",
    title: "The $2M Ad",
    line: "Eighty seconds that looks like a budget nobody gave me.",
    runtime: "1:19",
    url: "https://x.com/_Quivira/status/2055375185889382870",
    note: "Unofficial. Lexus commissioned, approved and paid for none of it.",
  },
  peaceway: {
    brand: "Peaceway Pharmacy",
    img: "/proof/aimastery/peaceway.webp",
    file: "peaceway.mp4",
    aspect: "vertical",
    title: "Peaceway Pharmacy",
    line: "My dad asked me to make an ad for his pharmacy, so I did. Symptom, hesitation, shopfront, pharmacist, branded bag.",
    runtime: "0:16",
    url: "https://x.com/_Quivira/status/2051236382689910875",
    note: "My father's pharmacy. Never billed. The only one made to a real brief.",
  },
  lagos: {
    brand: "Air Peace",
    img: "/proof/aimastery/lagos.webp",
    file: "lagos.mp4",
    aspect: "vertical",
    title: "The Lagos Film",
    line: "The same man followed from a Lagos street to a cockpit, across three parts.",
    runtime: "2:42",
    url: "https://x.com/_Quivira/status/2056297961617801722",
    note: "Unofficial. Air Peace commissioned, approved and paid for none of it.",
  },
  bridge: {
    img: "/proof/aimastery/bridge.webp",
    file: "bridge.mp4",
    aspect: "scope",
    title: "Third Mainland Bridge",
    line: "Three Nigerians, a door under the bridge, and a box that could set the country free.",
    runtime: "2:59",
    url: "https://x.com/_Quivira/status/2057144836604498108",
  },
  titan: {
    img: "/proof/aimastery/titan.webp",
    file: "titan.mp4",
    aspect: "scope",
    title: "Titan",
    line: "A lone figure, a sea god, one final blast. My own face used as the reference to direct the whole sequence.",
    runtime: "0:20",
    url: "https://x.com/_Quivira/status/2051961250007994792",
  },
  gucci: {
    brand: "Gucci",
    img: "/proof/aimastery/gucci.webp",
    file: "gucci.mp4",
    aspect: "scope",
    title: "Metamorphosis",
    line: "Leather becomes liquid gold. Gold becomes glass. Glass becomes birds. No talking, no product shot until the end.",
    runtime: "0:25",
    url: "https://x.com/_Quivira/status/2052822783231488379",
    note: "Unofficial. Gucci commissioned, approved and paid for none of it.",
  },
  mcdonalds: {
    brand: "McDonald’s",
    img: "/proof/aimastery/mcdonalds.webp",
    file: "mcdonalds.mp4",
    aspect: "wide",
    title: "The Last Fry",
    line: "One fry, shot like it is the last one on earth.",
    runtime: "0:15",
    url: "https://x.com/_Quivira/status/2053878672726311130",
    note: "Unofficial. McDonald's commissioned, approved and paid for none of it.",
  },
  amara: {
    img: "/proof/aimastery/amara.webp",
    file: "amara.mp4",
    aspect: "vertical",
    title: "Amara Wasn't Lazy",
    line: "A whole character carried through a story, on a laptop, with nobody in front of a camera.",
    runtime: "1:43",
    url: "https://x.com/_Quivira/status/2051712953322217553",
  },
};
