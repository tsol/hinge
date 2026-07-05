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
        :always-on-top="alwaysOnTop"
        :candidate-labels="candidateLabels"
        :candidates="candidates"
        :model="model"
        :selected-element="selectedElement"
        @pointerdown="onCogPointerDown"
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
import { ref, onMounted } from 'vue'
import './host'
import HingeMenuToggle from './components/HingeMenuToggle.vue'
import HingeCog from './components/HingeCog.vue'
import HingePanel from './components/HingePanel.vue'
import { useCogDrag } from './composables/useCogDrag'
import { useCogPosition } from './composables/useCogPosition'
import { useTargetComponent } from './composables/useTargetComponent'
import { useTaskModel } from './composables/useTaskModel'

const isOpen = ref(false)
const alwaysOnTop = ref(false)

onMounted(() => {
  alwaysOnTop.value = !!(window as any).__HINGE_DEFAULT_PROJECT
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

const model = useTaskModel()
const note = model.text

async function handleSend(onSuccess?: () => void) {
  const serialized = model.serialize()
  if (!serialized.trim()) return
  await fetch('/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: serialized }),
  })
  model.text.value = ''
  model.attachments.value = []
  onSuccess?.()
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
