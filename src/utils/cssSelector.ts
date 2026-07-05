/**
 * Generate a unique CSS selector path from root to an element.
 * Prefers IDs, falls back to tag:nth-child path.
 * Skips Hinge-specific wrapper elements.
 */

const HINGE_SKIP = ['cog-wrap', 'cog-icon', 'cog-modal', 'hinge-highlight-overlay']

export function generateCSSSelector(el: Element): string {
  if (!el || el === document.body || el === document.documentElement) {
    return ''
  }

  const parts: string[] = []

  let current: Element | null = el
  while (current && current !== document.body && current !== document.documentElement) {
    // Skip Hinge internals
    const cls = current.className
    if (typeof cls === 'string' && HINGE_SKIP.some(s => cls.includes(s))) {
      current = current.parentElement
      continue
    }

    let segment = current.tagName.toLowerCase()

    // Use ID if available (most specific)
    const id = current.id
    if (id && !id.startsWith('hinge-') && !id.startsWith('el')) {
      segment = `#${CSS.escape(id)}`
      parts.unshift(segment)
      break // ID is globally unique, stop here
    }

    // nth-child for uniqueness
    const parent = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        c => c.tagName === current!.tagName && !HINGE_SKIP.some(s => (c.className || '').includes(s))
      )
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current as HTMLElement)
        if (idx >= 0) {
          segment += `:nth-child(${idx + 1})`
        }
      }
    }

    parts.unshift(segment)
    current = current.parentElement
  }

  return parts.join(' > ')
}
