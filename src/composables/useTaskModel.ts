import { computed, type ComputedRef, type Ref } from 'vue'
import {
  type Section,
  parseQueueMarkdown,
  stringifyQueueMarkdown,
  toggleSection,
  upsertSection,
  removeSection,
} from '../utils/queueFormat'

export interface TaskModel {
  /** Raw parsed sections — all types mixed */
  sections: ComputedRef<Section[]>
  /** Only ### Page: sections */
  pages: ComputedRef<Section[]>
  /** Only ### Component: sections */
  components: ComputedRef<Section[]>
  /** Only ### File: sections */
  files: ComputedRef<Section[]>

  /** Check if a component is in the model */
  hasComponent(name: string): boolean
  /** Check if a file path is in the model */
  hasFile(path: string): boolean
  /** Check if a URL is in the model */
  hasPage(url: string): boolean

  /** Toggle — add if missing, remove if exists */
  toggleComponent(name: string, fields?: Record<string, string>): void
  /** Upsert — add if missing, update fields if exists */
  upsertComponent(name: string, fields?: Record<string, string>): void
  removeComponent(name: string): void

  /** Add file path if not already present */
  upsertFile(path: string): void
  removeFile(path: string): void

  /** Toggle page/URL */
  togglePage(url: string): void
  upsertPage(url: string): void
}

/**
 * Central reactive "computer" that derives state from the textarea markdown model.
 *
 * @param note — the V-model ref bound to the textarea (the source of truth)
 */
export function useTaskModel(note: Ref<string>): TaskModel {
  const sections = computed(() => parseQueueMarkdown(note.value))

  const pages = computed(() => sections.value.filter(s => s.type === 'page'))
  const components = computed(() => sections.value.filter(s => s.type === 'component'))
  const files = computed(() => sections.value.filter(s => s.type === 'file'))

  function hasComponent(name: string): boolean {
    return sections.value.some(s => s.type === 'component' && s.value === name)
  }

  function hasFile(path: string): boolean {
    return sections.value.some(s => s.type === 'file' && s.value === path)
  }

  function hasPage(url: string): boolean {
    return sections.value.some(s => s.type === 'page' && s.value === url)
  }

  // ── Mutators ──────────────────────────────────────────────

  function toggleComponent(name: string, fields?: Record<string, string>) {
    const updated = toggleSection(parseQueueMarkdown(note.value), 'component', name, fields)
    note.value = stringifyQueueMarkdown(updated)
  }

  function upsertComponent(name: string, fields?: Record<string, string>) {
    const updated = upsertSection(parseQueueMarkdown(note.value), 'component', name, fields)
    note.value = stringifyQueueMarkdown(updated)
  }

  function removeComponent(name: string) {
    const updated = removeSection(parseQueueMarkdown(note.value), 'component', name)
    note.value = stringifyQueueMarkdown(updated)
  }

  function upsertFile(path: string) {
    const updated = upsertSection(parseQueueMarkdown(note.value), 'file', path)
    note.value = stringifyQueueMarkdown(updated)
  }

  function removeFile(path: string) {
    const updated = removeSection(parseQueueMarkdown(note.value), 'file', path)
    note.value = stringifyQueueMarkdown(updated)
  }

  function togglePage(url: string) {
    const updated = toggleSection(parseQueueMarkdown(note.value), 'page', url)
    note.value = stringifyQueueMarkdown(updated)
  }

  function upsertPage(url: string) {
    const updated = upsertSection(parseQueueMarkdown(note.value), 'page', url)
    note.value = stringifyQueueMarkdown(updated)
  }

  return {
    sections,
    pages,
    components,
    files,
    hasComponent,
    hasFile,
    hasPage,
    toggleComponent,
    upsertComponent,
    removeComponent,
    upsertFile,
    removeFile,
    togglePage,
    upsertPage,
  }
}
