import { ref } from 'vue'
import type { HingeTarget } from '../types/target'
import { captureElementSnapshot } from '../utils/elementSnapshot'
import { useSelectionStore } from './useSelectionStore'

export interface QueuePayload {
  note: string
  url: string
  filePath: string
  component: string
  dom: string
  props: Record<string, unknown>
  elementHtml?: string
  computedStyles?: Record<string, string>
  elementRect?: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface UseQueueSubmitOptions {
  getTarget: () => HingeTarget
  getElement: () => Element | null
}

export function useQueueSubmit({ getTarget, getElement }: UseQueueSubmitOptions) {
  const note = ref('')
  const { selection } = useSelectionStore()

  async function sendNote(onSuccess?: () => void) {
    const t = getTarget()
    const snapshot = captureElementSnapshot(getElement())

    const data: QueuePayload = {
      note: note.value,
      url: window.location.pathname + window.location.search,
      filePath: selection.filePath,
      component: '',
      dom: '',
      props: {},
    }

    // Include component data only when user selected from gear (not from file tree)
    if (selection.source === 'gear') {
      data.component = t.component
      data.dom = t.dom
      data.props = t.props
    }

    if (snapshot) {
      data.elementHtml = snapshot.html
      data.computedStyles = snapshot.styles
      data.elementRect = snapshot.rect
    }

    await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    note.value = ''
    onSuccess?.()
  }

  return { note, sendNote }
}
