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
        :candidate-index="candidateIndex"
        :collapsed="collapsed"
        :collapsed-label="collapsedLabel"
        @pointerdown="handleGearPointerDown"
        @pointermove="onCogPointerMove"
        @pointerup="onCogPointerUp"
        @pointercancel="onCogPointerUp"
        @togglayer="onToggleLayer"
        @select="onSelectCandidate"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import './host'
import HingeMenuToggle from './components/HingeMenuToggle.vue'
import HingeCog from './components/HingeCog.vue'
import HingePanel from './components/HingePanel.vue'
import { useCogDrag } from './composables/useCogDrag'
import { useCogPosition } from './composables/useCogPosition'
import { useQueueSubmit } from './composables/useQueueSubmit'
import { useTargetComponent } from './composables/useTargetComponent'
import { useSelectionStore } from './composables/useSelectionStore'

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
const { target, candidateLabels, candidateIndex, selectCandidate, refreshOnUserAction } = useTargetComponent(position)

const collapsedLabel = computed(() => {
  const t = target.value
  return t.component || t.dom || 'unknown'
})

const { note, sendNote } = useQueueSubmit({
  getTarget: () => target.value,
  getElement: () => null,
})

function handleGearPointerDown(e: PointerEvent) {
  refreshOnUserAction()
  onCogPointerDown(e)
}

function startCollapseTimer() {
  clearTimeout(collapseTimer)
  collapseTimer = setTimeout(() => {
    collapsed.value = true
  }, 3000)
}

function resetCollapse() {
  collapsed.value = false
  clearTimeout(collapseTimer)
  startCollapseTimer()
}

onMounted(() => {
  startCollapseTimer()
})

onUnmounted(() => {
  clearTimeout(collapseTimer)
})

// When position changes (user moves gear) → expand + reset timer
watch(
  () => [position.x, position.y],
  () => resetCollapse(),
)

function onToggleLayer() {
  gearLayerActive.value = !gearLayerActive.value
}

function onSelectCandidate(index: number) {
  selectCandidate(index)
  resetCollapse()
}

// Sync gear selection → unified store
const { selection: storeSel, fromGear } = useSelectionStore()

watch(
  () => target.value.component,
  async (comp) => {
    if (!comp) return
    const t = target.value
    await fromGear(comp, t.dom, t.url, t.props)
  },
  { immediate: true },
)

async function handleSend(onSuccess?: () => void) {
  await sendNote(onSuccess)
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
