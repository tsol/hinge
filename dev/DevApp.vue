<template>
  <div class="dev-page">
    <DevHeader />

    <DevCardGrid
      :cards="cards"
      :highlighted-index="highlightedIndex"
      :nested-data="nestedData"
      @select-card="highlightedIndex = $event"
    />

    <DevList
      :items="items"
      :active-index="activeIndex"
      @select-item="activeIndex = $event"
    />

    <DevFooter
      :highlighted-label="highlightedLabel"
      :active-label="activeLabel"
    />

    <Hinge />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Hinge from '../src/Hinge.vue'
import DevHeader from './components/DevHeader.vue'
import DevCardGrid from './components/DevCardGrid.vue'
import DevList from './components/DevList.vue'
import DevFooter from './components/DevFooter.vue'
interface CardItem { title: string; desc: string }
interface NestedItem { name: string; details: string[] }
interface NestedData { label: string; items: NestedItem[] }

const cards: CardItem[] = [
  { title: 'Карточка A', desc: 'Нажми "Выделить" чтобы сделать активной' },
  { title: 'Карточка B', desc: 'Компонент с длинным текстом' },
  { title: 'Карточка C', desc: 'Ещё один элемент для теста' },
  { title: 'Карточка D', desc: 'Переключение циклическое' },
]

const nestedData: NestedData = {
  label: 'Глубокий блок (4 уровня вложенности)',
  items: [
    {
      name: 'Уровень 3 — Компонент A',
      details: ['field: value_a', 'status: ok', 'depth: 4 — DevNestedDetail'],
    },
    {
      name: 'Уровень 3 — Компонент B',
      details: ['field: value_b', 'status: pending'],
    },
  ],
}

const items = [
  { badge: 'ВХ', label: 'Вход' },
  { badge: 'РГ', label: 'Регистрация' },
  { badge: 'НС', label: 'Настройки' },
  { badge: 'ПФ', label: 'Профиль' },
  { badge: 'ВХ', label: 'Выход' },
]

const highlightedIndex = ref(0)
const activeIndex = ref(1)

const highlightedLabel = computed(() => {
  const c = cards[highlightedIndex.value]
  return c ? `${c.title} (card ${highlightedIndex.value + 1})` : '—'
})

const activeLabel = computed(() => {
  const i = items[activeIndex.value]
  return i ? `${i.badge} · ${i.label} (item ${activeIndex.value + 1})` : '—'
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
}
.dev-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
}
</style>
