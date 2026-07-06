import { reactive, watch, toRaw } from 'vue'

const STORAGE_PREFIX = 'hinge:'

export interface PersistedState<T extends Record<string, unknown>> {
  /** Reactive state proxy — mutate fields directly, auto-saves debounced */
  state: T
  /** Reset all fields to defaults and remove from localStorage */
  clear(): void
  /** Force immediate save (skip debounce) */
  saveNow(): void
  /** Enable/disable persistence on the fly */
  enabled: boolean
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * A reactive state that auto-persists to localStorage.
 *
 * @param key  Storage key suffix (prefixed with "hinge:")
 * @param defaults  Default values; also defines the shape
 * @param debounceMs  Debounce interval (default 400ms)
 */
export function usePersistedState<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
  debounceMs = 400,
): PersistedState<T> {
  const storageKey = STORAGE_PREFIX + key

  // ── Hydrate from localStorage ──
  let saved: Partial<T> = {}
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') saved = parsed
    }
  } catch { /* ignore corrupt data */ }

  // Merge defaults + saved (saved wins for existing keys, unknown keys discarded)
  const initial: T = { ...defaults }
  for (const k of Object.keys(saved)) {
    if (k in defaults) (initial as any)[k] = (saved as any)[k]
  }

  const state = reactive<T>(initial) as T
  let _enabled = true

  // ── Debounced save ──
  function scheduleSave() {
    if (!_enabled) return
    const existing = timers.get(storageKey)
    if (existing) clearTimeout(existing)
    timers.set(storageKey, setTimeout(() => {
      timers.delete(storageKey)
      try {
        localStorage.setItem(storageKey, JSON.stringify(toRaw(state)))
      } catch { /* quota exceeded or private mode */ }
    }, debounceMs))
  }

  watch(state, scheduleSave, { deep: true })

  function clear() {
    for (const k of Object.keys(defaults) as (keyof T)[]) {
      state[k] = defaults[k]
    }
    const existing = timers.get(storageKey)
    if (existing) { clearTimeout(existing); timers.delete(storageKey) }
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
  }

  function saveNow() {
    const existing = timers.get(storageKey)
    if (existing) { clearTimeout(existing); timers.delete(storageKey) }
    try { localStorage.setItem(storageKey, JSON.stringify(toRaw(state))) } catch { /* ignore */ }
  }

  return { state, clear, saveNow, enabled: _enabled }
}

/**
 * Clear ALL hinge-persisted keys from localStorage.
 * Useful for debug or a "reset everything" button.
 */
export function clearAllPersistedState(): void {
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(STORAGE_PREFIX)) toRemove.push(k)
  }
  for (const k of toRemove) localStorage.removeItem(k)
  // Cancel any pending save timers
  for (const [k, t] of timers) { clearTimeout(t); timers.delete(k) }
}
