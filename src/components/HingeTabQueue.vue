<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface QueueItem {
  name: string
  status: 'wait' | 'done'
  content: string
  component: string
  note: string
  url: string
  dom: string
}

const emit = defineEmits<{
  'edit-task': [item: QueueItem]
}>()

const props = withDefaults(defineProps<{
  compact?: boolean
  refreshKey?: number
  editingFile?: string
}>(), {
  compact: false,
  refreshKey: 0,
  editingFile: '',
})

const items = ref<QueueItem[]>([])
const loading = ref(false)
const error = ref('')
const expanded = ref<string | null>(null)

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

function toggle(name: string) {
  fetch('/api/queue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: name }),
  }).then(() => loadItems())
}

function remove(name: string) {
  fetch(`/api/queue?file=${encodeURIComponent(name)}`, { method: 'DELETE' })
    .then(() => {
      if (expanded.value === name) expanded.value = null
      loadItems()
    })
}

function statusIcon(status: string) {
  return status === 'done' ? '✅' : '⏳'
}

function timeLabel(name: string) {
  // 2026-06-27T16-11-30_491Z_wait.md
  const parts = name.replace(/(_wait|_done)\.md$/, '').split('_')
  const ts = parts[0].replace(/T/, ' ').replace(/-/g, ':').replace(/:(\d+):(\d+)/, (_, h, m) => `${h}:${m}`)
  return ts.replace(/-/g, '.')
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
        <div class="qr-card__header" @click="expanded = expanded === item.name ? null : item.name">
          <span class="qr-card__icon">{{ statusIcon(item.status) }}</span>
          <span class="qr-card__comp">{{ item.component }}</span>
          <span class="qr-card__time">{{ timeLabel(item.name) }}</span>
          <span class="qr-card__chevron">{{ expanded === item.name ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expanded === item.name" class="qr-card__body">
          <div class="qr-card__note" v-if="item.note">{{ item.note }}</div>
          <div class="qr-card__meta">
            <span v-if="item.dom"><strong>DOM:</strong> {{ item.dom }}</span>
            <span v-if="item.url"><strong>URL:</strong> {{ item.url }}</span>
          </div>
          <pre class="qr-card__content">{{ item.content }}</pre>

          <div class="qr-card__actions">
            <button class="qr-btn qr-btn--edit" @click.stop="emit('edit-task', item)">✎ Edit</button>
            <button class="qr-btn" :class="item.status === 'done' ? 'qr-btn--wait' : 'qr-btn--done'" @click.stop="toggle(item.name)">
              {{ item.status === 'done' ? '↩ Wait' : '✓ Done' }}
            </button>
            <button class="qr-btn qr-btn--delete" @click.stop="remove(item.name)">✕ Delete</button>
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
.qr-card__comp {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #c9d1d9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}
.qr-card__note {
  font-size: 13px;
  color: #e0e0e0;
  padding: 8px 0 4px;
}
.qr-card__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #888;
  padding-bottom: 6px;
}
.qr-card__content {
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 11px;
  color: #888;
  background: #0d1117;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  margin: 0 0 8px;
}
.qr-card__actions {
  display: flex;
  gap: 6px;
}
.qr-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.12s;
}
.qr-btn:hover { opacity: 0.8; }
.qr-btn--done { background: #238636; color: #fff; }
.qr-btn--wait { background: #30363d; color: #ccc; }
.qr-btn--edit { background: #1f6feb; color: #fff; }
.qr-btn--delete { background: transparent; color: #f85149; border: 1px solid #f85149; }
</style>
