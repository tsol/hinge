<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss, toggleExpand } = useToast()
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
            v-html="t.detail"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed !important;
  bottom: var(--hinge-spacing-lg, 16px) !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 200000 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: var(--hinge-spacing-md, 8px) !important;
  pointer-events: none !important;
  padding: 0 var(--hinge-spacing-sm, 12px) !important;
}

.toast {
  pointer-events: auto !important;
  background: #1c1c3a !important;
  border-radius: 8px !important;
  padding: var(--hinge-spacing-sm, 12px) var(--hinge-spacing-lg, 16px) !important;
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
  gap: var(--hinge-spacing-md, 8px) !important;
}

.toast__msg {
  flex: 1 !important;
  font-size: var(--hinge-fs-14, 14px) !important;
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
  font-size: var(--hinge-fs-12, 12px) !important;
  padding: 4px !important;
  line-height: 1 !important;
}

.toast__close:hover {
  color: rgba(255,255,255,0.9) !important;
}

.toast__detail {
  margin-top: var(--hinge-spacing-sm, 6px) !important;
  font-size: var(--hinge-fs-12, 12px) !important;
  color: rgba(255,255,255,0.7) !important;
  line-height: 1.4 !important;
  overflow: hidden !important;
  white-space: nowrap !important;
  text-overflow: ellipsis !important;
  max-height: 1.4em !important;
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

<!--
  Unscoped: v-html content doesn't get Vue data attributes,
  so scoped selectors won't reach rendered markdown elements.
-->
<style>
.toast__detail strong {
  color: rgba(255,255,255,0.95) !important;
  font-weight: 700 !important;
}

.toast__detail em {
  font-style: italic !important;
}

.toast__detail code {
  background: rgba(255,255,255,0.12) !important;
  padding: 1px 4px !important;
  border-radius: 3px !important;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
  font-size: var(--hinge-fs-11, 11px) !important;
}

.toast__detail pre {
  background: rgba(0,0,0,0.35) !important;
  border-radius: 4px !important;
  padding: 6px 8px !important;
  margin: 4px 0 !important;
  overflow-x: auto !important;
}

.toast__detail pre code {
  background: none !important;
  padding: 0 !important;
  font-size: var(--hinge-fs-11, 11px) !important;
  line-height: 1.35 !important;
}

.toast__detail ul,
.toast__detail ol {
  margin: 2px 0 !important;
  padding-left: 18px !important;
}

.toast__detail li {
  margin: 1px 0 !important;
}

.toast__detail a {
  color: #6af !important;
  text-decoration: underline !important;
}

.toast__detail h3,
.toast__detail h4,
.toast__detail h5,
.toast__detail h6 {
  margin: 6px 0 2px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
}

.toast__detail h3 { font-size: var(--hinge-fs-13, 13px) !important; }
.toast__detail h4 { font-size: var(--hinge-fs-12, 12px) !important; }
.toast__detail h5 { font-size: var(--hinge-fs-12, 12px) !important; }

.toast__detail blockquote {
  border-left: 3px solid rgba(255,255,255,0.3) !important;
  padding-left: 8px !important;
  margin: 4px 0 !important;
  color: rgba(255,255,255,0.6) !important;
}

.toast__detail hr {
  border: none !important;
  border-top: 1px solid rgba(255,255,255,0.15) !important;
  margin: 6px 0 !important;
}

.toast__detail p {
  margin: 2px 0 !important;
}

.toast__detail table {
  border-collapse: collapse !important;
  margin: 4px 0 !important;
  font-size: var(--hinge-fs-11, 11px) !important;
  width: 100% !important;
}
.toast__detail th,
.toast__detail td {
  border: 1px solid rgba(255,255,255,0.15) !important;
  padding: 3px 6px !important;
  text-align: left !important;
}
.toast__detail th {
  background: rgba(255,255,255,0.08) !important;
  font-weight: 700 !important;
  color: rgba(255,255,255,0.9) !important;
}
.toast__detail td {
  color: rgba(255,255,255,0.7) !important;
}
.toast__detail th[right],
.toast__detail td[right] {
  text-align: right !important;
}
.toast__detail th[center],
.toast__detail td[center] {
  text-align: center !important;
}
</style>
