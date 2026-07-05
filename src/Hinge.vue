<template>
  <Teleport to="body">
    <div id="hinge-app">
      <HingeMenuToggle
        :menu-open="isOpen"
        :badge-count="queueCount"
        @toggle="isOpen = !isOpen"
      />

      <HingeCog
        :open="isOpen"
        :cog-style="cogStyle"
        :position-x="position.x"
        :position-y="position.y"
        :always-on-top="alwaysOnTop"
        :candidate-labels="candidateLabels"
        :candidates="candidates"
        :model="model"
        :selected-element="selectedElement"
        :queue-count="queueCount"
        @pointerdown="onCogPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
      />

      <HingePanel
        v-if="isOpen"
        v-model="note"
        :target="target"
        :model="model"
        @send="handleSend"
        @close="isOpen = false"
      />

      <ToastContainer />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

const isOpen = ref(false)
const alwaysOnTop = ref(false)

onMounted(() => {
  alwaysOnTop.value = !!(window as any).__HINGE_DEFAULT_PROJECT
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

const { target, selectedElement, candidateLabels, candidates } = useTargetComponent(position)

const model = useTaskModel()
const note = model.text

async function handleSend(onSuccess?: () => void) {
  const serialized = model.serialize()
  if (!serialized.trim()) return
  await fetch('/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: serialized }),
  })
  model.text.value = ''
  model.attachments.value = []
  onSuccess?.()
}

// ── Queue polling (badge + toast on completion) ──
const queueCount = ref(0)
let prevProcessing = new Set<string>()
let pollTimer: ReturnType<typeof setInterval> | null = null
const { toasts: _t, success } = useToast()

async function pollQueue() {
  try {
    const res = await fetch('/api/queue')
    if (!res.ok) return
    const items: { name: string; status: string; content?: string }[] = await res.json()

    // Badge: processing + wait count
    const active = items.filter(i => i.status === 'processing' || i.status === 'wait')
    queueCount.value = active.length

    // Detect task completions
    for (const item of items) {
      const stem = item.name.replace(/_(new|wait|done|processing)$/, '')
      if (prevProcessing.has(stem) && item.status === 'done') {
        // Fetch last ~250 chars of agent response
        let detail = ''
        try {
          const chatRes = await fetch(`/api/output?file=${encodeURIComponent(item.name)}`)
          if (chatRes.ok) {
            const text = await chatRes.text()
            const stripped = text.replace(/^```[\s\S]*?```\n?/gm, '').trim()
            detail = stripped.slice(-250)
          }
        } catch { /* silent */ }
        success(`✅ Task "${stem}" completed`, detail)
      }
    }

    // Track current processing stems
    prevProcessing = new Set(
      items.filter(i => i.status === 'processing').map(i => i.name.replace(/_(new|wait|done|processing)$/, ''))
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
