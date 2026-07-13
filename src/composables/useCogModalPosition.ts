import { computed, watch, toRef, nextTick, onMounted, type Ref } from 'vue'
import { COG_SIZE } from '../constants'
import { useSmoothFollow } from './useSmoothFollow'
import { usePersistedState } from './usePersistedState'

const BASE_W = 280
const BASE_H = 220

// Offsets as percentage of modal height (per user request: 30-40%)
const GAP_ABOVE_RATIO = 0.35
const GAP_BELOW_RATIO = 0.38

function getCssScale(): number {
  try {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hinge-scale')) || 1
  } catch {
    return 1
  }
}

function getViewport() {
  const vv = window.visualViewport
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  }
}

/**
 * Manages the cog settings modal position with spring-damper smooth follow.
 *
 * The spring follows the modal's top-left TARGET corner (which includes
 * above/below offset). When the vertical direction flips, the target jumps
 * and the spring smoothly carries the modal to the new position.
 *
 * @param posX  Reactive Ref<number> for the gear's viewport X
 * @param posY  Reactive Ref<number> for the gear's viewport Y
 */
export function useCogModalPosition(posX: Ref<number>, posY: Ref<number>) {
  const { state: cogUi } = usePersistedState('cogUi', {
    modalOpen: false,
  })
  const modalOpen = toRef(cogUi, 'modalOpen')

  // Scale-dependent modal dimensions — read --hinge-scale from CSS
  const estW = computed(() => {
    const s = getCssScale()
    return Math.round(BASE_W * s)
  })
  const estH = computed(() => {
    const s = getCssScale()
    return Math.round(BASE_H * s)
  })
  const gapAbove = computed(() => -(estH.value * GAP_ABOVE_RATIO) + 20)
  const gapBelow = computed(() => estH.value * GAP_BELOW_RATIO - 30)

  // Target top-left corner of the modal:
  //   Horizontal: centered on gear, clamped to viewport edges
  //   Vertical:   above gear or below gear, clamped to viewport edges
  const modalTarget = computed(() => {
    const { width: vw, height: vh } = getViewport()
    const gx = posX.value + COG_SIZE / 2   // gear horizontal center
    const w = estW.value
    const h = estH.value

    // Horizontal: centered on gear
    let tx = gx - w / 2
    tx = Math.max(0, Math.min(tx, vw - w))

    // Vertical: above or below based on where the gear is
    const aboveProposal = posY.value - gapAbove.value - h
    const belowProposal = posY.value + COG_SIZE + gapBelow.value

    const aboveFits = aboveProposal >= 0
    const belowFits = belowProposal + h <= vh

    let ty: number
    if (aboveFits && !belowFits) {
      ty = aboveProposal
    } else if (!aboveFits && belowFits) {
      ty = belowProposal
    } else if (!aboveFits && !belowFits) {
      const aboveOverflow = Math.abs(aboveProposal)
      const belowOverflow = belowProposal + h - vh
      ty = aboveOverflow <= belowOverflow ? aboveProposal : belowProposal
    } else {
      ty = aboveProposal
    }

    ty = Math.max(0, Math.min(ty, vh - h))

    return { x: tx, y: ty }
  })

  const { current: smoothCorner, stop: stopFollow, snap: snapFollow } =
    useSmoothFollow(modalTarget, 0.04, 0.12)

  function scrollModalIntoView() {
    nextTick(() => {
      const el = document.querySelector<HTMLElement>('.cog-modal')
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }

  watch(modalOpen, (open) => {
    if (open) {
      snapFollow()
      scrollModalIntoView()
    } else {
      stopFollow()
    }
  })

  // Re-scroll modal into view if viewport resizes (e.g. keyboard opens) while open
  onMounted(() => {
    window.visualViewport?.addEventListener('resize', () => {
      if (modalOpen.value) scrollModalIntoView()
    })
  })

  // Output style — safe clamp in case smoothCorner lags behind target
  const modalStyle = computed(() => {
    const { width: vw, height: vh } = getViewport()
    const w = estW.value
    const h = estH.value
    return {
      position: 'fixed',
      top: `${Math.max(0, Math.min(smoothCorner.y, vh - h))}px`,
      left: `${Math.max(0, Math.min(smoothCorner.x, vw - w))}px`,
      width: `${w}px`,
    } as Record<string, string>
  })

  function toggleModal() {
    modalOpen.value = !modalOpen.value
  }

  function closeModal() {
    modalOpen.value = false
  }

  return { modalOpen, modalStyle, toggleModal, closeModal }
}
