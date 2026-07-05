<template>
  <div class="dev-card" :class="{ 'dev-card--highlighted': highlighted }">
    <h3>{{ title }}</h3>
    <p>{{ desc }}</p>
    <DevCardButton label="Выделить" @select="$emit('select')" />
  </div>
</template>

<script setup lang="ts">
import DevCardButton from './DevCardButton.vue'
defineProps<{
  title: string
  desc: string
  highlighted: boolean
}>()
defineEmits<{ select: [] }>()
</script>

<style scoped>
.dev-card {
  background: #21262d; border: 1px solid #30363d;
  border-radius: 8px; padding: 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.dev-card--highlighted {
  border-color: #58a6ff; box-shadow: 0 0 0 1px #58a6ff;
}
.dev-card h3 { font-size: 16px; color: #f0f6fc; margin-bottom: 8px; }
.dev-card p { font-size: 13px; color: #8b949e; margin-bottom: 12px; }
</style>
