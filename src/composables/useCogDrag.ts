import { reactive, type Reactive } from 'vue'
import { DRAG_THRESHOLD, LONG_PRESS_MS } from '../constants'
import type { CogPosition } from './useCogPosition'

interface UseCogDragOptions {
  position: Reactive<CogPosition>
  clampPosition: () => void
  /** Short tap — cycle target under cog. */
  onTap: () => void
  /** Long press or right-click — toggle panel. */
  onPanelToggle: () => void
  onMove?: () => void
}

export function useCogDrag({
  position,
  clampPosition,
  onTap,
  onPanelToggle,
  onMove,
}: UseCogDragOptions) {
  const dragState = reactive({
    active: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    longPressTriggered: false,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
  })

  function clearLongPress() {
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer)
      dragState.longPressTimer = null
    }
  }

  function onCogPointerDown(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement | null
    if (!target) return

    dragState.active = true
    dragState.moved = false
    dragState.longPressTriggered = false
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    dragState.offsetX = e.clientX - position.x
    dragState.offsetY = e.clientY - position.y
    target.setPointerCapture(e.pointerId)

    clearLongPress()
    dragState.longPressTimer = setTimeout(() => {
      dragState.longPressTriggered = true
      onPanelToggle()
    }, LONG_PRESS_MS)
  }

  function onCogPointerMove(e: PointerEvent) {
    if (!dragState.active) return

    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    if (!dragState.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        onMove?.()
        return
      }
      clearLongPress()
      dragState.moved = true
    }

    position.x = e.clientX - dragState.offsetX
    position.y = e.clientY - dragState.offsetY
    clampPosition()
    onMove?.()
  }

  function onCogPointerUp(e: PointerEvent) {
    if (!dragState.active) return

    const target = e.currentTarget as HTMLElement | null
    dragState.active = false
    clearLongPress()

    if (target?.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }

    if (dragState.longPressTriggered || dragState.moved) return

    onTap()
  }

  function onCogContextMenu(e: MouseEvent) {
    e.preventDefault()
    clearLongPress()
    dragState.longPressTriggered = true
    onPanelToggle()
  }

  return {
    onCogPointerDown,
    onCogPointerMove,
    onCogPointerUp,
    onCogContextMenu,
  }
}
