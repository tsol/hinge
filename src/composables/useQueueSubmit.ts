import { ref } from 'vue'
import type { HingeTarget } from '../types/target'
import { captureElementSnapshot } from '../utils/elementSnapshot'

export interface QueuePayload {
  note: string
  url: string
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

  async function sendNote(onSuccess?: () => void) {
    const t = getTarget()
    const snapshot = captureElementSnapshot(getElement())

    const data: QueuePayload = {
      note: note.value,
      url: window.location.href,
      component: t.component,
      dom: t.dom,
      props: t.props,
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
