<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { HingeTarget } from '../types/target'
import type { TaskModel } from '../composables/useTaskModel'
import { useFileTree, type FileEntry } from '../composables/useFileTree'
import { useFileSource } from '../composables/useFileSource'
import { useSelectionStore } from '../composables/useSelectionStore'
import { syncHighlights } from '../composables/useElementHighlights'
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
  target: HingeTarget
  modelValue: string
  model: TaskModel
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  send: [onSuccess?: () => void]
  close: []
}>()

const { selection, fromFile } = useSelectionStore()

const note = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const activeTab = ref<'input' | 'files' | 'source'>('input')

const fileMentioned = ref(false)

watch(
  () => [selection.filePath, props.model.files.value.map(s => s.value)],
  ([path, files]) => {
    fileMentioned.value = !!path && files.includes(path as string)
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
const editingNoteRef = ref('')
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
      const res = await fetch(`/api/log?file=${encodeURIComponent(folder)}`)
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

// Drawer resizable width
const STORAGE_KEY = 'hinge-drawer-width'
const DEFAULT_WIDTH = 380
const drawerWidth = ref(DEFAULT_WIDTH)
const resizing = ref(false)
const drawerRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const w = parseInt(saved, 10)
    if (w >= 260 && w <= 800) drawerWidth.value = w
  }
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
    localStorage.setItem(STORAGE_KEY, String(drawerWidth.value))
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
    // Save edit — increment key after PATCH completes
    fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: editingFile.value, content: note.value }),
    }).then(() => {
      editingFile.value = ''
      editingNoteRef.value = ''
      queueRefreshKey.value++
    })
  } else {
    // Delegate to parent (Hinge.vue sends the POST).
    // Key increment happens via onSuccess callback after POST completes.
    emit('send', () => queueRefreshKey.value++)
  }
}

function onEditTask(item: { name: string; content: string }) {
  editingFile.value = item.name
  editingNoteRef.value = item.content
  note.value = item.content
}

// Execute agent — marks tasks as _wait, agent picks them up
async function onExecute() {
  const selected = queueRef.value?.getSelectedTasks() ?? []
  if (selected.length === 0) return
  // Mark selected tasks as wait (queue will pick them up)
  for (const name of selected) {
    await fetch('/api/queue', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: name, status: 'wait' }),
    })
  }
  queueRefreshKey.value++
}

// Load root files on mount when switching to files tab
const tabs = [
  { id: 'input' as const, label: 'Input' },
  { id: 'files' as const, label: 'Files' },
  { id: 'source' as const, label: 'Source' },
]

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
  const ext = path.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    vue: 'html', html: 'html', htm: 'html', svg: 'xml',
    css: 'css', scss: 'scss', sass: 'scss', less: 'scss',
    json: 'json', jsonc: 'json',
    md: 'markdown', mdx: 'markdown',
    yaml: 'yaml', yml: 'yaml',
    sh: 'bash', bash: 'bash', zsh: 'bash',
  }
  const lang = langMap[ext ?? ''] || ''
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

// Voice recording
const noteTextareaRef = ref<HTMLTextAreaElement | null>(null)
const recording = ref(false)
const transcribing = ref(false)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

function startRecording() {
  if (recording.value) return
  audioChunks = []
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data) }
    mediaRecorder.onstop = async () => {
      // Stop all tracks
      stream.getTracks().forEach(t => t.stop())
      if (audioChunks.length === 0) return
      transcribing.value = true
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      try {
        const res = await fetch('/api/transcribe', { method: 'POST', body: blob })
        const { text, error: err } = await res.json()
        if (err) throw new Error(err)
        if (text && noteTextareaRef.value) {
          note.value = (note.value ? note.value + '\n' : '') + text + '\n'
          autoResizeTextarea()
        }
      } catch { /* silent */ }
      transcribing.value = false
      audioChunks = []
    }
    mediaRecorder.start()
    recording.value = true
  }).catch(() => { /* no mic permission */ })
}

function stopRecording() {
  if (!recording.value || !mediaRecorder) return
  recording.value = false
  mediaRecorder.stop()
  mediaRecorder = null
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

// Source edit mode
const sourceEditMode = ref(false)
const sourceEditingContent = ref('')
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
    await fetch('/api/write-file', {
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

// When source file changes externally → exit edit mode and reset
watch([activeTab, () => selection.filePath], async ([tab, file]) => {
  // Exit edit mode if file changed
  if (sourceEditMode.value) {
    sourceEditMode.value = false
  }
  if (tab !== 'source' || !file) return
  if (!fileSrc.loading.value && fileSrc.path.value === file) return // already loaded
  await fileSrc.loadFile(file)
})

// When selection.filePath changes (from gear) → expand tree to that file
watch(() => selection.filePath, (filePath) => {
  if (filePath) {
    fileTree.expandToPath(filePath)
  }
}, { immediate: true })

// When textarea changes → sync DOM highlights with current components + auto-resize
watch(() => note.value, () => {
  const active = props.model.components.value.map(s => s.value)
  syncHighlights(active)
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
    treePollTimer.value = setInterval(() => {
      fileTree.refreshProcessingFolders()
      // Also refresh root if expanded (new files may appear)
      if (fileTree.root.value.length > 0) {
        fileTree.refreshRoot()
      }
    }, 5000)
  }
})

onUnmounted(() => {
  stopLogPoll()
  if (treePollTimer.value) clearInterval(treePollTimer.value)
})

// ─── Prompt settings ─────────────────────
const promptModal = ref(false)
const promptText = ref('')
const promptLoading = ref(false)
const promptSaving = ref(false)

async function loadPrompt() {
  promptLoading.value = true
  try {
    const res = await fetch('/api/prompt')
    promptText.value = await res.text()
  } catch {
    promptText.value = 'Failed to load prompt'
  }
  promptLoading.value = false
}

async function savePrompt() {
  promptSaving.value = true
  try {
    await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: promptText.value }),
    })
    promptModal.value = false
  } catch { /* ignore */ }
  promptSaving.value = false
}

async function resetPrompt() {
  promptSaving.value = true
  try {
    await fetch('/api/prompt', { method: 'DELETE' })
    await loadPrompt()
  } catch { /* ignore */ }
  promptSaving.value = false
}

function openPromptModal() {
  loadPrompt()
  promptModal.value = true
}
</script>

<template>
  <Teleport to="body">
    <div class="hinge-panel-wrapper">

      <div ref="drawerRef" class="drawer" :style="{ width: drawerWidth + 'px' }">
        <!-- Tabs -->
        <div class="drawer-tabs">
          <button class="drawer-settings" @click="openPromptModal" title="System prompt">⚙</button>
          <button
            v-for="t in tabs"
            :key="t.id"
            class="drawer-tab"
            :class="{ 'drawer-tab--active': activeTab === t.id }"
            @click="switchTab(t.id)"
          >
            {{ t.label }}
          </button>
          <button class="drawer-close" @click="emit('close')" title="Закрыть">✕</button>
        </div>

        <!-- Tab: Input -->
        <div v-if="activeTab === 'input'" class="tab-content">
          <div class="input-scroll">
            <textarea
              ref="noteTextareaRef"
              class="drawer-textarea"
              :value="note"
              @input="onNoteInput"
              placeholder="Заметка / описание..."
            ></textarea>

            <div class="input-actions">
              <button
                class="mic-btn"
                :class="{
                  'mic-btn--recording': recording,
                  'mic-btn--transcribing': transcribing
                }"
                :disabled="transcribing"
                @pointerdown.prevent="!transcribing && startRecording()"
                @pointerup.prevent="stopRecording"
                @pointerleave="recording && stopRecording()"
                :title="recording ? 'Отпустите для отправки' : transcribing ? 'Транскрибация...' : 'Записать голос'"
                >
                {{ recording ? '🔴' : transcribing ? '⏳' : '🎤' }}
              </button>
              <HingeAttach v-if="editingFile" :folder="editingFile" />
              <button
                class="drawer-btn drawer-btn--add"
                :disabled="!note.trim()"
                @click="onAdd"
              >
                {{ editingFile ? 'Сохранить' : 'Добавить' }}
              </button>
              <button
                v-if="editingFile"
                class="drawer-btn drawer-btn--cancel"
                @click="editingFile = ''; editingNoteRef = ''"
              >
                ✕
              </button>
            </div>

            <HingeTabQueue
              ref="queueRef"
              compact
              :refresh-key="queueRefreshKey"
              :editing-file="editingFile"
              @edit-task="onEditTask"
            />

            <div class="queue-footer">
              <button
                class="drawer-btn drawer-btn--exec"
                @click="onExecute"
              >Выполнить</button>
            </div>
          </div>
        </div>

        <!-- Tab: Files -->
        <div v-if="activeTab === 'files'" class="tab-content">
          <div class="tab-header">Project Files</div>

          <div v-if="fileTree.loading.value" class="drawer-body">
            <p class="drawer-muted">Loading…</p>
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
            <span v-else class="tab-header__file tab-header__file--muted">No file selected</span>
            <button
              v-if="filePathParts.file"
              class="source-edit-toggle"
              :class="{ 'source-edit-toggle--active': sourceEditMode }"
              @click="toggleSourceEdit"
              :title="sourceEditMode ? 'Просмотр' : 'Редактировать'"
            >{{ sourceEditMode ? '👁' : '✎' }}</button>
            <button
              v-if="filePathParts.file"
              class="source-mention-btn"
              :class="{ 'source-mention-btn--active': fileMentioned }"
              @click="mentionFile"
              title="Вставить путь к файлу в заметку"
            >@</button>
          </div>

          <div v-if="fileSrc.loading.value" class="drawer-body">
            <p class="drawer-muted">Loading…</p>
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
            <img v-else-if="isImage" :src="`/api/raw-file?path=${encodeURIComponent(selection.filePath)}`" class="source-image" />
            <pre v-else class="source-code" v-html="highlightedCode"></pre>
            <div v-if="sourceEditMode" class="source-save-row">
              <button
                class="drawer-btn drawer-btn--save-source"
                :disabled="sourceSaving"
                @click="saveSourceFile"
              >{{ sourceSaving ? 'Saving…' : 'Сохранить' }}</button>
            </div>
          </div>
        </div>
        <div
          class="drawer-resize-handle"
          :class="{ 'drawer-resize-handle--active': resizing }"
          @pointerdown="startResize"
        ></div>
      </div>

      <!-- Prompt settings modal -->
      <div v-if="promptModal" class="prompt-overlay" @click.self="promptModal = false">
        <div class="prompt-modal">
          <div class="prompt-modal__header">
            <span>System Prompt</span>
            <button class="drawer-close" @click="promptModal = false">✕</button>
          </div>
          <div class="prompt-modal__body" v-if="promptLoading">
            <p class="drawer-muted">Loading…</p>
          </div>
          <div class="prompt-modal__body" v-else>
            <textarea
              class="prompt-editor"
              :value="promptText"
              @input="promptText = ($event.target as HTMLTextAreaElement).value"
              spellcheck="false"
            ></textarea>
          </div>
          <div class="prompt-modal__footer">
            <button class="drawer-btn drawer-btn--prompt-reset" @click="resetPrompt" :disabled="promptSaving">
              {{ promptSaving ? '…' : 'Сброс' }}
            </button>
            <button class="drawer-btn drawer-btn--prompt-save" @click="savePrompt" :disabled="promptSaving || promptLoading">
              {{ promptSaving ? '…' : 'Сохранить' }}
            </button>
          </div>
        </div>
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
  font-size: 13px;
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
  font-size: 16px;
  cursor: pointer;
  padding: 10px 12px;
  line-height: 1;
  transition: color 0.15s;
  flex-shrink: 0;
}
.drawer-close:hover {
  color: #f85149;
}

.drawer-tab {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 12px;
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
  font-size: 11px;
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
  font-size: 14px;
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
  font-size: 14px;
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
  font-size: 11px;
  font-weight: 500;
}

.tab-header__file {
  overflow: hidden;
  white-space: nowrap;
  color: #e0e0e0;
  font-weight: 700;
  font-size: 12px;
}

.tab-header__file--muted {
  color: #666;
  font-weight: 500;
  font-size: 11px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* Voice mic button */
.mic-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #30363d;
  cursor: pointer;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
  line-height: 1;
  flex-shrink: 0;
}
.mic-btn:hover {
  background: #484f58;
}
.mic-btn:active {
  transform: scale(0.92);
}
.mic-btn--recording {
  background: #da3633 !important;
  animation: mic-pulse 0.6s ease-in-out infinite;
}
.mic-btn--transcribing {
  background: #1f6feb !important;
  animation: mic-spin 0.8s linear infinite;
  cursor: default;
  opacity: 0.7;
}
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(218, 54, 51, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(218, 54, 51, 0); }
}
@keyframes mic-spin {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
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

.drawer-textarea {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  background: #16162a;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 13px;
  min-height: 60px;
  box-sizing: border-box;
  white-space: pre !important;
  overflow: auto !important;
}

.drawer-textarea:focus {
  outline: none;
  border-color: #58a6ff;
}

.input-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
  padding: 8px 12px;
}

.queue-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.drawer-btn--exec {
  background: #1f6feb;
  color: #fff;
}

.drawer-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
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
  font-size: 11px;
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
  gap: 4px;
  padding: 3px 14px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 13px;
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
  width: 12px;
  text-align: center;
  font-size: 9px;
  color: #888;
  flex-shrink: 0;
}

.file-toggle--spacer {
  visibility: hidden;
}

.file-icon {
  font-size: 13px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #c9d1d9;
}

.file-check {
  width: 14px;
  text-align: center;
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
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

/* Execute result banner */
.exec-result {
  margin: 8px 14px 14px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #0d2818;
  border: 1px solid #238636;
  position: relative;
  max-height: 200px;
  overflow-y: auto;
}
.exec-result--err {
  background: #2d0f0f;
  border-color: #da3633;
}
.exec-result__close {
  position: sticky;
  top: 0;
  float: right;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
.exec-result__text {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  font-family: ui-monospace, 'SF Mono', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #e0e0e0;
}

/* Settings gear button */
.drawer-settings {
  background: transparent;
  border: none;
  color: #666;
  font-size: 15px;
  cursor: pointer;
  padding: 10px 8px;
  line-height: 1;
  transition: color 0.15s;
  flex-shrink: 0;
}
.drawer-settings:hover {
  color: #ccc;
}

/* Prompt modal overlay */
.prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200000;
}
.prompt-modal {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  width: min(90vw, 600px);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.prompt-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4a;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}
.prompt-modal__body {
  flex: 1;
  overflow: hidden;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
}
.prompt-editor {
  width: 100%;
  flex: 1;
  min-height: 200px;
  padding: 10px;
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}
.prompt-editor:focus {
  outline: none;
  border-color: #58a6ff;
}
.prompt-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #2a2a4a;
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
</style>
