<template>
  <div
    class="dev-list-item"
    :class="{ 'dev-list-item--active': active }"
    @click="$emit('select')"
  >
    <span class="dev-badge">{{ badge }}</span>
    <span>{{ label }}</span>
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
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 14px 20px;
  cursor: pointer;
  transition: border-color 0.15s;
  font-size: 14px;
}
.dev-list-item:hover { border-color: #58a6ff; }
.dev-list-item--active {
  border-color: #58a6ff;
  background: #1c2333;
}
.dev-badge {
  background: #21262d;
  color: #8b949e;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
