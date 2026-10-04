import { cx } from "./cx";

/**
 * Checkered border strip, gold and white between two ink rules. Decorative.
 * `tone="ink"` swaps the gold squares for ink, for a louder edge.
 */
export function CheckerStrip({ tone = "gold", className }: { tone?: "gold" | "ink" | "soft"; className?: string }) {
  const style =
    tone === "ink"
      ? ({ "--checker-a": "var(--color-ink)" } as React.CSSProperties)
      : tone === "soft"
        ? ({ "--checker-a": "var(--color-gold-soft)" } as React.CSSProperties)
        : undefined;
  return <div aria-hidden="true" className={cx("checker-strip w-full", className)} style={style} />;
}
