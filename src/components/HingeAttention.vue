<script setup lang="ts">
import type { HingeTarget } from '../types/target'

defineProps<{
  target: HingeTarget
}>()

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>

<template>
  <div class="attention">
    <div class="attention__row">
      <span class="attention__label">Component</span>
      <span class="attention__name">{{ target.component }}</span>
    </div>

    <div v-if="target.dom && target.dom !== target.component" class="attention__row">
      <span class="attention__label">DOM</span>
      <span class="attention__dom">{{ target.dom }}</span>
    </div>

    <dl v-if="Object.keys(target.props).length" class="attention__props">
      <template v-for="(value, key) in target.props" :key="key">
        <dt>{{ key }}</dt>
        <dd>{{ formatValue(value) }}</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.attention {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  padding: 8px 10px !important;
  background: #f0f4ff !important;
  border: 1px solid #c8d6f5 !important;
  border-radius: 4px !important;
  font-size: 13px !important;
  flex-shrink: 0 !important;
}

.attention__row {
  display: flex !important;
  align-items: baseline !important;
  gap: 8px !important;
  min-width: 0 !important;
}

.attention__label {
  color: #5a6478 !important;
  font-weight: 600 !important;
  flex-shrink: 0 !important;
}

.attention__name,
.attention__dom {
  color: #1a3f8f !important;
  font-weight: 700 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.attention__props {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  gap: 2px 10px !important;
  margin: 0 !important;
  padding-top: 4px !important;
  border-top: 1px solid #d8e4fb !important;
}

.attention__props dt {
  color: #5a6478 !important;
  font-weight: 600 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
}

.attention__props dd {
  margin: 0 !important;
  color: #1a3f8f !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
</style>
