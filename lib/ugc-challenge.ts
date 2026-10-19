/**
 * The 30-day UGC challenge, as the site shows it. One copy, used by the home
 * section, /ugc and the hero orbit.
 *
 * Owner, 19 Oct 2026: "upload the proofs ... my UGC challenge ... it should be
 * at the first stage, because it's UGC I'm running now."
 *
 * Sources (do not guess any of these):
 *  - posted reels: his @big_quiv reels pulled for the Day 12 edit,
 *    D:\Projects\ContentBrain\videos\day12-offer\own\*.info.json (id, date,
 *    caption) and hf\assets\media\reel_<id>.mp4
 *  - Day 1: videos\day01-ugc-pivot\FINAL; Day 12: C:\READY TO POST\UGC Day 12 Offer.mp4
 *  - raw takes: Day 11 day12-offer\hf\assets\media\day11_raw_24.mp4, Day 12 take.mov
 *    (the Day 12 raw take and the finished reel are the same length and frame
 *    aligned, so both sides of the slider show the same second)
 * Day 8 was not posted as its own reel, so there is no Day 8 card.
 *
 * Clips: 540x960, 24 fps, H.264 CRF 14, muted (scratchpad ugcweb/encode.sh).
 * They live in the Vercel Blob store with the other proof videos, under
 * proof/ugc-challenge/ (uploaded 19 Oct 2026 with the owner's OK). A new day:
 * encode the same way, `vercel blob put <file> --pathname proof/ugc-challenge/<file>`,
 * then add it to CHALLENGE_DAYS.
 *
 * ⚠ Claims: every reel is his own challenge content. "Made on my own" is the
 * only line about brands, as on /ugc (VestaScan is the only brand that hired
 * him). Never imply a brand paid for a challenge reel.
 */

// NEXT_PUBLIC_PROOF_VIDEO_BASE is set for Production and Development only, so
// Preview builds fall back to the same public bucket address.
const PROOF_BASE =
  process.env.NEXT_PUBLIC_PROOF_VIDEO_BASE || "https://9riuwecd7c7kbebs.public.blob.vercel-storage.com/proof";
export const CLIP_BASE = `${PROOF_BASE}/ugc-challenge`;

export type ChallengeDay = {
  day: number;
  title: string;
  /** clip and poster name, without extension */
  file: string;
  /** the posted reel, where it is public */
  url?: string;
};

export const CHALLENGE_DAYS: ChallengeDay[] = [
  { day: 1, title: "The pivot to UGC", file: "ugc-day01" },
  { day: 2, title: "5 hours of class, 3 prompts", file: "ugc-day02", url: "https://www.instagram.com/reel/DeGvWNlR87C/" },
  { day: 3, title: "A brand paying for your opinion", file: "ugc-day03", url: "https://www.instagram.com/reel/DeJL5YuRfjH/" },
  { day: 4, title: "7 brands I want to work with", file: "ugc-day04", url: "https://www.instagram.com/reel/DeOgCnHxQlO/" },
  { day: 5, title: "My rough edit timeline", file: "ugc-day05", url: "https://www.instagram.com/reel/DeUO2W2tGYW/" },
  { day: 6, title: "Online the minute you land", file: "ugc-day06", url: "https://www.instagram.com/reel/DebSWEwx8fc/" },
  { day: 7, title: "Get paid before you shoot", file: "ugc-day07", url: "https://www.instagram.com/reel/DeggEa6x_KA/" },
  { day: 9, title: "Out of storage on day 9", file: "ugc-day09", url: "https://www.instagram.com/reel/DeloIcLRK4D/" },
  { day: 10, title: "Revoke your token approvals", file: "ugc-day10", url: "https://www.instagram.com/reel/DeoLcOUtjFS/" },
  { day: 11, title: "Questions for Elon's Roadster", file: "ugc-day11", url: "https://www.instagram.com/reel/Deo4eFLtZ6_/" },
  { day: 12, title: "What I do for brands", file: "ugc-day12" },
];

/**
 * Raw take next to the finished reel, the same seconds on both sides. Days 3, 7
 * and 9 were lined up by audio cross-correlation of the reel against the raw
 * take (scratchpad align.py, 19 Oct 2026) and checked frame by frame. Days 2
 * and 6 were left out: their "raw" files already carried an edit.
 * Home and /ugc show the first two; the TheEditCompanion page shows all five.
 */
export const BEFORE_AFTER = [
  { day: 12, title: "What I do for brands", before: "ugc-d12-before", after: "ugc-d12-after" },
  { day: 11, title: "Questions for Elon's Roadster", before: "ugc-d11-before", after: "ugc-d11-after" },
  { day: 9, title: "Out of storage on day 9", before: "ugc-d9-before", after: "ugc-d9-after" },
  { day: 7, title: "Get paid before you shoot", before: "ugc-d7-before", after: "ugc-d7-after" },
  { day: 3, title: "A brand paying for your opinion", before: "ugc-d3-before", after: "ugc-d3-after" },
];

export const INSTAGRAM = "https://www.instagram.com/big_quiv/";

export const clip = (file: string) => `${CLIP_BASE}/${file}.mp4`;
export const poster = (file: string) => `${CLIP_BASE}/${file}.webp`;
