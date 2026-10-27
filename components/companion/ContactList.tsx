import { CONTACTS } from "./content";

/**
 * Support contacts as selectable text AND as links (owner decision 15 Oct).
 * The visible text is real text nodes, so it can be selected and copied.
 */
export function ContactList({ className = "" }: { className?: string }) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {Object.values(CONTACTS).map((c) => (
        <li key={c.label} className="flex flex-wrap items-baseline gap-x-2 text-[16px] leading-relaxed text-ink">
          <span className="font-typewriter text-[13px] font-bold uppercase tracking-[0.08em] text-ink-soft">
            {c.label}:
          </span>
          <a
            href={c.href}
            className="paper-link select-text break-all font-semibold text-ink"
            {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {c.display}
          </a>
        </li>
      ))}
    </ul>
  );
}
