import { HINGE_ROOT_ID } from '../constants'

const SEMANTIC_TAGS = new Set([
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'nav',
  'form',
])

const BORING_CLASS_PREFIXES = ['v-application', 'v-main', 'v-overlay', 'v-toolbar']

function isHingeElement(el: Element): boolean {
  // Check by container
  if (el.closest(`#${HINGE_ROOT_ID}`)) return true
  // Teleported hinge UI elements (direct body children) — check the element itself only,
  // not ancestors, to avoid filtering target-page elements that happen to sit under
  // a parent with a common class like 'menu-toggle', 'drawer', etc.
  const cls = el.classList
  if (cls.contains('cog-wrap') || cls.contains('cog-icon') || cls.contains('cog-list') ||
      cls.contains('menu-toggle') || cls.contains('burger-icon') ||
      cls.contains('hinge-panel-wrapper') || cls.contains('drawer') || cls.contains('drawer-backdrop')) {
    return true
  }
  return false
}

function isBoringElement(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag === 'html' || tag === 'body') return true

  const classes = [...el.classList]
  if (classes.some((c) => BORING_CLASS_PREFIXES.some((p) => c.startsWith(p)))) {
    return true
  }

  if (tag === 'div' && !el.id && meaningfulClasses(el).length === 0) {
    return true
  }

  return false
}

function meaningfulClasses(el: Element): string[] {
  return [...el.classList].filter(
    (c) => !c.startsWith('v-') && !c.includes('data-v-'),
  )
}

function trimText(text: string, max = 36): string {
  const normalized = text.trim().replace(/\s+/g, ' ')
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized
}

function mdiClass(el: Element): string | null {
  const match = [...el.classList].find((c) => c.startsWith('mdi-') && c !== 'mdi' && c !== 'mdi-set')
  return match ?? null
}

function findMdiIcon(el: Element): Element | null {
  if (mdiClass(el)) return el
  return el.querySelector('i[class*="mdi-"]')
}

function normalizeTarget(el: Element): Element {
  const tag = el.tagName.toLowerCase()
  if (tag === 'path' || tag === 'use') {
    return (
      el.closest('svg') ??
      el.closest('.v-icon') ??
      el.closest('i') ??
      el.closest('.skill-icon') ??
      el
    )
  }
  return el
}

function isIconLike(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag === 'img' || tag === 'svg') return true
  if (tag === 'i' && mdiClass(el)) return true
  if (el.classList.contains('v-icon') || el.classList.contains('skill-icon')) return true

  const classes = meaningfulClasses(el)
  if (classes.some((c) => /icon|badge/i.test(c))) return true

  return false
}

function isTextLeaf(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag !== 'span' && tag !== 'p') return false
  const text = el.textContent?.trim()
  return !!text && text.length > 0 && text.length < 60
}

function isInteractiveOrHeading(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  return SEMANTIC_TAGS.has(tag) || tag.startsWith('h')
}

function hasMeaningfulIdentity(el: Element): boolean {
  if (el.id || el.getAttribute('data-testid') || el.getAttribute('aria-label')) {
    return true
  }
  return meaningfulClasses(el).length > 0
}

export function formatDomElement(el: Element): string {
  const tag = el.tagName.toLowerCase()
  if (tag === 'html' || tag === 'body') return tag

  const id = el.id ? `#${el.id}` : ''
  const testId = el.getAttribute('data-testid')
  if (testId) return `${tag}[data-testid="${testId}"]`

  const aria = el.getAttribute('aria-label')
  if (aria) return `${tag}[aria-label="${aria}"]`

  const classes = meaningfulClasses(el).slice(0, 2)
  const classPart = classes.length ? `.${classes.join('.')}` : ''
  const label = `${tag}${id}${classPart}`
  return label.length > 48 ? `${label.slice(0, 45)}…` : label
}

function describeIcon(el: Element): string | null {
  const iconEl = findMdiIcon(el)
  const mdi = iconEl ? mdiClass(iconEl) : null

  if (mdi) {
    if (el.classList.contains('skill-icon')) return `icon ${mdi} (.skill-icon)`
    return `icon ${mdi}`
  }

  const tag = el.tagName.toLowerCase()
  if (tag === 'img') {
    const alt = el.getAttribute('alt')
    return alt ? `img[alt="${trimText(alt)}"]` : formatDomElement(el)
  }

  if (el.classList.contains('skill-icon')) return 'div.skill-icon'
  if (tag === 'svg') return 'svg icon'

  return null
}

export function describeElement(el: Element): string {
  const target = normalizeTarget(el)

  const iconDesc = describeIcon(target)
  if (iconDesc) return iconDesc

  const tag = target.tagName.toLowerCase()

  if (isTextLeaf(target)) {
    const text = trimText(target.textContent ?? '')
    const classes = meaningfulClasses(target)
    if (classes.length) return `${tag}.${classes[0]} "${text}"`
    return `${tag} "${text}"`
  }

  if (tag === 'button' || tag === 'a' || tag.startsWith('h')) {
    const text = trimText(target.textContent ?? '')
    if (text) return `${tag} "${text}"`
  }

  if (tag === 'input' || tag === 'textarea') {
    const placeholder = target.getAttribute('placeholder')
    const name = target.getAttribute('name')
    if (placeholder) return `${tag}[placeholder="${trimText(placeholder, 24)}"]`
    if (name) return `${tag}[name="${name}"]`
  }

  return formatDomElement(target)
}

export function getRouteComponentName(): string | null {
  const routeName = window.__hingeRouter?.currentRoute?.value?.name
  if (routeName != null && routeName !== '') {
    return String(routeName)
  }
  return null
}

/** Elements under the cog center, topmost first, hinge UI excluded. */
export function getElementsAtPoint(x: number, y: number, cogSize: number): Element[] {
  const cx = x + cogSize / 2
  const cy = y + cogSize / 2
  return document.elementsFromPoint(cx, cy).filter((el) => !isHingeElement(el))
}

/** Pick the topmost specific element — icons and text leaves before parent buttons. */
export function pickBestDomElement(elements: Element[]): Element | null {
  if (elements.length === 0) return null

  for (const el of elements.slice(0, 20)) {
    if (isBoringElement(el)) continue
    if (isIconLike(el)) return normalizeTarget(el)
  }

  for (const el of elements.slice(0, 20)) {
    if (isBoringElement(el)) continue
    if (isTextLeaf(el)) return el
  }

  for (const el of elements.slice(0, 20)) {
    if (isBoringElement(el)) continue
    if (isInteractiveOrHeading(el)) return el
  }

  for (const el of elements.slice(0, 20)) {
    if (isBoringElement(el)) continue
    if (hasMeaningfulIdentity(el)) return el
  }

  return elements.find((el) => !isBoringElement(el)) ?? elements[0]
}

/** Ordered targets under the cog for tap-to-cycle (best match first). */
export function getCycleableTargetsAtPoint(
  x: number,
  y: number,
  cogSize: number,
): Element[] {
  const elements = getElementsAtPoint(x, y, cogSize)
  const seen = new Set<Element>()
  const result: Element[] = []

  const best = pickBestDomElement(elements)
  if (best) {
    seen.add(best)
    result.push(best)
  }

  for (const el of elements.slice(0, 24)) {
    if (isBoringElement(el)) continue
    const normalized = normalizeTarget(el)
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

export function resolveTargetLabelAtPoint(
  x: number,
  y: number,
  cogSize: number,
): string {
  const elements = getElementsAtPoint(x, y, cogSize)
  const hit = pickBestDomElement(elements)

  if (!hit) {
    return getRouteComponentName() ?? 'unknown'
  }

  return describeElement(hit)
}
