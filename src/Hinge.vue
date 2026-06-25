<template>
  <Teleport to="body">
    <div id="hinge-app">
      <HingeHighlight :rect="highlightRect" />

      <HingeCog
        :open="isOpen"
        :cog-style="cogStyle"
        :target-label="targetLabel"
        @pointerdown="onCogPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
        @contextmenu="onCogContextMenu"
      />

      <HingePanel
        v-if="isOpen"
        v-model="note"
        :target="target"
        @send="handleSend"
        @close="isOpen = false"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import './host'
import HingeCog from './components/HingeCog.vue'
import HingeHighlight from './components/HingeHighlight.vue'
import HingePanel from './components/HingePanel.vue'
import { useCogDrag } from './composables/useCogDrag'
import { useCogPosition } from './composables/useCogPosition'
import { useElementHighlight } from './composables/useElementHighlight'
import { useQueueSubmit } from './composables/useQueueSubmit'
import { useTargetComponent } from './composables/useTargetComponent'

const isOpen = ref(false)

const { position, cogStyle, clampPosition } = useCogPosition()
const { target, targetLabel, selectedElement, cycleTarget } =
  useTargetComponent(position)
const { rect: highlightRect, update: updateHighlightRect } =
  useElementHighlight(selectedElement)
const { note, sendNote } = useQueueSubmit({
  getTarget: () => target.value,
  getElement: () => selectedElement.value,
})

watch(selectedElement, () => updateHighlightRect())

function togglePanel() {
  isOpen.value = !isOpen.value
}

const { onCogPointerDown, onCogPointerMove, onCogPointerUp, onCogContextMenu } =
  useCogDrag({
    position,
    clampPosition,
    onTap: () => {
      cycleTarget()
      updateHighlightRect()
    },
    onPanelToggle: togglePanel,
  })

async function handleSend() {
  await sendNote(() => {
    isOpen.value = false
  })
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
