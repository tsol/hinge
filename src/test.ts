/**
 * Non-blocking execution test.
 *
 * Simulates multi-stage async agent work without blocking the UI.
 * Supports concurrent runs, cancellation, and progress reporting.
 */

export interface TestProgress {
  id: number
  stage: string
  detail: string
  elapsed: number
}

export type TestCallback = (progress: TestProgress) => void

let nextId = 1
const STAGES = [
  { stage: 'init', detail: 'Инициализация...', ms: 400 },
  { stage: 'parse', detail: 'Разбор запроса...', ms: 600 },
  { stage: 'execute', detail: 'Выполнение...', ms: 800 },
  { stage: 'verify', detail: 'Проверка результата...', ms: 500 },
  { stage: 'done', detail: 'Готово ✓', ms: 0 },
]

/**
 * Run a single non-blocking test cycle.
 * Calls `onProgress` after each stage with elapsed time from start.
 * Resolves with the final result when complete.
 *
 * Multiple calls run concurrently — UI stays responsive before,
 * during, and after each run.
 */
export function runTest(onProgress?: TestCallback): Promise<string> {
  const id = nextId++
  const start = performance.now()

  return (async () => {
    for (const s of STAGES) {
      await new Promise((r) => setTimeout(r, s.ms))
      const elapsed = Math.round(performance.now() - start)
      onProgress?.({ id, stage: s.stage, detail: s.detail, elapsed })
    }
    return `Тест #${id} завершён за ${Math.round(performance.now() - start)}ms`
  })()
}

/**
 * Run multiple concurrent tests.
 * Returns a promise that resolves when all complete.
 */
export function runSuite(
  count: number,
  onProgress?: TestCallback,
): Promise<string[]> {
  const runners: Promise<string>[] = []
  for (let i = 0; i < count; i++) {
    runners.push(runTest(onProgress))
  }
  return Promise.all(runners)
}
