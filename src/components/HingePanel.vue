<script setup lang="ts">
import HingeAttention from './HingeAttention.vue'

import type { HingeTarget } from '../types/target'

const note = defineModel<string>({ required: true })

defineProps<{
  target: HingeTarget
}>()

defineEmits<{
  send: []
  close: []
}>()
</script>

<template>
  <div class="panel">
    <HingeAttention :target="target" />
    <textarea v-model="note" placeholder="Enter queue info..."></textarea>
    <div class="actions">
      <button type="button" @click="$emit('send')">Send</button>
      <button type="button" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: auto !important;
  max-width: 100% !important;
  max-height: min(36dvh, 280px) !important;
  padding: 12px !important;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
  background: #ffffff !important;
  border-top: 2px solid #e0e0e0 !important;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1) !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  box-sizing: border-box !important;
  pointer-events: auto !important;
  z-index: 100000 !important;
  overflow: hidden !important;
}

textarea {
  flex: 1 !important;
  min-height: 0 !important;
  width: 100% !important;
  resize: none !important;
  padding: 10px !important;
  border: 1px solid #ccc !important;
  border-radius: 4px !important;
  box-sizing: border-box !important;
  font-size: 16px !important;
}

.actions {
  display: flex !important;
  gap: 10px !important;
  justify-content: flex-end !important;
  flex-shrink: 0 !important;
}

button {
  padding: 8px 16px !important;
  border: none !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  background: #007bff !important;
  color: white !important;
}

button:last-child {
  background: #6c757d !important;
}
</style>
