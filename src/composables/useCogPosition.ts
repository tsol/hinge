import { computed, onMounted, onUnmounted, reactive } from 'vue'
import { COG_SIZE } from '../constants'

export interface CogPosition {
  x: number
  y: number
}

function getViewportBounds() {
  const vv = window.visualViewport
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  }
}

export function useCogPosition() {
  const position = reactive<CogPosition>({ x: 0, y: 0 })

  const cogStyle = computed(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  }))

  function bottomRightPosition() {
    const { width, height } = getViewportBounds()
    position.x = Math.max(0, width - COG_SIZE - 16)
    position.y = Math.max(0, height - COG_SIZE - 16)
  }

  function clampPosition() {
    const { width, height } = getViewportBounds()
    const maxX = Math.max(0, width - COG_SIZE)
    const maxY = Math.max(0, height - COG_SIZE)
    position.x = Math.min(Math.max(0, position.x), maxX)
    position.y = Math.min(Math.max(0, position.y), maxY)
  }

  onMounted(() => {
    bottomRightPosition()
    clampPosition()
    window.addEventListener('resize', clampPosition)
    window.visualViewport?.addEventListener('resize', clampPosition)
    window.visualViewport?.addEventListener('scroll', clampPosition)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', clampPosition)
    window.visualViewport?.removeEventListener('resize', clampPosition)
    window.visualViewport?.removeEventListener('scroll', clampPosition)
  })

  return { position, cogStyle, clampPosition }
}
