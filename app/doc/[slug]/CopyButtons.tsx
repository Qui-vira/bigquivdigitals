"use client";

import { useEffect } from "react";

/**
 * The article body is server-rendered HTML, so the Copy buttons inside each prompt box
 * are plain <button>s. This wires them up after load: one listener on the document,
 * copying the <code> next to whichever button was clicked.
 */
export default function CopyButtons() {
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".doc-copy");
      if (!btn) return;
      const code = btn.parentElement?.querySelector("code");
      if (!code) return;
      const text = code.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
      } catch {
        // Clipboard refused (older browsers, some in-app browsers): select the text instead.
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        btn.textContent = "Selected, press copy";
      }
      window.setTimeout(() => {
        btn.textContent = "Copy";
      }, 1800);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
