<template>
  <Teleport to="body">
    <div id="hinge-app">
      <HingeMenuToggle
        :menu-open="isOpen"
        @toggle="isOpen = !isOpen"
      />

      <HingeCog
        :open="isOpen"
        :component-list-open="componentListOpen"
        :cog-style="cogStyle"
        :position-x="position.x"
        :position-y="position.y"
        :always-on-top="alwaysOnTop"
        :candidate-labels="candidateLabels"
        :candidates="candidates"
        :model="model"
        :selected-element="selectedElement"
        @toggle-component="onToggleComponent"
        @toggle-list="toggleComponentList"
        @pointerdown="handleGearPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
      />

      <HingePanel
        v-if="isOpen"
        v-model="note"
        :target="target"
        :model="model"
        @send="handleSend"
        @close="isOpen = false"
      />

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import './host'
import HingeMenuToggle from './components/HingeMenuToggle.vue'
import HingeCog from './components/HingeCog.vue'
import HingePanel from './components/HingePanel.vue'
import { useCogDrag } from './composables/useCogDrag'
import { useCogPosition } from './composables/useCogPosition'
import { useQueueSubmit } from './composables/useQueueSubmit'
import { useTargetComponent } from './composables/useTargetComponent'
import { useTaskModel } from './composables/useTaskModel'
import {
  toggleComponentHighlight,
  refreshHighlights,
} from './composables/useElementHighlights'
import { resolveVueFromElement } from './utils/vueTarget'
import { formatPropsInline } from './utils/vueTarget'

const isOpen = ref(false)
const alwaysOnTop = ref(false)

const componentListOpen = ref(false)

onMounted(() => {
  alwaysOnTop.value = !!(window as any).__HINGE_DEFAULT_PROJECT
  document.addEventListener('click', onDocumentClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick, true)
})

const { position, cogStyle, clampPosition } = useCogPosition()
const {
  onCogPointerDown,
  onCogPointerMove,
  onCogPointerUp,
} = useCogDrag({
  position,
  clampPosition,
})

const { target, selectedElement, candidateLabels, candidates } = useTargetComponent(position)

const { note, sendNote } = useQueueSubmit()
const model = useTaskModel(note)

function handleGearPointerDown(e: PointerEvent) {
  if (candidates.value.length === 0) {
    useTargetComponent(position)
  }
  onCogPointerDown(e)
}

function toggleComponentList() {
  componentListOpen.value = !componentListOpen.value
}

function onDocumentClick(e: MouseEvent) {
  if (!componentListOpen.value) return
  const target = e.target as Node
  const cogWrap = document.querySelector('.cog-wrap')
  if (cogWrap && !cogWrap.contains(target)) {
    componentListOpen.value = false
  }
}

/** Extract relevant computed CSS values from an element */
function getComputedStyles(el: Element): Record<string, string> {
  if (!(el instanceof HTMLElement)) return {}
  const cs = getComputedStyle(el)
  const relevant = [
    'display', 'position', 'flex-direction', 'align-items', 'justify-content',
    'gap', 'padding', 'margin', 'font-size', 'font-weight', 'color',
    'background', 'background-color', 'border-radius', 'border',
    'width', 'height', 'min-width', 'min-height',
    'opacity', 'overflow', 'text-align', 'white-space',
  ]
  const out: Record<string, string> = {}
  for (const key of relevant) {
    const val = cs.getPropertyValue(key)
    if (val && val !== 'none' && val !== 'auto' && val !== 'normal') {
      out[key] = val
    }
  }
  return out
}

/**
 * Toggle a component from the gear dropdown.
 * Uses the composite label (e.g. "HingePanel · button \"Добавить\"") as the unique key.
 * Adds/removes from the task model + manages DOM highlight.
 */
function onToggleComponent(compositeKey: string, domEl: Element | null) {
  const inModel = model.hasComponent(compositeKey)
  if (inModel) {
    model.removeComponent(compositeKey)
  } else {
    const fields: Record<string, string> = {}
    // Save relative page URL to know which page the component was added from
    const url = window.location.pathname + window.location.search
    if (url) fields.Url = url
    // Extract Vue props & computed styles from the element
    if (domEl) {
      const vue = resolveVueFromElement(domEl)
      // Don't save props for Hinge's own UI components — their target prop causes infinite recursion
      if (!vue.component?.startsWith('Hinge')) {
        const propsStr = formatPropsInline(vue.props, 6)
        if (propsStr) fields.Props = propsStr
      }
      const styles = getComputedStyles(domEl)
      const styleStr = Object.entries(styles).map(([k, v]) => `${k}=${v}`).join(' ')
      if (styleStr) fields.Styling = styleStr
    }
    model.toggleComponent(compositeKey, fields)
  }
  if (domEl) {
    toggleComponentHighlight(compositeKey, domEl)
  }
}

watch(() => model.components.value.length, () => {
  refreshHighlights()
})

async function handleSend(onSuccess?: () => void) {
  await sendNote(note.value, onSuccess)
}
</script>

<style scoped>
#hinge-app {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 0 !important;
  height: 0 !important;
  overflow: visible !important;
  pointer-events: none !important;
  z-index: 100000 !important;
}
</style>
