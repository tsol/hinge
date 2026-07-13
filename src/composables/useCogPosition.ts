import { reactive, computed, onMounted } from 'vue'
import { usePersistedState } from './usePersistedState'
import { COG_SIZE } from '../constants'

export interface CogPosition {
  x: number
  y: number
}

/**
 * Cog position stored in LAYOUT viewport pixels (stable across keyboard open/close).
 *
 * On mobile with keyboard open:
 *   - PointerEvent.clientX/Y returns coordinates in the VISUAL viewport
 *   - visualViewport.offsetTop is the scroll offset between layout and visual viewports
 *   - position: fixed elements render at layout viewport coordinates
 *
 * Drag values (visual coords) are converted to layout coords for storage/rendering.
 * Clamping accounts for visual viewport bounds so the cog stays in the visible area.
 */
export function useCogPosition() {
  // Initial position: 90% from top/left of LAYOUT viewport
  const { state: stored } = usePersistedState('cogPos', {
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.9) : 1000,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.9) : 600,
  })

  const position = reactive({ x: stored.x as number, y: stored.y as number })

  function vv() {
    return window.visualViewport
  }

  /** Visual → Layout: add viewport scroll offset. */
  function toLayout(vx: number, vy: number) {
    const v = vv()
    return {
      x: vx + (v?.offsetLeft ?? 0),
      y: vy + (v?.offsetTop ?? 0),
    }
  }

  /**
   * Called during drag. `px, py` are from e.clientX/Y — always in visual coords.
   * We convert to layout for storage, clamped to visual viewport bounds.
   */
  function setPositionAbs(px: number, py: number, _vw: number, _vh: number) {
    const v = vv()
    const visW = v?.width ?? window.innerWidth
    const visH = v?.height ?? window.innerHeight

    // Clamp in visual space first
    const vx = Math.max(0, Math.min(px, visW - COG_SIZE))
    const vy = Math.max(0, Math.min(py, visH - COG_SIZE))

    // Convert to layout for storage
    const l = toLayout(vx, vy)
    position.x = l.x
    position.y = l.y
    stored.x = l.x
    stored.y = l.y
  }

  /** Computed style uses layout coords — position: fixed renders in layout viewport space. */
  const cogStyle = computed(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  }))

  onMounted(() => {
    // Clamp to current visual viewport on first render
    const v = vv()
    if (v) {
      const maxVisX = v.width - COG_SIZE
      const maxVisY = v.height - COG_SIZE
      const lx = Math.max(0, Math.min(position.x, maxVisX + v.offsetLeft))
      const ly = Math.max(0, Math.min(position.y, maxVisY + v.offsetTop))
      position.x = lx
      position.y = ly
    }
  })

  return { position, cogStyle, setPositionAbs }
}
