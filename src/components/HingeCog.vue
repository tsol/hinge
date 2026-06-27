<script setup lang="ts">
import { computed } from 'vue'
import { COG_SIZE } from '../constants'

const props = defineProps<{
  open: boolean
  cogStyle: Record<string, string>
  positionX: number
  positionY: number
  layerActive: boolean
  candidateLabels: string[]
  candidateIndex: number
  collapsed: boolean
  collapsedLabel: string
}>()

const emit = defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  pointercancel: [event: PointerEvent]
  togglayer: []
  select: [index: number]
}>()

const wrapStyle = computed(() => ({
  ...props.cogStyle,
  zIndex: props.layerActive ? 2147483647 : 1,
}))

function onGearDblClick(_e: MouseEvent) {
  console.log('[HingeCog] double-click → toggle layer')
  emit('togglayer')
}

function onItemClick(index: number) {
  emit('select', index)
}

const ITEM_EST = 22
const GAP = 4

const listPos = computed(() => {
  const vw = window.visualViewport?.width ?? window.innerWidth
  const vh = window.visualViewport?.height ?? window.innerHeight
  const cx = props.positionX
  const cy = props.positionY
  const n = props.collapsed ? 1 : props.candidateLabels.length
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
        :class="{
          'cog-icon--open': open,
          'cog-icon--topmost': layerActive,
        }"
        @pointerdown="$emit('pointerdown', $event)"
        @pointermove="$emit('pointermove', $event)"
        @pointerup="$emit('pointerup', $event)"
        @pointercancel="$emit('pointercancel', $event)"
        @dblclick="onGearDblClick"
      >
        ⚙️
      </div>
      <div
        v-if="candidateLabels.length > 0"
        class="cog-list"
        :class="{ 'cog-list--collapsed': collapsed }"
        :style="listPos"
      >
        <!-- Collapsed: show only active item -->
        <div
          v-if="collapsed"
          class="cog-list__item cog-list__item--active"
          @click="onItemClick(candidateIndex)"
        >
          {{ collapsedLabel }}
        </div>
        <!-- Full list -->
        <template v-else>
          <div
            v-for="(label, i) in candidateLabels"
            :key="i"
            class="cog-list__item"
            :class="{ 'cog-list__item--active': i === candidateIndex }"
            @click="onItemClick(i)"
          >
            {{ label }}
          </div>
        </template>
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

.cog-icon--topmost {
  background: rgba(220, 40, 40, 0.25) !important;
  box-shadow: 0 0 12px rgba(220, 40, 40, 0.5), 0 0 24px rgba(220, 40, 40, 0.2) !important;
  filter: drop-shadow(0 0 6px rgba(220, 40, 40, 0.7)) !important;
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

.cog-list--collapsed {
  opacity: 0.6 !important;
}

.cog-list__item {
  padding: 3px 10px !important;
  background: rgb(23, 60, 140) !important;
  color: #fff !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  white-space: nowrap !important;
  border-radius: 3px !important;
  text-align: center !important;
  transition: background 0.15s !important;
  cursor: pointer !important;
  pointer-events: auto !important;
}

.cog-list__item:hover {
  background: rgb(35, 80, 170) !important;
}

.cog-list__item--active {
  background: rgb(0, 100, 220) !important;
  font-weight: 700 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
  outline: 2px solid #58a6ff !important;
  outline-offset: -2px !important;
}

.cog-list--collapsed .cog-list__item--active {
  opacity: 1 !important;
}
</style>
