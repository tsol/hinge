import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  /** Agent completion: last snippet from chat */
  detail?: string
  expanded?: boolean
}

const toasts = ref<Toast[]>([])
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', detail?: string) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, type, detail, expanded: false }]
    timers.set(id, setTimeout(() => dismiss(id), 10000))
  }

  function dismiss(id: number) {
    const t = timers.get(id)
    if (t) { clearTimeout(t); timers.delete(id) }
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function toggleExpand(id: number) {
    const toast = toasts.value.find(t => t.id === id)
    if (!toast) return
    toast.expanded = !toast.expanded
    if (toast.expanded) {
      // Expand: cancel auto-dismiss
      const t = timers.get(id)
      if (t) { clearTimeout(t); timers.delete(id) }
    } else {
      // Collapse: re-enable auto-dismiss
      timers.set(id, setTimeout(() => dismiss(id), 10000))
    }
  }

  function success(message: string, detail?: string) {
    show(message, 'success', detail)
  }

  function error(message: string, detail?: string) {
    show(message, 'error', detail)
  }

  return { toasts, show, dismiss, toggleExpand, success, error }
}
