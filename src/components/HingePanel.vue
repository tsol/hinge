<script setup lang="ts">
import { API_BASE } from '../const'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { TaskModel } from '../composables/useTaskModel'
import { useFileTree, type FileEntry } from '../composables/useFileTree'
import { useFileSource } from '../composables/useFileSource'
import { useSelectionStore } from '../composables/useSelectionStore'
import { syncAttachmentHighlights } from '../composables/useElementHighlights'
import { useModeDropdown } from '../composables/useModeDropdown'
import { highlightLangForPath } from '../utils/highlightLang'
import { patchQueueContent } from '../utils/queueApi'
import { useI18n } from '../composables/useI18n'
import { usePersistedState } from '../composables/usePersistedState'
import HingeTabQueue from './HingeTabQueue.vue'
import HingeAttach from './HingeAttach.vue'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github-dark.css'
import typescript from 'highlight.js/lib/languages/typescript'
import javascript from 'highlight.js/lib/languages/javascript'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import scss from 'highlight.js/lib/languages/scss'
import bash from 'highlight.js/lib/languages/bash'
import HingeMic from './HingeMic.vue'
import { useFontScale } from '../composables/useFontScale'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('scss', scss)
hljs.registerLanguage('bash', bash)

const props = defineProps<{
  modelValue: string
  model: TaskModel
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: [onSuccess?: () => void]
  close: []
}>()

const { t: lang, setLocale, currentLocale } = useI18n()

const { selection, fromFile, restoreFilePath } = useSelectionStore()

const note = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { state: panel } = usePersistedState('panel', {
  activeTab: 'input' as 'input' | 'files' | 'source' | 'settings',
  lastFile: '',
})
const { state: panelExec } = usePersistedState('panelExecMode', {
  mode: 'execute' as 'execute' | 'stop' | 'delete',
})
const { state: drawerW } = usePersistedState('drawerWidth', {
  width: 380,
})
const activeTab = computed({
  get: () => panel.activeTab as 'input' | 'files' | 'source' | 'settings',
  set: (v: 'input' | 'files' | 'source' | 'settings') => { panel.activeTab = v },
})

const fileMentioned = ref(false)

watch(
  () => [selection.filePath, props.model.filePaths.value],
  ([path, files]) => {
    fileMentioned.value = !!path && (files as string[]).includes(path as string)
  },
  { immediate: true },
)

function mentionFile() {
  const path = selection.filePath
  if (!path) return
  if (fileMentioned.value) {
    props.model.removeFile(path)
  } else {
    props.model.upsertFile(path)
  }
}

/** Toggle a file path in the task model — used by file tree checkboxes */
function toggleFileMention(path: string) {
  if (props.model.hasFile(path)) {
    props.model.removeFile(path)
  } else {
    props.model.upsertFile(path)
  }
}

const fileTree = useFileTree()
const fileSrc = useFileSource()
const queueRefreshKey = ref(0)
const editingFile = ref('')
const queueRef = ref<InstanceType<typeof HingeTabQueue> | null>(null)

// ─── Log polling (auto-refresh chat.log in Source tab) ──
const logPollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const treePollTimer = ref<ReturnType<typeof setInterval> | null>(null)

/** Extract folder name from .hinge path, null if not chat.log in _processing */
function getLogFolder(path: string): string | null {
  const m = path.match(/\.hinge\/(.+_processing)\/chat\.log$/)
  return m ? m[1] : null
}

function stopLogPoll() {
  if (logPollTimer.value) {
    clearInterval(logPollTimer.value)
    logPollTimer.value = null
  }
}

function startLogPoll(folder: string) {
  stopLogPoll()
  logPollTimer.value = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/log?file=${encodeURIComponent(folder)}`)
      if (!res.ok) {
        if (res.status === 404) stopLogPoll() // task renamed to _done → done
        return
      }
      const text = await res.text()
      // Gentle in-place update — no loading state, no flicker
      if (text !== fileSrc.content.value) {
        fileSrc.content.value = text
      }
    } catch { stopLogPoll() }
  }, 2000)
}

const drawerWidth = computed({
  get: () => drawerW.width as number,
  set: (v: number) => { drawerW.width = v },
})
const resizing = ref(false)
const drawerRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  // Always start on input tab when panel opens
  activeTab.value = 'input'
  // Auto-resize textarea to content
  setTimeout(autoResizeTextarea, 50)
})

function startResize(e: PointerEvent) {
  resizing.value = true
  e.preventDefault()
  const startX = e.clientX
  const startW = drawerWidth.value

  function onMove(ev: PointerEvent) {
    const delta = ev.clientX - startX
    const newW = Math.max(260, Math.min(800, startW + delta))
    drawerWidth.value = newW
  }

  function onUp() {
    resizing.value = false
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

function onAdd() {
  if (editingFile.value) {
    patchQueueContent(editingFile.value, note.value).then(() => {
      editingFile.value = ''
      queueRefreshKey.value++
    })
  } else {
    emit('send', () => queueRefreshKey.value++)
  }
}

function onEditTask(item: { name: string; content: string }) {
  editingFile.value = item.name
  note.value = item.content
  activeTab.value = 'input'
}

type ExecMode = 'execute' | 'stop' | 'delete'
const allModes: ExecMode[] = ['execute', 'stop', 'delete']

const execMode = computed({
  get: () => panelExec.mode as ExecMode,
  set: (v: ExecMode) => { panelExec.mode = v },
})
const chevronRef = ref<HTMLElement | null>(null)
const {
  open: showModeDropdown,
  opensUpward: dropdownUp,
  toggle: toggleModeDropdown,
  close: closeModeDropdown,
  onOutsideClick: onModeOutsideClick,
} = useModeDropdown(chevronRef, allModes.length)

const modeLabels = computed((): Record<ExecMode, string> => ({
  execute: lang.value.execute,
  stop: lang.value.stop,
  delete: lang.value.delete,
}))

function setMode(mode: ExecMode) {
  execMode.value = mode
  closeModeDropdown()
}

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  onModeOutsideClick(e, '.segmented-btn')
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const hasSelected = computed(() => {
  const q = queueRef.value
  return q ? q.selectionCount > 0 : false
})

// Execute / Stop / Delete based on current mode
async function onExecuteByMode() {
  const selected = queueRef.value?.getSelectedTasks() ?? []
  if (selected.length === 0) return

  if (execMode.value === 'execute') {
    for (const name of selected) {
      await fetch(`${API_BASE}/queue`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: name, status: 'wait' }),
      })
    }
    // Trigger agent to pick up the first _wait task
    await fetch(`${API_BASE}/queue/run`, { method: 'POST' })
  } else if (execMode.value === 'stop') {
    for (const name of selected) {
      try {
        const res = await fetch(`${API_BASE}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        if (!res.ok) console.warn(`[hinge] Stop failed for ${name}: HTTP ${res.status}`)
      } catch (e) {
        console.error(`[hinge] Stop fetch error for ${name}:`, e)
      }
    }
  } else if (execMode.value === 'delete') {
    for (const name of selected) {
      await fetch(`${API_BASE}/queue?file=${encodeURIComponent(name)}`, { method: 'DELETE' })
    }
  }

  queueRefreshKey.value++
}

// Load root files on mount when switching to files tab

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  if (tab === 'files' && fileTree.root.value.length === 0) {
    fileTree.loadRoot()
  }
  if (tab === 'input') {
    nextTick(autoResizeTextarea)
  }
}

async function openFile(path: string) {
  fromFile(path)
  activeTab.value = 'source'
}

function fileIcon(entry: { name: string; isDir: boolean }): string {
  if (entry.isDir) return '📁'
  const ext = entry.name.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    ts: '🔷', vue: '💚', js: '🟨', html: '🟠', css: '🟦',
    scss: '🟣', json: '📋', md: '📝', yaml: '📄', yml: '📄',
  }
  return icons[ext ?? ''] || '📄'
}

/** Split file path into directory prefix and filename */
const filePathParts = computed(() => {
  const path = selection.filePath
  if (!path) return { dir: null, file: null, full: '' }
  const idx = path.lastIndexOf('/')
  let dir = idx >= 0 ? path.slice(0, idx) : ''
  let file = idx >= 0 ? path.slice(idx + 1) : path
  // Middle ellipsis for long directory paths
  if (dir.length > 28) {
    const first = dir.slice(0, 12)
    const last = dir.slice(-12)
    dir = `${first}…${last}`
  }
  return { dir, file, full: path }
})

/** Highlight code based on file extension */
const highlightedCode = computed(() => {
  const content = fileSrc.content.value
  if (!content) return ''
  const path = selection.filePath
  if (!path) return `<code class="hljs">${hljs.highlightAuto(content).value}</code>`
  const lang = highlightLangForPath(path)
  if (lang && hljs.getLanguage(lang)) {
    return `<code class="hljs">${hljs.highlight(content, { language: lang }).value}</code>`
  }
  return `<code class="hljs">${hljs.highlightAuto(content).value}</code>`
})

const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']

/** True when the selected file is an image */
const isImage = computed(() => {
  const path = selection.filePath
  if (!path) return false
  const ext = path.split('.').pop()?.toLowerCase()
  return ext ? imageExts.includes(ext) : false
})

interface FlatTreeItem {
  entry: FileEntry
  depth: number
}

/** Flatten expanded file tree into a single array with depth for rendering */
const flatTree = computed(() => {
  const result: FlatTreeItem[] = []
  function walk(entries: FileEntry[], depth: number) {
    for (const entry of entries) {
      result.push({ entry, depth })
      if (entry.isDir && fileTree.isExpanded(entry.path)) {
        walk(fileTree.getChildren(entry.path), depth + 1)
      }
    }
  }
  walk(fileTree.root.value, 0)
  return result
})

// Shorten attachment label for chip display
function chipLabel(name: string): string {
  // Component: "HingePanel · button \"Add\"" → "HingePanel · Add"
  if (name.includes('·')) {
    const parts = name.split('·').map(p => p.trim())
    // Take first 2 meaningful parts
    const short = parts.slice(0, 2).join(' · ').replace(/"[^"]*"/g, '')
    if (short.length > 30) return short.slice(0, 28) + '…'
    return short.trim()
  }
  // File: extract basename
  const base = name.split('/').pop() || name
  if (base.length > 30) return base.slice(0, 28) + '…'
  return base
}

function onTranscribed(text: string) {
  note.value = (note.value ? note.value + '\n' : '') + text + '\n'
  nextTick(() => autoResizeTextarea())
}

const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)

function clearNote() {
  note.value = ''
  nextTick(autoResizeTextarea)
}

/** Auto-resize textarea to fit content, capped at 50% of available height */
function autoResizeTextarea() {
  const ta = noteTextareaRef.value
  if (!ta) return
  ta.style.height = 'auto'
  const scroll = ta.scrollHeight
  // Find the container (.input-scroll) which has flex:1
  const container = ta.closest('.input-scroll') as HTMLElement | null
  if (!container) { ta.style.height = scroll + 'px'; return }
  // Calculate available = container height minus other children (actions, gaps, padding)
  const actions = container.querySelector('.input-actions') as HTMLElement | null
  const actionsH = actions ? actions.offsetHeight : 0
  const gapPx = 14 // gap value from CSS
  const containerPad = 4 + 14 // padding-top + padding-bottom
  const available = container.clientHeight - actionsH - containerPad - gapPx
  const max = Math.max(60, Math.floor(available * 0.5))
  ta.style.maxHeight = max + 'px'
  ta.style.height = Math.min(scroll, max) + 'px'
}

/** Handle textarea input: update model + auto-resize */
function onNoteInput(e: Event) {
  note.value = (e.target as HTMLTextAreaElement).value
  autoResizeTextarea()
}

const { state: sourceEdit } = usePersistedState('sourceEdit', {
  mode: false,
  content: '',
})
const sourceEditMode = computed({
  get: () => sourceEdit.mode as boolean,
  set: (v: boolean) => { sourceEdit.mode = v },
})
const sourceEditingContent = computed({
  get: () => sourceEdit.content as string,
  set: (v: string) => { sourceEdit.content = v },
})
const sourceSaving = ref(false)

function toggleSourceEdit() {
  if (!sourceEditMode.value) {
    // Enter edit mode → populate textarea with raw content
    sourceEditingContent.value = fileSrc.content.value || ''
    sourceEditMode.value = true
  } else {
    sourceEditMode.value = false
  }
}

async function saveSourceFile() {
  const path = selection.filePath
  if (!path) return
  sourceSaving.value = true
  try {
    await fetch(`${API_BASE}/write-file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content: sourceEditingContent.value }),
    })
    // Reload file content to reflect changes
    await fileSrc.loadFile(path)
    sourceEditMode.value = false
  } catch { /* ignore */ }
  sourceSaving.value = false
}

// When source file changes → exit edit mode; load content (no tab switch)
watch(() => selection.filePath, async (file, prev) => {
  if (sourceEditMode.value && fileSrc.path.value && fileSrc.path.value !== file) {
    sourceEditMode.value = false
  }
  if (file) fileTree.expandToPath(file)
  if (!file) return
  if (!fileSrc.loading.value && fileSrc.path.value === file && file === prev) return
  await fileSrc.loadFile(file)
}, { immediate: true })

// Save last selected file path for restoring after reload
watch(() => selection.filePath, (fp) => {
  if (fp) panel.lastFile = fp
})

// Sync DOM highlights when attachments change
watch(
  () => props.model.attachments.value,
  (attachments) => syncAttachmentHighlights(attachments),
  { deep: true, immediate: true },
)

watch(() => note.value, () => {
  nextTick(autoResizeTextarea)
})

// ─── Real-time polling ─────────────────────

// Poll log when viewing chat.log from _processing folder
watch([activeTab, () => selection.filePath], ([tab, file]) => {
  stopLogPoll()
  if (tab === 'source' && file) {
    const folder = getLogFolder(file)
    if (folder) startLogPoll(folder)
  }
})

// Refresh file tree for _processing folders and root when Files tab is active
watch(activeTab, (tab) => {
  if (treePollTimer.value) {
    clearInterval(treePollTimer.value)
    treePollTimer.value = null
  }
  if (tab === 'files') {
    // Load root on first visit after reload
    if (fileTree.root.value.length === 0) {
      fileTree.loadRoot()
    }
    treePollTimer.value = setInterval(() => {
      fileTree.refreshProcessingFolders()
      // Also refresh root if expanded (new files may appear)
      if (fileTree.root.value.length > 0) {
        fileTree.refreshRoot()
      }
    }, 5000)
  }
}, { immediate: true })

// Restore last selected file on mount (do not pin source=file — gear must keep syncing)
onMounted(() => {
  if (panel.lastFile && !selection.filePath) {
    restoreFilePath(panel.lastFile)
    if (activeTab.value === 'files') {
      fileTree.expandToPath(panel.lastFile)
    }
  }
})

onUnmounted(() => {
  stopLogPoll()
  if (treePollTimer.value) clearInterval(treePollTimer.value)
})

// ─── Prompt settings ─────────────────────
const promptText = ref('')
const promptLoading = ref(false)
const promptSaving = ref(false)

async function loadPrompt() {
  promptLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/prompt`)
    promptText.value = await res.text()
  } catch {
    promptText.value = lang.value.failedLoadPrompt
  }
  promptLoading.value = false
}

async function savePrompt() {
  promptSaving.value = true
  try {
    await fetch(`${API_BASE}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: promptText.value }),
    })
  } catch { /* ignore */ }
  promptSaving.value = false
}

async function resetPrompt() {
  promptSaving.value = true
  try {
    await fetch(`${API_BASE}/prompt`, { method: 'DELETE' })
    await loadPrompt()
  } catch { /* ignore */ }
  promptSaving.value = false
}

// Load prompt when settings tab is opened
watch(activeTab, (tab) => {
  if (tab === 'settings' && !promptText.value) {
    loadPrompt()
  }
})

// ── Font scale ──
const { level: fontLevel, setLevel: setFontLevel, labels: fontLabels, levels: fontLevels } = useFontScale()
</script>

<template>
  <Teleport to="body">
    <div class="hinge-panel-wrapper">

      <div ref="drawerRef" class="drawer" :style="{ width: drawerWidth + 'px' }">
        <!-- Tabs -->
        <div class="drawer-tabs">
          <button
            v-for="id in (['input', 'files', 'source', 'settings'] as const)"
            :key="id"
            class="drawer-tab"
            :class="{ 'drawer-tab--active': activeTab === id }"
            @click="switchTab(id)"
          >
            {{ lang[id] }}
          </button>
          <button class="drawer-close" @click="emit('close')" :title="lang.close">✕</button>
        </div>

        <!-- Tab: Input -->
        <div v-if="activeTab === 'input'" class="tab-content">
          <div class="input-scroll">
            <div class="textarea-wrap">
              <textarea
                ref="noteTextareaRef"
                class="drawer-textarea"
                data-hinge-field="panel"
                :value="note"
                @input="onNoteInput"
                :placeholder="lang.notePlaceholder"
              ></textarea>
              <button
                class="clear-btn"
                :disabled="!note.trim()"
                @click="clearNote"
                :title="lang.clear"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Attachments chips -->
            <div v-if="props.model.attachments.value.length > 0" class="chips-row">
              <span
                v-for="a in props.model.attachments.value"
                :key="a.name"
                class="chip"
                :class="'chip--' + a.type"
                :title="a.name"
              >
                <span class="chip__type">{{ a.type === 'component' ? '🧩' : '📄' }}</span>
                <span class="chip__label">{{ chipLabel(a.name) }}</span>
                <button class="chip__x" @click="props.model.removeAttachment(a.name)">✕</button>
              </span>
            </div>

            <div class="input-actions">
              <HingeMic @transcribed="onTranscribed" />
              <div class="input-actions__group">
                <button
                  class="drawer-btn drawer-btn--add"
                  :disabled="!note.trim()"
                  @click="onAdd"
                >
                  {{ editingFile ? lang.saveEdit : lang.add }}
                </button>
                <button
                  v-if="editingFile"
                  class="drawer-btn drawer-btn--cancel"
                  @click="editingFile = ''"
                >
                  ✕
                </button>
                <HingeAttach v-if="editingFile" :folder="editingFile" />
                <div class="segmented-btn">
                <button
                  class="segmented-btn__main"
                  :class="'segmented-btn__main--' + execMode"
                  :disabled="!hasSelected"
                  @click="onExecuteByMode"
                >{{ modeLabels[execMode] }}</button>
                <button
                  ref="chevronRef"
                  class="segmented-btn__chevron"
                  :class="{ 'segmented-btn__chevron--active': showModeDropdown }"
                  @click.stop="toggleModeDropdown"
                >▼</button>
                <div v-if="showModeDropdown" class="mode-dropdown" :class="{ 'mode-dropdown--up': dropdownUp }">
                  <button
                    v-for="mode in allModes"
                    :key="mode"
                    class="mode-dropdown__item"
                    :class="{ 'mode-dropdown__item--active': mode === execMode }"
                    @click="setMode(mode)"
                  >{{ modeLabels[mode] }}</button>
                </div>
              </div>
              </div>
            </div>

            <HingeTabQueue
              ref="queueRef"
              compact
              :refresh-key="queueRefreshKey"
              :editing-file="editingFile"
              :exec-mode="execMode"
              @edit-task="onEditTask"
            />
          </div>
        </div>

        <!-- Tab: Files -->
        <div v-if="activeTab === 'files'" class="tab-content">
          <div class="tab-header">{{ lang.projectFiles }}</div>

          <div v-if="fileTree.loading.value" class="drawer-body">
            <p class="drawer-muted">{{ lang.promptLoading }}</p>
          </div>

          <div v-else-if="fileTree.error.value" class="drawer-body">
            <p class="drawer-error">{{ fileTree.error.value }}</p>
          </div>

          <div v-else class="drawer-body drawer-body--scroll">
            <template v-for="item in flatTree" :key="item.entry.path">
              <div
                class="file-row"
                :class="{ 'file-row--highlighted': fileTree.highlightedPath.value === item.entry.path }"
                :style="{ paddingLeft: (14 + item.depth * 20) + 'px' }"
                @click="item.entry.isDir ? fileTree.toggleDir(item.entry.path) : openFile(item.entry.path)"
              >
                <span
                  v-if="!item.entry.isDir"
                  class="file-check"
                  :class="{ 'file-check--on': props.model.hasFile(item.entry.path) }"
                  @click.stop="toggleFileMention(item.entry.path)"
                >{{ props.model.hasFile(item.entry.path) ? '☑' : '☐' }}</span>
                <span v-else class="file-check file-check--spacer"></span>
                <span v-if="item.entry.isDir" class="file-toggle">
                  {{ fileTree.isExpanded(item.entry.path) ? '▼' : '▶' }}
                </span>
                <span v-else class="file-toggle file-toggle--spacer"></span>
                <span class="file-icon">{{ fileIcon(item.entry) }}</span>
                <span class="file-name">{{ item.entry.name }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Tab: Source -->
        <div v-if="activeTab === 'source'" class="tab-content">
          <div class="tab-header tab-header--source">
            <span v-if="filePathParts.dir" class="tab-header__dir">{{ filePathParts.dir }}/</span>
            <span v-if="filePathParts.file" class="tab-header__file">{{ filePathParts.file }}</span>
            <span v-else class="tab-header__file tab-header__file--muted">{{ lang.noFileSelected }}</span>
            <button
              v-if="filePathParts.file"
              class="source-edit-toggle"
              :class="{ 'source-edit-toggle--active': sourceEditMode }"
              @click="toggleSourceEdit"
              :title="sourceEditMode ? lang.view : lang.edit"
            >{{ sourceEditMode ? '👁' : '✎' }}</button>
            <button
              v-if="filePathParts.file"
              class="source-mention-btn"
              :class="{ 'source-mention-btn--active': fileMentioned }"
              @click="mentionFile"
              :title="lang.insertFilePath"
            >@</button>
          </div>

          <div v-if="fileSrc.loading.value" class="drawer-body">
            <p class="drawer-muted">{{ lang.promptLoading }}</p>
          </div>

          <div v-else-if="fileSrc.error.value" class="drawer-body">
            <p class="drawer-error">{{ fileSrc.error.value }}</p>
          </div>

          <div v-else class="drawer-body drawer-body--scroll source-body">
            <textarea
              v-if="sourceEditMode"
              class="source-editor"
              :value="sourceEditingContent"
              @input="sourceEditingContent = ($event.target as HTMLTextAreaElement).value"
              spellcheck="false"
            ></textarea>
            <img v-else-if="isImage" :src="`${API_BASE}/raw-file?path=${encodeURIComponent(selection.filePath)}`" class="source-image" />
            <pre v-else class="source-code" v-html="highlightedCode"></pre>
            <div v-if="sourceEditMode" class="source-save-row">
              <button
                class="drawer-btn drawer-btn--save-source"
                :disabled="sourceSaving"
                @click="saveSourceFile"
              >{{ sourceSaving ? lang.saving : lang.sourceSave }}</button>
            </div>
          </div>
        </div>
        <!-- Tab: Settings -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <div class="settings-scroll">
            <!-- Language -->
            <div class="settings-row">
              <div class="settings-row__label">{{ lang.lang }}</div>
              <div class="settings-row__control">
                <button
                  class="settings-btn"
                  :class="{ 'settings-btn--active': currentLocale === 'en' }"
                  @click="setLocale('en')"
                >EN</button>
                <button
                  class="settings-btn"
                  :class="{ 'settings-btn--active': currentLocale === 'ru' }"
                  @click="setLocale('ru')"
                >RU</button>
              </div>
            </div>
            <!-- Font Size -->
            <div class="settings-row">
              <div class="settings-row__label">Font Size</div>
              <div class="settings-row__control">
                <button
                  v-for="lvl in fontLevels"
                  :key="lvl"
                  class="settings-btn"
                  :class="{ 'settings-btn--active': fontLevel === lvl }"
                  @click="setFontLevel(lvl)"
                >{{ fontLabels[lvl] }}</button>
              </div>
            </div>
            <!-- System Prompt -->
            <div class="settings-row settings-row--full">
              <div class="settings-row__label">{{ lang.systemPrompt }}</div>
              <div class="settings-row__body" v-if="promptLoading">
                <p class="drawer-muted">{{ lang.promptLoading }}</p>
              </div>
              <div class="settings-row__body" v-else>
                <textarea
                  class="settings-editor"
                  :value="promptText"
                  @input="promptText = ($event.target as HTMLTextAreaElement).value"
                  spellcheck="false"
                ></textarea>
              </div>
              <div class="settings-row__actions">
                <button class="drawer-btn drawer-btn--prompt-reset" @click="resetPrompt" :disabled="promptSaving">
                  {{ promptSaving ? lang.saving : lang.reset }}
                </button>
                <button class="drawer-btn drawer-btn--prompt-save" @click="savePrompt" :disabled="promptSaving || promptLoading">
                  {{ promptSaving ? lang.saving : lang.save }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          class="drawer-resize-handle"
          :class="{ 'drawer-resize-handle--active': resizing }"
          @pointerdown="startResize"
        ></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background: #1a1a2e;
  color: #e0e0e0;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: var(--hinge-fs-13, 13px);
  overflow: hidden;
}

.drawer-tabs {
  display: flex;
  border-bottom: 1px solid #2a2a4a;
  flex-shrink: 0;
}

.drawer-close {
  background: transparent;
  border: none;
  color: #888;
  font-size: var(--hinge-fs-16, 16px);
  cursor: pointer;
  padding: var(--hinge-spacing-sm, 10px) var(--hinge-spacing-sm, 12px);
  line-height: 1;
  transition: color 0.15s;
  flex-shrink: 0;
}
.drawer-close:hover {
  color: #f85149;
}

.drawer-tab {
  flex: 1;
  padding: var(--hinge-spacing-sm, 10px) var(--hinge-spacing-md, 8px);
  background: transparent;
  border: none;
  color: #888;
  font-size: var(--hinge-fs-12, 12px);
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.15s, background 0.15s;
}

.drawer-tab:hover {
  color: #ccc;
  background: rgba(255, 255, 255, 0.05);
}

.drawer-tab--active {
  color: #58a6ff;
  box-shadow: inset 0 -2px 0 #58a6ff;
}

.tab-header {
  padding: 10px 14px;
  font-size: var(--hinge-fs-11, 11px);
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #888;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.tab-header--source {
  gap: 0;
  min-height: 38px;
}

.source-edit-toggle {
  background: transparent;
  border: none;
  color: #888;
  font-size: var(--hinge-fs-14, 14px);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  margin-left: auto;
  line-height: 1;
}
.source-edit-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ccc;
}
.source-edit-toggle--active {
  color: #58a6ff;
}
.source-edit-toggle--active:hover {
  background: rgba(88, 166, 255, 0.12);
  color: #58a6ff;
}

.source-mention-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: var(--hinge-fs-14, 14px);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
  line-height: 1;
  font-weight: 700;
}
.source-mention-btn:hover {
  background: rgba(88, 166, 255, 0.08);
  color: #58a6ff;
}
.source-mention-btn--active {
  color: #58a6ff;
  background: rgba(88, 166, 255, 0.15);
}

.tab-header__dir {
  overflow: hidden;
  white-space: nowrap;
  color: #666;
  font-size: var(--hinge-fs-11, 11px);
  font-weight: 500;
}

.tab-header__file {
  overflow: hidden;
  white-space: nowrap;
  color: #e0e0e0;
  font-weight: 700;
  font-size: var(--hinge-fs-12, 12px);
}

.tab-header__file--muted {
  color: #666;
  font-weight: 500;
  font-size: var(--hinge-fs-11, 11px);
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Clear button (X icon overlay on textarea) */
.clear-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #f85149;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s, transform 0.1s;
  line-height: 1;
  z-index: 1;
  opacity: 0.7;
}
.clear-btn:hover {
  background: rgba(248, 81, 73, 0.15);
  opacity: 1;
}
.clear-btn:active {
  transform: scale(0.88);
}
.clear-btn:disabled {
  opacity: 0;
  pointer-events: none;
}

.input-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
}

.input-scroll::-webkit-scrollbar {
  width: 6px;
}
.input-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.input-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.drawer-body {
  padding: 14px;
  flex: 1;
}

.drawer-body--scroll {
  overflow-y: auto;
  padding: 4px 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.drawer-body--scroll::-webkit-scrollbar {
  width: 6px;
}

.drawer-body--scroll::-webkit-scrollbar-track {
  background: transparent;
}

.drawer-body--scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.textarea-wrap {
  position: relative;
  margin-top: var(--hinge-spacing-md, 8px);
}

.drawer-textarea {
  width: 100%;
  padding: var(--hinge-spacing-sm, 10px);
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  background: #16162a;
  color: #e0e0e0;
  font-family: inherit;
  font-size: var(--hinge-fs-13, 13px);
  min-height: 60px;
  box-sizing: border-box;
  overflow: auto !important;
}

.drawer-textarea:focus {
  outline: none;
  border-color: #58a6ff;
}

.input-actions {
  display: flex;
  gap: var(--hinge-spacing-md, 8px);
  justify-content: space-between;
}

.input-actions__group {
  display: flex;
  gap: var(--hinge-spacing-xs, 4px);
  align-items: center;
}

.drawer-btn--add {
  background: #238636;
  color: #fff;
}
.drawer-btn--add:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.drawer-btn--cancel {
  background: #30363d;
  color: #ccc;
  padding: var(--hinge-spacing-md, 8px) var(--hinge-spacing-sm, 12px);
}

/* ── Segmented Button ── */
.segmented-btn {
  display: inline-flex;
  position: relative;
  z-index: 100;
}

.segmented-btn__main {
  padding: var(--hinge-spacing-md, 8px) var(--hinge-spacing-lg, 16px);
  border: none;
  border-radius: 6px 0 0 6px;
  font-size: var(--hinge-fs-13, 13px);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  color: #fff;
}
.segmented-btn__main:hover:not(:disabled) {
  opacity: 0.85;
}
.segmented-btn__main:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.segmented-btn__main--execute {
  background: #1f6feb;
}
.segmented-btn__main--stop {
  background: #da3633;
}
.segmented-btn__main--delete {
  background: #f85149;
}
.segmented-btn__chevron {
  padding: 8px 10px;
  border: none;
  border-radius: 0 6px 6px 0;
  font-size: var(--hinge-fs-9, 9px);
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  color: #fff;
  background: #1f6feb;
  border-left: 1px solid rgba(255,255,255,0.2);
}
.segmented-btn__chevron:hover {
  opacity: 0.85;
}
.segmented-btn__chevron--active {
  background: #1158c7;
}
.segmented-btn__main--stop + .segmented-btn__chevron {
  background: #da3633;
}
.segmented-btn__main--stop + .segmented-btn__chevron--active {
  background: #b02626;
}
.segmented-btn__main--delete + .segmented-btn__chevron {
  background: #f85149;
}
.segmented-btn__main--delete + .segmented-btn__chevron--active {
  background: #d93a3a;
}

/* ── Mode Dropdown ── */
.mode-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #1c1c3a;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  overflow: hidden;
  min-width: 140px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.mode-dropdown--up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 4px;
}
.mode-dropdown__item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #c9d1d9;
  font-size: var(--hinge-fs-13, 13px);
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.mode-dropdown__item:hover {
  background: rgba(88, 166, 255, 0.1);
}
.mode-dropdown__item--active {
  color: #58a6ff;
  font-weight: 700;
  background: rgba(88, 166, 255, 0.08);
}

.drawer-btn {
  padding: var(--hinge-spacing-md, 8px) var(--hinge-spacing-lg, 16px);
  border: none;
  border-radius: 6px;
  font-size: var(--hinge-fs-13, 13px);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.drawer-btn:hover {
  opacity: 0.85;
}

.drawer-btn--back {
  background: transparent;
  color: #58a6ff;
  font-size: var(--hinge-fs-11, 11px);
  padding: 4px 10px;
}

.drawer-muted {
  color: #666;
  font-style: italic;
}

.drawer-error {
  color: #f85149;
}

/* File tree */
.file-row {
  display: flex;
  align-items: center;
  gap: var(--hinge-spacing-xs, 4px);
  padding: 3px var(--hinge-spacing-md, 14px);
  cursor: pointer;
  transition: background 0.12s;
  font-size: var(--hinge-fs-13, 13px);
  font-family: ui-monospace, 'SF Mono', monospace;
  user-select: none;
}

.file-row:hover {
  background: rgba(88, 166, 255, 0.1);
}

.file-row--highlighted {
  background: rgba(88, 166, 255, 0.18) !important;
  outline: 1px solid rgba(88, 166, 255, 0.4);
  outline-offset: -1px;
}

.file-toggle {
  width: var(--hinge-spacing-sm, 12px);
  text-align: center;
  font-size: var(--hinge-fs-9, 9px);
  color: #888;
  flex-shrink: 0;
}

.file-toggle--spacer {
  visibility: hidden;
}

.file-icon {
  font-size: var(--hinge-fs-13, 13px);
  flex-shrink: 0;
  width: var(--hinge-spacing-xl, 18px);
  text-align: center;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #c9d1d9;
}

.file-check {
  width: var(--hinge-spacing-md, 14px);
  text-align: center;
  font-size: var(--hinge-fs-12, 12px);
  flex-shrink: 0;
  cursor: pointer;
  color: #555;
  transition: color 0.12s;
}
.file-check:hover {
  color: #58a6ff;
}
.file-check--on {
  color: #58a6ff;
}
.file-check--spacer {
  visibility: hidden;
  pointer-events: none;
}

.file-children {
  /* no extra styling needed */
}

.file-children--nested {
  /* deeper nesting handled by padding-left on child2 */
}

.file-nested {
  /* container for grandchildren */
}

/* Source viewer */
.source-body {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
}

.source-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
  padding: 14px;
  flex: 1;
  align-self: center;
}

.source-code {
  margin: 0;
  padding: 12px 14px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: var(--hinge-fs-12, 12px);
  line-height: 1.5;
  color: #c9d1d9;
  white-space: pre;
  overflow-x: auto;
  flex: 1;
}

.source-editor {
  width: 100%;
  flex: 1;
  min-height: 150px;
  padding: 12px 14px;
  background: #0d1117;
  color: #c9d1d9;
  border: none;
  border-top: 1px solid #2a2a4a;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: var(--hinge-fs-12, 12px);
  line-height: 1.5;
  resize: none;
  box-sizing: border-box;
}
.source-editor:focus {
  outline: none;
}

.source-save-row {
  padding: 8px 14px;
  border-top: 1px solid #2a2a4a;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.drawer-btn--save-source {
  background: #1f6feb;
  color: #fff;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: var(--hinge-fs-12, 12px);
  font-weight: 600;
  cursor: pointer;
}
.drawer-btn--save-source:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile: full-width drawer */
@media (max-width: 767px) {
  .drawer {
    width: 100vw !important;
  }
  .drawer-resize-handle {
    display: none;
  }
}

/* Resize handle on the right edge */
.drawer-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 5px;
  cursor: ew-resize;
  z-index: 1;
  background: transparent;
  transition: background 0.15s;
  transform: translateX(50%);
}
.drawer-resize-handle:hover,
.drawer-resize-handle--active {
  background: rgba(88, 166, 255, 0.3);
}

/* ── Settings tab ── */
.settings-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--hinge-spacing-md, 8px);
  padding: var(--hinge-spacing-sm, 10px) var(--hinge-spacing-md, 14px);
}
.settings-row {
  display: flex;
  align-items: center;
  gap: var(--hinge-spacing-sm, 8px);
}
.settings-row--full {
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}
.settings-row__label {
  font-size: var(--hinge-fs-12, 12px);
  font-weight: 600;
  color: #bbb;
  white-space: nowrap;
  flex-shrink: 0;
}
.settings-row__control {
  display: flex;
  gap: var(--hinge-spacing-xs, 4px);
}
.settings-btn {
  background: #2a2a4a;
  border: 1px solid transparent;
  color: #888;
  font-size: var(--hinge-fs-11, 11px);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}
.settings-btn:hover {
  color: #e0e0e0;
  border-color: #4a4a6a;
}
.settings-btn--active {
  background: #0d6efd;
  color: #fff;
  border-color: #0d6efd;
}
.settings-row__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.settings-editor {
  width: 100%;
  flex: 1;
  min-height: 120px;
  padding: var(--hinge-spacing-sm, 10px);
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: var(--hinge-fs-12, 12px);
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}
.settings-editor:focus {
  outline: none;
  border-color: #58a6ff;
}
.settings-row__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--hinge-spacing-md, 8px);
}
.drawer-btn--prompt-save {
  background: #1f6feb;
  color: #fff;
}
.drawer-btn--prompt-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.drawer-btn--prompt-reset {
  background: #30363d;
  color: #ccc;
}
.drawer-btn--prompt-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* ── Attachments chips ── */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--hinge-spacing-xs, 4px);
  margin-bottom: var(--hinge-spacing-xs, 4px);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--hinge-spacing-xs, 3px);
  padding: 2px var(--hinge-spacing-sm, 6px);
  border-radius: 10px;
  font-size: var(--hinge-fs-11, 11px);
  font-family: ui-monospace, monospace;
  max-width: 100%;
  overflow: hidden;
}
.chip--component {
  background: #1f3a5f;
  color: #c8d6e5;
  border: 1px solid #2a5a8a;
}
.chip--file {
  background: #2a2a3a;
  color: #b0b0c0;
  border: 1px solid #3a3a5a;
}
.chip__type {
  flex-shrink: 0;
  font-size: var(--hinge-fs-10, 10px);
}
.chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.chip__x {
  flex-shrink: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: var(--hinge-fs-10, 10px);
  opacity: 0.6;
  line-height: 1;
}
.chip__x:hover {
  opacity: 1;
}
</style>
