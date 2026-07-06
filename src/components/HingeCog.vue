<script setup lang="ts">
import { API_BASE } from '../const'
import { ref, computed, onMounted, onUnmounted, nextTick, toRef } from 'vue'
import type { HingeTarget } from '../types/target'
import type { TaskModel } from '../composables/useTaskModel'
import { useCogModalPosition } from '../composables/useCogModalPosition'
import { usePersistedState } from '../composables/usePersistedState'
import { useI18n } from '../composables/useI18n'
import HingeMic from './HingeMic.vue'

// ── Drag-vs-click guard ──
const didDrag = ref(false)
const dragStart = { x: 0, y: 0 }
const DRAG_THRESHOLD = 6

function onIconPointerDown(e: PointerEvent) {
  didDrag.value = false
  dragStart.x = e.clientX
  dragStart.y = e.clientY
}

function onIconPointerMove(e: PointerEvent) {
  if (didDrag.value) return
  if (Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > DRAG_THRESHOLD) {
    didDrag.value = true
  }
}

function onIconClick() {
  if (didDrag.value) {
    didDrag.value = false
    return
  }
  toggleModal()
}

const props = defineProps<{
  open: boolean
  cogStyle: Record<string, string>
  positionX: number
  positionY: number
  alwaysOnTop: boolean
  currentLabel: string
  candidateLabels: string[]
  candidates: Element[]
  target: HingeTarget
  selectedElement: Element | null
  model: TaskModel
  queueCount: number
}>()

defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  pointercancel: [event: PointerEvent]
  'cycle-target': []
}>()

// ── Modal positioning (independent smooth-follow composable) ──
const { modalOpen, modalStyle, toggleModal, closeModal } = useCogModalPosition(
  toRef(props, 'positionX'),
  toRef(props, 'positionY'),
)

// ── Task text ──
const { state: cogText } = usePersistedState('cogText', {
  text: '',
})
const taskText = toRef(cogText, 'text')

// ── Mode split-button (dropdown, like HingePanel group ops) ──
const { t: lang } = useI18n()

const showModeDropdown = ref(false)

function onTranscribed(text: string) {
  taskText.value = (taskText.value ? taskText.value + '\n' : '') + text + '\n'
}

const modeDropdownUp = ref(false)
const chevronRef = ref<HTMLElement | null>(null)

const { state: cogExec } = usePersistedState('cogExecMode', {
  mode: 'run' as 'queue' | 'run',
})
const cogExecMode = computed({
  get: () => cogExec.mode as 'queue' | 'run',
  set: (v: 'queue' | 'run') => { cogExec.mode = v },
})

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
    const label = props.currentLabel
    const el = props.selectedElement
    const fields: Record<string, string> = {}
    // Save page URL
    const url = window.location.pathname + window.location.search
    if (url) fields.Url = url
    // Extract component props & computed styles
    if (el) {
      const { resolveComponentFromElement, formatPropsInline } = await import('../utils/componentTarget')
      const { generateCSSSelector } = await import('../utils/cssSelector')
      const resolved = resolveComponentFromElement(el)
      if (!resolved.component?.startsWith('Hinge')) {
        const propsStr = formatPropsInline(resolved.props, 6)
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
      // Generate unique CSS selector
      const selector = generateCSSSelector(el)
      if (selector) fields.Selector = selector
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
  await fetch(`${API_BASE}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  // Extract folder name from response if available
  let folderName = ''

  // Run mode: enqueue + trigger execution
  if (cogExecMode.value === 'run') {
    // Find the just-created folder (newest _new)
    const res = await fetch(`${API_BASE}/queue`)
    if (res.ok) {
      const items: { name: string; status: string }[] = await res.json()
      const newItem = items.find(i => i.status === 'new')
      if (newItem) {
        folderName = newItem.name
        // Transition to wait, server auto-starts if idle
        await fetch(`${API_BASE}/queue`, {
            method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: folderName, status: 'wait' }),
        })
        // Trigger immediate execution
        await fetch(`${API_BASE}/queue/run`, { method: 'POST' })
      }
    }
  }

  // Reset
  taskText.value = ''
  modalOpen.value = false
}

// ── Close on click outside ──
function onDocumentClick(e: MouseEvent) {
  if (!modalOpen.value) return
  const target = e.target as Node
  const wrap = document.querySelector('.cog-wrap')
  const modal = document.querySelector('.cog-modal')
  if (wrap && modal && !wrap.contains(target) && !modal.contains(target)) {
    closeModal()
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

const wrapStyle = computed(() => ({
  ...props.cogStyle,
  zIndex: props.alwaysOnTop ? 100001 : 1,
}))
</script>

<template>
  <Teleport to="body">
    <!-- Gear icon (positioned by cogStyle translate3d) -->
    <div class="cog-wrap" :style="wrapStyle">
      <div
        class="cog-icon"
        :class="{ 'cog-icon--open': modalOpen }"
        @pointerdown="onIconPointerDown($event); $emit('pointerdown', $event)"
        @pointermove="onIconPointerMove($event); $emit('pointermove', $event)"
        @pointerup="$emit('pointerup', $event)"
        @pointercancel="$emit('pointercancel', $event)"
        @click.stop="onIconClick"
      >⚙️
        <span
          v-if="queueCount > 0"
          class="cog-badge"
        >{{ queueCount > 99 ? '99+' : queueCount }}</span>
      </div>
    </div>

    <!-- Modal (sibling, position: fixed → viewport coords independent of cog-wrap) -->
    <div
      v-if="modalOpen"
      class="cog-modal"
      :style="modalStyle"
      @click.stop
    >
      <textarea
        class="cog-modal__ta"
        data-hinge-field="cog"
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
          >{{ lang[cogExecMode] }}</button>
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
            >{{ lang[mode] }}</button>
          </div>
        </div>
      </div>

      <div class="cog-modal__selector">
        <button
          class="cog-modal__el"
          :title="currentLabel"
          @click="$emit('cycle-target')"
        >
          <span class="cog-modal__el-icon">🎯</span>
          <span class="cog-modal__el-label">{{ currentLabel }}</span>
          <span class="cog-modal__el-arrow">↻</span>
        </button>
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
  position: relative !important;
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
  font-size: var(--hinge-fs-28, 28px) !important;
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

/* ── Queue badge ── */
.cog-badge {
  position: absolute !important;
  top: -2px !important;
  right: -2px !important;
  min-width: 16px !important;
  height: 16px !important;
  padding: 0 4px !important;
  border-radius: 8px !important;
  background: #da3633 !important;
  color: #fff !important;
  font-size: var(--hinge-fs-10, 10px) !important;
  font-weight: 700 !important;
  line-height: 16px !important;
  text-align: center !important;
  pointer-events: none !important;
}

/* ── Modal ── */
.cog-modal {
  position: fixed !important;
  pointer-events: auto !important;
  background: #16162a !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 8px !important;
  padding: 8px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: var(--hinge-spacing-sm, 6px) !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
  z-index: 100002 !important;
}

.cog-modal__ta {
  width: 100% !important;
  min-height: 48px !important;
  padding: 6px 8px !important;
  font-size: var(--hinge-fs-12, 12px) !important;
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
  gap: var(--hinge-spacing-sm, 6px) !important;
}

.cog-mode-btn {
  display: inline-flex !important;
  position: relative !important;
  border-radius: 4px !important;
  overflow: visible !important;
  margin-left: auto !important;
}

.cog-mode-btn__main {
  height: 28px !important;
  padding: 0 8px !important;
  border: 1px solid #3a3a5a !important;
  border-right: none !important;
  border-radius: 4px 0 0 4px !important;
  background: #2a2a4a !important;
  color: #c9d1d9 !important;
  font-size: var(--hinge-fs-11, 11px) !important;
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
  font-size: var(--hinge-fs-9, 9px) !important;
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
  font-size: var(--hinge-fs-12, 12px) !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  text-align: left !important;
  white-space: nowrap !important;
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
  font-size: var(--hinge-fs-11, 11px) !important;
  font-family: ui-monospace, monospace !important;
  text-align: left !important;
  overflow: hidden !important;
}

.cog-modal__el-icon {
  flex-shrink: 0 !important;
  font-size: var(--hinge-fs-12, 12px) !important;
}

.cog-modal__el-label {
  flex: 1 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.cog-modal__el-arrow {
  flex-shrink: 0 !important;
  font-size: var(--hinge-fs-12, 12px) !important;
  color: #8b949e !important;
}
</style>
