<template>
<!-- ро -->
  <section class="dev-grid">
    <DevCard
      v-for="(card, i) in cards"
      :key="i"
      :title="card.title"
      :desc="card.desc"
      :highlighted="i === highlightedIndex"
      @select="$emit('selectCard', i)"
    />

    <!-- Deeply nested block to test multi-level detection -->
    <DevNestedBlock :data="nestedData" />
  </section>
</template>

<script setup lang="ts">
import DevCard from './DevCard.vue'
import DevNestedBlock from './DevNestedBlock.vue'

defineProps<{
  cards: { title: string; desc: string }[]
  highlightedIndex: number
  nestedData: { label: string; items: { name: string; details: string }[] }
}>()

defineEmits<{ selectCard: [index: number] }>()
</script>

<style scoped>
.dev-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
</style>
