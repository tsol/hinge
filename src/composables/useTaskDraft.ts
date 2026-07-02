import { type Ref } from 'vue'

const STORAGE_KEY = 'hinge_drafts'
const DEFAULT_DEBOUNCE_MS = 400

// ── Module-level timer map (preserved across calls) ─────────────
const draftTimers: Record<string, number> = {}

// ── Low-level localStorage ops ───────────────────────────────────

function loadAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(drafts: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch { /* quota exceeded — silently skip */ }
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Load a single draft from localStorage, falling back to `fallback` if absent.
 */
export function loadDraft(key: string, fallback = ''): string {
  const drafts = loadAll()
  return drafts[key] ?? fallback
}

/**
 * Debounced save: schedules a write. Call on every keystroke.
 * Previous pending writes for the same key are cancelled.
 *
 * Returns a cancel function — call it on component unmount or when the
 * task is removed.
 */
export function saveDraft(
  key: string,
  content: string,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): () => void {
  const existing = draftTimers[key]
  if (existing) window.clearTimeout(existing)

  const timer: number = window.setTimeout(() => {
    const drafts = loadAll()
    if (content) {
      drafts[key] = content
    } else {
      delete drafts[key] // don't store empty drafts
    }
    writeAll(drafts)
    delete draftTimers[key]
  }, debounceMs)

  draftTimers[key] = timer

  return () => {
    const t = draftTimers[key]
    if (t) {
      window.clearTimeout(t)
      delete draftTimers[key]
    }
  }
}

/**
 * Flush a draft immediately (cancel pending debounce + write now).
 */
export function flushDraft(key: string, content: string) {
  const t = draftTimers[key]
  if (t) window.clearTimeout(t)
  delete draftTimers[key]

  const drafts = loadAll()
  if (content) {
    drafts[key] = content
  } else {
    delete drafts[key]
  }
  writeAll(drafts)
}

/**
 * Clear a draft (call after successful save to disk or agent reply).
 */
export function clearDraft(key: string) {
  const t = draftTimers[key]
  if (t) window.clearTimeout(t)
  delete draftTimers[key]

  const drafts = loadAll()
  delete drafts[key]
  writeAll(drafts)
}

/**
 * Hydrate editingContent from localStorage drafts.
 * Merges drafts on top of server content so unsaved edits survive refresh.
 */
export function hydrateDrafts(
  editingContent: Ref<Record<string, string>>,
  items: { name: string; content: string }[],
) {
  const drafts = loadAll()
  const next = { ...editingContent.value }
  for (const item of items) {
    if (drafts[item.name] !== undefined) {
      next[item.name] = drafts[item.name]
    } else if (!(item.name in next)) {
      next[item.name] = item.content
    }
  }
  editingContent.value = next
}

/**
 * Remove all drafts from localStorage (e.g. on logout / clear).
 */
export function clearAllDrafts() {
  // Cancel all pending timers
  for (const key of Object.keys(draftTimers)) {
    window.clearTimeout(draftTimers[key])
    delete draftTimers[key]
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}
