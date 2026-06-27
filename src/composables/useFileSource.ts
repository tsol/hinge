import { ref, computed } from 'vue'

export function useFileSource() {
  const content = ref('')
  const path = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadFile(filePath: string) {
    loading.value = true
    error.value = null
    path.value = filePath
    try {
      const params = new URLSearchParams({ path: filePath })
      const res = await fetch(`/api/read-file?${params}`)
      if (!res.ok) throw new Error(`Failed to read ${filePath}`)
      content.value = await res.text()
    } catch (e: any) {
      error.value = e.message
      content.value = ''
    } finally {
      loading.value = false
    }
  }

  function clear() {
    content.value = ''
    path.value = ''
    error.value = null
  }

  const lang = computed(() => {
    const ext = path.value.split('.').pop()?.toLowerCase()
    const map: Record<string, string> = {
      ts: 'typescript',
      vue: 'vue',
      js: 'javascript',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
    }
    return map[ext ?? ''] || 'plaintext'
  })

  return { content, path, loading, error, loadFile, clear, lang }
}
