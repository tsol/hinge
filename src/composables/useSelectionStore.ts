import { API_BASE } from '../const'
import { reactive } from 'vue'
import { getComponentFileExtensions, stripComponentExtension } from '../utils/componentTarget'

export interface Selection {
  component: string
  filePath: string
  dom: string
  url: string
  props: Record<string, unknown>
  source: 'gear' | 'file' | ''
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

  /** Called when user picks a component from gear dropdown (has DOM info) */
  async function fromGear(
    comp: string,
    dom: string = '',
    url: string = '',
    props: Record<string, unknown> = {},
  ) {
    state.component = comp
    state.dom = dom
    state.url = url
    state.props = { ...props }
    state.source = 'gear'
    // Resolve component name → file path
    const filePath = await resolveFilePath(comp)
    if (filePath) {
      state.filePath = filePath
    }
  }

  /** Called when user clicks a file in the file tree */
  function fromFile(filePath: string) {
    state.filePath = filePath
    state.source = 'file'
    // Extract component name from path: "src/components/Foo.tsx" → "Foo"
    const basename = filePath.split('/').pop() || ''
    const comp = stripComponentExtension(basename)
    state.component = comp
    // Clear DOM info — we selected a file, not a DOM element
    state.dom = ''
    state.url = ''
    state.props = {}
  }

  return {
    selection: state as Readonly<Selection>,
    fromGear,
    fromFile,
    resolveFilePath,
  }
}
