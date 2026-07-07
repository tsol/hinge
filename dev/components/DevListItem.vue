<template>
  <div
    class="dev-list-item"
    :class="{ 'dev-list-item--active': active }"
    @click="$emit('select')"
  >
    <span class="dev-step">{{ badge }}</span>
    <span class="dev-step-label">{{ label }}</span>
    <span class="dev-step-check" v-if="active">✓</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ badge: string; label: string; active: boolean }>()
defineEmits<{ select: [] }>()
</script>

<style scoped>
.dev-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg,
    rgba(255, 50, 50, 0.14),
    rgba(255, 160, 30, 0.10),
    rgba(255, 215, 0, 0.08),
    rgba(50, 200, 50, 0.08),
    rgba(40, 130, 255, 0.10),
    rgba(160, 60, 255, 0.12));
  border: 1px solid rgba(160, 60, 255, 0.25);
  border-radius: 8px;
  padding: 14px 20px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  font-size: calc(14px * var(--dev-fs));
}
.dev-list-item:hover {
  border-color: #58a6ff;
  background: #1a2230;
}
.dev-list-item--active {
  border-color: #238636;
  background: #0d2818;
  box-shadow: 0 0 0 1px #238636;
}
.dev-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #21262d;
  color: #8b949e;
  font-size: calc(12px * var(--dev-fs));
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.dev-list-item--active .dev-step {
  background: #238636;
  color: #fff;
}
.dev-step-label {
  flex: 1;
  color: #c9d1d9;
}
.dev-step-check {
  color: #238636;
  font-weight: 700;
  font-size: calc(16px * var(--dev-fs));
  flex-shrink: 0;
}
</style>
