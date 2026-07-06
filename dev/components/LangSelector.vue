<template>
  <div class="lang-switch">
    <button
      class="lang-btn"
      :class="{ 'lang-btn--active': locale === 'en' }"
      @click="$emit('update:locale', 'en')"
    >
      EN
    </button>
    <button
      class="lang-btn"
      :class="{ 'lang-btn--active': locale === 'ru' }"
      @click="$emit('update:locale', 'ru')"
    >
      RU
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Locale } from '../composables/useI18n'

defineProps<{ locale: Locale }>()
defineEmits<{ 'update:locale': [value: Locale] }>()
</script>

<style scoped>
.lang-switch {
  display: flex;
  gap: 2px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
}
.lang-btn {
  padding: 4px 10px;
  font-size: calc(11px * var(--dev-fs));
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #8b949e;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
}
.lang-btn:hover {
  color: #c9d1d9;
}
.lang-btn--active {
  color: #f0f6fc;
  background: #21262d;
}
</style>
