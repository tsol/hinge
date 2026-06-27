<template>
  <section class="dev-info">
    <p><strong>Активный компонент:</strong> {{ highlightedLabel }}</p>
    <p><strong>Активный элемент списка:</strong> {{ activeLabel }}</p>
    <p class="dev-levels">
      Уровни вложенности: DevApp → DevCardGrid → DevCard → DevCardButton
      &nbsp;|&nbsp; DevApp → DevNestedBlock → DevNestedItem → DevNestedDetail
    </p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  highlightedLabel: string
  activeLabel: string
}>()
</script>

<style scoped>
.dev-info {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 13px;
  line-height: 1.8;
}
.dev-info p { color: #8b949e; }
.dev-info strong { color: #f0f6fc; }
.dev-levels {
  margin-top: 4px;
  font-size: 11px;
  color: #58a6ff;
  font-family: ui-monospace, 'SF Mono', monospace;
}
</style>
