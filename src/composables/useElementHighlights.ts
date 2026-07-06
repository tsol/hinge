/**
 * DOM highlights:
 * - attachment highlights (model components) — pulsing blue
 * - gear target highlight (current cog selection) — solid orange
 */

const componentElementMap = new Map<string, Element>()
const activeTimers = new Map<Element, ReturnType<typeof setInterval>>()

let gearTargetEl: Element | null = null

const COLORS = ['#58a6ff', '#79c0ff', '#7ee787', '#ffa657', '#ff7b72', '#d2a8ff', '#58a6ff']
const GEAR_ATTR = 'data-hinge-gear-target'
const ATTACH_ATTR = 'data-hinge-highlight'

function applyAttachmentHighlight(el: Element) {
  const htm = el as HTMLElement
  htm.setAttribute(ATTACH_ATTR, '')
  htm.style.setProperty('outline', '2.5px solid #58a6ff', 'important')
  htm.style.setProperty('outline-offset', '1px', 'important')
  htm.style.setProperty('transition', 'box-shadow 0.25s ease', 'important')

  let idx = 0
  const timer = setInterval(() => {
    idx = (idx + 1) % COLORS.length
    const c = COLORS[idx]
    htm.style.setProperty('outline-color', c, 'important')
    htm.style.setProperty('box-shadow', `0 0 8px 2px ${c}44, inset 0 0 4px 1px ${c}22`, 'important')
  }, 350)
  activeTimers.set(htm, timer)
}

function clearAttachmentHighlight(el: Element) {
  const htm = el as HTMLElement
  htm.removeAttribute(ATTACH_ATTR)
  htm.style.removeProperty('outline')
  htm.style.removeProperty('outline-offset')
  htm.style.removeProperty('outline-color')
  htm.style.removeProperty('box-shadow')
  htm.style.removeProperty('transition')
  const timer = activeTimers.get(htm)
  if (timer) {
    clearInterval(timer)
    activeTimers.delete(htm)
  }
}

function clearAllAttachmentHighlights() {
  document.querySelectorAll(`[${ATTACH_ATTR}]`).forEach(clearAttachmentHighlight)
}

function applyGearHighlight(el: Element) {
  const htm = el as HTMLElement
  htm.setAttribute(GEAR_ATTR, '')
  htm.style.setProperty('outline', '2.5px solid #ffa657', 'important')
  htm.style.setProperty('outline-offset', '1px', 'important')
  htm.style.setProperty('box-shadow', '0 0 8px 2px #ffa65744, inset 0 0 4px 1px #ffa65722', 'important')
}

function clearGearHighlight() {
  document.querySelectorAll(`[${GEAR_ATTR}]`).forEach((el) => {
    const htm = el as HTMLElement
    htm.removeAttribute(GEAR_ATTR)
    htm.style.removeProperty('outline')
    htm.style.removeProperty('outline-offset')
    htm.style.removeProperty('box-shadow')
  })
  gearTargetEl = null
}

/** Current element under the cog — orange outline. */
export function setGearTargetHighlight(el: Element | null) {
  if (gearTargetEl === el) return
  clearGearHighlight()
  gearTargetEl = el
  if (el && document.body.contains(el)) {
    applyGearHighlight(el)
  }
}

/** Re-apply attachment highlights from the stored map. */
export function refreshHighlights() {
  clearAllAttachmentHighlights()
  for (const el of componentElementMap.values()) {
    if (document.body.contains(el)) {
      applyAttachmentHighlight(el)
    }
  }
}

export function setHighlightEntry(name: string, el: Element) {
  componentElementMap.set(name, el)
}

export function getAllHighlightEntries(): [string, Element][] {
  return Array.from(componentElementMap.entries())
}

export function clearAllComponentHighlights() {
  componentElementMap.clear()
  clearAllAttachmentHighlights()
}

/**
 * Sync attachment highlights with active component names from the task model.
 * Entries not in the active set are removed.
 */
export function syncHighlights(activeNames: string[]) {
  const active = new Set(activeNames)
  for (const [name, el] of componentElementMap) {
    if (!active.has(name)) {
      clearAttachmentHighlight(el)
      componentElementMap.delete(name)
    }
  }
  refreshHighlights()
}
