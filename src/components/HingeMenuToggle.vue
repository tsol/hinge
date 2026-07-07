<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { COG_SIZE } from '../constants'

defineProps<{
  menuOpen: boolean
  badgeCount?: number
}>()

const emit = defineEmits<{
  toggle: []
}>()

const drag = reactive({
  active: false,
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
  startX: 0,
  startY: 0,
})
let moved = false

function positionRightTop() {
  const w = window.visualViewport?.width ?? window.innerWidth
  drag.x = Math.max(0, w - COG_SIZE)
  drag.y = 0
}

onMounted(() => {
  positionRightTop()
})

const toggleStyle = computed(() => ({
  transform: `translate3d(${drag.x}px, ${drag.y}px, 0)`,
}))

function onPointerDown(e: PointerEvent) {
  const target = e.currentTarget as HTMLElement | null
  if (!target) return
  moved = false
  drag.active = true
  drag.startX = e.clientX
  drag.startY = e.clientY
  drag.offsetX = e.clientX - drag.x
  drag.offsetY = e.clientY - drag.y
  try { target.setPointerCapture(e.pointerId) } catch {}
}

function onPointerMove(e: PointerEvent) {
  if (!drag.active) return
  const dx = e.clientX - drag.startX
  const dy = e.clientY - drag.startY
  if (Math.hypot(dx, dy) >= 8) {
    moved = true
  }
  drag.x = e.clientX - drag.offsetX
  drag.y = e.clientY - drag.offsetY
  clampPosition()
}

function onPointerUp(e: PointerEvent) {
  if (!drag.active) return
  drag.active = false
  const target = e.currentTarget as HTMLElement | null
  try { if (target?.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId) } catch {}
}

function onClick() {
  if (!moved) {
    emit('toggle')
  }
}

function clampPosition() {
  const w = window.visualViewport?.width ?? window.innerWidth
  const h = window.visualViewport?.height ?? window.innerHeight
  drag.x = Math.min(Math.max(0, drag.x), Math.max(0, w - COG_SIZE))
  drag.y = Math.min(Math.max(0, drag.y), Math.max(0, h - COG_SIZE))
}
</script>

<template>
  <div
    class="menu-toggle"
    :style="toggleStyle"
    :class="{ 'menu-toggle--open': menuOpen }"
  >
    <div
      class="burger-icon"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onClick"
    >
      <span></span>
      <span></span>
      <span></span>
      <span
        v-if="badgeCount && badgeCount > 0"
        class="menu-badge"
      >{{ badgeCount > 99 ? '99+' : badgeCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.menu-toggle {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 40px !important;
  height: 40px !important;
  pointer-events: none !important;
  z-index: 100001 !important;
}

.burger-icon {
  position: relative !important;
  width: 40px !important;
  height: 40px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
  cursor: grab !important;
  touch-action: none !important;
  pointer-events: auto !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  background: rgba(0, 123, 255, 0.85) !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18) !important;
  transition: background 0.2s, border-radius 0.2s !important;
}

.menu-toggle--open .burger-icon {
  background: rgba(220, 53, 69, 0.85) !important;
  border-radius: 50% !important;
}

.burger-icon:active {
  cursor: grabbing !important;
}

.burger-icon span:not(.menu-badge) {
  display: block !important;
  width: 20px !important;
  height: 3px !important;
  background: #fff !important;
  border-radius: 2px !important;
  transition: transform 0.2s !important;
}

.menu-toggle--open .burger-icon span:nth-child(1) {
  transform: translateY(7px) rotate(45deg) !important;
}

.menu-toggle--open .burger-icon span:nth-child(2) {
  opacity: 0 !important;
}

.menu-toggle--open .burger-icon span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg) !important;
}

.menu-badge {
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
  width: auto !important;
  height: 16px !important;
}
</style>
