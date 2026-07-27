
export interface ProofStatData {
  label: string;
  value: number;
  suffix: string | null;
  /** Pointer to the proof block backing this number. No ref, no render. */
  evidenceRef: string | null;
}

/**
 * A number with its receipt.
 *
 * The claim register says no claim ships without evidence behind it. That rule
 * lived only in a document, which is how "85%+ win rate" ended up published
 * under a heading reading "Data, not claims". Here it is structural: a stat
 * with no `evidenceRef` returns null and never reaches the page.
 *
 * If a number belongs on the site, someone has to be able to point at the
 * screenshot. If they cannot, the number does not belong on the site.
 *
 * The number renders as static text. There was a count-up animation here; it
 * shipped "0+ COMMUNITY MEMBERS" to real visitors twice, on a page whose whole
 * argument is that the numbers are real. A two-second flourish is not worth a
 * failure mode that attacks the site's central claim, so the animation is gone
 * rather than fixed a third time. There is now no code path that can render
 * anything other than the true value.
 */
export function ProofStat({ label, value, suffix, evidenceRef }: ProofStatData) {
  if (!evidenceRef) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-6 text-center">
      <div
        // Tabular figures stop the number jittering as it counts.
        className="text-4xl font-extrabold tabular-nums text-text-primary md:text-[56px] md:leading-none"
        style={{ textShadow: "0 0 20px rgba(230, 57, 70, 0.2)" }}
      >
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-sm font-medium uppercase tracking-widest text-text-secondary">
        {label}
      </div>
    </div>
  );
}

/**
 * Renders only the stats that carry evidence. Returns null if none qualify, so
 * an empty proof strip never leaves a bare heading with nothing under it.
 */
export function ProofStrip({ stats }: { stats: ProofStatData[] }) {
  const backed = stats.filter((s) => s.evidenceRef);
  if (backed.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-labelledby="proof-strip-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2
          id="proof-strip-heading"
          className="text-center text-sm font-medium uppercase tracking-widest text-text-muted"
        >
          Receipts, not adjectives.
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {backed.map((stat) => (
            <ProofStat key={stat.label} {...stat} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Every number on this site has a screenshot behind it. Ask me for any of them.
        </p>
      </div>
    </section>
  );
}
