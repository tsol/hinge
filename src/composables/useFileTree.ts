import { ref } from 'vue'

export interface FileEntry {
  name: string
  path: string
  isDir: boolean
  isSymlink: boolean
}

const STORAGE_KEY = 'hinge_file_tree_expanded'

function loadSavedExpanded(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

export function useFileTree() {
  const root = ref<FileEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const expanded = ref<Set<string>>(loadSavedExpanded())
  const children = ref<Map<string, FileEntry[]>>(new Map())
  const highlightedPath = ref('')

  function saveExpanded() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded.value]))
    } catch { /* ignore */ }
  }

  async function loadDir(dirPath: string): Promise<FileEntry[]> {
    const params = new URLSearchParams({ path: dirPath })
    const res = await fetch(`/api/list-dir?${params}`)
    if (!res.ok) throw new Error(`Failed to list ${dirPath}`)
    return res.json()
  }

  async function loadRoot() {
    loading.value = true
    error.value = null
    try {
      root.value = await loadDir('.')
      // Re-expand previously saved dirs
      for (const p of expanded.value) {
        if (!children.value.has(p)) {
          children.value = new Map(children.value).set(p, await loadDir(p))
        }
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function toggleDir(path: string) {
    if (expanded.value.has(path)) {
      expanded.value.delete(path)
      expanded.value = new Set(expanded.value) // trigger reactivity
      saveExpanded()
      return
    }
    if (!children.value.has(path)) {
      const entries = await loadDir(path)
      children.value = new Map(children.value).set(path, entries)
    }
    expanded.value = new Set(expanded.value).add(path)
    saveExpanded()
  }

  function getChildren(path: string): FileEntry[] {
    return children.value.get(path) ?? []
  }

  function isExpanded(path: string): boolean {
    return expanded.value.has(path)
  }

  /** Expand parent directories and highlight a file */
  async function expandToPath(filePath: string) {
    highlightedPath.value = filePath
    if (!filePath) return
    // Ensure root is loaded
    if (root.value.length === 0) {
      await loadRoot()
    }
    const parts = filePath.split('/')
    // Expand each parent dir level
    let acc = ''
    for (let i = 0; i < parts.length - 1; i++) {
      acc = acc ? acc + '/' + parts[i] : parts[i]
      if (!expanded.value.has(acc)) {
        await toggleDir(acc)
      }
    }
  }

  /** Silent refresh root — no loading state, no flash, keeps expanded dirs */
  async function refreshRoot() {
    if (root.value.length === 0) {
      await loadRoot()
      return
    }
    try {
      const fresh = await loadDir('.')
      root.value = fresh
      // Re-expand previously saved dirs
      for (const p of expanded.value) {
        if (!children.value.has(p)) {
          children.value = new Map(children.value).set(p, await loadDir(p))
        }
      }
    } catch { /* silent */ }
  }

  /** Re-fetch children for an already-expanded path (gentle, no loading state) */
  async function refreshChildren(path: string) {
    if (!expanded.value.has(path)) return
    try {
      const entries = await loadDir(path)
      children.value = new Map(children.value).set(path, entries)
    } catch { /* directory may have been renamed */ }
  }

  /** Refresh all expanded _processing folders */
  async function refreshProcessingFolders() {
    for (const p of expanded.value) {
      if (p.includes('_processing')) {
        await refreshChildren(p)
      }
    }
  }

  return { root, loading, error, loadRoot, refreshRoot, toggleDir, getChildren, isExpanded, highlightedPath, expandToPath, refreshChildren, refreshProcessingFolders }
}
