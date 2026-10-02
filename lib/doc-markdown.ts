/**
 * Markdown for /doc/[slug] articles, rendered on the server.
 * Handles headings, bold, links, images, blockquotes, lists, rules, and fenced
 * prompt boxes (escaped, each with a Copy button that CopyButtons.tsx wires up).
 */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function mdToHtml(md: string): string {
  // Fenced code blocks first, so nothing below rewrites the text inside a prompt.
  // Each becomes a placeholder line and is put back, escaped, with a Copy button.
  const blocks: string[] = [];
  let html = md.replace(/\r\n/g, "\n").replace(/^[ \t]*```[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm, (_m, code: string) => {
    blocks.push(
      `<div class="doc-code"><button type="button" class="doc-copy">Copy</button>` +
        `<pre><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre></div>`,
    );
    return `@@DOCBLOCK${blocks.length - 1}@@`;
  });
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Images before links: an image is a link with a "!" in front.
  html = html.replace(
    /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/gm,
    '<figure><img src="$2" alt="$1" loading="lazy" /></figure>',
  );
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^> ?(.*)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^---$/gm, "<hr>");
  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("<li>")) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(line);
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      if (line.trim() === "") out.push("");
      else if (/^<(h[1-6]|ul|ol|li|hr|figure|blockquote|div|pre|table)/.test(line)) out.push(line);
      else out.push(`<p>${line}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out
    .join("\n")
    .replace(/(<p>)?@@DOCBLOCK(\d+)@@(<\/p>)?/g, (_m, _a, i: string) => blocks[Number(i)]);
}
