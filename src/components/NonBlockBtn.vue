<template>
  <div class="nbt-wrap">
    <button
      id="test"
      class="nbt-btn"
      :disabled="runningCount > 0"
      @click="handleClick"
    >
      {{ runningCount > 0 ? `Выполняется (${runningCount})...` : 'Запустить неблокирующий тест' }}
    </button>

    <div v-if="runningCount > 0" class="nbt-progress">
      <div class="nbt-bar-track">
        <div class="nbt-bar-fill" :style="{ width: `${progressPct}%` }" />
      </div>
      <div class="nbt-stage">{{ currentStage }}</div>
    </div>

    <div v-if="logs.length" class="nbt-logs">
      <div v-for="(log, i) in logs" :key="i" class="nbt-log">
        <span class="nbt-log-time">{{ log.elapsed }}ms</span>
        <span class="nbt-log-msg">{{ log.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { runTest, runSuite, type TestProgress } from '../test'

const runningCount = ref(0)
const currentStage = ref('')
const progressPct = ref(0)
const logs = ref<Array<{ elapsed: number; text: string }>>([])

function onProgress(p: TestProgress) {
  currentStage.value = p.detail
  const idx = ['init', 'parse', 'execute', 'verify'].indexOf(p.stage)
  if (idx >= 0) progressPct.value = ((idx + 1) / 4) * 100
  logs.value.push({ elapsed: p.elapsed, text: p.detail })
}

async function handleClick() {
  runningCount.value++
  progressPct.value = 0
  currentStage.value = 'Старт...'

  runTest(onProgress)
    .then((result) => {
      logs.value.push({ elapsed: 0, text: result })
    })
    .finally(() => {
      runningCount.value--
      if (runningCount.value === 0) {
        currentStage.value = ''
      }
    })
}
</script>

<style scoped>
.nbt-wrap {
  margin: 12px 0;
}
.nbt-btn {
  padding: 10px 24px;
  border: 1px solid #30363d;
  border-radius: 6px;
  background: #21262d;
  color: #c9d1d9;
  cursor: pointer;
  font-size: 14px;
}
.nbt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.nbt-btn:not(:disabled):hover {
  background: #30363d;
}
.nbt-progress {
  margin-top: 8px;
}
.nbt-bar-track {
  width: 200px;
  height: 4px;
  background: #30363d;
  border-radius: 2px;
  overflow: hidden;
}
.nbt-bar-fill {
  height: 100%;
  background: #58a6ff;
  transition: width 0.2s ease;
}
.nbt-stage {
  margin-top: 4px;
  font-size: 12px;
  color: #8b949e;
}
.nbt-logs {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
}
.nbt-log {
  display: flex;
  gap: 8px;
}
.nbt-log-time {
  color: #484f58;
  min-width: 48px;
}
.nbt-log-msg {
  color: #c9d1d9;
}
</style>
