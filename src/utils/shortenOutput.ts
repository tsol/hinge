/**
 * Shorten verbose tool call output from coding agents (Hermes, Claude Code, Codex, etc.)
 * into a compact single-line format suitable for in-chat display.
 *
 * Patterns handled:
 *   ┊ review diff / ┊ patch blocks → Изменен файл: filename
 *   diff --git a/... b/... blocks   → Изменен файл: filename
 */

/** Extract short filename from a path like 'a/path/to/file.ts' or 'b/path/to/file.ts' */
function shortName(path: string): string {
  const cleaned = path.replace(/^[ab]\//, '')
  const parts = cleaned.split('/')
  return parts[parts.length - 1] || cleaned
}

/**
 * Find the first filename mentioned in a review/patch block.
 * Looks at lines immediately after the intro line.
 */
function findReviewFilename(block: string): string | null {
  for (const line of block.split('\n').slice(0, 15)) {
    const trimmed = line.trim()
    // ┊ a//path/file.ts or ┊ b//path/file.ts
    const m = trimmed.match(/^┊\s*[ab]\/*(\S+)/)
    if (m) return shortName(m[1])
    // --- a/path/file.ts
    const m2 = trimmed.match(/^--- [ab]\/(\S+)/)
    if (m2) return shortName(m2[1])
    // @@ context hint mentioning file
    const m3 = trimmed.match(/^@@ .*\++\s+(\S+)\s*@@/)
    if (m3) return m3[1]
  }
  return null
}

/**
 * Collapse a ┊ review diff / ┊ patch block into a single line.
 * Block starts with "┊ review diff" or "┊ patch" and continues through
 * all consecutive ┊-prefixed lines.
 */
function collapseReviewBlocks(text: string): string {
  return text.replace(
    /(?:^|\n)((?:\s*┊.*\n?)+)/gm,
    (match: string) => {
      const lines = match.split('\n').filter(l => l.trim())
      // First ┊ line tells us what kind of block
      const firstLine = lines[0]?.trim() || ''
      if (!/^┊\s*(review diff|patch)/i.test(firstLine)) {
        return match // not a review block, keep as-is
      }

      const filename = findReviewFilename(match)
      if (!filename) return '\nИзменения\n' // fallback

      return `\nИзменен файл: ${filename}`
    },
  )
}

/**
 * Collapse a standard git diff block into a single "Изменен файл: filename" line.
 * Matches from "diff --git ..." through the end of the hunk (blank line or non-diff text).
 */
function collapseDiffBlocks(text: string): string {
  // Match complete diff blocks: from "diff --git" to a blank line or end of content
  return text.replace(
    /diff --git a\/(\S+) b\/\S+(?:\n(?:index [0-9a-f]{4,40}\.\.[0-9a-f]{4,40}[^\n]*|new file mode [^\n]*|deleted file mode [^\n]*|--- [ab]\/[^\n]*|\+\+\+ [ab]\/[^\n]*|@@[^@]+@@[^\n]*|[-+ ][^\n]*))*\n?/g,
    (_match: string, fileA: string) => {
      return `Изменен файл: ${shortName(fileA)}`
    },
  )
}

/**
 * Main entry point: shorten a full assistant message body.
 */
export function shortenOutput(content: string): string {
  let result = content

  // 1. Collapse ┊ review diff / ┊ patch blocks
  result = collapseReviewBlocks(result)

  // 2. Collapse standard git diff blocks
  result = collapseDiffBlocks(result)

  // 3. Clean up duplicated blank lines from collapsed blocks
  result = result.replace(/\n{3,}/g, '\n\n')

  // 4. Trim trailing whitespace
  result = result.trim()

  return result
}
