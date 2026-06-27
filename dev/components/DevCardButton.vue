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
  background: #238636; color: #fff; border: none;
  border-radius: 6px; padding: 6px 14px;
  font-size: 13px; cursor: pointer;
}
.dev-btn:hover { background: #2ea043; }
</style>
