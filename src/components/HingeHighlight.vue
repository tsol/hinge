<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rect: DOMRect | null
}>()

const style = computed(() => {
  const { rect } = props
  if (!rect) return { display: 'none' }

  return {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})
</script>

<template>
  <div class="hinge-highlight" :style="style" />
</template>

<style scoped>
.hinge-highlight {
  position: fixed !important;
  pointer-events: none !important;
  z-index: 99999 !important;
  box-sizing: border-box !important;
  box-shadow: inset 0 0 0 1px #2563eb !important;
  background: transparent !important;
}
</style>
