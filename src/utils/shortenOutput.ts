/**
 * Shorten verbose tool call output from coding agents (Hermes, Claude Code, Codex, etc.)
 * into a compact single-line format suitable for in-chat display.
 *
 * Patterns handled:
 *   ┊ review diff / ┊ patch blocks → ┊ Изменен файл: filename
 *   diff --git blocks               → Изменен файл: filename
 */

/** Extract short filename from a path like 'a/path/to/file.ts' or 'b/path/to/file.ts' */
function shortName(path: string): string {
  const cleaned = path.replace(/^[ab]\//, '')
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || cleaned
}

/** Check if a line is part of a unified diff body (not a block header). */
function isDiffBodyLine(line: string): boolean {
  // unified diff: context(space), added(+), removed(-), hunk header(@@),
  // file markers (a/, b/), index line, ---/+++ headers, new/deleted-file markers
  return /^\s*[ +-]|^@@ |^[ab]\//.test(line) ||
         /^(index |--- |\+\+\+ |new file mode|deleted file mode|old mode|new mode)/.test(line)
}

/** Check if a line is a ┊ review diff / ┊ patch header. */
function isBlockHeader(line: string): boolean {
  return /^\s*┊\s*(?:review diff|patch)\s*$/i.test(line.trimEnd())
}

/**
 * Walk lines after a block header and extract the short filename
 * from the nearest a→b diff header line.
 */
function findBlockFilename(lines: string[], startIdx: number): string | null {
  for (let j = startIdx; j < Math.min(startIdx + 10, lines.length); j++) {
    const raw = lines[j]
    // a/path/file.ts → b/path/file.ts
    const m = raw.match(/^[ab]\/*(\S+)\s*→/)
    if (m) return shortName(m[1])
    // ┊ a//path/file.ts variant
    const m2 = raw.match(/^\s*┊\s*[ab]\/*(\S+)/)
    if (m2) return shortName(m2[1])
    // --- a/path/file.ts
    const m3 = raw.match(/^--- [ab]\/(\S+)/)
    if (m3) return shortName(m3[1])
  }
  return null
}

/** Skip all diff body lines from i forward. Returns new index (firs non-diff line or lines.length). */
function skipDiffBody(lines: string[], i: number): number {
  while (i < lines.length && isDiffBodyLine(lines[i])) i++
  return i
}

/**
 * Collapse ┊ review diff / ┊ patch blocks and diff --git blocks
 * into single-line "Изменен файл: filename" entries.
 */
function collapseAllDiffBlocks(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()

    // ── diff --git block ──
    const dgMatch = trimmed.match(/^diff --git a\/(\S+) b\//)
    if (dgMatch) {
      const filename = shortName(dgMatch[1])
      i = skipDiffBody(lines, i + 1) // skip marker + body
      result.push(`Изменен файл: ${filename}`)
      continue
    }

    // ── ┊ review diff / ┊ patch block ──
    if (isBlockHeader(raw)) {
      const filename = findBlockFilename(lines, i + 1)
      i = skipDiffBody(lines, i + 1) // skip header + body
      result.push(filename ? `  ┊ Изменен файл: ${filename}` : '  ┊ Изменения')
      continue
    }

    result.push(raw)
    i++
  }

  return result.join('\n')
}

/**
 * Main entry point: shorten a full assistant message body.
 */
export function shortenOutput(content: string): string {
  let result = content

  // 1. Collapse all ┊ review diff / ┊ patch / diff --git blocks
  result = collapseAllDiffBlocks(result)

  // 2. Clean up duplicated blank lines from collapsed blocks
  result = result.replace(/\n{3,}/g, '\n\n')

  // 3. Trim trailing whitespace
  result = result.trim()

  return result
}
