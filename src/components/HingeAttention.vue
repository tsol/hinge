<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HingeTarget } from '../types/target'
import { useSelectionStore } from '../composables/useSelectionStore'

const props = defineProps<{
  target: HingeTarget
}>()

const { selection } = useSelectionStore()

const expanded = ref(false)

const displayName = computed(() =>
  selection.component || props.target.component || '—',
)

const displayLabel = computed(() =>
  selection.source === 'file' ? 'File' : 'Component',
)

const showDetails = computed(() =>
  selection.source === 'gear' && hasDetails()
)

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function hasDetails(): boolean {
  const t = props.target
  return !!(t.dom && t.dom !== t.component) || Object.keys(t.props).length > 0
}
</script>

<template>
  <div
    class="attention"
    :class="{ 'attention--expanded': expanded }"
    :style="{ cursor: showDetails ? 'pointer' : 'default' }"
    @click="showDetails && (expanded = !expanded)"
  >
    <div class="attention__head">
      <span class="attention__label">{{ displayLabel }}</span>
      <span class="attention__name">{{ displayName }}</span>
      <span v-if="showDetails" class="attention__chevron">{{ expanded ? '▲' : '▼' }}</span>
    </div>

    <div v-if="expanded && showDetails" class="attention__body" @click.stop>
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
  </div>
</template>

<style scoped>
.attention {
  display: flex !important;
  flex-direction: column !important;
  background: #16162a !important;
  border: 1px solid #2a2a4a !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  flex-shrink: 0 !important;
  overflow: hidden !important;
  transition: border-color 0.15s !important;
  margin: 4px 14px 0 !important;
}
.attention--expanded {
  border-color: #58a6ff !important;
}

.attention__head {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px 10px !important;
  min-width: 0 !important;
}

.attention__label {
  color: #888 !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.3px !important;
  flex-shrink: 0 !important;
}

.attention__name {
  flex: 1 !important;
  color: #c9d1d9 !important;
  font-weight: 700 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.attention__chevron {
  font-size: 9px !important;
  color: #666 !important;
  flex-shrink: 0 !important;
  width: 14px !important;
  text-align: center !important;
}

.attention__body {
  padding: 0 10px 10px !important;
  border-top: 1px solid #2a2a4a !important;
}

.attention__row {
  display: flex !important;
  align-items: baseline !important;
  gap: 8px !important;
  min-width: 0 !important;
  padding-top: 8px !important;
}

.attention__dom {
  color: #58a6ff !important;
  font-weight: 600 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.attention__props {
  display: grid !important;
  grid-template-columns: auto 1fr !important;
  gap: 2px 10px !important;
  margin: 0 !important;
  padding-top: 8px !important;
}

.attention__props dt {
  color: #888 !important;
  font-weight: 600 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px !important;
}

.attention__props dd {
  margin: 0 !important;
  color: #c9d1d9 !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
</style>
