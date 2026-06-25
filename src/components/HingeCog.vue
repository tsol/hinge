<script setup lang="ts">
defineProps<{
  open: boolean
  cogStyle: Record<string, string>
  targetLabel: string
}>()

defineEmits<{
  pointerdown: [event: PointerEvent]
  pointermove: [event: PointerEvent]
  pointerup: [event: PointerEvent]
  pointercancel: [event: PointerEvent]
  contextmenu: [event: MouseEvent]
}>()
</script>

<template>
  <div class="cog-wrap" :style="cogStyle">
    <div
      class="cog-icon"
      :class="{ 'cog-icon--open': open }"
      @pointerdown="$emit('pointerdown', $event)"
      @pointermove="$emit('pointermove', $event)"
      @pointerup="$emit('pointerup', $event)"
      @pointercancel="$emit('pointercancel', $event)"
      @contextmenu="$emit('contextmenu', $event)"
    >
      ⚙️
    </div>
    <div class="cog-target" aria-live="polite">{{ targetLabel }}</div>
  </div>
</template>

<style scoped>
.cog-wrap {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 40px !important;
  height: 40px !important;
  pointer-events: none !important;
  z-index: 100001 !important;
}

.cog-icon {
  width: 40px !important;
  height: 40px !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: grab !important;
  touch-action: none !important;
  pointer-events: auto !important;
  font-size: 28px !important;
  line-height: 1 !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

.cog-icon:active {
  cursor: grabbing !important;
}

.cog-icon--open {
  filter: drop-shadow(0 0 4px rgba(0, 123, 255, 0.6)) !important;
}

.cog-target {
  position: absolute !important;
  top: 44px !important;
  left: 0 !important;
  max-width: min(280px, 75vw) !important;
  padding: 4px 8px !important;
  background: rgba(26, 63, 143, 0.92) !important;
  color: #fff !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  border-radius: 4px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  pointer-events: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}
</style>
