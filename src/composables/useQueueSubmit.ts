import { ref } from 'vue'

export function useQueueSubmit() {
  const note = ref('')

  async function sendNote(content: string, onSuccess?: () => void) {
    await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    note.value = ''
    onSuccess?.()
  }

  return { note, sendNote }
}
