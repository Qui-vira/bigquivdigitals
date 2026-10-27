import { CONTACTS } from "./content";

/**
 * Support contacts as selectable text AND as links (owner decision 15 Oct).
 * The visible text is real text nodes, so it can be selected and copied.
 * Styled by .v3-contacts (app/v3-shared.css); callers wrap it in that class.
 */
export function ContactList() {
  return (
    <ul className="v3-contacts__list">
      {Object.values(CONTACTS).map((c) => (
        <li key={c.label} className="v3-contacts__row">
          <span className="v3-contacts__label">{c.label}:</span>
          <a
            href={c.href}
            className="v3-contacts__link"
            {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {c.display}
          </a>
        </li>
      ))}
    </ul>
  );
}
