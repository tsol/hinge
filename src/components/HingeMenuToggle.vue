<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { COG_SIZE } from '../constants'
import { usePersistedState } from '../composables/usePersistedState'

const props = withDefaults(defineProps<{
  menuOpen: boolean
  badgeCount?: number
  /** Persisted drawer width — fallback when panel DOM is not measurable yet */
  panelWidth?: number
}>(), {
  panelWidth: 380,
})

const emit = defineEmits<{
  toggle: []
}>()

const { state: togglePos } = usePersistedState('menuToggle', { y: 0 })

const drag = reactive({
  active: false,
  offsetY: 0,
  startX: 0,
  startY: 0,
})
let moved = false

/** Bump to re-read drawer.getBoundingClientRect() on resize / panel width change */
const measureTick = ref(0)
let drawerObserver: ResizeObserver | null = null

function viewportSize() {
  const vv = window.visualViewport
  return {
    w: vv?.width ?? window.innerWidth,
    h: vv?.height ?? window.innerHeight,
  }
}

function anchorX(): number {
  measureTick.value // reactive dependency
  if (!props.menuOpen) return 0
  const drawer = document.querySelector('.drawer') as HTMLElement | null
  if (drawer) return drawer.getBoundingClientRect().right - COG_SIZE
  return Math.max(0, props.panelWidth - COG_SIZE)
}

function clampY(y = togglePos.y as number): number {
  const { h } = viewportSize()
  return Math.min(Math.max(0, y), Math.max(0, h - COG_SIZE))
}

const toggleStyle = computed(() => ({
  transform: `translate3d(${anchorX()}px, ${clampY()}px, 0)`,
}))

function onViewportChange() {
  measureTick.value++
  togglePos.y = clampY()
}

async function bindDrawerObserver(open: boolean) {
  drawerObserver?.disconnect()
  drawerObserver = null
  if (!open) {
    measureTick.value++
    return
  }
  await nextTick()
  const drawer = document.querySelector('.drawer')
  if (!drawer) {
    measureTick.value++
    return
  }
  drawerObserver = new ResizeObserver(() => { measureTick.value++ })
  drawerObserver.observe(drawer)
  measureTick.value++
}

watch(() => props.menuOpen, (open) => { bindDrawerObserver(open) }, { immediate: true })
watch(() => props.panelWidth, () => { measureTick.value++ })

onMounted(() => {
  togglePos.y = clampY()
  window.addEventListener('resize', onViewportChange)
  window.visualViewport?.addEventListener('resize', onViewportChange)
})

onUnmounted(() => {
  drawerObserver?.disconnect()
  window.removeEventListener('resize', onViewportChange)
  window.visualViewport?.removeEventListener('resize', onViewportChange)
})

function onPointerDown(e: PointerEvent) {
  const target = e.currentTarget as HTMLElement | null
  if (!target) return
  moved = false
  drag.active = true
  drag.startX = e.clientX
  drag.startY = e.clientY
  drag.offsetY = e.clientY - (togglePos.y as number)
  try { target.setPointerCapture(e.pointerId) } catch {}
}

function onPointerMove(e: PointerEvent) {
  if (!drag.active) return
  const dx = e.clientX - drag.startX
  const dy = e.clientY - drag.startY
  if (Math.hypot(dx, dy) >= 8) moved = true
  togglePos.y = clampY(e.clientY - drag.offsetY)
}

function onPointerUp(e: PointerEvent) {
  if (!drag.active) return
  drag.active = false
  const target = e.currentTarget as HTMLElement | null
  try { if (target?.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId) } catch {}
}

function onClick() {
  if (!moved) emit('toggle')
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
  opacity: 0.5 !important;
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
