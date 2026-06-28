import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatDomElement,
  describeElement,
  pickBestDomElement,
  getElementsAtPoint,
  resolveTargetLabelAtPoint,
} from '../utils/domTarget'

function createEl(tag: string, attrs: Record<string, string> = {}, children: Element[] = []): Element {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') {
      el.className = v
    } else if (k === 'textContent') {
      el.textContent = v
    } else {
      el.setAttribute(k, v)
    }
  }
  for (const c of children) el.appendChild(c)
  return el
}

function mockElementFromPoint(x: number, y: number, stack: Element[]): void {
  // We can't fully mock elementsFromPoint in jsdom, so we use a simpler approach
  // for the pure helper functions instead
}

// ---------------------------------------------------------------------------
// formatDomElement
// ---------------------------------------------------------------------------
describe('formatDomElement', () => {
  it('returns "html" for html element', () => {
    expect(formatDomElement(document.documentElement)).toBe('html')
  })

  it('returns "body" for body element', () => {
    expect(formatDomElement(document.body)).toBe('body')
  })

  it('uses id when present (classes appended after id)', () => {
    const el = createEl('div', { id: 'my-id', className: 'some-class' })
    expect(formatDomElement(el)).toBe('div#my-id.some-class')
  })

  it('uses data-testid when present', () => {
    const el = createEl('button', { 'data-testid': 'submit-btn', className: 'v-btn' })
    expect(formatDomElement(el)).toBe('button[data-testid="submit-btn"]')
  })

  it('uses aria-label when present', () => {
    const el = createEl('a', { 'aria-label': 'Go home' })
    expect(formatDomElement(el)).toBe('a[aria-label="Go home"]')
  })

  it('uses meaningful class names (skips v- prefixed)', () => {
    const el = createEl('div', { className: 'v-application my-special-card' })
    expect(formatDomElement(el)).toContain('my-special-card')
  })

  it('uses up to 2 meaningful classes', () => {
    const el = createEl('span', { className: 'a b c d' })
    expect(formatDomElement(el)).toBe('span.a.b')
  })

  it('truncates long label to 48 chars', () => {
    const el = createEl('div', { className: 'a'.repeat(60) })
    expect(formatDomElement(el).length).toBeLessThanOrEqual(48)
  })
})

// ---------------------------------------------------------------------------
// describeElement
// ---------------------------------------------------------------------------
describe('describeElement', () => {
  it('describes a button with text', () => {
    const el = createEl('button', { textContent: 'Submit' })
    expect(describeElement(el)).toBe('button "Submit"')
  })

  it('describes an anchor with text', () => {
    const el = createEl('a', { textContent: 'Click here' })
    expect(describeElement(el)).toBe('a "Click here"')
  })

  it('describes input with placeholder', () => {
    const el = createEl('input', { placeholder: 'Enter name' })
    expect(describeElement(el)).toBe('input[placeholder="Enter name"]')
  })

  it('truncates long placeholder', () => {
    const el = createEl('input', { placeholder: 'x'.repeat(30) })
    const result = describeElement(el)
    // "input[placeholder=\"…\"]" shell — trimText(max=24) yields ~24 chars inside
    expect(result).toMatch(/^input\[placeholder="[^"]{24}"\]$/)
  })

  it('describes input with name when no placeholder', () => {
    const el = createEl('input', { name: 'email', type: 'text' })
    expect(describeElement(el)).toBe('input[name="email"]')
  })

  it('describes a text leaf span', () => {
    const el = createEl('span', { textContent: 'Hello', className: 'label-text' })
    expect(describeElement(el)).toBe('span.label-text "Hello"')
  })

  it('describes a text leaf span with no classes', () => {
    const el = createEl('span', { textContent: 'Hello' })
    expect(describeElement(el)).toBe('span "Hello"')
  })

  it('falls back to formatDomElement for plain divs', () => {
    const el = createEl('div', { className: 'container flex-row' })
    expect(describeElement(el)).toBe('div.container.flex-row')
  })

  it('describes heading with text', () => {
    const el = createEl('h2', { textContent: 'Section Title' })
    expect(describeElement(el)).toBe('h2 "Section Title"')
  })
})

// ---------------------------------------------------------------------------
// pickBestDomElement
// ---------------------------------------------------------------------------
describe('pickBestDomElement', () => {
  it('returns null for empty array', () => {
    expect(pickBestDomElement([])).toBeNull()
  })

  it('skips boring elements (html, body)', () => {
    const btn = createEl('button', { textContent: 'OK' })
    expect(pickBestDomElement([document.documentElement, document.body, btn])).toBe(btn)
  })

  it('prefers icon-like elements', () => {
    const btn = createEl('button', { textContent: 'Click' })
    const icon = createEl('i', { className: 'mdi-home mdi' })
    expect(pickBestDomElement([btn, icon])).toBe(icon)
  })

  it('prefers text leaves over interactive', () => {
    const span = createEl('span', { textContent: 'Hello' })
    const btn = createEl('button', { textContent: 'World' })
    expect(pickBestDomElement([btn, span])).toBe(span)
  })

  it('prefers interactive over plain', () => {
    const btn = createEl('button', { textContent: 'Go' })
    const div = createEl('div', { className: 'generic' })
    expect(pickBestDomElement([div, btn])).toBe(btn)
  })

  it('prefers elements with identity over boring', () => {
    const card = createEl('div', { className: 'card highlight' })
    const plain = createEl('div')
    expect(pickBestDomElement([plain, card])).toBe(card)
  })

  it('returns first element if all are boring', () => {
    const el = createEl('div')
    expect(pickBestDomElement([el])).toBe(el)
  })
})
