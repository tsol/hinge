<template>
  <section class="dev-grid">
    <DevCard
      v-for="(card, i) in cards"
      :key="i"
      :title="card.title"
      :desc="card.desc"
      :highlighted="false"
      :details="details"
    />
  </section>
</template>

<script setup lang="ts">
import DevCard from './DevCard.vue'

defineProps<{
  cards: { title: string; desc: string }[]
  details: string
}>()
</script>

<style scoped>
.dev-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 0;
}
</style>
