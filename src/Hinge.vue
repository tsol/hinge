<template>
  <Teleport to="body">
    <div id="hinge-app">
      <HingeMenuToggle
        :menu-open="isOpen"
        @toggle="isOpen = !isOpen"
      />

      <HingeCog
        :open="isOpen"
        :cog-style="cogStyle"
        :position-x="position.x"
        :position-y="position.y"
        :layer-active="gearLayerActive"
        :candidate-labels="candidateLabels"
        :candidates="candidates"
        :model="model"
        :selected-element="selectedElement"
        :collapsed="collapsed"
        @toggle-component="onToggleComponent"
        @pointerdown="handleGearPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
        @togglayer="onToggleLayer"
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

const isOpen = ref(false)
const gearLayerActive = ref(false)

const collapsed = ref(false)
let collapseTimer: ReturnType<typeof setTimeout> | null = null

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
    // Force refresh candidates on gear click
    useTargetComponent(position)
  }
  onCogPointerDown(e)
}

/**
 * Toggle a component from the gear dropdown.
 * Adds/removes from the task model + manages DOM highlight.
 */
function onToggleComponent(compName: string, domEl: Element | null) {
  const inModel = model.hasComponent(compName)
  if (inModel) {
    model.removeComponent(compName)
  } else {
    model.toggleComponent(compName, { DOM: compName })
  }
  if (domEl) {
    toggleComponentHighlight(compName, domEl)
  }
}

function startCollapseTimer() {
  if (collapseTimer) clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    collapsed.value = true
  }, 3000)
}

function resetCollapse() {
  collapsed.value = false
  if (collapseTimer) clearTimeout(collapseTimer)
  startCollapseTimer()
}

onMounted(() => {
  startCollapseTimer()
})

onUnmounted(() => {
  if (collapseTimer) clearTimeout(collapseTimer)
})

watch(
  () => [position.x, position.y],
  () => resetCollapse(),
)

function onToggleLayer() {
  gearLayerActive.value = !gearLayerActive.value
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
