<template>
  <div class="nested-detail">
    <code>{{ detail }}</code>
  </div>
</template>

<script setup lang="ts">
defineProps<{ detail: string }>()
</script>

<style scoped>
.nested-detail {
  padding: 2px 0;
  font-size: calc(11px * var(--dev-fs));
  color: #8b949e;
}
.nested-detail code {
  color: #58a6ff;
}
</style>
