<template>
  <header class="dev-header">
    <div class="dev-header__bar">
      <div class="dev-header__top">
        <span class="dev-header__logo">⚙</span>
        <h1>Hinge</h1>
      </div>
      <LangSelector :locale="locale" @update:locale="setLocale" />
    </div>
    <p class="dev-sub">{{ text.headerSub }}</p>
    <div class="dev-badges">
      <span class="dev-badge-tag">⚡ Vite Plugin</span>
      <span class="dev-badge-tag">📱 Mobile Friendly</span>
      <span class="dev-badge-tag">🔌 Agent Agnostic</span>
      <span class="dev-badge-tag">📦 Open Source</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LangSelector from './LangSelector.vue'
import { useI18n } from '../composables/useI18n'
import { t } from '../translations'

const { locale, setLocale } = useI18n()
const text = computed(() => t(locale))
</script>

<style scoped>
.dev-header {
  margin-bottom: 36px;
  text-align: center;
}
.dev-header__bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 12px;
}
.dev-header__top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dev-header__logo {
  font-size: 32px;
  line-height: 1;
}
.dev-header h1 {
  font-size: 32px;
  color: #f0f6fc;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.dev-sub {
  color: #8b949e;
  font-size: 14px;
  line-height: 1.6;
  max-width: 580px;
  margin: 0 auto;
}
.dev-badges {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
  flex-wrap: wrap;
}
.dev-badge-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: #1c2333;
  color: #58a6ff;
  border: 1px solid rgba(88, 166, 255, 0.2);
}
</style>
