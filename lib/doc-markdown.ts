/**
 * Markdown for /doc/[slug] articles, rendered on the server.
 *
 * Handles headings, bold, italics, inline code, links, images (with their alt
 * text repeated as a visible caption), blockquotes, bulleted and numbered
 * lists, pipe tables, rules, and fenced prompt boxes (escaped, each with a Copy
 * button that CopyButtons.tsx wires up).
 *
 * Numbered lists and tables were added in the October 2026 redesign. Before
 * that, 150 numbered-list lines and every pipe table in the articles rendered
 * as loose paragraphs full of "|" characters. The words are unchanged; only
 * the markup they get is new.
 */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Cells of one pipe-table row, without the outer pipes. */
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

const TABLE_RULE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const OL_ITEM = /^<li data-ol="(\d+)">/;

function renderTable(rows: string[]): string {
  const [head, , ...body] = rows;
  const th = splitRow(head)
    .map((c) => `<th scope="col">${c}</th>`)
    .join("");
  const trs = body
    .map((r) => `<tr>${splitRow(r).map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  // The wrapper scrolls sideways on a phone instead of widening the page.
  return `<div class="doc-table" role="region" aria-label="Table" tabindex="0"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

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
  // Inline code before bold and italics, so an asterisk inside it stays literal.
  html = html.replace(/`([^`\n]+)`/g, (_m, c: string) => `<code>${escapeHtml(c)}</code>`);
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Single asterisks: emphasis. Only a closed pair on one line counts.
  html = html.replace(/(^|[^\w*])\*(?![\s*])([^*\n]+?)\*(?![\w*])/gm, "$1<em>$2</em>");
  // Images before links: an image is a link with a "!" in front. A standalone
  // image becomes a printed figure, its alt text repeated as the caption
  // (aria-hidden, because a screen reader already reads the alt).
  html = html.replace(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/gm, (_m, alt: string, src: string) =>
    alt.trim()
      ? `<figure><img src="${src}" alt="${alt}" loading="lazy" /><figcaption aria-hidden="true">${alt}</figcaption></figure>`
      : `<figure><img src="${src}" alt="" loading="lazy" /></figure>`,
  );
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^> ?(.*)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^[ \t]{2,}[-*] (.+)$/gm, '<li class="doc-li-nested">$1</li>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li data-ol="$1">$2</li>');
  html = html.replace(/^---$/gm, "<hr>");

  const lines = html.split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const nextNonBlank = (from: number) => {
    for (let j = from; j < lines.length; j++) if (lines[j].trim() !== "") return lines[j];
    return "";
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pipe table: a header row followed by a |---| rule.
    if (line.trim().startsWith("|") && TABLE_RULE.test(lines[i + 1] ?? "")) {
      if (list) out.push(`</${list}>`);
      list = null;
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++]);
      i--;
      out.push(renderTable(rows));
      continue;
    }

    // Two or more standalone images in a row (blank lines between them
    // allowed) are laid out side by side as a set of prints.
    if (line.startsWith("<figure") && nextNonBlank(i + 1).startsWith("<figure")) {
      if (list) out.push(`</${list}>`);
      list = null;
      const figs: string[] = [];
      while (i < lines.length && (lines[i].startsWith("<figure") || (lines[i].trim() === "" && nextNonBlank(i).startsWith("<figure")))) {
        if (lines[i].startsWith("<figure")) figs.push(lines[i]);
        i++;
      }
      i--;
      out.push(`<div class="doc-prints">${figs.join("")}</div>`);
      continue;
    }

    if (line.startsWith("<li")) {
      const ol = OL_ITEM.exec(line);
      const kind = ol ? "ol" : "ul";
      const item = ol ? line.replace(OL_ITEM, "<li>") : line;
      // A nested bullet stays inside whatever list is open.
      if (list && line.startsWith('<li class="doc-li-nested"')) {
        out.push(item);
        continue;
      }
      if (list !== kind) {
        if (list) out.push(`</${list}>`);
        const start = ol && ol[1] !== "1" ? ` start="${ol[1]}"` : "";
        out.push(`<${kind}${start}>`);
        list = kind;
      }
      out.push(item);
      continue;
    }

    if (line.trim() === "") {
      // A blank line between two items of the same list does not end the list
      // (the articles space their numbered steps out with blank lines).
      const next = nextNonBlank(i + 1);
      const continues =
        (list === "ol" && OL_ITEM.test(next)) || (list === "ul" && next.startsWith("<li") && !OL_ITEM.test(next));
      if (continues) continue;
      if (list) out.push(`</${list}>`);
      list = null;
      out.push("");
      continue;
    }

    if (list) out.push(`</${list}>`);
    list = null;
    if (/^<(h[1-6]|ul|ol|li|hr|figure|blockquote|div|pre|table)/.test(line)) out.push(line);
    else out.push(`<p>${line}</p>`);
  }
  if (list) out.push(`</${list}>`);
  return out
    .join("\n")
    .replace(/(<p>)?@@DOCBLOCK(\d+)@@(<\/p>)?/g, (_m, _a, i: string) => blocks[Number(i)]);
}

/** The leading `# title` and the rest of the body, as rendered HTML. */
export function splitTitle(fullHtml: string) {
  const lead = /^\s*<h1>([\s\S]*?)<\/h1>\s*/.exec(fullHtml);
  return {
    titleHtml: lead ? lead[1] : null,
    bodyHtml: lead ? fullHtml.slice(lead[0].length) : fullHtml,
  };
}
