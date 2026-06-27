<template>
  <div class="nested-item">
    <span class="nested-item__name">{{ name }}</span>
    <DevNestedDetail
      v-for="(d, i) in details"
      :key="i"
      :detail="d"
    />
  </div>
</template>

<script setup lang="ts">
import DevNestedDetail from './DevNestedDetail.vue'
defineProps<{ name: string; details: string[] }>()
</script>

<style scoped>
.nested-item {
  padding: 6px 10px;
  border-left: 2px solid #30363d;
  margin: 4px 0;
}
.nested-item__name {
  color: #f0f6fc;
  font-weight: 600;
  font-size: 12px;
}
</style>
