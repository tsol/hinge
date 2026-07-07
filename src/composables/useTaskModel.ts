import { computed, toRef, type ComputedRef, type Ref } from 'vue'
import { usePersistedState } from './usePersistedState'
import { type Section, stringifyQueueMarkdown } from '../utils/queueFormat'

export interface Attachment {
  type: 'component' | 'file'
  name: string
  fields?: Record<string, string>
}

export interface TaskModel {
  text: Ref<string>
  attachments: Ref<Attachment[]>
  /** Component attachment names (for DOM highlight sync). */
  componentNames: ComputedRef<string[]>
  /** File attachment paths. */
  filePaths: ComputedRef<string[]>

  hasFile(path: string): boolean
  upsertFile(path: string): void
  removeFile(path: string): void
  removeAttachment(name: string): void
  serialize(): string
}

function toSections(attachments: Attachment[], text: string): Section[] {
  const sections: Section[] = []
  for (const a of attachments) {
    if (a.type === 'component') {
      sections.push({ type: 'component', value: a.name, fields: a.fields ?? {}, note: '' })
    } else {
      sections.push({ type: 'file', value: a.name, fields: {}, note: '' })
    }
  }
  const trimmed = text.trim()
  if (trimmed) {
    sections.push({ type: 'text', value: trimmed, fields: {}, note: '' })
  }
  return sections
}

let _modelSingleton: ReturnType<typeof _createModel> | null = null

export function useTaskModel(): TaskModel {
  if (!_modelSingleton) _modelSingleton = _createModel()
  return _modelSingleton
}

function _createModel(): TaskModel {
  const { state } = usePersistedState('model', {
    text: '',
    attachments: [] as Attachment[],
  })

  const text: Ref<string> = toRef(state, 'text')
  const attachments: Ref<Attachment[]> = toRef(state, 'attachments')

  const componentNames = computed(() =>
    attachments.value.filter(a => a.type === 'component').map(a => a.name),
  )
  const filePaths = computed(() =>
    attachments.value.filter(a => a.type === 'file').map(a => a.name),
  )

  function hasFile(path: string): boolean {
    return attachments.value.some(a => a.type === 'file' && a.name === path)
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

  return {
    text,
    attachments,
    componentNames,
    filePaths,
    hasFile,
    upsertFile,
    removeFile,
    removeAttachment,
    serialize,
  }
}
