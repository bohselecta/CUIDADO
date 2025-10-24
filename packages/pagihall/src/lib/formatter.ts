// Tiny streaming-friendly formatter: Markdown-ish → sanitized HTML
// Handles: headings, lists, ordered lists, callouts, code fences, inline code, links, tables,
// paragraph breaks, horizontal rules. No external deps.

function esc(s: string) {
  return s.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]!));
}

// crude but safe-enough linkifier (http(s) only)
function linkify(text: string) {
  return text.replace(/\bhttps?:\/\/[^\s)]+/g, (u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a>`);
}

export function formatToHtml(raw: string): string {
  if (!raw) return "";

  // Normalize line endings
  let t = raw.replace(/\r\n?/g, "\n");

  // Gentle heuristics: if model emits long run-on, insert paragraph breaks after sentence ends
  if (!/\n{2,}/.test(t)) {
    t = t.replace(/([.!?])\s+(?=[A-Z0-9"'\[])/g, "$1\n\n");
  }

  // Code fences: protect blocks first
  const codeBlocks: string[] = [];
  t = t.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.push(code) - 1;
    return `\uFFF0CODE${idx}\uFFF1`;
  });

  // Headings (##, ###, ####) and underlined ===/---
  t = t
    .replace(/^\s*######\s+(.*)$/gm, `<h6>$1</h6>`)
    .replace(/^\s*#####\s+(.*)$/gm, `<h5>$1</h5>`)
    .replace(/^\s*####\s+(.*)$/gm,  `<h4>$1</h4>`)
    .replace(/^\s*###\s+(.*)$/gm,   `<h3>$1</h3>`)
    .replace(/^\s*##\s+(.*)$/gm,    `<h2>$1</h2>`)
    .replace(/^\s*#\s+(.*)$/gm,     `<h1>$1</h1>`)
    .replace(/^(.*)\n=+\s*$/gm,     `<h1>$1</h1>`)
    .replace(/^(.*)\n-+\s*$/gm,     `<h2>$1</h2>`);

  // Callouts: Tip/Note/Warning:
  t = t.replace(/^(>?\s*)(TIP|NOTE|WARNING|CAUTION|INFO)\s*:\s*(.*)$/gmi,
    (_, _q, kind, body) => `<div class="callout ${kind.toLowerCase()}"><b>${kind}:</b> ${body}</div>`);

  // Lists: bullets and ordered
  //  - bullets
  t = t.replace(/(^|\n)(?:\s*[-*•]\s+.+(?:\n\s*[-*•]\s+.+)*)/g, (block) => {
    const items = block.trim().split(/\n/).map(l => l.replace(/^\s*[-*•]\s+/, "").trim());
    return `\n<ul>\n${items.map(i=>`<li>${i}</li>`).join("\n")}\n</ul>`;
  });
  //  - ordered: "1. " or "1) "
  t = t.replace(/(^|\n)(?:\s*\d+[.)]\s+.+(?:\n\s*\d+[.)]\s+.+)*)/g, (block) => {
    const items = block.trim().split(/\n/).map(l => l.replace(/^\s*\d+[.)]\s+/, "").trim());
    return `\n<ol>\n${items.map(i=>`<li>${i}</li>`).join("\n")}\n</ol>`;
  });

  // Horizontal rules
  t = t.replace(/^\s*---+\s*$/gm, `<hr/>`);

  // Inline code `code`
  t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`);

  // Basic table: lines that look like | a | b |
  t = t.replace(/((?:^\|.*\|\s*$\n?){2,})/gm, (tbl) => {
    const rows = tbl.trim().split(/\n/).map(r => r.trim());
    // optional header separator row with --- – ignore for now
    const body = rows
      .filter(r => !/^\|\s*:?-{2,}/.test(r))
      .map(r => `<tr>${r.split("|").slice(1,-1).map(c=>`<td>${c.trim()}</td>`).join("")}</tr>`)
      .join("\n");
    return `<table>${body}</table>`;
  });

  // Paragraphs: wrap stray lines into <p>
  // Split by double newlines, ignore blocks that already look like HTML tags
  const blocks = t.split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(b => {
    if (/^<h\d|^<ul>|^<ol>|^<hr\/>|^<div class="callout|^<table>/.test(b)) return b;
    return `<p>${b}</p>`;
  });

  // Restore code fences (escaped & linkified inside)
  let html = blocks.join("\n\n");
  html = linkify(html);
  html = html.replace(/\uFFF0CODE(\d+)\uFFF1/g, (_, sidx) => {
    const code = codeBlocks[Number(sidx)] ?? "";
    return `<pre><code>${esc(code)}</code></pre>`;
  });

  return html;
}
