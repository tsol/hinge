<template>
  <section class="dev-info">
    <div class="dev-info__row">
      <span class="dev-info__label">Выбранная фича:</span>
      <span class="dev-info__value">{{ highlightedLabel }}</span>
    </div>
    <div class="dev-info__row">
      <span class="dev-info__label">Активный шаг:</span>
      <span class="dev-info__value">{{ activeLabel }}</span>
    </div>
    <div class="dev-info__levels">
      Уровни: DevApp → DevCardGrid → DevCard → DevCardButton
      &nbsp;|&nbsp; DevApp → DevNestedBlock → DevNestedItem → DevNestedDetail
    </div>
    <div class="dev-info__footnote">
      Hinge v{{ version }} &middot; <a href="https://github.com/tsol/hinge" target="_blank" class="dev-info__link">GitHub</a>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  highlightedLabel: string
  activeLabel: string
}>()

// Try to read version from package.json at runtime
const version = '0.1.0'
</script>

<style scoped>
.dev-info {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 13px;
  margin-bottom: 40px;
}
.dev-info__row {
  display: flex;
  gap: 8px;
  line-height: 1.8;
}
.dev-info__label {
  color: #8b949e;
  flex-shrink: 0;
}
.dev-info__value {
  color: #f0f6fc;
  font-weight: 500;
}
.dev-info__levels {
  margin-top: 6px;
  font-size: 11px;
  color: #58a6ff;
  font-family: ui-monospace, 'SF Mono', monospace;
  line-height: 1.6;
}
.dev-info__footnote {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #21262d;
  font-size: 11px;
  color: #484f58;
}
.dev-info__link {
  color: #58a6ff;
  text-decoration: none;
}
.dev-info__link:hover {
  text-decoration: underline;
}
</style>
