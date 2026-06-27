import { reactive, ref, type Reactive } from 'vue'
import { DRAG_THRESHOLD } from '../constants'
import type { CogPosition } from './useCogPosition'

interface UseCogDragOptions {
  position: Reactive<CogPosition>
  clampPosition: () => void
}

export function useCogDrag({
  position,
  clampPosition,
}: UseCogDragOptions) {
  const isDragMoved = ref(false)
  const dragState = reactive({
    active: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
  })

  function onCogPointerDown(e: PointerEvent) {
    const target = e.currentTarget as HTMLElement | null
    if (!target) return

    dragState.active = true
    dragState.moved = false
    isDragMoved.value = false
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    dragState.offsetX = e.clientX - position.x
    dragState.offsetY = e.clientY - position.y
    target.setPointerCapture(e.pointerId)
  }

  function onCogPointerMove(e: PointerEvent) {
    if (!dragState.active) return

    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    if (!dragState.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragState.moved = true
      isDragMoved.value = true
    }

    position.x = e.clientX - dragState.offsetX
    position.y = e.clientY - dragState.offsetY
    clampPosition()
  }

  function onCogPointerUp(e: PointerEvent) {
    if (!dragState.active) return

    const target = e.currentTarget as HTMLElement | null
    dragState.active = false

    if (target?.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
  }

  function resetDragMoved() {
    isDragMoved.value = false
  }

  return {
    onCogPointerDown,
    onCogPointerMove,
    onCogPointerUp,
    isDragMoved,
    resetDragMoved,
  }
}
