<template>
  <button class="dev-btn" @click="$emit('select')">
    {{ label }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
defineEmits<{ select: [] }>()
</script>

<style scoped>
.dev-btn {
  display: inline-block; position: static;
  flex-direction: row;
  padding: 6px 14px; margin: 0;
  font-size: calc(13px * var(--dev-fs)); font-weight: 400;
  color: #c9d1d9; background: #21262d; border: 1px solid #30363d;
  border-radius: 6px;
  width: auto; height: auto;
  min-width: 0; min-height: 0;
  opacity: 1; overflow: visible;
  text-align: center;
  cursor: pointer;
}
.dev-btn:hover { background: #30363d; border-color: #58a6ff; }
</style>
