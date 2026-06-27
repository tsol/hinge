<template>
  <section class="dev-list">
    <DevListItem
      v-for="(item, i) in items"
      :key="i"
      :badge="item.badge"
      :label="item.label"
      :active="i === activeIndex"
      @select="$emit('selectItem', i)"
    />
  </section>
</template>

<script setup lang="ts">
import DevListItem from './DevListItem.vue'

defineProps<{
  items: { badge: string; label: string }[]
  activeIndex: number
}>()

defineEmits<{ selectItem: [index: number] }>()
</script>

<style scoped>
.dev-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 40px;
}
</style>
