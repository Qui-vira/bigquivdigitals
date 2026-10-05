import "./longread.css";

/**
 * A gold rule under the navbar that fills as the page scrolls. CSS only (see
 * longread.css): no listener, no state, absent where scroll timelines are not
 * supported and under reduced motion. Decorative, so hidden from assistive tech.
 */
export function ReadingProgress() {
  return <div aria-hidden="true" className="read-progress" />;
}
