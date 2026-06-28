import { describe, it, expect } from 'vitest'
import {
  parseQueueMarkdown,
  stringifyQueueMarkdown,
  toggleSection,
  removeSection,
  upsertSection,
  getSectionNote,
  extractComponent,
  extractFile,
  extractUrl,
  extractNote,
  type Section,
} from '../utils/queueFormat'

// ---------------------------------------------------------------------------
// parseQueueMarkdown
// ---------------------------------------------------------------------------
describe('parseQueueMarkdown', () => {
  it('returns empty array for empty string', () => {
    expect(parseQueueMarkdown('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseQueueMarkdown('   \n  \n')).toEqual([])
  })

  it('parses a single Component section with fields (no blank line before fields)', () => {
    const md = `### Component: FooButton · button "Click me"
Props: variant=elevated color=primary
Styling: display=flex gap=8px

some user note here`
    const result = parseQueueMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      type: 'component',
      value: 'FooButton · button "Click me"',
      fields: { Props: 'variant=elevated color=primary', Styling: 'display=flex gap=8px' },
      note: 'some user note here',
    })
  })

  it('blank line before fields pushes them into note', () => {
    const md = `### Component: Foo
Props: variant=flat`
    // No blank line → Props is a field
    expect(parseQueueMarkdown(md)[0].fields.Props).toBe('variant=flat')

    const mdWithBlank = `### Component: Foo

Props: variant=flat`
    // Blank line → Props lands in note
    const result = parseQueueMarkdown(mdWithBlank)
    expect(result[0].fields).toEqual({})
    expect(result[0].note).toContain('Props: variant=flat')
  })

  it('parses preamble text before first section', () => {
    const md = `First line of preamble.
Second line.

### Component: MyComp

note`
    const result = parseQueueMarkdown(md)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      type: 'text',
      value: 'First line of preamble.\nSecond line.',
      fields: {},
      note: '',
    })
    expect(result[1].type).toBe('component')
    expect(result[1].value).toBe('MyComp')
    expect(result[1].note).toBe('note')
  })

  it('parses Page and File sections', () => {
    const md = `### Page: /settings

### File: src/App.vue

### Component: NavBar`
    const result = parseQueueMarkdown(md)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ type: 'page', value: '/settings', fields: {}, note: '' })
    expect(result[1]).toEqual({ type: 'file', value: 'src/App.vue', fields: {}, note: '' })
    expect(result[2]).toEqual({ type: 'component', value: 'NavBar', fields: {}, note: '' })
  })

  it('handles sections with fields but no note', () => {
    const md = `### Component: Panel
Props: variant=flat
Styling: background=#fff`
    const result = parseQueueMarkdown(md)
    expect(result).toHaveLength(1)
    expect(result[0].fields).toEqual({ Props: 'variant=flat', Styling: 'background=#fff' })
    expect(result[0].note).toBe('')
  })

  it('multiple sections each with notes', () => {
    const md = `### Component: Foo

note for foo

### Component: Bar

note for bar`
    const result = parseQueueMarkdown(md)
    expect(result).toHaveLength(2)
    expect(result[0].note).toBe('note for foo')
    expect(result[1].note).toBe('note for bar')
  })
})

// ---------------------------------------------------------------------------
// stringifyQueueMarkdown
// ---------------------------------------------------------------------------
describe('stringifyQueueMarkdown', () => {
  it('round-trips basic input', () => {
    const input = `### Component: Foo · button "Go"

Props: variant=elevated

user note`
    const sections = parseQueueMarkdown(input)
    const output = stringifyQueueMarkdown(sections)
    expect(output).toBe(input)
  })

  it('outputs text sections as raw blocks', () => {
    const sections: Section[] = [
      { type: 'text', value: 'Preamble block', fields: {}, note: '' },
      { type: 'component', value: 'MyComp', fields: {}, note: '' },
    ]
    expect(stringifyQueueMarkdown(sections)).toBe('Preamble block\n\n### Component: MyComp')
  })

  it('emits sections with fields and notes', () => {
    const sections: Section[] = [
      { type: 'component', value: 'Btn', fields: { Props: 'size=lg' }, note: 'some note' },
    ]
    expect(stringifyQueueMarkdown(sections)).toBe(
      '### Component: Btn\nProps: size=lg\n\nsome note',
    )
  })

  it('joins multiple sections with double newline', () => {
    const sections: Section[] = [
      { type: 'page', value: '/', fields: {}, note: '' },
      { type: 'file', value: 'src/index.ts', fields: {}, note: '' },
    ]
    expect(stringifyQueueMarkdown(sections)).toBe(
      '### Page: /\n\n### File: src/index.ts',
    )
  })
})

// ---------------------------------------------------------------------------
// toggleSection
// ---------------------------------------------------------------------------
describe('toggleSection', () => {
  it('adds a section when not present', () => {
    const sections: Section[] = []
    const result = toggleSection(sections, 'component', 'NewComp', { Props: 'a=1' })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'component', value: 'NewComp', fields: { Props: 'a=1' }, note: '' })
  })

  it('removes a section when present and preserves note as text', () => {
    const sections: Section[] = [
      { type: 'component', value: 'Btn', fields: {}, note: 'user remark' },
    ]
    const result = toggleSection(sections, 'component', 'Btn')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'text', value: 'user remark', fields: {}, note: '' })
  })

  it('removes section with empty note — no text section inserted', () => {
    const sections: Section[] = [
      { type: 'component', value: 'Btn', fields: {}, note: '' },
    ]
    const result = toggleSection(sections, 'component', 'Btn')
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// removeSection
// ---------------------------------------------------------------------------
describe('removeSection', () => {
  it('removes matching section and preserves note as text', () => {
    const sections: Section[] = [
      { type: 'component', value: 'A', fields: {}, note: 'note A' },
      { type: 'component', value: 'B', fields: {}, note: 'note B' },
    ]
    const result = removeSection(sections, 'component', 'A')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ type: 'text', value: 'note A', fields: {}, note: '' })
    expect(result[1]).toEqual({ type: 'component', value: 'B', fields: {}, note: 'note B' })
  })

  it('returns sections unchanged when value not found', () => {
    const sections: Section[] = [
      { type: 'component', value: 'A', fields: {}, note: '' },
    ]
    expect(removeSection(sections, 'component', 'B')).toBe(sections) // same ref
  })

  it('inserts text section at the removed position', () => {
    const sections: Section[] = [
      { type: 'component', value: 'First', fields: {}, note: '' },
      { type: 'component', value: 'Target', fields: {}, note: 'mid note' },
      { type: 'component', value: 'Last', fields: {}, note: '' },
    ]
    const result = removeSection(sections, 'component', 'Target')
    expect(result).toHaveLength(3)
    expect(result[0].value).toBe('First')
    expect(result[1].type).toBe('text')
    expect(result[1].value).toBe('mid note')
    expect(result[2].value).toBe('Last')
  })
})

// ---------------------------------------------------------------------------
// upsertSection
// ---------------------------------------------------------------------------
describe('upsertSection', () => {
  it('adds a new section when not found', () => {
    const sections: Section[] = []
    const result = upsertSection(sections, 'file', 'src/main.ts')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'file', value: 'src/main.ts', fields: {}, note: '' })
  })

  it('updates fields of existing section', () => {
    const sections: Section[] = [
      { type: 'component', value: 'Btn', fields: { Props: 'a=1' }, note: 'hi' },
    ]
    const result = upsertSection(sections, 'component', 'Btn', { Props: 'a=1 b=2', Styling: 'red' })
    expect(result).toHaveLength(1)
    expect(result[0].fields).toEqual({ Props: 'a=1 b=2', Styling: 'red' })
    expect(result[0].note).toBe('hi') // preserved
  })

  it('does not duplicate when already present without fields arg', () => {
    const sections: Section[] = [
      { type: 'page', value: '/', fields: {}, note: '' },
    ]
    const result = upsertSection(sections, 'page', '/')
    expect(result).toHaveLength(1)
    expect(result).toBe(sections) // same ref
  })
})

// ---------------------------------------------------------------------------
// getSectionNote
// ---------------------------------------------------------------------------
describe('getSectionNote', () => {
  it('returns note text for matching section', () => {
    const sections: Section[] = [
      { type: 'component', value: 'Foo', fields: {}, note: 'my note' },
    ]
    expect(getSectionNote(sections, 'component', 'Foo')).toBe('my note')
  })

  it('returns empty string for unknown section', () => {
    expect(getSectionNote([], 'component', 'Nope')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// extract helpers
// ---------------------------------------------------------------------------
describe('extractComponent', () => {
  it('returns first ### Component: value', () => {
    const md = `### Component: MyButton · button "Go"
Props: variant=flat`
    expect(extractComponent(md)).toBe('MyButton · button "Go"')
  })

  it('returns empty string when no component header', () => {
    expect(extractComponent('# plain text')).toBe('')
  })
})

describe('extractFile', () => {
  it('returns first ### File: value', () => {
    const md = `### File: src/utils/foo.ts`
    expect(extractFile(md)).toBe('src/utils/foo.ts')
  })
})

describe('extractUrl', () => {
  it('returns first ### Page: value', () => {
    const md = `### Page: /dashboard/settings`
    expect(extractUrl(md)).toBe('/dashboard/settings')
  })
})

describe('extractNote', () => {
  it('returns note of last section', () => {
    const md = `### Component: A

note a

### Component: B

note b`
    expect(extractNote(md)).toBe('note b')
  })

  it('returns empty when content becomes text-section (preamble, no section header)', () => {
    // parseQueueMarkdown('just text') creates a text section, whose note is ''
    expect(extractNote('just text')).toBe('')
  })
})
