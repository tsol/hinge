<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss, toggleExpand } = useToast()

function detailPreview(text: string, maxLen = 80): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= maxLen) return oneLine
  return oneLine.slice(0, maxLen).trimEnd() + '…'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="'toast--' + t.type"
        >
          <div class="toast__header" @click="toggleExpand(t.id)">
            <span class="toast__msg">{{ t.message }}</span>
            <button class="toast__close" @click.stop="dismiss(t.id)">✕</button>
          </div>
          <div
            v-if="t.detail"
            class="toast__detail"
            :class="{ 'toast__detail--expanded': t.expanded }"
            @click="toggleExpand(t.id)"
          >
            <template v-if="t.expanded">{{ t.detail }}</template>
            <template v-else>{{ detailPreview(t.detail) }}</template>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed !important;
  bottom: 16px !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 200000 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8px !important;
  pointer-events: none !important;
  padding: 0 12px !important;
}

.toast {
  pointer-events: auto !important;
  background: #1c1c3a !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  width: 100% !important;
  max-width: 600px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
  cursor: pointer !important;
  transition: transform 0.2s, opacity 0.2s !important;
}

.toast--success {
  background: #1a4a1a !important;
}

.toast--error {
  background: #4a1a1a !important;
}

.toast__header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.toast__msg {
  flex: 1 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #e0e0e0 !important;
  line-height: 1.4 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.toast__close {
  flex-shrink: 0 !important;
  border: none !important;
  background: transparent !important;
  color: rgba(255,255,255,0.5) !important;
  cursor: pointer !important;
  font-size: 12px !important;
  padding: 4px !important;
  line-height: 1 !important;
}

.toast__close:hover {
  color: rgba(255,255,255,0.9) !important;
}

.toast__detail {
  margin-top: 6px !important;
  font-size: 12px !important;
  color: rgba(255,255,255,0.7) !important;
  line-height: 1.4 !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  max-height: 18px !important;
  transition: max-height 0.3s ease, white-space 0.3s ease !important;
}

.toast__detail--expanded {
  white-space: pre-wrap !important;
  overflow: auto !important;
  text-overflow: clip !important;
  max-height: 400px !important;
}

/* Full width on mobile */
@media (max-width: 480px) {
  .toast {
    max-width: 100% !important;
  }
}

/* Transition */
.toast-enter-active {
  animation: toast-in 0.25s ease-out !important;
}
.toast-leave-active {
  animation: toast-out 0.2s ease-in !important;
}

@keyframes toast-in {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes toast-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(20px); opacity: 0; }
}
</style>
