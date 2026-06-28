export interface Section {
  type: 'page' | 'component' | 'file' | 'text'
  value: string        // URL path | component name | file path | raw text (for 'text' type)
  fields: Record<string, string>   // DOM, Props, Styles (raw "Key: Val" lines)
  note: string          // free text after fields until next ###
}

const SECTION_RE = /^### (Page|Component|File): (.+)$/m
const FIELD_RE = /^([A-Za-z]\w+): (.+)$/

/**
 * Parse markdown text into sections.
 * Sections are delimited by ### Page / ### Component / ### File lines.
 * Fields are Key: Value lines immediately after the header (no blank line before).
 * Text before the first section is stored as a 'text' section at index 0 (preamble).
 * Text after fields (user free notes) is stored in the section's `note` field.
 */
export function parseQueueMarkdown(text: string): Section[] {
  const lines = text.split('\n')
  const sections: Section[] = []
  let current: Section | null = null
  let inFields = false
  let noteLines: string[] = []
  let preambleLines: string[] = []

  function flushPreamble() {
    const txt = preambleLines.join('\n').trim()
    if (txt) {
      sections.push({ type: 'text', value: txt, fields: {}, note: '' })
    }
    preambleLines = []
  }

  function flushNote() {
    if (current) {
      current.note = noteLines.join('\n').trim()
      noteLines = []
    }
  }

  for (const line of lines) {
    const sectionMatch = line.match(SECTION_RE)
    if (sectionMatch) {
      flushPreamble()
      flushNote()
      current = {
        type: sectionMatch[1].toLowerCase() as Section['type'],
        value: sectionMatch[2].trim(),
        fields: {},
        note: '',
      }
      sections.push(current)
      inFields = true
      continue
    }

    if (!current) {
      // Text before any section — save as preamble
      preambleLines.push(line)
      continue
    }

    const fieldMatch = inFields ? line.match(FIELD_RE) : null
    if (fieldMatch) {
      current.fields[fieldMatch[1]] = fieldMatch[2].trim()
      continue
    }

    // Blank line or non-field line → end of fields section
    inFields = false
    noteLines.push(line)
  }

  flushPreamble()
  flushNote()

  return sections
}

/**
 * Stringify sections back to markdown.
 * 'text' type sections output their value as raw free text (no header).
 */
export function stringifyQueueMarkdown(sections: Section[]): string {
  const blocks: string[] = []

  for (const s of sections) {
    if (s.type === 'text') {
      // Raw text block — output as-is
      blocks.push(s.value)
      continue
    }

    const typeLabel = s.type === 'page' ? 'Page'
      : s.type === 'component' ? 'Component'
      : 'File'

    const lines: string[] = [`### ${typeLabel}: ${s.value}`]

    for (const [key, val] of Object.entries(s.fields)) {
      if (val) lines.push(`${key}: ${val}`)
    }

    if (s.note) {
      lines.push('')
      lines.push(s.note)
    }

    blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n')
}

/**
 * Toggle a section — if it exists, remove it (preserving its note as free text);
 * otherwise add it. Returns new array.
 */
export function toggleSection(
  sections: Section[],
  type: Section['type'],
  value: string,
  fields?: Record<string, string>,
): Section[] {
  const idx = sections.findIndex(s => s.type === type && s.value === value)
  if (idx >= 0) {
    // Remove, but preserve note as free text
    const removed = sections[idx]
    const note = removed.note?.trim()
    const filtered = sections.filter((_, i) => i !== idx)
    if (note) {
      const textSection: Section = { type: 'text', value: note, fields: {}, note: '' }
      filtered.splice(Math.min(idx, filtered.length), 0, textSection)
    }
    return filtered
  }
  return [...sections, { type, value, fields: fields ?? {}, note: '' }]
}

/**
 * Find or create a section in the parsed result, returning updated sections.
 */
export function upsertSection(
  sections: Section[],
  type: Section['type'],
  value: string,
  fields?: Record<string, string>,
): Section[] {
  const existing = sections.find(s => s.type === type && s.value === value)
  if (existing && fields) {
    existing.fields = { ...existing.fields, ...fields }
    return sections
  }
  if (existing) return sections

  return [...sections, { type, value, fields: fields ?? {}, note: '' }]
}

/**
 * Remove a section by type+value.
 * The section's free-text note is preserved as a 'text' section, so user-written
 * notes between system fields are never lost.
 */
export function removeSection(sections: Section[], type: Section['type'], value: string): Section[] {
  const idx = sections.findIndex(s => s.type === type && s.value === value)
  if (idx < 0) return sections

  const removed = sections[idx]
  const note = removed.note?.trim()
  const filtered = sections.filter((_, i) => i !== idx)

  if (note) {
    // Insert the note as a free-text block at the position where the section was
    const textSection: Section = { type: 'text', value: note, fields: {}, note: '' }
    filtered.splice(Math.min(idx, filtered.length), 0, textSection)
  }

  return filtered
}

/**
 * Get note text from markdown (text after all fields, before next ###).
 * Returns text for a specific section, or '' if not found.
 */
export function getSectionNote(sections: Section[], type: Section['type'], value: string): string {
  const s = sections.find(s => s.type === type && s.value === value)
  return s?.note ?? ''
}

/**
 * Extract the component name from markdown (first ### Component:).
 */
export function extractComponent(content: string): string {
  const m = content.match(/^### Component: (.+)/m)
  return m?.[1] ?? ''
}

/**
 * Extract the file path from markdown (first ### File:).
 */
export function extractFile(content: string): string {
  const m = content.match(/^### File: (.+)/m)
  return m?.[1] ?? ''
}

/**
 * Extract the URL from markdown (first ### Page:).
 */
export function extractUrl(content: string): string {
  const m = content.match(/^### Page: (.+)/m)
  return m?.[1] ?? ''
}

/**
 * Extract note text for the last section, or raw text before any sections.
 */
export function extractNote(content: string): string {
  const sections = parseQueueMarkdown(content)
  if (sections.length === 0) return content.trim()
  // Note = note of the last section
  return sections[sections.length - 1].note
}
