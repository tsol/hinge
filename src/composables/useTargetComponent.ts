import { onMounted, onUnmounted, ref, shallowRef, watchEffect, type Reactive } from 'vue'
import { COG_SIZE } from '../constants'
import type { HingeTarget } from '../types/target'
import { EMPTY_TARGET } from '../types/target'
import { getCycleableTargetsAtPoint } from '../utils/domTarget'
import { formatTargetSummary, resolveTargetFromElement } from '../utils/resolveTarget'
import type { CogPosition } from './useCogPosition'

export function useTargetComponent(position: Reactive<CogPosition>) {
  const target = ref<HingeTarget>({ ...EMPTY_TARGET })
  const targetLabel = ref(EMPTY_TARGET.component)
  const selectedElement = shallowRef<Element | null>(null)
  const candidates = shallowRef<Element[]>([])
  const candidateIndex = ref(0)

  function applySelection() {
    const list = candidates.value
    const el = list[candidateIndex.value] ?? null
    selectedElement.value = el
    target.value = resolveTargetFromElement(el)
    targetLabel.value = formatTargetSummary(
      target.value,
      candidateIndex.value,
      list.length,
    )
  }

  function rebuildCandidates() {
    candidates.value = getCycleableTargetsAtPoint(position.x, position.y, COG_SIZE)
    candidateIndex.value = 0
    applySelection()
  }

  function cycleTarget() {
    const list = candidates.value
    if (list.length === 0) {
      rebuildCandidates()
      return
    }
    candidateIndex.value = (candidateIndex.value + 1) % list.length
    applySelection()
  }

  watchEffect(() => {
    position.x
    position.y
    rebuildCandidates()
  })

  onMounted(() => {
    rebuildCandidates()
    window.addEventListener('resize', rebuildCandidates)
    window.visualViewport?.addEventListener('resize', rebuildCandidates)
    window.visualViewport?.addEventListener('scroll', rebuildCandidates)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', rebuildCandidates)
    window.visualViewport?.removeEventListener('resize', rebuildCandidates)
    window.visualViewport?.removeEventListener('scroll', rebuildCandidates)
  })

  return { target, targetLabel, selectedElement, cycleTarget, updateHighlight: applySelection }
}
