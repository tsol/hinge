<template>
  <div
    class="dev-card"
    :class="{ 'dev-card--highlighted': highlighted }"
  >
    <h3 class="dev-card__title">{{ title }}</h3>
    <p class="dev-card__desc" v-html="desc"></p>
    <DevCardButton :label="details" @select="$emit('select')" />
  </div>
</template>

<script setup lang="ts">
import DevCardButton from './DevCardButton.vue'
defineProps<{
  title: string
  desc: string
  highlighted: boolean
  details: string
}>()
defineEmits<{ select: [] }>()
</script>

<style scoped>
.dev-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
}
.dev-card:hover {
  border-color: #3a3a5a;
  transform: translateY(-1px);
}
.dev-card--highlighted {
  border-color: #58a6ff;
  box-shadow: 0 0 0 1px #58a6ff, 0 4px 16px rgba(88, 166, 255, 0.08);
}
.dev-card__title {
  font-size: calc(15px * var(--dev-fs));
  color: #f0f6fc;
  margin-bottom: 8px;
  line-height: 1.3;
}
.dev-card__desc {
  font-size: calc(12.5px * var(--dev-fs));
  color: #8b949e;
  margin-bottom: 14px;
  line-height: 1.55;
  flex: 1;
}
.dev-card__desc :deep(code) {
  background: #0d1117;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: calc(11px * var(--dev-fs));
  color: #f0f6fc;
}
</style>
