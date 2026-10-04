/** Joins class names, dropping falsy values. No dependency, no merging. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * "relative", unless the caller already positioned the element. Two position
 * utilities in one class list resolve by stylesheet order (relative wins over
 * absolute), which silently drops a sticker into the document flow. Every
 * primitive that needs a positioned box uses this instead of hardcoding it.
 */
export function positioned(className?: string): string {
  return /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className ?? "") ? "" : "relative";
}

/**
 * The primitive's own display utility, unless the caller hides it with
 * `hidden` (for example `hidden lg:inline-flex`). Same stylesheet-order trap
 * as positioned(): `hidden` and `inline-flex` in one list, and inline-flex wins.
 */
export function display(className: string | undefined, fallback: string): string {
  return /(^|\s)hidden(\s|$)/.test(className ?? "") ? "" : fallback;
}
