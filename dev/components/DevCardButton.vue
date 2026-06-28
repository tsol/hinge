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
  font-size: 13px; font-weight: 400;
  color: #fff; background: #238636; border: 0;
  border-radius: 6px;
  width: auto; height: auto;
  min-width: 0; min-height: 0;
  opacity: 1; overflow: visible;
  text-align: center;
  cursor: pointer;
}
.dev-btn:hover { background: #2ea043; }
</style>
