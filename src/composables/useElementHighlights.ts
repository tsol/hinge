const HIGHLIGHT_STYLE = '2.5px solid #58a6ff'

/**
 * Module-level store: component name → DOM Element reference.
 * Component is "active" when its ### Component: X line is in the textarea.
 */
const componentElementMap = new Map<string, Element>()

function applyHighlightTo(el: Element) {
  el.setAttribute('data-hinge-highlight', '')
  el.setAttribute('style', (el.getAttribute('style') || '') + `;outline:${HIGHLIGHT_STYLE};outline-offset:1px`)
}

function clearAllHighlights() {
  document.querySelectorAll('[data-hinge-highlight]').forEach(el => {
    el.removeAttribute('data-hinge-highlight')
    el.removeAttribute('style')
  })
}

/** Re-apply highlights from the stored map. */
export function refreshHighlights() {
  clearAllHighlights()
  for (const el of componentElementMap.values()) {
    if (document.body.contains(el)) {
      applyHighlightTo(el)
    }
  }
}

/** Register or unregister a component → element pair. Returns true if added, false if removed. */
export function toggleComponentHighlight(name: string, el: Element | null): boolean {
  if (!el) return false
  if (componentElementMap.has(name)) {
    componentElementMap.delete(name)
    refreshHighlights()
    return false // removed
  }
  componentElementMap.set(name, el)
  refreshHighlights()
  return true // added
}

/** Get all currently highlighted elements (for textarea component match lookup). */
export function getHighlightedComponents(): Map<string, Element> {
  return componentElementMap
}

/** Clear everything. */
export function clearAllComponentHighlights() {
  componentElementMap.clear()
  clearAllHighlights()
}

/** Get element for a component name, if registered. */
export function getElementForComponent(name: string): Element | undefined {
  return componentElementMap.get(name)
}
