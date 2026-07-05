<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick, computed } from 'vue'
import HingeAttach from './HingeAttach.vue'
import { hydrateDrafts, clearDraft } from '../composables/useTaskDraft'
import { useI18n } from '../composables/useI18n'
import { shortenOutput } from '../utils/shortenOutput'

type ExecMode = 'execute' | 'stop' | 'delete'

interface QueueItem {
  name: string
  status: 'new' | 'wait' | 'done' | 'processing' | 'error'
  content: string
  component: string
  note: string
  url: string
  dom: string
  failed?: boolean
  agentStatus?: { status: string; pid?: number; elapsed?: number } | null
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const props = withDefaults(defineProps<{
  compact?: boolean
  refreshKey?: number
  editingFile?: string
  execMode?: ExecMode
}>(), {
  compact: false,
  refreshKey: 0,
  editingFile: '',
  execMode: 'execute',
})
const { t: lang } = useI18n()
const items = ref<QueueItem[]>([])
const loading = ref(false)
const error = ref('')

// Use stem (name without status suffix) for expanded tracking — survives status changes
const expandedStem = ref<string | null>(null)
const EXPANDED_STORAGE_KEY = 'hinge:tabqueue:expanded'

/** Derive stem from folder name */
function stem(name: string): string {
  return name.replace(/_(new|wait|done|processing)$/, '')
}

// Per-stem: editing state — keyed by stem (no status suffix) so content
// survives status transitions (_wait→_processing→_done) without migration.
const editingContent = ref<Record<string, string>>({})
const saving = ref<Record<string, boolean>>({})
// Per-item: selection for execution (wait tasks only, default checked)
const selected = ref<Record<string, boolean>>({})
// Processing flags per item
const processingTask = ref<Record<string, boolean>>({})
// Per-item: agent status {status, checkedAt}
const agentStatus = ref<Record<string, { status: string; checkedAt: number; elapsed?: number }>>({})
// Per-item: chat input (new message)
const chatInputs = ref<Record<string, string>>({})
// Auto-refresh timer
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null
/** Track expanded item content across poll cycles — only scroll when content changes */
const prevExpandedContent = new Map<string, string>()

/** True when at least one task is processing */
const hasProcessing = computed(() => Object.keys(processingTask.value).length > 0)

/** Returns true if this status should show a checkbox in the current exec mode */
function modeStatusCheck(status: string): boolean {
  if (props.execMode === 'stop') return status === 'wait' || status === 'processing'
  if (props.execMode === 'delete') return status === 'new' || status === 'done' || status === 'error'
  return status === 'new' || status === 'wait' // execute mode
}

/** Parse chat content into structured messages */
function parseMessages(content: string): ChatMessage[] {
  const result: ChatMessage[] = []

  // Check if there are any **User:** or **Assistant:** markers
  const hasMarkers = /\*\*User:\*\*|\*\*Assistant:\*\*/.test(content)

  if (!hasMarkers) {
    // Legacy format — entire content is the initial user message
    if (content.trim()) {
      result.push({ role: 'user', content: content.trim() })
    }
    return result
  }

  // Split on --- section markers
  const sections = content.split(/\n---\n/)
  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue

    // Check for User marker
    const userMatch = trimmed.match(/^\*\*User:\*\*\n([\s\S]*)/)
    if (userMatch) {
      result.push({ role: 'user', content: userMatch[1].trim() })
      continue
    }

    // Check for Assistant marker
    const asstMatch = trimmed.match(/^\*\*Assistant:\*\*\n([\s\S]*)/)
    if (asstMatch) {
      result.push({ role: 'assistant', content: asstMatch[1].trim() })
      continue
    }

    // Unmarked section — treat as user message (initial prompt)
    if (result.length === 0 && trimmed) {
      result.push({ role: 'user', content: trimmed })
    }
  }

  return result
}

/** Parse messages for the expanded item */
const expandedMessages = computed(() => {
  const name = expandedStem.value
  if (!name) return []
  // Find the item by stem
  const item = items.value.find(i => stem(i.name) === name)
  if (!item) return []
  const content = editingContent.value[name] || '' // name is already expandedStem
  return parseMessages(content)
})

onMounted(async () => {
  await loadItems()
  startAutoRefresh()
  // Restore accordion expanded state from localStorage
  try {
    const saved = localStorage.getItem(EXPANDED_STORAGE_KEY)
    if (saved) {
      expandedStem.value = saved
      // Seed content tracker with whatever is loaded for this stem
      const existing = editingContent.value[saved]
      if (existing) prevExpandedContent.set(saved, existing)
      scrollChatToBottom()
    }
  } catch { /* silent */ }
})

onUnmounted(() => {
  stopAutoRefresh()
})

watch(() => props.refreshKey, () => {
  refreshItems()
})

// NO auto-scroll on every message change — only scroll once on accordion open

function initSelected(fresh: QueueItem[]) {
  const next: Record<string, boolean> = {}
  for (const item of fresh) {
    const inRange = modeStatusCheck(item.status)
    if (item.name in selected.value) {
      next[item.name] = selected.value[item.name] && inRange
    } else {
      next[item.name] = inRange
    }
  }
  selected.value = next
}

/** Get names of all selected tasks for current mode */
function getSelectedTasks(): string[] {
  return items.value
    .filter(i => modeStatusCheck(i.status) && selected.value[i.name])
    .map(i => i.name)
}

function toggleSelected(name: string) {
  selected.value = { ...selected.value, [name]: !selected.value[name] }
}

/** Number of currently selected tasks (reactive) */
const selectionCount = computed(() => getSelectedTasks().length)

// Re-init selected when execMode changes
watch(() => props.execMode, () => {
  initSelected(items.value)
})

/** Send external text (from HingePanel's input) as a chat message to the expanded accordion */
async function sendExternalChat(text: string) {
  const s = expandedStem.value
  if (!s) return
  const item = items.value.find(i => stem(i.name) === s)
  if (!item) return
  // Set the chat input and use executeSingle (unified flow: PATCH + wait)
  chatInputs.value = { ...chatInputs.value, [item.name]: text }
  await executeSingle(item.name)
}

defineExpose({ getSelectedTasks, stopAll, selectionCount, expandedStem, sendExternalChat })

/** Silent refresh: keeps current loading state, no flicker */
async function refreshItems() {
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) return
    const fresh: QueueItem[] = await res.json()
    const wasProcessing = new Set(
      items.value.filter(i => i.status === 'processing').map(i => i.name)
    )
    hydrateDrafts(editingContent, fresh.map(i => ({ key: stem(i.name), content: i.content })))
    for (const item of fresh) {
      const wasProc = Array.from(wasProcessing).some(n => stem(n) === stem(item.name))
      if (wasProc && item.status !== 'processing') {
        clearDraft(stem(item.name))
        // Fetch actual chat.md from server to get agent response
        try {
          const chatRes = await fetch(`/api/output?file=${encodeURIComponent(item.name)}`)
          if (chatRes.ok) {
            const serverContent = await chatRes.text()
            if (serverContent) {
              editingContent.value = { ...editingContent.value, [stem(item.name)]: serverContent }
            }
          }
        } catch { /* silent */ }
      }
    }
    items.value = fresh
    initSelected(fresh)

    // Scroll to bottom only if expanded item's content actually changed
    if (expandedStem.value) {
      const s = expandedStem.value
      const newContent = editingContent.value[s] || ''
      const oldContent = (prevExpandedContent.get(s) ?? '')
      if (newContent !== oldContent) {
        prevExpandedContent.set(s, newContent)
        nextTick(() => scrollChatToBottom())
      }
    }
    const next: Record<string, boolean> = {}
    for (const item of fresh) {
      if (item.status === 'processing') next[item.name] = true
    }
    processingTask.value = next

    // Clean stale agentStatus entries for non-processing tasks
    const staleStatusKeys = Object.keys(agentStatus.value).filter(k => !(k in next))
    if (staleStatusKeys.length > 0) {
      const cleaned = { ...agentStatus.value }
      for (const k of staleStatusKeys) delete cleaned[k]
      agentStatus.value = cleaned
    }

    // Refresh agent status from queue response (server includes agentStatus for processing tasks)
    const statusUpdates: Record<string, { status: string; checkedAt: number; elapsed?: number }> = {}
    for (const item of fresh) {
      if (item.agentStatus && item.agentStatus.status) {
        statusUpdates[item.name] = {
          status: item.agentStatus.status,
          checkedAt: Date.now(),
          elapsed: item.agentStatus.elapsed,
        }
      }
    }
    if (Object.keys(statusUpdates).length > 0) {
      agentStatus.value = { ...agentStatus.value, ...statusUpdates }
    }
  } catch { /* silent */ }
}

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const fresh: QueueItem[] = await res.json()
    hydrateDrafts(editingContent, fresh.map(i => ({ key: stem(i.name), content: i.content })))
    items.value = fresh
    initSelected(fresh)
    const proc: Record<string, boolean> = {}
    for (const item of fresh) {
      if (item.status === 'processing') proc[item.name] = true
    }
    processingTask.value = proc
  } catch (e: any) {
    error.value = e.message || 'Failed to load queue'
  } finally {
    loading.value = false
  }
}

function remove(name: string) {
  fetch(`/api/queue?file=${encodeURIComponent(name)}`, { method: 'DELETE' })
    .then(() => {
      if (expandedStem.value === stem(name)) expandedStem.value = null
      refreshItems()
    })
}

function statusIcon(status: string) {
  if (status === 'done') return '✅'
  if (status === 'error') return '❌'
  if (status === 'processing') return '🔴'
  if (status === 'wait') return '⏳'
  return '📥'
}

/** Label for the processing status bar */
function processingStatusLabel(name: string): string {
  const a = agentStatus.value[name]
  const l = lang.value
  if (!a) return l.processing
  const secLabel = a.elapsed != null ? (a.elapsed <= 1 ? '1s' : `${a.elapsed}s`) : ''
  const suffix = secLabel ? ` (${secLabel})` : ''
  if (a.status === 'running' || a.status === 'no_pid') return `${l.processing}${suffix}`
  if (a.status === 'stopped') return `⚠ ${l.stopped}${suffix}`
  return l.processing
}

/** Extract first meaningful line from content (fallback when no header found) */
function firstMeaningfulLine(content: string): string {
  const clean = content
    .replace(/^### .+/gm, '')           // strip ### headers
    .replace(/^[A-Za-z]\w+: .+/gm, '')  // strip Prop: value lines
    .replace(/```[\s\S]*?```/g, '')     // strip code blocks
    .trim()
  const line = clean.split('\n').find(l => l.trim().length > 0)
  if (!line) return '—'
  return line.trim().slice(0, 60).replace(/\s+/g, ' ').trim()
}

/** Extract header title: first ### Component: or ### File: value, or first meaningful line */
function headerTitle(content: string): string {
  const comp = content.match(/^### Component: (.+)/m)
  if (comp) return comp[1]
  const file = content.match(/^### File: (.+)/m)
  if (file) return file[1]
  const page = content.match(/^### Page: (.+)/m)
  if (page) return page[1]
  return firstMeaningfulLine(content)
}

/** Extract first 200 chars of meaningful text from all sections */
function headerSubtitle(content: string): string {
  const clean = content
    .replace(/^### .+/gm, '')
    .replace(/^[A-Za-z]\w+: .+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
  if (!clean) return ''
  return clean.slice(0, 200).replace(/\s+/g, ' ').trim()
}

function timeLabel(name: string) {
  const stem = name.replace(/(_new|_wait|_done|_processing)$/, '')
  const parts = stem.split('_')
  const ts = parts[0]
  if (!ts || !ts.includes('T')) return stem
  const timeParts = ts.split('T')
  if (timeParts.length < 2) return stem
  const time = (timeParts[1] || '').replace(/-/g, ':')
  return time.slice(0, 5) // HH:mm only
}

// ── Auto-refresh (every 2s while component is mounted) ──
function startAutoRefresh() {
  autoRefreshTimer = setInterval(() => {
    refreshItems()
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
  const s = stem(name)
  if (expandedStem.value === s) {
    expandedStem.value = null
    try { localStorage.removeItem(EXPANDED_STORAGE_KEY) } catch { /* silent */ }
    return
  }
  expandedStem.value = s
  try { localStorage.setItem(EXPANDED_STORAGE_KEY, s) } catch { /* silent */ }

  const item = items.value.find(i => i.name === name)
  if (!item) return
  // Initialize editor with the full chat content — key by stem, not full name
  if (!(s in editingContent.value)) {
    editingContent.value = { ...editingContent.value, [s]: item.content }
  }
  // Seed content tracker so next poll cycle doesn't re-scroll identical content
  prevExpandedContent.set(s, editingContent.value[s])
  nextTick(() => scrollChatToBottom())
}

function scrollChatToBottom() {
  const el = document.querySelector(`.chat-history--${expandedStem.value}`)
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}

/** Send a new chat message */
async function sendChat(name: string) {
  const message = chatInputs.value[name]?.trim()
  if (!message || processingTask.value[name]) return

  // Optimistically add user message to displayed history
  const s = stem(name)
  const currentContent = editingContent.value[s] || ''
  const updatedContent = currentContent + `\n\n---\n\n**User:**\n${message}\n`
  editingContent.value = { ...editingContent.value, [s]: updatedContent }
  chatInputs.value = { ...chatInputs.value, [name]: '' }

  // Send via chat endpoint (handles rename + agent internally)
  const res = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, message }),
  })
  const data = await res.json()

  // Carry optimistic content under the stable stem key so it survives
  // auto-refresh even if server's chat.md hasn't been written yet (race).
  if (data.processingName && stem(data.processingName) !== s) {
    editingContent.value = { ...editingContent.value, [stem(data.processingName)]: updatedContent }
  }

  // Refresh first to get latest content from server, then scroll
  await refreshItems()
  await nextTick()
  scrollChatToBottom()
}

/** Cancel a running task (kill agent, revert to wait) */
async function cancelTask(name: string) {
  await fetch('/api/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  refreshItems()
}

/** Stop all processing tasks */
async function stopAll() {
  const processing = items.value.filter(i => i.status === 'processing')
  for (const item of processing) {
    fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name }),
    })
  }
  await new Promise(r => setTimeout(r, 300))
  refreshItems()
}

/** Set task to wait state (▶ button) — enqueue + save chat text if present */
async function executeSingle(name: string) {
  if (processingTask.value[name]) return
  const message = chatInputs.value[name]?.trim()
  if (message) {
    // Append message to chat content via PATCH first
    const s = stem(name)
    const currentContent = editingContent.value[s] || ''
    const updatedContent = currentContent ? currentContent + `\n\n---\n\n**User:**\n${message}\n` : `**User:**\n${message}\n`
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: name, content: updatedContent }),
    })
    editingContent.value = { ...editingContent.value, [s]: updatedContent }
    chatInputs.value = { ...chatInputs.value, [name]: '' }
  }
  // Set status to wait (server won't auto-start — guarded by status !== 'wait')
  await fetch('/api/queue', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: name, status: 'wait' }),
  })
  refreshItems()
  nextTick(() => scrollChatToBottom())
}

/** Cancel a running task (kill agent, revert to wait) */
</script>

<template>
  <div class="tab-content">
    <div v-if="!compact" class="tab-header">
      <span>{{ lang.tasks }} <span class="tab-count">{{ items.length }}</span></span>
      <button
        v-if="hasProcessing"
        class="tab-header__stop-all"
        @click="stopAll"
        :title="lang.stopAll"
      >{{ lang.stopAll }}</button>
    </div>

    <div v-if="loading" class="drawer-body"><p class="drawer-muted">{{ lang.promptLoading }}</p></div>
    <div v-else-if="error" class="drawer-body"><p class="drawer-error">{{ error }}</p></div>
    <div v-else-if="items.length === 0" class="drawer-body"><p class="drawer-muted">{{ lang.queueEmpty }}</p></div>

    <div v-else class="drawer-body drawer-body--scroll" :class="{ 'compact-scroll': compact }">
      <div
        v-for="item in items"
        :key="stem(item.name)"
        class="qr-card"
        :class="{ 'qr-card--done': item.status === 'done', 'qr-card--wait': item.status === 'wait', 'qr-card--processing': item.status === 'processing', 'qr-card--expanded': expandedStem === stem(item.name), 'qr-card--editing': props.editingFile === item.name }"
      >
        <div class="qr-card__header" @click="expandItem(item.name)">
          <span
            v-if="modeStatusCheck(item.status)"
            class="qr-card__select"
            :class="{ 'qr-card__select--on': selected[item.name] }"
            @click.stop="modeStatusCheck(item.status) && toggleSelected(item.name)"
          >{{ selected[item.name] ? '☑' : '☐' }}</span>
          <span class="qr-card__icon" :class="{ 'qr-card__icon--pulse': item.status === 'processing' }">{{ statusIcon(item.status) }}</span>
          <div class="qr-card__text">
            <span class="qr-card__title">{{ headerTitle(item.content) }}</span>
            <span v-if="headerSubtitle(item.content)" class="qr-card__subtitle">{{ headerSubtitle(item.content) }}</span>
          </div>
          <span class="qr-card__time">{{ timeLabel(item.name) }}</span>

          <span class="qr-card__chevron">{{ expandedStem === stem(item.name) ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expandedStem === stem(item.name)" class="qr-card__body">
          <!-- Chat UI -->
          <div class="chat-ui">
            <!-- History (readonly) -->
            <div
              class="chat-history"
              :class="`chat-history--${stem(item.name)}`"
              v-if="expandedMessages.length > 0"
            >
              <div
                v-for="(msg, idx) in expandedMessages"
                :key="idx"
                class="chat-msg"
                :class="'chat-msg--' + msg.role"
              >
                <div class="chat-msg__body">
                  <div class="chat-msg__role"><span class="chat-msg__avatar">{{ msg.role === 'user' ? '🧑' : '🤖' }}</span> {{ msg.role === 'user' ? lang.user : lang.assistant }}</div>
                  <div class="chat-msg__text">{{ msg.role === 'assistant' ? shortenOutput(msg.content) : msg.content }}</div>
                </div>
              </div>
            </div>
            <div v-else class="chat-history chat-history--empty">
              <p class="drawer-muted">{{ lang.noMessages }}</p>
            </div>

            <!-- Input row -->
            <div class="chat-input-row">
              <textarea
                class="chat-input"
                :placeholder="processingTask[item.name] ? lang.waitingResponse : lang.messageAgent"
                v-model="chatInputs[item.name]"
                :disabled="processingTask[item.name]"
                @keydown.enter.ctrl="sendChat(item.name)"
                rows="2"
                spellcheck="false"
              ></textarea>
            </div>
          </div>

          <!-- Actions row -->
          <div v-if="processingTask[item.name]" class="qr-card__processing-bar">
            <span class="qr-card__processing-text">{{ processingStatusLabel(item.name) }}</span>
            <button
              class="qr-btn qr-btn--stop"
              @click.stop="cancelTask(item.name)"
              :title="lang.stopTaskTitle"
            >{{ lang.stopTask }}</button>
          </div>
          <div v-else class="qr-card__save-row">
            <button class="qr-btn qr-btn--delete" :disabled="saving[item.name]" @click.stop="remove(item.name)" :title="lang.delete">✕</button>
            <HingeAttach :folder="item.name" />
            <span class="qr-card__save-spacer"></span>
            <button
              class="qr-btn qr-btn--run"
              :disabled="saving[item.name]"
              @click.stop="executeSingle(item.name)"
              :title="lang.runAgentTitle"
            >▶</button>
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
  justify-content: space-between;
  flex-shrink: 0;
}
.tab-header__stop-all {
  background: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  cursor: pointer;
  transition: background 0.12s;
}
.tab-header__stop-all:hover {
  background: rgba(255, 107, 107, 0.15);
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
.qr-card--wait {
  border-color: #3a3a5a;
  opacity: 0.85;
}
.qr-card--processing {
  border-color: #d29922;
  border-width: 2px;
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
.qr-card__icon--pulse {
  animation: qr-blink 1s ease-in-out infinite;
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
.qr-card__stop-btn {
  background: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, opacity 0.12s;
}
.qr-card__stop-btn:hover {
  background: rgba(255, 107, 107, 0.15);
}
.qr-card__chevron {
  font-size: 9px;
  color: #888;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}
.qr-card__body {
  padding: 0 10px 6px;
  border-top: 1px solid #2a2a4a;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Chat UI ── */
.chat-ui {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
}
.chat-history {
  max-height: 110px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 10px;
}
.chat-history--empty {
  min-height: 36px;
  justify-content: center;
  align-items: center;
}
.chat-msg {
  max-width: 100%;
}
.chat-msg__avatar {
  font-size: 13px;
  margin-right: 4px;
}
.chat-msg__body {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.45;
}
.chat-msg--user .chat-msg__body {
  background: rgba(31, 111, 235, 0.1);
  border: 1px solid rgba(31, 111, 235, 0.25);
}
.chat-msg--assistant .chat-msg__body {
  background: rgba(35, 134, 54, 0.1);
  border: 1px solid rgba(35, 134, 54, 0.25);
}
.chat-msg__role {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #888;
  margin-bottom: 3px;
}
.chat-msg__text {
  white-space: pre-wrap;
  word-break: break-word;
  color: #c9d1d9;
}

/* ── Chat input ── */
.chat-input-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}
.chat-input {
  flex: 1;
  padding: 8px 10px;
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  font-family: ui-monospace, 'SF Mono', monospace;
  font-size: 11px;
  line-height: 1.45;
  resize: none;
  box-sizing: border-box;
  min-height: 36px;
  max-height: 80px;
}
.chat-input:focus {
  outline: none;
  border-color: #58a6ff;
}
.chat-input:disabled {
  opacity: 0.5;
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

/* Agent output */
.qr-card__save-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.qr-card__save-spacer {
  flex: 1;
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
.qr-btn--stop {
  background: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.35;
  transition: background 0.12s;
  white-space: nowrap;
}
.qr-btn--stop:hover {
  background: rgba(255, 107, 107, 0.15);
}

/* Agent output */
.qr-card__select {
  width: 18px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
  cursor: pointer;
  color: #555;
  transition: color 0.12s;
}
.qr-card__select:hover {
  color: #58a6ff;
}
.qr-card__select--on {
  color: #58a6ff;
}

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
  max-height: 190px;
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
  justify-content: space-between;
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
