/**
 * Module-level store: component name → DOM Element reference.
 * Component is "active" when its ### Component: X line is in the textarea.
 */
const componentElementMap = new Map<string, Element>()
const activeTimers = new Map<Element, ReturnType<typeof setInterval>>()

const COLORS = ['#58a6ff', '#79c0ff', '#7ee787', '#ffa657', '#ff7b72', '#d2a8ff', '#58a6ff']

function applyHighlightTo(el: Element) {
  const htm = el as HTMLElement
  htm.setAttribute('data-hinge-highlight', '')
  htm.style.setProperty('outline', '2.5px solid #58a6ff', 'important')
  htm.style.setProperty('outline-offset', '1px', 'important')
  htm.style.setProperty('transition', 'box-shadow 0.25s ease', 'important')

  // Rainbow pulse — faster, more colors, box-shadow glow
  let idx = 0
  const timer = setInterval(() => {
    idx = (idx + 1) % COLORS.length
    const c = COLORS[idx]
    htm.style.setProperty('outline-color', c, 'important')
    htm.style.setProperty('box-shadow', `0 0 8px 2px ${c}44, inset 0 0 4px 1px ${c}22`, 'important')
  }, 350)
  activeTimers.set(htm, timer)
}

function clearAllHighlights() {
  document.querySelectorAll('[data-hinge-highlight]').forEach(el => {
    const htm = el as HTMLElement
    htm.removeAttribute('data-hinge-highlight')
    htm.style.removeProperty('outline')
    htm.style.removeProperty('outline-offset')
    htm.style.removeProperty('outline-color')
    htm.style.removeProperty('box-shadow')
    htm.style.removeProperty('transition')
    const timer = activeTimers.get(htm)
    if (timer) { clearInterval(timer); activeTimers.delete(htm) }
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

/** Check if a component name is currently highlighted. */
export function isComponentHighlighted(name: string): boolean {
  return componentElementMap.has(name)
}

/** Get all current highlight entries (name → element). */
export function getAllHighlightEntries(): [string, Element][] {
  return Array.from(componentElementMap.entries())
}

/** Add a highlight entry without visual refresh. */
export function setHighlightEntry(name: string, el: Element) {
  componentElementMap.set(name, el)
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

/**
 * Sync the highlight map with an active set of component names.
 * Entries not in the active set are removed (visual highlight + timer cleaned up).
 * Call after textarea changes to keep highlights in sync with the markdown source of truth.
 */
export function syncHighlights(activeNames: string[]) {
  const active = new Set(activeNames)
  for (const [name, el] of componentElementMap) {
    if (!active.has(name)) {
      const htm = el as HTMLElement
      htm.removeAttribute('data-hinge-highlight')
      htm.style.removeProperty('outline')
      htm.style.removeProperty('outline-offset')
      htm.style.removeProperty('outline-color')
      htm.style.removeProperty('box-shadow')
      htm.style.removeProperty('transition')
      const timer = activeTimers.get(htm)
      if (timer) { clearInterval(timer); activeTimers.delete(htm) }
      componentElementMap.delete(name)
    }
  }
  refreshHighlights()
}
