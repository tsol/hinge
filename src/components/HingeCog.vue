<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { COG_SIZE } from '../constants'
import type { TaskModel } from '../composables/useTaskModel'
import {
  clearAllComponentHighlights,
  refreshHighlights,
  getAllHighlightEntries,
  setHighlightEntry,
} from '../composables/useElementHighlights'
import HingeMic from './HingeMic.vue'

const props = defineProps<{
  open: boolean
  cogStyle: Record<string, string>
  positionX: number
  positionY: number
  alwaysOnTop: boolean
  candidateLabels: string[]
  candidates: Element[]
  model: TaskModel
  selectedElement: Element | null
}>()

defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  pointercancel: [event: PointerEvent]
}>()

// ── Modal state ──
const modalOpen = ref(false)
const taskText = ref('')
const circularIdx = ref(0)

// ── Circular selector ──

/** Current selected label (from candidates, cycled by clicking) */
const currentLabel = computed(() => {
  return props.candidateLabels[circularIdx.value] ?? '(no elements)'
})

// Temp highlight for circular selector
let savedHighlights: [string, Element][] = []

function clearTempHighlight() {
  const old = document.querySelector('[data-hinge-temp-highlight]')
  if (old) {
    const htm = old as HTMLElement
    htm.removeAttribute('data-hinge-temp-highlight')
    htm.style.removeProperty('outline')
    htm.style.removeProperty('outline-offset')
    htm.style.removeProperty('outline-color')
    htm.style.removeProperty('box-shadow')
    htm.style.removeProperty('transition')
  }
}

function applyTempHighlight(el: Element) {
  clearTempHighlight()
  const htm = el as HTMLElement
  htm.setAttribute('data-hinge-temp-highlight', '')
  htm.style.setProperty('outline', '2.5px solid #ffa657', 'important')
  htm.style.setProperty('outline-offset', '1px', 'important')
  htm.style.setProperty('box-shadow', '0 0 8px 2px #ffa65744, inset 0 0 4px 1px #ffa65722', 'important')
}

function highlightCurrentEl() {
  const el = props.candidates[circularIdx.value]
  if (el) applyTempHighlight(el)
}

function cycleElement() {
  if (props.candidateLabels.length === 0) return
  circularIdx.value = (circularIdx.value + 1) % props.candidateLabels.length
  highlightCurrentEl()
}

// Reset circular index when candidates change
watch(() => props.candidateLabels.length, () => {
  if (circularIdx.value >= props.candidateLabels.length) {
    circularIdx.value = 0
  }
})

// ── Mode split-button (dropdown, like HingePanel group ops) ──
const showModeDropdown = ref(false)

function onTranscribed(text: string) {
  taskText.value = (taskText.value ? taskText.value + '\n' : '') + text + '\n'
}

const modeDropdownUp = ref(false)
const chevronRef = ref<HTMLElement | null>(null)

const cogExecMode = ref<'queue' | 'run'>('run')

const modeLabels: Record<string, string> = {
  queue: 'Queue',
  run: 'Run',
}

function toggleModeDropdown() {
  showModeDropdown.value = !showModeDropdown.value
  if (showModeDropdown.value) {
    // Check if dropdown fits below
    nextTick(() => {
      const el = chevronRef.value
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dropH = 90 // approx 2 items
      modeDropdownUp.value = rect.bottom + 4 + dropH > window.innerHeight
    })
  }
}

function setMode(mode: 'queue' | 'run') {
  cogExecMode.value = mode
  showModeDropdown.value = false
}

// Close dropdown on outside click
function onDocCogClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.cog-mode-btn')) {
    showModeDropdown.value = false
  }
}

// ── Add action ──
async function onAdd() {
  if (!taskText.value.trim() && props.candidateLabels.length === 0) return

  // Build content: component header + text
  let content = ''
  if (props.candidateLabels.length > 0) {
    const label = props.candidateLabels[circularIdx.value]
    const el = props.candidates[circularIdx.value]
    const fields: Record<string, string> = {}
    // Save page URL
    const url = window.location.pathname + window.location.search
    if (url) fields.Url = url
    // Extract Vue props & computed styles
    if (el) {
      const { resolveVueFromElement, formatPropsInline } = await import('../utils/vueTarget')
      const vue = resolveVueFromElement(el)
      if (!vue.component?.startsWith('Hinge')) {
        const propsStr = formatPropsInline(vue.props, 6)
        if (propsStr) fields.Props = propsStr
      }
      const cs = el instanceof HTMLElement ? getComputedStyle(el) : null
      if (cs) {
        const relevant = ['display','position','flex-direction','align-items','justify-content',
          'gap','padding','margin','font-size','font-weight','color',
          'background','background-color','border-radius','border',
          'width','height','min-width','min-height','opacity','overflow','text-align','white-space']
        const styleStr = relevant.map(k => `${k}=${cs.getPropertyValue(k)}`).filter(([,v]) => v && v !== 'none' && v !== 'auto' && v !== 'normal').join(' ')
        if (styleStr) fields.Styling = styleStr
      }
    }
    content = `### Component: ${label}`
    if (Object.keys(fields).length > 0) {
      content += '\n' + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    }
  }
  const text = taskText.value.trim()
  if (text) {
    content += (content ? '\n\n' : '') + text
  }

  if (!content.trim()) return

  // POST to queue
  await fetch('/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  // Extract folder name from response if available
  let folderName = ''

  // Run mode: enqueue + trigger execution
  if (cogExecMode.value === 'run') {
    // Find the just-created folder (newest _new)
    const res = await fetch('/api/queue')
    if (res.ok) {
      const items: { name: string; status: string }[] = await res.json()
      const newItem = items.find(i => i.status === 'new')
      if (newItem) {
        folderName = newItem.name
        // Transition to wait, server auto-starts if idle
        await fetch('/api/queue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: folderName, status: 'wait' }),
        })
        // Trigger immediate execution
        await fetch('/api/queue/run', { method: 'POST' })
      }
    }
  }

  // Reset
  taskText.value = ''
  modalOpen.value = false
}

// ── Position modal above/below cog ──
const modalPos = computed(() => {
  const vw = window.visualViewport?.width ?? window.innerWidth
  const vh = window.visualViewport?.height ?? window.innerHeight
  const cx = props.positionX
  const cy = props.positionY
  const estW = 280
  const estH = 220

  const cogCx = cx + COG_SIZE / 2
  const cogCy = cy + COG_SIZE / 2

  type HMode = 'center' | 'left' | 'right'
  const horzModes: { mode: HMode; leftEdge: number }[] = [
    { mode: 'center', leftEdge: cogCx - estW / 2 },
    { mode: 'right', leftEdge: cx + COG_SIZE - estW },
    { mode: 'left', leftEdge: cx },
  ]
  const bestH = horzModes.find(m => m.leftEdge >= 0 && m.leftEdge + estW <= vw)
    ?? horzModes.reduce((a, b) => {
      const aOver = Math.max(0, -a.leftEdge) + Math.max(0, a.leftEdge + estW - vw)
      const bOver = Math.max(0, -b.leftEdge) + Math.max(0, b.leftEdge + estW - vw)
      return aOver < bOver ? a : b
    })

  let leftPos: string; let rightPos: string; let transform: string
  if (bestH.mode === 'center') {
    leftPos = '50%'; rightPos = 'auto'; transform = 'translateX(-50%)'
  } else if (bestH.mode === 'left') {
    leftPos = '0'; rightPos = 'auto'; transform = 'translateX(0)'
  } else {
    leftPos = 'auto'; rightPos = '0'; transform = 'translateX(0)'
  }

  const GAP = 4
  const aboveTop = cogCy - GAP - estH
  const belowBottom = cogCy + GAP + estH
  const aboveOverflow = Math.max(0, 0 - aboveTop)
  const belowOverflow = Math.max(0, belowBottom - vh)

  let top: string; let bottom: string
  if (aboveOverflow <= belowOverflow || aboveTop >= 0) {
    top = 'auto'; bottom = `calc(100% + ${GAP}px)`
  } else {
    top = `calc(100% + ${GAP}px)`; bottom = 'auto'
  }

  return { top, bottom, left: leftPos, right: rightPos, transform, width: `${estW}px` }
})

// ── Close on click outside ──
function onDocumentClick(e: MouseEvent) {
  if (!modalOpen.value) return
  const target = e.target as Node
  const wrap = document.querySelector('.cog-wrap')
  if (wrap && !wrap.contains(target)) {
    modalOpen.value = false
  }
}

function toggleModal() {
  modalOpen.value = !modalOpen.value
  if (modalOpen.value) {
    if (props.candidateLabels.length > 0) {
      circularIdx.value = 0
      highlightCurrentEl()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true)
  document.addEventListener('click', onDocCogClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
  document.removeEventListener('click', onDocCogClick)
})

// Clean up highlights when modal closes via any path (click outside, Add, gear click)
watch(modalOpen, (isOpen) => {
  if (!isOpen) {
    clearTempHighlight()
    for (const [name, el] of savedHighlights) {
      if (document.body.contains(el)) {
        setHighlightEntry(name, el)
      }
    }
    refreshHighlights()
    savedHighlights = []
  } else {
    // Save existing and clear for temp highlight
    savedHighlights = getAllHighlightEntries()
    clearAllComponentHighlights()
  }
})

const wrapStyle = computed(() => ({
  ...props.cogStyle,
  zIndex: props.alwaysOnTop ? 100001 : 1,
}))
</script>

<template>
  <Teleport to="body">
    <div class="cog-wrap" :style="wrapStyle">
      <!-- Gear icon -->
      <div
        class="cog-icon"
        :class="{ 'cog-icon--open': modalOpen }"
        @pointerdown="$emit('pointerdown', $event)"
        @pointermove="$emit('pointermove', $event)"
        @pointerup="$emit('pointerup', $event)"
        @pointercancel="$emit('pointercancel', $event)"
        @click.stop="toggleModal"
      >⚙️</div>

      <!-- Modal -->
      <div
        v-if="modalOpen"
        class="cog-modal"
        :style="modalPos"
        @click.stop
      >
        <textarea
          class="cog-modal__ta"
          v-model="taskText"
          placeholder="Task / comment…"
          rows="3"
          spellcheck="false"
        ></textarea>

        <div class="cog-modal__actions">
          <HingeMic @transcribed="onTranscribed" />

          <div class="cog-mode-btn">
            <button
              class="cog-mode-btn__main"
              @click="onAdd"
              :disabled="!taskText.trim() && candidateLabels.length === 0"
            >{{ modeLabels[cogExecMode] }}</button>
            <button
              ref="chevronRef"
              class="cog-mode-btn__chevron"
              :class="{ 'cog-mode-btn__chevron--active': showModeDropdown }"
              @click.stop="toggleModeDropdown"
            >▼</button>
            <div
              v-if="showModeDropdown"
              class="cog-mode-dropdown"
              :class="{ 'cog-mode-dropdown--up': modeDropdownUp }"
            >
              <button
                v-for="mode in (['queue', 'run'] as const)"
                :key="mode"
                class="cog-mode-dropdown__item"
                :class="{ 'cog-mode-dropdown__item--active': mode === cogExecMode }"
                @click="setMode(mode)"
              >{{ modeLabels[mode] }}</button>
            </div>
          </div>
        </div>

        <div class="cog-modal__selector">
          <button
            class="cog-modal__el"
            :title="currentLabel"
            @click="cycleElement"
          >
            <span class="cog-modal__el-icon">🎯</span>
            <span class="cog-modal__el-label">{{ currentLabel }}</span>
            <span class="cog-modal__el-arrow">↻</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cog-wrap {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 40px !important;
  height: 40px !important;
  pointer-events: none !important;
  isolation: isolate !important;
}

.cog-icon {
  width: 40px !important;
  height: 40px !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: grab !important;
  touch-action: none !important;
  pointer-events: auto !important;
  font-size: 28px !important;
  line-height: 1 !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  border-radius: 50% !important;
  transition: background 0.2s, box-shadow 0.2s, filter 0.2s !important;
}

.cog-icon:active {
  cursor: grabbing !important;
}

.cog-icon--open {
  filter: drop-shadow(0 0 4px rgba(0, 123, 255, 0.6)) !important;
}

/* ── Modal ── */
.cog-modal {
  position: absolute !important;
  pointer-events: auto !important;
  background: #16162a !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 8px !important;
  padding: 8px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
  z-index: 100002 !important;
}

.cog-modal__ta {
  width: 100% !important;
  min-height: 48px !important;
  padding: 6px 8px !important;
  font-size: 12px !important;
  font-family: inherit !important;
  background: #1e1e3a !important;
  color: #e0e0e0 !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 4px !important;
  resize: none !important;
  outline: none !important;
  box-sizing: border-box !important;
}

.cog-modal__ta:focus {
  border-color: #238636 !important;
}

/* ── Split-button mode selector (dropdown, like HingePanel group ops) ── */
.cog-modal__actions {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.cog-mode-btn {
  flex: 1 !important;
  display: flex !important;
  position: relative !important;
  border-radius: 4px !important;
  overflow: visible !important;
}

.cog-mode-btn__main {
  flex: 1 !important;
  min-width: 0 !important;
  height: 28px !important;
  padding: 0 8px !important;
  border: 1px solid #3a3a5a !important;
  border-right: none !important;
  border-radius: 4px 0 0 4px !important;
  background: #2a2a4a !important;
  color: #c9d1d9 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  transition: background 0.15s !important;
}
.cog-mode-btn__main:hover:not(:disabled) {
  background: #3a3a5a !important;
}
.cog-mode-btn__main:disabled {
  opacity: 0.4 !important;
  cursor: default !important;
}

.cog-mode-btn__chevron {
  height: 28px !important;
  width: 22px !important;
  padding: 0 !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 0 4px 4px 0 !important;
  background: #2a2a4a !important;
  color: #8b949e !important;
  font-size: 9px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background 0.15s !important;
  flex-shrink: 0 !important;
}
.cog-mode-btn__chevron:hover {
  background: #3a3a5a !important;
}
.cog-mode-btn__chevron--active {
  background: #1f6feb !important;
  border-color: #1f6feb !important;
  color: #fff !important;
}

/* ── Mode Dropdown ── */
.cog-mode-dropdown {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  margin-top: 4px !important;
  background: #1c1c3a !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 6px !important;
  overflow: hidden !important;
  min-width: 100px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
  z-index: 100003 !important;
}
.cog-mode-dropdown--up {
  top: auto !important;
  bottom: 100% !important;
  margin-top: 0 !important;
  margin-bottom: 4px !important;
}
.cog-mode-dropdown__item {
  display: block !important;
  width: 100% !important;
  padding: 6px 14px !important;
  border: none !important;
  background: transparent !important;
  color: #c9d1d9 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  text-align: left !important;
  transition: background 0.1s !important;
}
.cog-mode-dropdown__item:hover {
  background: rgba(88, 166, 255, 0.1) !important;
}
.cog-mode-dropdown__item--active {
  color: #58a6ff !important;
  font-weight: 700 !important;
  background: rgba(88, 166, 255, 0.08) !important;
}

/* ── Circular selector ── */
.cog-modal__selector {
  display: flex !important;
}

.cog-modal__el {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  width: 100% !important;
  padding: 4px 8px !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 4px !important;
  background: #1e1e3a !important;
  color: #e0e0e0 !important;
  cursor: pointer !important;
  font-size: 11px !important;
  font-family: ui-monospace, monospace !important;
  text-align: left !important;
  overflow: hidden !important;
}

.cog-modal__el-icon {
  flex-shrink: 0 !important;
  font-size: 12px !important;
}

.cog-modal__el-label {
  flex: 1 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.cog-modal__el-arrow {
  flex-shrink: 0 !important;
  font-size: 12px !important;
  color: #8b949e !important;
}
</style>
