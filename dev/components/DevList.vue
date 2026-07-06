<template>
  <section class="dev-list">
    <DevListItem
      v-for="(item, i) in items"
      :key="i"
      :badge="item.badge"
      :label="item.label"
      :active="false"
    />
  </section>
</template>

<script setup lang="ts">
import DevListItem from './DevListItem.vue'

defineProps<{
  items: { badge: string; label: string }[]
}>()
</script>

<style scoped>
.dev-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
