import type { ReactNode } from "react";

/**
 * Prompt Type-In (#30 in research/EFFECTS-CATALOGUE.md): a navy input bar
 * types the prompt out (Motion's data-typein), the send key presses, and the
 * film it made rises in underneath. The prompt is the page's own line for
 * that film, so nothing new is said.
 *
 * The bar is not a real input, so it is hidden from assistive tech; the same
 * words are read from `label`. With JavaScript off or motion reduced, the
 * typed prompt and the result are simply there. Styles: course.css.
 */
export function PromptTypeIn({ prompt, label, children }: { prompt: string; label: string; children: ReactNode }) {
  return (
    <div className="v3-prompt">
      <p className="v3-sr">{label}</p>
      <div className="v3-prompt__bar" aria-hidden="true">
        <p className="v3-prompt__text" data-typein>
          {prompt}
        </p>
        <span className="v3-prompt__send">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 16V4M5 8.5 10 4l5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
          </svg>
        </span>
      </div>
      <div className="v3-prompt__result">{children}</div>
    </div>
  );
}
