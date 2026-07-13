import { type Reactive } from 'vue'
import { DRAG_THRESHOLD } from '../constants'

interface UseCogDragOptions {
  position: Reactive<{ x: number; y: number }>
  setPosition: (x: number, y: number, vw: number, vh: number) => void
}

export function useCogDrag({
  position,
  setPosition,
}: UseCogDragOptions) {
  const dragState = {
    active: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
  }

  function getViewport() {
    const vv = window.visualViewport
    return {
      width: vv?.width ?? window.innerWidth,
      height: vv?.height ?? window.innerHeight,
    }
  }

  function onCogPointerDown(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement | null
    if (!target) return

    dragState.active = true
    dragState.moved = false
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    // Convert position (layout coords) to visual coords for offset computation,
    // because e.clientX/Y are always in visual viewport coords on mobile.
    const vv = window.visualViewport
    const visualX = position.x - (vv?.offsetLeft ?? 0)
    const visualY = position.y - (vv?.offsetTop ?? 0)
    dragState.offsetX = e.clientX - visualX
    dragState.offsetY = e.clientY - visualY
    target.setPointerCapture(e.pointerId)
  }

  function onCogPointerMove(e: PointerEvent) {
    if (!dragState.active) return

    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    if (!dragState.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragState.moved = true
    }

    const { width: vw, height: vh } = getViewport()
    const px = e.clientX - dragState.offsetX
    const py = e.clientY - dragState.offsetY
    setPosition(px, py, vw, vh)
  }

  function onCogPointerUp(e: PointerEvent) {
    if (!dragState.active) return

    const target = e.currentTarget as HTMLElement | null
    dragState.active = false

    if (target?.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
  }

  return {
    onCogPointerDown,
    onCogPointerMove,
    onCogPointerUp,
  }
}
