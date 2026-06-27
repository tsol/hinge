<template>
  <div class="nested-block">
    <div class="nested-block__header">{{ data.label }}</div>
    <DevNestedItem
      v-for="(item, i) in data.items"
      :key="i"
      :name="item.name"
      :details="item.details"
    />
  </div>
</template>

<script setup lang="ts">
import DevNestedItem from './DevNestedItem.vue'

defineProps<{
  data: { label: string; items: { name: string; details: string[] }[] }
}>()
</script>

<style scoped>
.nested-block {
  grid-column: 1 / -1;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px 20px;
}
.nested-block__header {
  font-size: 13px;
  font-weight: 600;
  color: #8b949e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
</style>
