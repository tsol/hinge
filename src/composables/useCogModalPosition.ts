import { computed, watch, toRef, type Ref } from 'vue'
import { COG_SIZE } from '../constants'
import { useSmoothFollow } from './useSmoothFollow'
import { usePersistedState } from './usePersistedState'

const EST_W = 280
const EST_H = 220

// Offsets as percentage of modal height (per user request: 30-40%)
const GAP_ABOVE = -(EST_H * 0.35) + 20  // overlap gear by 35% + 20px back
const GAP_BELOW = EST_H * 0.38 - 30     // gap below gear = 38% - 30px

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

  // Target top-left corner of the modal:
  //   Horizontal: centered on gear, clamped to viewport edges
  //   Vertical:   above gear or below gear, clamped to viewport edges
  // When direction flips the target jumps; the spring handles the transition.
  const modalTarget = computed(() => {
    const { width: vw, height: vh } = getViewport()
    const gx = posX.value + COG_SIZE / 2   // gear horizontal center

    // Horizontal: centered on gear
    let tx = gx - EST_W / 2
    tx = Math.max(0, Math.min(tx, vw - EST_W))

    // Vertical: above or below based on where the gear is
    // "Above": modal bottom = gear top - GAP → modal top = posY - GAP - EST_H
    // "Below": modal top = gear bottom + GAP → modal top = posY + COG_SIZE + GAP
    const aboveProposal = posY.value - GAP_ABOVE - EST_H
    const belowProposal = posY.value + COG_SIZE + GAP_BELOW

    const aboveFits = aboveProposal >= 0
    const belowFits = belowProposal + EST_H <= vh

    let ty: number
    if (aboveFits && !belowFits) {
      ty = aboveProposal   // only above fits
    } else if (!aboveFits && belowFits) {
      ty = belowProposal   // only below fits
    } else if (!aboveFits && !belowFits) {
      // Neither fits — pick the one with less overflow
      const aboveOverflow = Math.abs(aboveProposal) // negative → overflow
      const belowOverflow = belowProposal + EST_H - vh
      ty = aboveOverflow <= belowOverflow ? aboveProposal : belowProposal
    } else {
      // Both fit — prefer above
      ty = aboveProposal
    }

    // Clamp output so spring never targets off-screen
    ty = Math.max(0, Math.min(ty, vh - EST_H))

    return { x: tx, y: ty }
  })

  const { current: smoothCorner, stop: stopFollow, snap: snapFollow } =
    useSmoothFollow(modalTarget, 0.04, 0.12)

  watch(modalOpen, (open) => {
    if (open) {
      snapFollow()
    } else {
      stopFollow()
    }
  })

  // Output style — safe clamp in case smoothCorner lags behind target
  const modalStyle = computed(() => {
    const { width: vw, height: vh } = getViewport()
    return {
      position: 'fixed',
      top: `${Math.max(0, Math.min(smoothCorner.y, vh - EST_H))}px`,
      left: `${Math.max(0, Math.min(smoothCorner.x, vw - EST_W))}px`,
      width: `${EST_W}px`,
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
