<template>
  <Teleport to="body">
    <div id="hinge-app">
      <HingeMenuToggle
        :menu-open="isOpen"
        :panel-width="drawerWidth"
        :badge-count="queueCount"
        @toggle="isOpen = !isOpen"
      />

      <HingeCog
        :cog-style="cogStyle"
        :position-x="position.x"
        :position-y="position.y"
        :always-on-top="alwaysOnTop"
        :current-label="currentLabel"
        :candidate-labels="candidateLabels"
        :selected-element="selectedElement"
        :queue-count="queueCount"
        @pointerdown="onCogPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
        @cycle-target="cycleTarget"
      />

      <HingePanel
        v-if="isOpen"
        v-model="note"
        :model="model"
        @send="handleSend"
        @close="isOpen = false"
      />

      <ToastContainer />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import './host'
import HingeMenuToggle from './components/HingeMenuToggle.vue'
import HingeCog from './components/HingeCog.vue'
import HingePanel from './components/HingePanel.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useCogDrag } from './composables/useCogDrag'
import { useCogPosition } from './composables/useCogPosition'
import { useTargetComponent } from './composables/useTargetComponent'
import { useTaskModel } from './composables/useTaskModel'
import { useToast } from './composables/useToast'
import { usePersistedState } from './composables/usePersistedState'
import { useFontScale } from './composables/useFontScale'
import { prettifyMessage } from './utils/mdToHtml'
import { postQueueContent } from './utils/queueApi'
import { isAgentSetupError } from './utils/agentReply'
import { API_BASE } from './const'

const alwaysOnTop = ref(false)

onMounted(() => {
  alwaysOnTop.value = !!(window as any).__HINGE_DEFAULT_PROJECT
})

const { state: ui } = usePersistedState('ui', {
  isOpen: false,
  focusedField: '',
})
const { state: drawerW } = usePersistedState('drawerWidth', { width: 380 })
const drawerWidth = computed(() => drawerW.width as number)
const isOpen = computed({
  get: () => ui.isOpen as boolean,
  set: (v: boolean) => { ui.isOpen = v },
})

// ── Focus persistence ──
function onFocusIn(e: FocusEvent) {
  const el = e.target as HTMLElement | null
  if (!el) return
  const field = el.getAttribute('data-hinge-field')
  if (field === 'cog' || field === 'panel') {
    ui.focusedField = field
  }
}
onMounted(() => {
  document.addEventListener('focusin', onFocusIn, true)
  // Restore focus after UI state is restored
  if (ui.focusedField) {
    nextTick(() => {
      setTimeout(() => {
        const ta = document.querySelector<HTMLTextAreaElement>(`[data-hinge-field="${ui.focusedField}"]`)
        ta?.focus()
      }, 50)
    })
  }
})
onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn, true)
})


const { position, cogStyle, clampPosition } = useCogPosition()
const {
  onCogPointerDown,
  onCogPointerMove,
  onCogPointerUp,
} = useCogDrag({
  position,
  clampPosition,
})

const {
  selectedElement,
  candidateLabels,
  currentLabel,
  cycleTarget,
} = useTargetComponent(position)

const model = useTaskModel()
const note = model.text

async function handleSend(onSuccess?: () => void) {
  const serialized = model.serialize()
  if (!serialized.trim()) return
  await postQueueContent(serialized)
  model.text.value = ''
  model.attachments.value = []
  onSuccess?.()
}

// ── Font scale ──
useFontScale()

// ── Queue polling (badge + toast on completion) ──
const queueCount = ref(0)
/** Previous status per task stem — detects wait/processing → done even if poll skips _processing */
let prevStatusByStem = new Map<string, string>()
/** Toast when **Assistant:** arrives after premature _done (recovery race) */
const pendingToasts = new Map<string, { query: string; itemName: string }>()
let pollTimer: ReturnType<typeof setInterval> | null = null
const { toasts: _t, success, error } = useToast()

/** Truncate first words of note to one line */
function firstWords(note: string, maxLen = 60): string {
  const oneLine = note.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return oneLine.slice(0, maxLen).trimEnd() + '…'
}

async function fetchAssistantDetail(itemName: string): Promise<string> {
  try {
    const chatRes = await fetch(`${API_BASE}/output?file=${encodeURIComponent(itemName)}`)
    if (!chatRes.ok) return ''
    const text = await chatRes.text()
    const lastIdx = text.lastIndexOf('**Assistant:**')
    if (lastIdx === -1) return ''
    return prettifyMessage(text.slice(lastIdx + '**Assistant:**'.length))
  } catch {
    return ''
  }
}

function toastForCompletion(query: string, detail: string) {
  if (isAgentSetupError(detail)) {
    error(`❌ ${query}`, 'Agent not configured — check .hinge/new-session.sh')
    return
  }
  if (detail) success(`✅ ${query}`, detail)
}

async function pollQueue() {
  try {
    const res = await fetch(`${API_BASE}/queue`)
    if (!res.ok) return
    const items: { name: string; status: string; content?: string; note?: string; failed?: boolean }[] = await res.json()

    // Badge: processing + wait count
    const active = items.filter(i => i.status === 'processing' || i.status === 'wait')
    queueCount.value = active.length

    // Retry toasts queued while _done had no **Assistant:** yet
    for (const [stem, pending] of [...pendingToasts]) {
      const item = items.find(i => i.name.replace(/_(new|wait|done|processing)$/, '') === stem)
      if (!item) {
        pendingToasts.delete(stem)
        continue
      }
      const detail = await fetchAssistantDetail(item.name)
      if (detail) {
        toastForCompletion(pending.query, detail)
        pendingToasts.delete(stem)
      }
    }

    // Detect task completions (wait/processing → done/error; skip first poll per stem)
    for (const item of items) {
      const stem = item.name.replace(/_(new|wait|done|processing)$/, '')
      const prev = prevStatusByStem.get(stem)
      const finished = item.status === 'done' || item.status === 'error'
      if (prev && prev !== item.status && finished) {
        const query = firstWords(item.note || stem)
        if (item.failed || item.status === 'error') {
          error(`❌ ${query}`)
        } else {
          const detail = await fetchAssistantDetail(item.name)
          if (detail) {
            toastForCompletion(query, detail)
          } else {
            pendingToasts.set(stem, { query, itemName: item.name })
          }
        }
      }
    }

    prevStatusByStem = new Map(
      items.map(i => [i.name.replace(/_(new|wait|done|processing)$/, ''), i.status]),
    )
  } catch { /* silent */ }
}

onMounted(() => {
  pollTimer = setInterval(pollQueue, 3000)
  pollQueue() // first tick immediately
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
#hinge-app {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
  pointer-events: none !important;
  z-index: 100000 !important;
}
</style>
