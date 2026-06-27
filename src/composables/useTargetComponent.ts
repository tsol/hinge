import { onMounted, ref, shallowRef, watch, type Reactive } from 'vue'
import { COG_SIZE } from '../constants'
import type { HingeTarget } from '../types/target'
import { EMPTY_TARGET } from '../types/target'
import { getCycleableTargetsAtPoint, describeElement } from '../utils/domTarget'
import { formatTargetSummary, resolveTargetFromElement } from '../utils/resolveTarget'
import type { CogPosition } from './useCogPosition'

export function useTargetComponent(position: Reactive<CogPosition>) {
  const target = ref<HingeTarget>({ ...EMPTY_TARGET })
  const targetLabel = ref(EMPTY_TARGET.component)
  const selectedElement = shallowRef<Element | null>(null)
  const candidates = shallowRef<Element[]>([])
  const candidateIndex = ref(0)
  const candidateLabels = ref<string[]>([])

  function applySelection() {
    const list = candidates.value
    const idx = Math.min(candidateIndex.value, list.length - 1)
    const el = list[idx] ?? null
    selectedElement.value = el
    target.value = resolveTargetFromElement(el)
    targetLabel.value = formatTargetSummary(
      target.value,
      idx,
      list.length,
    )
  }

  function rebuildCandidates() {
    const raw = getCycleableTargetsAtPoint(position.x, position.y, COG_SIZE)
    // Deduplicate by combined component + DOM label
    const seen = new Set<string>()
    const deduped: Element[] = []
    const labels: string[] = []
    for (const el of raw) {
      const t = resolveTargetFromElement(el)
      const dom = describeElement(el)
      const label = dom !== t.component ? `${t.component} · ${dom}` : t.component
      if (!seen.has(label)) {
        seen.add(label)
        deduped.push(el)
        labels.push(label)
      }
    }
    candidates.value = deduped
    candidateLabels.value = labels

    // Preserve current selection if element still in list
    const currentEl = selectedElement.value
    if (currentEl && deduped.includes(currentEl)) {
      candidateIndex.value = deduped.indexOf(currentEl)
    } else {
      candidateIndex.value = 0
    }
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

  function selectCandidate(index: number) {
    if (index >= 0 && index < candidates.value.length) {
      candidateIndex.value = index
      applySelection()
    }
  }

  // Only re-scan when gear position changes (drag) or on explicit rebuild
  watch(
    () => [position.x, position.y],
    () => rebuildCandidates(),
  )

  /** Call this when user clicks/taps on the gear icon */
  function refreshOnUserAction() {
    rebuildCandidates()
  }

  onMounted(() => {
    rebuildCandidates()
  })

  return { target, targetLabel, selectedElement, cycleTarget, selectCandidate, updateHighlight: applySelection, candidateLabels, candidateIndex, refreshOnUserAction }
}
