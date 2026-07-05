<template>
  <div class="dev-page">
    <DevHeader />

    <section class="dev-section">
      <h2 class="dev-section-title">Возможности</h2>
      <DevCardGrid
        :cards="cards"
        :highlighted-index="highlightedIndex"
        :nested-data="nestedData"
        @select-card="highlightedIndex = $event"
      />
    </section>

    <section class="dev-section">
      <h2 class="dev-section-title">Быстрый старт</h2>
      <DevList
        :items="items"
        :active-index="activeIndex"
        @select-item="activeIndex = $event"
      />
    </section>

    <DevFooter
      :highlighted-label="highlightedLabel"
      :active-label="activeLabel"
    />

    <section class="dev-section">
      <h2 class="dev-section-title">Неблокирующий тест</h2>
      <p class="dev-section-desc">Асинхронная задача не блокирует UI — тост появится при завершении.</p>
      <NonBlockBtn />
    </section>

    <Hinge />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Hinge from '../src/Hinge.vue'
import DevHeader from './components/DevHeader.vue'
import DevCardGrid from './components/DevCardGrid.vue'
import DevList from './components/DevList.vue'
import DevFooter from './components/DevFooter.vue'
import NonBlockBtn from '../src/components/NonBlockBtn.vue'
import ToastContainer from '../src/components/ToastContainer.vue'
import { useToast } from '../src/composables/useToast'

interface CardItem { title: string; desc: string }
interface NestedItem { name: string; details: string[] }
interface NestedData { label: string; items: NestedItem[] }

const cards: CardItem[] = [
  { title: '🧠 AI-кодинг', desc: 'Каждая задача отправляется Hermes Agent — агенту с полным доступом к твоему коду. Пиши на естественном языке — он поймёт.' },
  { title: '🎯 Выбор компонентов', desc: 'Кликни на шестерёнку → выбери любой элемент на странице. Hinge подсветит границы и определит Vue-компонент.' },
  { title: '📁 Прикрепление файлов', desc: 'Во вкладке Files открой дерево проекта и отметь нужные файлы галочкой. Контекст уходит агенту.' },
  { title: '🎤 Голосовой ввод', desc: 'Диктуй задачи вслух — микрофон запускает транскрибацию через faster-whisper. Прямо в браузере, прямо в текст.' },
  { title: '📋 Умная очередь', desc: 'Задачи живут в <code>.hinge/</code> как файловая очередь. Execute / Stop / Delete — управляй на лету.' },
  { title: '✎ Редактор кода', desc: 'Открой любой файл во вкладке Source, редактируй прямо в панели и сохраняй. Vite HMR подхватит изменения.' },
  { title: '🔬 Глубокий DOM', desc: 'Выбирай компоненты на любой глубине — от DevApp до DevNestedDetail. Hinge понимает вложенные структуры.' },
  { title: '🔔 Тост-уведомления', desc: 'Асинхронные задачи не блокируют UI. Когда задача выполнена — всплывает тост с результатом.' },
]

const nestedData: NestedData = {
  label: '🏗 Архитектура Hinge',
  items: [
    {
      name: 'Vite Plugin (plugin.ts)',
      details: ['Прокси /api/* → Hinge API сервер', 'Генерация скриптов: new-session.sh, continue-session.sh', 'Автовосстановление зависших _processing задач'],
    },
    {
      name: 'API Server (server.ts)',
      details: ['Управление очередью: POST /api/queue', 'Чтение/запись файлов: /api/raw-file, /api/write-file', 'Системный промпт: GET/POST /api/prompt'],
    },
    {
      name: 'Hermes Agent (chat -q)',
      details: ['Файловая очередь: _new → _wait → _processing → _done', 'Автосессии с resume через .sessions.json', 'Полный доступ к файловой системе проекта'],
    },
    {
      name: 'Vue Frontend (HingePanel)',
      details: ['Три вкладки: Input → Files → Source', 'Resizable drawer с сохранением ширины', 'Real-time polling логов выполнения'],
    },
  ],
}

const items = [
  { badge: '01', label: 'Кликни на шестерёнку и выбери компонент на странице' },
  { badge: '02', label: 'Напиши задачу на естественном языке в текстовое поле' },
  { badge: '03', label: 'Прикрепи нужные файлы через вкладку Files' },
  { badge: '04', label: 'Нажми «Добавить» — задача уходит в очередь Hermes' },
  { badge: '05', label: 'Следи за прогрессом и получай результат через тосты' },
]

const highlightedIndex = ref(0)
const activeIndex = ref(1)

const highlightedLabel = computed(() => {
  const c = cards[highlightedIndex.value]
  return c ? c.title : '—'
})

const activeLabel = computed(() => {
  const i = items[activeIndex.value]
  return i ? `${i.badge} · ${i.label}` : '—'
})

const { success } = useToast()
let cycleTimer: ReturnType<typeof setInterval> | null = null

watch(highlightedIndex, (idx) => {
  if (idx === 3 && !cycleTimer) {
    success('🔄 Карточка D: циклическое переключение запущено')
    cycleTimer = setInterval(() => {
      highlightedIndex.value = (highlightedIndex.value + 1) % 4
    }, 1200)
  }
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
.dev-section {
  margin-bottom: 40px;
}
.dev-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #f0f6fc;
  margin-bottom: 6px;
}
.dev-section-desc {
  font-size: 13px;
  color: #8b949e;
  margin-bottom: 12px;
}
</style>
