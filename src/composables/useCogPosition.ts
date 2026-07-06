import { computed, onMounted, onUnmounted } from 'vue'
import { usePersistedState } from './usePersistedState'
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

const COG_MARGIN = 16

export function useCogPosition() {
  const { state: position } = usePersistedState('cog', {
    x: Math.max(0, getViewportBounds().width - COG_SIZE - COG_MARGIN),
    y: Math.max(0, getViewportBounds().height - COG_SIZE - COG_MARGIN),
  })

  const cogStyle = computed(() => ({
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
  }))

  function clampPosition() {
    const { width, height } = getViewportBounds()
    const maxX = Math.max(0, width - COG_SIZE)
    const maxY = Math.max(0, height - COG_SIZE)
    position.x = Math.min(Math.max(0, position.x), maxX)
    position.y = Math.min(Math.max(0, position.y), maxY)
  }

  onMounted(() => {
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
