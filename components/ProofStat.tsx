
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
        // Tabular figures keep the four numbers optically aligned across cards.
        //
        // Size is fluid and capped. It was a fixed 56px, at which the longest
        // value ("1,000,000+") measures 330px against a 222px card interior and
        // spilled straight out of the card. The cap is set so the longest
        // realistic value still fits the narrowest column the grid produces.
        // If a longer value is ever added, re-measure rather than nudging this.
        className="font-extrabold tabular-nums leading-none tracking-tight text-text-primary text-[clamp(2rem,3vw,2.25rem)]"
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
          Receipts.
        </h2>

        {/*
          Four across only from xl. Below ~1280px four columns leave roughly
          114px of usable width per card, which cannot hold a seven-figure
          number at any readable size. Two columns until then, one on phones.
        */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {backed.map((stat) => (
            <ProofStat key={stat.label} {...stat} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Every number here has a screenshot behind it. Ask me for any of them.
        </p>
      </div>
    </section>
  );
}
