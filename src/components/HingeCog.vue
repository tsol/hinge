<script setup lang="ts">
import { computed } from 'vue'
import { COG_SIZE } from '../constants'
import type { TaskModel } from '../composables/useTaskModel'

const props = defineProps<{
  open: boolean
  componentListOpen: boolean
  cogStyle: Record<string, string>
  positionX: number
  positionY: number
  alwaysOnTop: boolean
  candidateLabels: string[]
  candidates: Element[]
  model: TaskModel
  selectedElement: Element | null
}>()

const emit = defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  pointercancel: [event: PointerEvent]
  'toggle-component': [name: string, el: Element | null]
  'toggle-list': []
}>()

const wrapStyle = computed(() => ({
  ...props.cogStyle,
  zIndex: props.alwaysOnTop ? 100001 : 1,
}))

function onItemClick(label: string, el: Element | null) {
  emit('toggle-component', label, el)
}

function isActive(label: string): boolean {
  return props.model.hasComponent(label)
}

const displayItems = computed(() => {
  return props.candidateLabels
    .map((label, i) => ({
      label,
      el: props.candidates[i] ?? null,
      active: isActive(label),
      compName: label.split(' · ')[0].trim(),
    }))
})

const ITEM_EST = 22
const GAP = 4

const listPos = computed(() => {
  const vw = window.visualViewport?.width ?? window.innerWidth
  const vh = window.visualViewport?.height ?? window.innerHeight
  const cx = props.positionX
  const cy = props.positionY
  const n = displayItems.value.length
  if (n === 0) return {}

  const estW = 220
  const estH = n * ITEM_EST + (n - 1) * 2 + 6

  const cogCx = cx + COG_SIZE / 2
  const cogCy = cy + COG_SIZE / 2

  type HMode = 'center' | 'left' | 'right'
  const horzModes: { mode: HMode; leftEdge: number }[] = [
    { mode: 'center', leftEdge: cogCx - estW / 2 },
    { mode: 'right', leftEdge: cx + COG_SIZE - estW },
    { mode: 'left', leftEdge: cx },
  ]
  const bestH = horzModes.find((m) => m.leftEdge >= 0 && m.leftEdge + estW <= vw)
    ?? horzModes.reduce((a, b) => {
      const aOver = Math.max(0, -a.leftEdge) + Math.max(0, a.leftEdge + estW - vw)
      const bOver = Math.max(0, -b.leftEdge) + Math.max(0, b.leftEdge + estW - vw)
      return aOver < bOver ? a : b
    })

  let leftPos: string
  let rightPos: string
  let transform: string
  if (bestH.mode === 'center') {
    leftPos = '50%'; rightPos = 'auto'; transform = 'translateX(-50%)'
  } else if (bestH.mode === 'left') {
    leftPos = '0'; rightPos = 'auto'; transform = 'translateX(0)'
  } else {
    leftPos = 'auto'; rightPos = '0'; transform = 'translateX(0)'
  }

  const aboveTop = cogCy - GAP - estH
  const belowBottom = cogCy + GAP + estH
  const aboveOverflow = Math.max(0, 0 - aboveTop)
  const belowOverflow = Math.max(0, belowBottom - vh)

  let top: string
  let bottom: string
  if (aboveOverflow <= belowOverflow || aboveTop >= 0) {
    top = 'auto'; bottom = `calc(100% + ${GAP}px)`
  } else {
    top = `calc(100% + ${GAP}px)`; bottom = 'auto'
  }

  return { top, bottom, left: leftPos, right: rightPos, transform }
})
</script>

<template>
  <Teleport to="body">
    <div class="cog-wrap" :style="wrapStyle">
      <div
        class="cog-icon"
        :class="{ 'cog-icon--open': open }"
        @pointerdown="$emit('pointerdown', $event)"
        @pointermove="$emit('pointermove', $event)"
        @pointerup="$emit('pointerup', $event)"
        @pointercancel="$emit('pointercancel', $event)"
        @click="$emit('toggle-list')"
      >
        ⚙️
      </div>
      <div
        v-if="componentListOpen && displayItems.length > 0"
        class="cog-list"
        :style="listPos"
      >
        <div
          v-for="(item, i) in displayItems"
          :key="i"
          class="cog-list__item"
          :class="{
            'cog-list__item--active': item.active,
            'cog-list__item--inactive': !item.active,
          }"
          @click="onItemClick(item.label, item.el)"
        >
          {{ item.label }}
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

.cog-list {
  position: absolute !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  pointer-events: auto !important;
  overflow-y: auto !important;
  min-width: 100px !important;
  transition: opacity 0.2s !important;
}

.cog-list__item {
  padding: 3px 10px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  white-space: nowrap !important;
  cursor: pointer !important;
  pointer-events: auto !important;
}

.cog-list__item--inactive {
  background: rgb(23, 60, 140) !important;
  color: #8b949e !important;
}

.cog-list__item--inactive:hover {
  background: rgb(23, 60, 140) !important;
}
.cog-list__item--active {
  background: rgb(0, 100, 230) !important;
  color: #fff !important;
  font-weight: 600 !important;
}

.cog-list__item--active:hover {
  background: rgb(0, 100, 230) !important;
}
</style>
