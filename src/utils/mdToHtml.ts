/**
 * Lightweight markdown → HTML converter for toast detail rendering.
 * No dependencies, pure string processing.
 * Only emits safe HTML tags — strips anything not in the allowlist.
 */

// ── Helpers ──

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

import { shortenOutput } from './shortenOutput'

/** Allowlisted HTML tags and their void-status */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'strong', 'em', 'del',
  'code', 'pre',
  'ul', 'ol', 'li',
  'h3', 'h4', 'h5', 'h6',
  'blockquote',
  'a',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
])

/** Strip any tag not in the allowlist. Also removes all attributes except href on <a>. */
function sanitize(html: string): string {
  return html.replace(/<(\/?)(\w+)((?:[^>"']|"[^"]*"|'[^']*')*)(\/?)>/gs, (_raw, close, tag, attrs, selfClose) => {
    if (!ALLOWED_TAGS.has(tag.toLowerCase())) {
      // Disallowed tag — keep its inner content, strip the tag
      return ''
    }
    // <a> only: keep href attribute
    if (tag.toLowerCase() === 'a' && !close) {
      const hrefMatch = attrs.match(/\bhref\s*=\s*"([^"]*)"/i)
      const href = hrefMatch ? hrefMatch[1] : ''
      return href ? `<a href="${escapeHtml(href)}">` : '<a>'
    }
    // All other allowed tags: strip attributes entirely
    return `<${close}${tag}${selfClose}>`
  })
}

// ── Inline processing ──

/** Apply inline markdown → HTML inside a non-code paragraph. Text is already HTML-escaped. */
function inlineMd(s: string): string {
  // Inline code (before bold/italic so `**a**` inside backticks is preserved)
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // Strikethrough ~~text~~
  s = s.replace(/~~(.+?)~~/g, '<del>$1</del>')
  return s
}

// ── Line-type detection ──

function isHeader(line: string): false | { level: number; text: string } {
  const m = line.match(/^(#{1,4})\s+(.+)$/)
  return m ? { level: m[1].length, text: m[2] } : false
}

function isHr(line: string): boolean {
  return /^-{3,}$/.test(line.trim())
}

function isBullet(line: string): boolean {
  return /^\s*[-*+]\s/.test(line)
}

function isOrdered(line: string): boolean {
  return /^\s*\d+\.\s/.test(line)
}

function isSepRow(line: string): boolean {
  // GFM table separator: |---|---| or |:---|:---:|---:|
  return /^\s*\|[\s:|:-]+\|/.test(line.trim()) && /-{3,}/.test(line)
}

/** Parse a GFM table block into <table> HTML. */
function renderTable(lines: string[]): string {
  // Find separator row index
  const sepIdx = lines.findIndex(l => isSepRow(l))
  if (sepIdx === -1) return ''

  // Split cells
  function cells(line: string): string[] {
    return line
      .split('|')
      .slice(1, -1)               // drop leading/trailing empty from split on first/last |
      .map(c => c.trim())
  }

  // Determine alignment from separator row
  const alignCells = lines[sepIdx].split('|').slice(1, -1)
  const aligns = alignCells.map(c => {
    const t = c.trim()
    if (t.startsWith(':') && t.endsWith(':')) return ' center'
    if (t.endsWith(':')) return ' right'
    return ''
  })

  // Header row (before separator)
  const headerCells = cells(lines[0])
  const headers = headerCells.map((c, i) => {
    const al = aligns[i] || ''
    return `    <th${al}>${inlineMd(escapeHtml(c))}</th>`
  }).join('\n')

  // Body rows (after separator)
  const bodyRows = lines.slice(sepIdx + 1).map(line => {
    const cols = cells(line)
    // Pad with empty cells if fewer than header
    while (cols.length < headerCells.length) cols.push('')
    const row = cols.map((c, i) => {
      const al = aligns[i] || ''
      return `    <td${al}>${inlineMd(escapeHtml(c))}</td>`
    }).join('\n')
    return `  <tr>\n${row}\n  </tr>`
  }).join('\n')

  return `<table>\n  <thead>\n    <tr>\n${headers}\n    </tr>\n  </thead>\n  <tbody>\n${bodyRows}\n  </tbody>\n</table>`
}

// ── Main entry ──

/**
 * Convert markdown text to safe HTML.
 *
 * Block processing order:
 * 1. Code fences (protected)
 * 2. Horizontal rules
 * 3. Headers
 * 4. Lists (unordered / ordered)
 * 5. Blockquotes
 * 6. Paragraphs
 *
 * @returns HTML string safe for `v-html` (no script/event-handler tags).
 */
export function mdToHtml(text: string): string {
  // 1. Normalise line endings
  let body = text.replace(/\r\n?/g, '\n')

  // 2. Extract code fences first — protect them from any other processing
  const fenceBlocks: string[] = []
  body = body.replace(/```(\w*)\n?([\s\S]*?)```/g, (_raw, lang, code) => {
    const inner = escapeHtml(code.replace(/\n$/, ''))
    const cls = lang ? ` class="language-${escapeHtml(lang)}"` : ''
    fenceBlocks.push(`<pre><code${cls}>${inner}</code></pre>`)
    return `\x00FENCE${fenceBlocks.length - 1}\x00`
  })

  // 3. Split into blocks by blank lines
  const blocks = body.split(/\n{2,}/)
  const out: string[] = []

  for (let block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    // Restore fence placeholders that span an entire block
    if (/^\x00FENCE\d+\x00$/.test(trimmed)) {
      const idx = Number(trimmed.replace(/\x00FENCE(\d+)\x00/, '$1'))
      out.push(fenceBlocks[idx])
      continue
    }

    const lines = trimmed.split('\n')

    // Horizontal rule (entire block)
    if (lines.every(l => isHr(l))) {
      out.push('<hr>')
      continue
    }

    // Header (first line of block)
    const h = isHeader(lines[0])
    if (h) {
      const text = inlineMd(escapeHtml(h.text))
      // For toasts: h6 = ####, h5 = ###, h4 = ##, h3 = #
      const level = Math.min(h.level + 2, 6) as 3 | 4 | 5 | 6
      out.push(`<h${level}>${text}</h${level}>`)
      // Spill remaining lines as paragraph
      if (lines.length > 1) {
        out.push(`<p>${inlineMd(escapeHtml(lines.slice(1).join('<br>')))}</p>`)
      }
      continue
    }

    // Unordered list
    if (lines.every(l => isBullet(l))) {
      const items = lines.map(l =>
        `<li>${inlineMd(escapeHtml(l.replace(/^\s*[-*+]\s+/, '')))}</li>`,
      ).join('\n')
      out.push(`<ul>\n${items}\n</ul>`)
      continue
    }

    // Ordered list
    if (lines.every(l => isOrdered(l))) {
      const items = lines.map(l =>
        `<li>${inlineMd(escapeHtml(l.replace(/^\s*\d+\.\s+/, '')))}</li>`,
      ).join('\n')
      out.push(`<ol>\n${items}\n</ol>`)
      continue
    }

    // Blockquote
    if (lines.every(l => /^\s*>/.test(l))) {
      const content = lines
        .map(l => inlineMd(escapeHtml(l.replace(/^\s*>\s?/, ''))))
        .join('<br>')
      out.push(`<blockquote>${content}</blockquote>`)
      continue
    }

    // Table (GFM: lines start with |, at least one --- separator row)
    if (lines.length >= 2 && lines.every(l => /^\s*\|/.test(l.trim()))) {
      const tableHtml = renderTable(lines)
      if (tableHtml) {
        out.push(tableHtml)
        continue
      }
    }

    // Default: paragraph (with <br> for single line breaks)
    const para = lines
      .map(l => inlineMd(escapeHtml(l)))
      .join('<br>')
    out.push(`<p>${para}</p>`)
  }

  return sanitize(out.join('\n'))
}

/**
 * Full pipeline: strip verbose tool-call output (diffs, ┊ blocks),
 * then render remaining text as markdown → safe HTML.
 * Use this for both the accordion chat and toast detail.
 */
export function prettifyMessage(text: string): string {
  return mdToHtml(shortenOutput(text))
}
