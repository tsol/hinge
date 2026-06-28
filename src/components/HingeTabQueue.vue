<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import HingeAttach from './HingeAttach.vue'

interface QueueItem {
  name: string
  status: 'wait' | 'done'
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

onMounted(() => loadItems())

watch(() => props.refreshKey, () => {
  loadItems()
})

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    items.value = await res.json()
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
      loadItems()
    })
}

async function setStatus(name: string, status: string) {
  await fetch('/api/queue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: name, status }),
  })
  loadItems()
}

function statusIcon(status: string) {
  return status === 'done' ? '✅' : '⏳'
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
  const stem = name.replace(/(_wait|_done)$/, '')
  const parts = stem.split('_')
  const ts = parts[0] // "2026-06-27T20-28-43"
  const [datePart, timePart] = ts.split('T')
  const time = (timePart || '').replace(/-/g, ':')
  return `${datePart} ${time}`
}

async function expandItem(name: string) {
  if (expanded.value === name) {
    expanded.value = null
    return
  }
  expanded.value = name
  const item = items.value.find(i => i.name === name)
  if (!item) return
  // Initialize editor with the current markdown content
  if (!(name in editingContent.value)) {
    editingContent.value = { ...editingContent.value, [name]: item.content }
  }
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
        :class="{ 'qr-card--done': item.status === 'done', 'qr-card--expanded': expanded === item.name, 'qr-card--editing': props.editingFile === item.name }"
      >
        <div class="qr-card__header" @click="expandItem(item.name)">
          <span class="qr-card__icon">{{ statusIcon(item.status) }}</span>
          <div class="qr-card__text">
            <span class="qr-card__title">{{ headerTitle(item.content) }}</span>
            <span v-if="headerSubtitle(item.content)" class="qr-card__subtitle">{{ headerSubtitle(item.content) }}</span>
          </div>
          <span class="qr-card__time">{{ timeLabel(item.name) }}</span>
          <span class="qr-card__chevron">{{ expanded === item.name ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expanded === item.name" class="qr-card__body">
          <textarea
            class="qr-card__editor"
            :value="editingContent[item.name]"
            @input="editingContent[item.name] = ($event.target as HTMLTextAreaElement).value"
            spellcheck="false"
          ></textarea>
          <div class="qr-card__save-row">
            <button class="qr-btn qr-btn--delete" @click.stop="remove(item.name)" title="Delete">✕</button>
            <select class="qr-btn qr-btn--status-select" :value="item.status" @change.stop="setStatus(item.name, ($event.target as HTMLSelectElement).value)">
              <option value="wait">⏳ Wait</option>
              <option value="done">✅ Done</option>
            </select>
            <HingeAttach :folder="item.name" />
            <button class="qr-btn qr-btn--edit-task" @click.stop="emit('edit-task', { name: item.name, content: item.content })" title="Edit">✎</button>
            <span class="qr-card__save-spacer"></span>
            <button
              class="qr-btn qr-btn--save"
              :disabled="saving[item.name]"
              @click.stop="saveFile(item.name)"
            >
              {{ saving[item.name] ? 'Saving…' : 'Сохранить' }}
            </button>
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
.qr-btn--delete { background: transparent; color: #f85149; border: 1px solid #f85149; }
.qr-btn--edit-task { background: transparent; color: #58a6ff; border: 1px solid #58a6ff; font-size: 12px; padding: 4px 8px; }
</style>
