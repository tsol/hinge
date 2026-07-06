import { API_BASE } from '../const'
import { reactive } from 'vue'
import { getComponentFileExtensions, stripComponentExtension } from '../utils/componentTarget'

export interface Selection {
  component: string
  filePath: string
  dom: string
  url: string
  props: Record<string, unknown>
  /** gear-preview = debounced from cog target; file = explicit file-tree pick */
  source: 'gear-preview' | 'file' | ''
}

export interface GearPreviewPayload {
  component: string
  dom: string
  props: Record<string, unknown>
  filePath: string | null
}

// Singleton state — global reactive store
const state = reactive<Selection>({
  component: '',
  filePath: '',
  dom: '',
  url: '',
  props: {},
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

  /** Debounced mirror from cog target — updates Source preview, not task model. */
  function previewFromGear(payload: GearPreviewPayload) {
    if (state.source === 'file') return
    state.component = payload.component
    state.dom = payload.dom
    state.props = { ...payload.props }
    state.source = 'gear-preview'
    if (payload.filePath) {
      state.filePath = payload.filePath
    }
  }

  /** Called when user clicks a file in the file tree */
  function fromFile(filePath: string) {
    state.filePath = filePath
    state.source = 'file'
    const basename = filePath.split('/').pop() || ''
    const comp = stripComponentExtension(basename)
    state.component = comp
    state.dom = ''
    state.url = ''
    state.props = {}
  }

  return {
    selection: state as Readonly<Selection>,
    previewFromGear,
    fromFile,
    resolveFilePath,
  }
}
