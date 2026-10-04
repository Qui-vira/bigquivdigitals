import { cx } from "./cx";

/**
 * Typewriter label: metadata, small print, tags, the "(02)" in a section head.
 * Short strings only. It is not a paragraph face.
 *
 *   <MonoLabel>Spec ad</MonoLabel>
 *   <MonoLabel caps={false} tone="soft">Thirty minutes, and I will not pitch you.</MonoLabel>
 */
export function MonoLabel({
  as: Tag = "span",
  caps = true,
  tone = "ink",
  size = "sm",
  className,
  children,
  ...rest
}: {
  as?: "span" | "p" | "div" | "dt" | "dd" | "li";
  caps?: boolean;
  tone?: "ink" | "soft" | "muted" | "gold-deep";
  size?: "xs" | "sm" | "md";
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  const toneCls =
    tone === "soft" ? "text-ink-soft" : tone === "muted" ? "text-ink-muted" : tone === "gold-deep" ? "text-gold-deep" : "text-ink";
  const sizeCls = size === "xs" ? "text-[12px]" : size === "md" ? "text-[15px]" : "text-[13px]";
  return (
    <Tag
      className={cx(
        "font-typewriter leading-snug",
        caps && "uppercase tracking-[0.08em]",
        sizeCls,
        toneCls,
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
