import { API_BASE } from '../const'
import { ref, computed } from 'vue'
import { highlightLangForPath } from '../utils/highlightLang'

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
      const res = await fetch(`${API_BASE}/read-file?${params}`)
      if (!res.ok) throw new Error(`Failed to read ${filePath}`)
      content.value = await res.text()
    } catch (e: any) {
      error.value = e.message
      content.value = ''
    } finally {
      loading.value = false
    }
  }

  const lang = computed(() => highlightLangForPath(path.value) || 'plaintext')

  return { content, path, loading, error, loadFile, lang }
}
