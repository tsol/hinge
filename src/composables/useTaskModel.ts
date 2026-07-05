import { computed, ref, type ComputedRef, type Ref } from 'vue'
import {
  type Section,
  parseQueueMarkdown,
  stringifyQueueMarkdown,
} from '../utils/queueFormat'

export interface Attachment {
  type: 'component' | 'file'
  name: string           // component label or file path
  fields?: Record<string, string>  // e.g. {Url, Props, Styling}
}

export interface TaskModel {
  /** Raw parsed sections — backward compat, derived from attachments + text */
  sections: ComputedRef<Section[]>
  pages: ComputedRef<Section[]>
  components: ComputedRef<Section[]>
  files: ComputedRef<Section[]>

  /** New reactive model: plain text separate from attachments */
  text: Ref<string>
  attachments: Ref<Attachment[]>

  /** Check if a component is in the model */
  hasComponent(name: string): boolean
  /** Check if a file path is in the model */
  hasFile(path: string): boolean
  hasPage(_url: string): boolean

  /** Toggle — add if missing, remove if exists */
  toggleComponent(name: string, fields?: Record<string, string>): void
  /** Upsert — add if missing */
  upsertComponent(name: string, fields?: Record<string, string>): void
  removeComponent(name: string): void

  upsertFile(path: string): void
  removeFile(path: string): void

  /** Remove any attachment by name */
  removeAttachment(name: string): void

  /** Serialize to markdown for queue submission */
  serialize(): string
  /** Deserialize from markdown (loading existing task content) */
  deserialize(md: string): void
}

/** Convert Attachment[] + text → Section[] (backward compat) */
function toSections(attachments: Attachment[], text: string): Section[] {
  const sections: Section[] = []
  for (const a of attachments) {
    if (a.type === 'component') {
      sections.push({ type: 'component', value: a.name, fields: a.fields ?? {}, note: '' })
    } else if (a.type === 'file') {
      sections.push({ type: 'file', value: a.name, fields: {}, note: '' })
    }
  }
  const trimmed = text.trim()
  if (trimmed) {
    sections.push({ type: 'text', value: trimmed, fields: {}, note: '' })
  }
  return sections
}

/**
 * Reactive model: attachments (components/files) + text stored as plain arrays,
 * not embedded in markdown. Backward-compatible computed Section[] for legacy consumers.
 */
export function useTaskModel(): TaskModel {
  const text = ref('')
  const attachments = ref<Attachment[]>([])

  const sections = computed(() => toSections(attachments.value, text.value))
  const pages = computed<Section[]>(() => [])
  const components = computed(() => sections.value.filter(s => s.type === 'component'))
  const files = computed(() => sections.value.filter(s => s.type === 'file'))

  function hasComponent(name: string): boolean {
    return attachments.value.some(a => a.type === 'component' && a.name === name)
  }
  function hasFile(path: string): boolean {
    return attachments.value.some(a => a.type === 'file' && a.name === path)
  }
  function hasPage(_url: string): boolean {
    return false // pages no longer tracked separately
  }

  function toggleComponent(name: string, fields?: Record<string, string>) {
    const idx = attachments.value.findIndex(a => a.type === 'component' && a.name === name)
    if (idx >= 0) {
      attachments.value = attachments.value.filter((_, i) => i !== idx)
    } else {
      attachments.value = [...attachments.value, { type: 'component', name, fields }]
    }
  }

  function upsertComponent(name: string, fields?: Record<string, string>) {
    const existing = attachments.value.find(a => a.type === 'component' && a.name === name)
    if (existing) {
      if (fields) existing.fields = { ...existing.fields, ...fields }
    } else {
      attachments.value = [...attachments.value, { type: 'component', name, fields }]
    }
  }

  function removeComponent(name: string) {
    attachments.value = attachments.value.filter(a => !(a.type === 'component' && a.name === name))
  }

  function upsertFile(path: string) {
    if (!hasFile(path)) {
      attachments.value = [...attachments.value, { type: 'file', name: path }]
    }
  }

  function removeFile(path: string) {
    attachments.value = attachments.value.filter(a => !(a.type === 'file' && a.name === path))
  }

  function removeAttachment(name: string) {
    attachments.value = attachments.value.filter(a => a.name !== name)
  }

  function serialize(): string {
    return stringifyQueueMarkdown(toSections(attachments.value, text.value))
  }

  function deserialize(md: string) {
    const parsed = parseQueueMarkdown(md)
    const newAttachments: Attachment[] = []
    let newText = ''
    for (const s of parsed) {
      if (s.type === 'component') {
        newAttachments.push({ type: 'component', name: s.value, fields: s.fields })
      } else if (s.type === 'file') {
        newAttachments.push({ type: 'file', name: s.value })
      } else if (s.type === 'text') {
        newText = (newText ? newText + '\n' : '') + s.value
      }
    }
    attachments.value = newAttachments
    text.value = newText
  }

  return {
    sections, pages, components, files,
    text, attachments,
    hasComponent, hasFile, hasPage,
    toggleComponent, upsertComponent, removeComponent,
    upsertFile, removeFile, removeAttachment,
    serialize, deserialize,
  }
}
