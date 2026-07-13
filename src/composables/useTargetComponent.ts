import { computed, onMounted, ref, shallowRef, watch, type Reactive } from 'vue'
import { COG_SIZE } from '../constants'
import type { HingeTarget } from '../types/target'
import { EMPTY_TARGET } from '../types/target'
import { setGearTargetHighlight } from './useElementHighlights'
import { useSelectionStore } from './useSelectionStore'
import { getCycleableTargetsAtPoint, describeElement } from '../utils/domTarget'
import { resolveTargetFromElement } from '../utils/resolveTarget'
import type { CogPosition } from './useCogPosition'

const PREVIEW_DEBOUNCE_MS = 400

export function useTargetComponent(position: Reactive<CogPosition>) {
  const { previewFromGear, resolveFilePath } = useSelectionStore()

  const target = ref<HingeTarget>({ ...EMPTY_TARGET })
  const selectedElement = shallowRef<Element | null>(null)
  const candidateLabels = ref<string[]>([])
  const selectedIndex = ref(0)
  const userPinned = ref(false)

  const currentLabel = computed(
    () => candidateLabels.value[selectedIndex.value] ?? '(no elements)',
  )

  let previewTimer: ReturnType<typeof setTimeout> | null = null

  function applySelection() {
    const deduped = _dedupedElements.value
    if (deduped.length === 0) {
      selectedIndex.value = 0
      selectedElement.value = null
      target.value = { ...EMPTY_TARGET }
      setGearTargetHighlight(null)
      return
    }

    const idx = Math.min(selectedIndex.value, deduped.length - 1)
    selectedIndex.value = idx
    selectedElement.value = deduped[idx] ?? null
    target.value = resolveTargetFromElement(selectedElement.value)
    setGearTargetHighlight(selectedElement.value)
  }

  const _dedupedElements = shallowRef<Element[]>([])

  function rebuildCandidates() {
    // Convert position (layout coords) → visual coords for elementsFromPoint API
    const vv = window.visualViewport
    const vx = position.x - (vv?.offsetLeft ?? 0)
    const vy = position.y - (vv?.offsetTop ?? 0)
    const raw = getCycleableTargetsAtPoint(vx, vy, COG_SIZE)
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

    _dedupedElements.value = deduped
    candidateLabels.value = labels

    const prevEl = selectedElement.value
    if (userPinned.value && prevEl && deduped.includes(prevEl)) {
      selectedIndex.value = deduped.indexOf(prevEl)
    } else {
      selectedIndex.value = 0
      userPinned.value = false
    }

    applySelection()
  }

  function cycleTarget() {
    if (_dedupedElements.value.length === 0) {
      rebuildCandidates()
      return
    }
    userPinned.value = true
    selectedIndex.value = (selectedIndex.value + 1) % _dedupedElements.value.length
    applySelection()
  }

  function schedulePreviewMirror() {
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(async () => {
      previewTimer = null
      const t = target.value
      const comp = t.component
      if (!comp || comp === 'unknown' || !/^[A-Z]/.test(comp)) return

      const filePath = await resolveFilePath(comp)
      previewFromGear({ component: comp, filePath })
    }, PREVIEW_DEBOUNCE_MS)
  }

  watch(
    () => [position.x, position.y],
    () => rebuildCandidates(),
  )

  watch(
    () => [target.value.component, target.value.dom, JSON.stringify(target.value.props)] as const,
    () => schedulePreviewMirror(),
  )

  onMounted(() => {
    rebuildCandidates()
  })

  return {
    target,
    selectedElement,
    candidateLabels,
    currentLabel,
    cycleTarget,
  }
}
