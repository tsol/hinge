<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import HingeAttach from './HingeAttach.vue'

interface QueueItem {
  name: string
  status: 'wait' | 'done' | 'processing'
  content: string
  component: string
  note: string
  url: string
  dom: string
}

const props = withDefaults(defineProps<{
  compact?: boolean
  refreshKey?: number
  editingFile?: string
}>(), {
  compact: false,
  refreshKey: 0,
  editingFile: '',
})
const emit = defineEmits<{
  'edit-task': [item: { name: string; content: string }]
}>()

const items = ref<QueueItem[]>([])
const loading = ref(false)
const error = ref('')
const expanded = ref<string | null>(null)

// Per-item: editing state
const editingContent = ref<Record<string, string>>({})
const saving = ref<Record<string, boolean>>({})
// Per-item: selection for execution (wait tasks only, default checked)
const selected = ref<Record<string, boolean>>({})
// Processing flags per item
const processingTask = ref<Record<string, boolean>>({})
// Auto-refresh timer
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadItems()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

watch(() => props.refreshKey, () => {
  refreshItems()
})

// Auto-scroll chat textarea when content updates for expanded item
watch(editingContent, (val) => {
  if (expanded.value && val[expanded.value] !== undefined) {
    nextTick(() => scrollChatToBottom(expanded.value!))
  }
}, { deep: true })

function initSelected(fresh: QueueItem[]) {
  const next: Record<string, boolean> = {}
  for (const item of fresh) {
    // Keep existing selection for known items, default true for wait
    if (item.name in selected.value) {
      next[item.name] = selected.value[item.name] && item.status === 'wait'
    } else {
      next[item.name] = item.status === 'wait'
    }
  }
  selected.value = next
}

/** Get names of all selected wait tasks (processing excluded) */
function getSelectedTasks(): string[] {
  return items.value
    .filter(i => i.status === 'wait' && selected.value[i.name])
    .map(i => i.name)
}

function toggleSelected(name: string) {
  selected.value = { ...selected.value, [name]: !selected.value[name] }
}

defineExpose({ getSelectedTasks })

/** Silent refresh: keeps current loading state, no flicker */
async function refreshItems() {
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) return
    const fresh: QueueItem[] = await res.json()
    // Track which tasks were processing before this refresh
    const wasProcessing = new Set(
      items.value.filter(i => i.status === 'processing').map(i => i.name)
    )
    for (const item of fresh) {
      // Preserve unsaved edits only for tasks that were NOT processing
      // (processing tasks get fresh content from server — agent appended response)
      if (item.name in editingContent.value && !wasProcessing.has(item.name)) {
        ;(item as any).content = editingContent.value[item.name]
      } else {
        // Update editing content with fresh server data (e.g. agent reply)
        editingContent.value = { ...editingContent.value, [item.name]: item.content }
      }
    }
    items.value = fresh
    initSelected(fresh)
    // Update processing flags: any task still _processing = agent running
    const next: Record<string, boolean> = {}
    for (const item of fresh) {
      if (item.status === 'processing') next[item.name] = true
    }
    processingTask.value = next
  } catch { /* silent */ }
}

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const fresh: QueueItem[] = await res.json()
    // Preserve unsaved editing content for existing items
    for (const item of fresh) {
      if (item.name in editingContent.value) {
        ;(item as any).content = editingContent.value[item.name]
      }
    }
    items.value = fresh
    initSelected(fresh)
  } catch (e: any) {
    error.value = e.message || 'Failed to load queue'
  } finally {
    loading.value = false
  }
}

function remove(name: string) {
  fetch(`/api/queue?file=${encodeURIComponent(name)}`, { method: 'DELETE' })
    .then(() => {
      if (expanded.value === name) expanded.value = null
      stopOutputPoll(name)
      refreshItems()
    })
}

async function setStatus(name: string, status: string) {
  await fetch('/api/queue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: name, status }),
  })
  refreshItems()
}

function statusIcon(status: string) {
  if (status === 'done') return '✅'
  if (status === 'processing') return '🔴'
  return '⏳'
}

/** Extract header title: first ### Component: or ### File: value */
function headerTitle(content: string): string {
  const comp = content.match(/^### Component: (.+)/m)
  if (comp) return comp[1]
  const file = content.match(/^### File: (.+)/m)
  if (file) return file[1]
  const page = content.match(/^### Page: (.+)/m)
  if (page) return page[1]
  return 'untitled'
}

/** Extract first 200 chars of meaningful text from all sections */
function headerSubtitle(content: string): string {
  // Strip all ### lines and field lines
  const clean = content
    .replace(/^### .+/gm, '')
    .replace(/^[A-Za-z]\w+: .+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
  if (!clean) return ''
  return clean.slice(0, 200).replace(/\s+/g, ' ').trim()
}

function timeLabel(name: string) {
  // Folder name format: 2026-06-27T20-28-43_403Z_wait
  const stem = name.replace(/(_wait|_done|_processing)$/, '')
  const parts = stem.split('_')
  const ts = parts[0] // "2026-06-27T20-28-43"
  const [datePart, timePart] = ts.split('T')
  const time = (timePart || '').replace(/-/g, ':')
  return `${datePart} ${time}`
}

// ── Auto-refresh (every 2s while processing items exist) ──
function startAutoRefresh() {
  autoRefreshTimer = setInterval(() => {
    // Only refresh if there are processing tasks (silent, no flicker)
    if (Object.keys(processingTask.value).length > 0) {
      refreshItems()
    }
  }, 2000)
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

// ── Expand / Collapse ──
async function expandItem(name: string) {
  if (expanded.value === name) {
    expanded.value = null
    return
  }
  expanded.value = name

  const item = items.value.find(i => i.name === name)
  if (!item) return
  // Initialize editor with the full chat content
  if (!(name in editingContent.value)) {
    editingContent.value = { ...editingContent.value, [name]: item.content }
  }
  // Auto-scroll textarea to bottom (latest messages)
  await nextTick()
  scrollChatToBottom(name)
}

/** Scroll the chat textarea to the bottom */
function scrollChatToBottom(name: string) {
  const el = document.querySelector<HTMLTextAreaElement>(
    `[data-chat-id="${name}"]`
  )
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

/** Execute a single task — marks as _processing, POSTs /api/execute */
async function executeSingle(name: string) {
  if (processingTask.value[name]) return // already running
  // Mark as processing
  await fetch('/api/queue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: name, status: 'processing' }),
  })
  // Fire agent
  await fetch('/api/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  refreshItems()
}

async function saveFile(name: string) {
  const content = editingContent.value[name]
  if (content === undefined) return
  saving.value = { ...saving.value, [name]: true }
  try {
    // Write back to .hinge/<name>/input.md
    await fetch('/api/write-file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `.hinge/${name}/input.md`, content }),
    })
  } catch { /* ignore */ }
  saving.value = { ...saving.value, [name]: false }
}
</script>

<template>
  <div class="tab-content">
    <div v-if="!compact" class="tab-header">Tasks <span class="tab-count">{{ items.length }}</span></div>

    <div v-if="loading" class="drawer-body"><p class="drawer-muted">Loading…</p></div>
    <div v-else-if="error" class="drawer-body"><p class="drawer-error">{{ error }}</p></div>
    <div v-else-if="items.length === 0" class="drawer-body"><p class="drawer-muted">Queue is empty</p></div>

    <div v-else class="drawer-body drawer-body--scroll" :class="{ 'compact-scroll': compact }">
      <div
        v-for="item in items"
        :key="item.name"
        class="qr-card"
        :class="{ 'qr-card--done': item.status === 'done', 'qr-card--processing': item.status === 'processing', 'qr-card--expanded': expanded === item.name, 'qr-card--editing': props.editingFile === item.name }"
      >
        <div class="qr-card__header" @click="expandItem(item.name)">
          <span
            v-if="item.status === 'wait'"
            class="qr-card__select"
            :class="{ 'qr-card__select--on': selected[item.name] }"
            @click.stop="item.status === 'wait' && toggleSelected(item.name)"
          >{{ selected[item.name] ? '☑' : '☐' }}</span>
          <span class="qr-card__icon">{{ statusIcon(item.status) }}</span>
          <div class="qr-card__text">
            <span class="qr-card__title">{{ headerTitle(item.content) }}</span>
            <span v-if="headerSubtitle(item.content)" class="qr-card__subtitle">{{ headerSubtitle(item.content) }}</span>
          </div>
          <span class="qr-card__time">{{ timeLabel(item.name) }}</span>
          <span v-if="item.status === 'processing'" class="qr-card__pulse">●</span>
          <span class="qr-card__chevron">{{ expanded === item.name ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expanded === item.name" class="qr-card__body">
          <textarea
            v-if="item.status !== 'processing'"
            class="qr-card__editor"
            :value="editingContent[item.name]"
            @input="editingContent[item.name] = ($event.target as HTMLTextAreaElement).value"
            :data-chat-id="item.name"
            spellcheck="false"
          ></textarea>
          <textarea
            v-else
            class="qr-card__editor qr-card__editor--locked"
            :value="editingContent[item.name]"
            readonly
            :data-chat-id="item.name"
            spellcheck="false"
          ></textarea>

          <!-- Chat is shown in the textarea above — no separate output section -->

          <!-- Actions row -->
          <div v-if="processingTask[item.name]" class="qr-card__processing-bar">
            <span class="qr-card__processing-text">🔄 Processing…</span>
          </div>
          <div v-else class="qr-card__save-row">
            <button class="qr-btn qr-btn--delete" @click.stop="remove(item.name)" title="Delete">✕</button>
            <select class="qr-btn qr-btn--status-select" :value="item.status" @change.stop="setStatus(item.name, ($event.target as HTMLSelectElement).value)">
              <option value="wait">⏳ Wait</option>
              <option value="done">✅ Done</option>
            </select>
            <HingeAttach :folder="item.name" />
            <span class="qr-card__save-spacer"></span>
            <button
              class="qr-btn qr-btn--save"
              :disabled="saving[item.name]"
              @click.stop="saveFile(item.name)"
            >
              {{ saving[item.name] ? 'Saving…' : 'Сохранить' }}
            </button>
            <button
              class="qr-btn qr-btn--run"
              @click.stop="executeSingle(item.name)"
            title="Run Agent">▶</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.tab-header {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tab-count {
  background: #2a2a4a;
  color: #ccc;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
}
.drawer-body {
  padding: 8px;
  flex: 1;
}
.drawer-body--scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.compact-scroll {
  padding: 0 !important;
}
.drawer-muted { color: #666; font-style: italic; padding: 14px; }
.drawer-error { color: #f85149; padding: 14px; }

.qr-card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  margin-bottom: 6px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.qr-card--done {
  opacity: 0.6;
}
.qr-card--processing {
  border-color: #da3633;
  animation: qr-pulse-border 2s ease-in-out infinite;
}
@keyframes qr-pulse-border {
  0%, 100% { border-color: #da3633; }
  50% { border-color: #ff6b6b; }
}
.qr-card--expanded {
  border-color: #58a6ff;
  opacity: 1;
}
.qr-card--editing {
  border-color: #d29922 !important;
  box-shadow: 0 0 0 1px #d29922;
  opacity: 1;
}
.qr-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}
.qr-card__header:hover {
  background: rgba(88, 166, 255, 0.08);
}
.qr-card__icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}
.qr-card__pulse {
  font-size: 10px;
  color: #da3633;
  animation: qr-blink 1s ease-in-out infinite;
  flex-shrink: 0;
  width: 10px;
  text-align: center;
}
@keyframes qr-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
.qr-card__text {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.qr-card__title {
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qr-card__subtitle {
  font-size: 10px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
}
.qr-card__time {
  font-size: 10px;
  color: #666;
  font-family: ui-monospace, monospace;
  flex-shrink: 0;
}
.qr-card__chevron {
  font-size: 9px;
  color: #888;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}
.qr-card__body {
  padding: 0 10px 10px;
  border-top: 1px solid #2a2a4a;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.qr-card__file-path {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 10px;
  color: #666;
  padding: 6px 0 2px;
}
.qr-card__file-path--err {
  color: #f85149;
}
.qr-card__editor {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  resize: vertical;
  box-sizing: border-box;
}
.qr-card__editor:focus {
  outline: none;
  border-color: #58a6ff;
}
.qr-card__editor--locked {
  opacity: 0.65;
  color: #888;
  resize: none;
  cursor: not-allowed;
}
.qr-card__editor--locked:focus {
  outline: none;
  border-color: #2a2a4a;
}
.qr-card__save-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.qr-card__save-spacer {
  flex: 1;
}
.qr-btn--status-select {
  background: #1a1a3a;
  color: #c9d1d9;
  border: 1px solid #2a2a4a;
  padding: 4px 6px;
  font-size: 11px;
  border-radius: 4px;
  cursor: pointer;
}
.qr-btn--save {
  background: #1f6feb;
  color: #fff;
}
.qr-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.qr-btn:hover { opacity: 0.8; }
.qr-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.qr-btn--delete { background: transparent; color: #f85149; border: 1px solid #f85149; }
.qr-btn--run { background: #238636; color: #fff; padding: 5px 12px; }

/* Agent output */
.qr-card__select {
  width: 14px;
  text-align: center;
  font-size: 11px;
  flex-shrink: 0;
  cursor: pointer;
  color: #555;
  transition: color 0.12s;
  margin-right: 2px;
}
.qr-card__select:hover {
  color: #58a6ff;
}
.qr-card__select--on {
  color: #58a6ff;
}

/* Agent output */
.qr-card__output {
  border-top: 1px solid #1f6feb33;
  padding-top: 8px;
}
.qr-card__output-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #58a6ff;
  margin-bottom: 6px;
}
.qr-card__output-text {
  margin: 0;
  padding: 8px 10px;
  background: #0d1117;
  border: 1px solid #2a2a4a;
  border-radius: 4px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #c9d1d9;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}
.qr-card__output-text--live {
  border-color: #da3633;
  max-height: 320px;
}
.qr-card__output-loading {
  font-size: 11px;
  color: #666;
  font-style: italic;
  padding: 6px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.qr-card__output-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #da3633;
  border-top-color: transparent;
  border-radius: 50%;
  animation: qr-spin 0.8s linear infinite;
}
@keyframes qr-spin {
  to { transform: rotate(360deg); }
}
.qr-card__output-empty {
  font-size: 11px;
  color: #666;
  font-style: italic;
  margin: 0;
  padding: 6px 0;
}

.qr-card__processing-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: rgba(218, 54, 51, 0.08);
  border-radius: 4px;
}
.qr-card__processing-text {
  font-size: 11px;
  color: #ff6b6b;
  font-weight: 600;
}
</style>
