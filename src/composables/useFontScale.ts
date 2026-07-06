import { computed, watch, onUnmounted, type ComputedRef } from 'vue'
import { usePersistedState } from './usePersistedState'

export type FontScaleLevel = 'compact' | 'comfort' | 'large'

const SCALE_MAP: Record<FontScaleLevel, number> = {
  compact: 1,
  comfort: 1.35,
  large: 1.85,
}

const SCALE_LABELS: Record<FontScaleLevel, string> = {
  compact: 'Compact',
  comfort: 'Comfort',
  large: 'Large',
}

const LEVELS: FontScaleLevel[] = ['compact', 'comfort', 'large']

/** Font sizes used across Hinge components — each will be scaled */
const FONT_SIZES = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32] as const

let styleEl: HTMLStyleElement | null = null

function injectStyles(level: FontScaleLevel) {
  const scale = SCALE_MAP[level]

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.setAttribute('data-hinge-font-scale', '')
    document.head.appendChild(styleEl)
  }

  const vars = FONT_SIZES.map(px => {
    const scaled = Math.round(px * scale * 10) / 10
    return `  --hinge-fs-${px}: ${scaled}px;`
  }).join('\n')

  const spacingVars = [
    `  --hinge-scale: ${scale};`,
    `  --hinge-unit: ${Math.round(scale * 10) / 10}px;`,
    `  --hinge-spacing-xs: ${Math.round(4 * scale * 10) / 10}px;`,
    `  --hinge-spacing-sm: ${Math.round(6 * scale * 10) / 10}px;`,
    `  --hinge-spacing-md: ${Math.round(8 * scale * 10) / 10}px;`,
    `  --hinge-spacing-lg: ${Math.round(12 * scale * 10) / 10}px;`,
    `  --hinge-spacing-xl: ${Math.round(16 * scale * 10) / 10}px;`,
  ].join('\n')

  styleEl.textContent = `:root {\n${vars}\n${spacingVars}\n}`
}

// Module-level reactive state — shared across all callers
const { state: fontState } = usePersistedState('fontScale', {
  level: 'comfort' as FontScaleLevel,
})

export function useFontScale() {
  // Apply on first call
  injectStyles(fontState.level as FontScaleLevel)

  // Watch for changes (single watch, module-managed)
  const stop = watch(
    () => fontState.level as FontScaleLevel,
    (newLevel) => injectStyles(newLevel),
  )

  onUnmounted(() => stop())

  function setLevel(newLevel: FontScaleLevel) {
    fontState.level = newLevel
  }

  const currentLevel: ComputedRef<FontScaleLevel> = computed(() => fontState.level as FontScaleLevel)

  return {
    level: currentLevel,
    setLevel,
    scale: computed(() => SCALE_MAP[currentLevel.value]),
    labels: SCALE_LABELS,
    levels: LEVELS,
  }
}
