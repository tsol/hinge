import { API_BASE } from '../const'
import { reactive } from 'vue'
import { getComponentFileExtensions } from '../utils/componentTarget'

export interface Selection {
  filePath: string
  /** gear-preview = debounced from cog target; file = explicit file-tree pick */
  source: 'gear-preview' | 'file' | ''
}

const state = reactive<Selection>({
  filePath: '',
  source: '',
})

export function useSelectionStore() {
  async function resolveFilePath(comp: string): Promise<string | null> {
    if (!comp || !/^[A-Z]/.test(comp)) return null
    try {
      for (const ext of getComponentFileExtensions()) {
        const res = await fetch(`${API_BASE}/find-file?name=${encodeURIComponent(comp + ext)}`)
        if (!res.ok) continue
        const data = await res.json()
        if (data.path) return data.path
      }
      return null
    } catch {
      return null
    }
  }

  /** Debounced mirror from cog target — opens matching file in Source tab. */
  function previewFromGear(payload: {
    component: string
    filePath: string | null
  }) {
    state.source = 'gear-preview'
    if (payload.filePath) {
      state.filePath = payload.filePath
    }
  }

  /** Restore path after reload without blocking gear-driven updates. */
  function restoreFilePath(filePath: string) {
    if (!filePath) return
    state.filePath = filePath
    if (!state.source) state.source = 'gear-preview'
  }

  function fromFile(filePath: string) {
    state.filePath = filePath
    state.source = 'file'
  }

  return {
    selection: state as Readonly<Selection>,
    previewFromGear,
    restoreFilePath,
    fromFile,
    resolveFilePath,
  }
}
