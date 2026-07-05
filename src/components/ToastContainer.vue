<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()
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
          @click="dismiss(t.id)"
        >
          <div class="toast__header">
            <span class="toast__icon">{{ t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️' }}</span>
            <span class="toast__msg">{{ t.message }}</span>
            <button class="toast__close">✕</button>
          </div>
          <div v-if="t.detail" class="toast__detail">{{ t.detail }}</div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed !important;
  bottom: 16px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 200000 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 8px !important;
  pointer-events: none !important;
  max-width: 90vw !important;
}

.toast {
  pointer-events: auto !important;
  background: #1c1c3a !important;
  border: 1px solid #3a3a5a !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
  min-width: 240px !important;
  max-width: 480px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
  cursor: pointer !important;
  transition: transform 0.2s, opacity 0.2s !important;
}

.toast--success {
  border-color: #238636 !important;
}

.toast--error {
  border-color: #da3633 !important;
}

.toast__header {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.toast__icon {
  flex-shrink: 0 !important;
  font-size: 14px !important;
}

.toast__msg {
  flex: 1 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #e0e0e0 !important;
  line-height: 1.3 !important;
}

.toast__close {
  flex-shrink: 0 !important;
  border: none !important;
  background: transparent !important;
  color: #8b949e !important;
  cursor: pointer !important;
  font-size: 10px !important;
  padding: 2px !important;
}

.toast__detail {
  margin-top: 4px !important;
  font-size: 11px !important;
  color: #8b949e !important;
  line-height: 1.4 !important;
  max-height: 60px !important;
  overflow: hidden !important;
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
