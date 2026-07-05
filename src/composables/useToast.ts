import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
  /** Agent completion: last snippet from chat */
  detail?: string
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', detail?: string) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, type, detail }]
    // Auto-dismiss after 10s
    setTimeout(() => dismiss(id), 10000)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(message: string, detail?: string) {
    show(message, 'success', detail)
  }

  function error(message: string, detail?: string) {
    show(message, 'error', detail)
  }

  return { toasts, show, dismiss, success, error }
}
