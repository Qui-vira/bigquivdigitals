import type { DevicePose } from "@/components/v3/stage/scenes/device";

/**
 * The opening stage of each case study (comps: WorkPeaceway, WorkAlphaPlays,
 * WorkNigeriaBusinessCosts, WorkContentEngine on the website comps canvas).
 *
 * Every line here repeats, word for word, a line from the case study's own
 * MDX or from the comp the owner approved on 19 Oct 2026. Nothing is new copy.
 * The stage beats line up with the device poses: hero, beat one (p 0.13 to
 * 0.34), beat two (0.36 to 0.56), the push-in (0.6 to 0.79), the settle
 * (0.84 to 1).
 */

export type StageLine = { text: string; win: string; side?: "left" | "right" | "low" | "high" | "center" | "top-left" };

export type CaseStageConfig = {
  slug: string;
  mark: string;
  /** the part of the h1 set in gold */
  titleMark: string;
  check?: string;
  kind: "phone" | "laptop";
  screens: { src: string; at: number; crop?: [number, number, number, number] }[];
  poses: [number, DevicePose][];
  ghosts: StageLine[];
  asides: StageLine[];
  /** labels shown on the push-in (Freeze and Label in the stage) */
  pins?: { text: string; win: string };
  /** the settle: an optional figure and line over the button */
  end: { win: string; figure?: string; line?: string };
  /** the small device beside the close */
  closeScreen: string;
};

const P = (x: number, y: number, s: number, ry: number, rx: number, rz = 0, extra: Partial<DevicePose> = {}): DevicePose => ({
  x,
  y,
  s,
  ry,
  rx,
  rz,
  z: 0,
  fx: 0.5,
  fy: 0.5,
  open: 1,
  ...extra,
});

const NOTE = "Thirty minutes. No deck, no pitch. You leave with the plan whether you hire me or not.";
export const CASE_NOTE = NOTE;

export const CASE_STAGES: Record<string, CaseStageConfig> = {
  peaceway: {
    slug: "peaceway",
    mark: "PEACEWAY",
    titleMark: "never makes a claim about a drug.",
    check: "https://peacewayonline.com",
    kind: "phone",
    screens: [
      { src: "/proof/peaceway/12-telegram-order-confirmation.webp", at: 0, crop: [0, 0, 0.5, 1] },
      { src: "/proof/peaceway/09b-telegram-inventory-search.webp", at: 0.555 },
      { src: "/proof/peaceway/12-telegram-order-confirmation.webp", at: 0.8, crop: [0, 0, 0.5, 1] },
    ],
    poses: [
      [0, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.05, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.17, P(0.32, 0, 0.95, -1.02, 0.05)],
      [0.31, P(0.3, 0, 0.95, -0.82, 0.06)],
      [0.41, P(-0.3, 0, 1.02, 0.36, 0.04, -0.05)],
      [0.54, P(-0.3, 0, 1.02, 0.28, 0.04, -0.04)],
      [0.62, P(0, 0.06, 2.7, 0, 0, 0, { z: 1, fx: 0.66, fy: 0.3 })],
      [0.76, P(0, 0.06, 2.8, 0, 0, 0, { z: 1, fx: 0.66, fy: 0.34 })],
      [0.86, P(0, 0.13, 0.56, -0.2, 0.08)],
      [1, P(0, 0.13, 0.56, 0.24, 0.08)],
    ],
    ghosts: [
      { text: "Three doors, not one.", win: "0.13,0.19,0.29,0.34", side: "left" },
      { text: "Ordering inside Telegram.", win: "0.36,0.42,0.52,0.56", side: "right" },
      { text: "ask pharmacist", win: "0.6,0.645,0.75,0.79", side: "low" },
    ],
    asides: [],
    end: { win: "0.84,0.88,0.97,1", figure: "N1,055" },
    closeScreen: "/proof/peaceway/12-telegram-order-confirmation.webp",
  },
  "alpha-plays": {
    slug: "alpha-plays",
    mark: "ALPHA PLAYS",
    titleMark: "Most buy posts and get nothing.",
    check: "https://t.me/Hustlerskrib_Results/399",
    kind: "phone",
    screens: [{ src: "/proof/quivira/result-eth-setup-85pct.webp", at: 0 }],
    poses: [
      [0, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.05, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.17, P(0.32, 0, 0.95, -0.95, 0.05)],
      [0.31, P(0.3, 0, 0.95, -0.78, 0.06)],
      [0.41, P(-0.3, 0, 1.02, 0.36, 0.04, -0.05)],
      [0.54, P(-0.3, 0, 1.02, 0.28, 0.04, -0.04)],
      [0.62, P(0.12, 0, 4.3, 0, 0, 0, { z: 1, fx: 0.32, fy: 0.42 })],
      [0.76, P(0.12, 0, 4.4, 0, 0, 0, { z: 1, fx: 0.32, fy: 0.43 })],
      [0.86, P(0, 0.13, 0.56, -0.2, 0.08)],
      [1, P(0, 0.13, 0.56, 0.24, 0.08)],
    ],
    ghosts: [
      { text: "3,485 subscribers.", win: "0.13,0.19,0.29,0.34", side: "left" },
      { text: "Then the outcome.", win: "0.36,0.42,0.52,0.56", side: "right" },
    ],
    asides: [{ text: "Anyone can post a green number.", win: "0.62,0.66,0.75,0.79", side: "top-left" }],
    pins: { text: "Entry 3748|Stop loss 3683|Take profit 3974", win: "0.61,0.65,0.75,0.79" },
    end: { win: "0.84,0.88,0.97,1", line: "No guaranteed returns. No profit promises." },
    closeScreen: "/proof/quivira/result-eth-setup-85pct.webp",
  },
  "nigeria-business-costs": {
    slug: "nigeria-business-costs",
    mark: "NIGERIA",
    titleMark: "Can you prove which ones are killing you?",
    kind: "laptop",
    screens: [
      { src: "/proof/nbci/01-powerbi-what-is-changing.webp", at: 0 },
      { src: "/proof/nbci/02-powerbi-fuel-and-power.webp", at: 0.37 },
      { src: "/proof/nbci/04-powerbi-validation.webp", at: 0.565 },
    ],
    poses: [
      [0, P(0.27, 0.07, 0.8, -0.42, 0.2)],
      [0.05, P(0.27, 0.07, 0.8, -0.42, 0.2)],
      [0.15, P(0.29, 0.03, 0.78, -0.3, 0.26, 0, { open: 0.32 })],
      [0.31, P(0.29, 0.03, 0.8, -0.36, 0.18)],
      [0.41, P(-0.29, 0.03, 0.84, 0.42, 0.14)],
      [0.54, P(-0.29, 0.03, 0.84, 0.36, 0.14)],
      [0.62, P(0, 0.02, 1.75, 0, 0.03, 0, { z: 1, fx: 0.26, fy: 0.15 })],
      [0.76, P(0, 0.02, 1.82, 0, 0.03, 0, { z: 1, fx: 0.26, fy: 0.16 })],
      [0.86, P(0, 0.15, 0.6, -0.22, 0.22)],
      [1, P(0, 0.15, 0.6, 0.2, 0.22)],
    ],
    ghosts: [
      { text: "The data exists.", win: "0.12,0.18,0.29,0.34", side: "left" },
      { text: "Diesel more than doubled", win: "0.36,0.42,0.52,0.56", side: "right" },
      { text: "110 out of 110 checks", win: "0.6,0.645,0.75,0.79", side: "low" },
    ],
    asides: [{ text: "158.2%", win: "0.39,0.44,0.52,0.56", side: "right" }],
    end: { win: "0.84,0.88,0.97,1", line: "Thirty minutes. No deck, no pitch." },
    closeScreen: "/proof/nbci/01-powerbi-what-is-changing.webp",
  },
  "content-engine": {
    slug: "content-engine",
    mark: "ENGINE",
    titleMark: "Then what?",
    kind: "phone",
    screens: [{ src: "/proof/content/web3-video-128k.webp", at: 0 }],
    poses: [
      [0, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.05, P(0.3, 0.02, 1, -0.45, 0.12, 0.05)],
      [0.17, P(0.32, 0, 0.95, -0.95, 0.05)],
      [0.31, P(0.3, 0, 0.95, -0.78, 0.06)],
      [0.41, P(-0.3, 0, 1.02, 0.36, 0.04, -0.05)],
      [0.54, P(-0.3, 0, 1.02, 0.28, 0.04, -0.04)],
      [0.62, P(0, 0.04, 2.6, 0, 0, 0, { z: 1, fx: 0.3, fy: 0.6 })],
      [0.76, P(0, 0.04, 2.7, 0, 0, 0, { z: 1, fx: 0.3, fy: 0.61 })],
      [0.86, P(0, 0.13, 0.56, -0.2, 0.08)],
      [1, P(0, 0.13, 0.56, 0.24, 0.08)],
    ],
    ghosts: [
      { text: "128,000 views.", win: "0.13,0.19,0.29,0.34", side: "left" },
      { text: "1,700 comments.", win: "0.36,0.42,0.52,0.56", side: "right" },
      { text: "Web3 Jobs", win: "0.6,0.645,0.75,0.79", side: "high" },
    ],
    asides: [{ text: "The video was never the asset.", win: "0.62,0.66,0.75,0.79", side: "center" }],
    end: { win: "0.84,0.88,0.97,1", line: "I build the half that catches it." },
    closeScreen: "/proof/content/web3-video-128k.webp",
  },
};
