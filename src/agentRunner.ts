/**
 * Agent task queue
 *
 * ## Roles
 *
 * **Wrapper** (`.hinge/.agent-wrapper.sh`, detached bash):
 *   Runs user script → appends **Assistant:** to chat.md → mv `_processing` → `_done`.
 *   Writes `.pid` while alive. Server never writes chat.md or renames on success.
 *
 * **Server** (this module):
 *   Promotes `_wait` → `_processing`, spawns one wrapper per folder, tracks in-memory slot.
 *   On wrapper exit: free slot, maybe recover dead folder, start next `_wait`.
 *
 * **Recovery** (`recoverDeadTasks`):
 *   Only for `_processing` folders whose `.pid` is missing or dead → rename to `_done`.
 *   Never re-spawns the agent on a stuck folder.
 *
 * ## Why recovery exists
 *
 * Vite HMR reloads this module but detached wrappers keep running. In-memory `runningTasks`
 * resets; recovery re-syncs from `.pid` on disk and cleans up crashed wrappers.
 */

import {
  readFileSync, readdirSync, existsSync,
  appendFileSync, unlinkSync, renameSync, statSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { resolveAgentScripts, readPrompt } from './utils/config'
import { getHingeRoot, resolveInside, resolveQueueFolder } from './utils/pathSafety'

// ── Persistent in-memory state (survives Vite HMR module reload) ─────────────

function getRunningTasks(): Set<string> {
  const g = globalThis as Record<string, unknown>
  if (!g.__hinge_running_tasks) g.__hinge_running_tasks = new Set<string>()
  return g.__hinge_running_tasks as Set<string>
}

function getTaskQueue(): string[] {
  const g = globalThis as Record<string, unknown>
  if (!g.__hinge_task_queue) g.__hinge_task_queue = []
  return g.__hinge_task_queue as string[]
}

// ── Wrapper PID on disk (written only by .agent-wrapper.sh) ─────────────────

export function readWrapperPid(folderPath: string): number | null {
  const pidPath = resolveInside(folderPath, '.pid')
  if (!pidPath || !existsSync(pidPath)) return null
  try {
    const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
    return pid && !isNaN(pid) ? pid : null
  } catch {
    return null
  }
}

export function isWrapperAlive(folderPath: string): boolean {
  const pid = readWrapperPid(folderPath)
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Reconcile in-memory slot with disk after HMR or before scheduling. */
export function syncRunningTasksFromDisk(): void {
  const runningTasks = getRunningTasks()
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return

  for (const name of [...runningTasks]) {
    const folderPath = resolveQueueFolder(name)
    if (!folderPath || !existsSync(folderPath) || !isWrapperAlive(folderPath)) {
      runningTasks.delete(name)
    }
  }

  for (const e of readdirSync(queueDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
    const folderPath = resolveQueueFolder(e.name)
    if (folderPath && isWrapperAlive(folderPath)) {
      runningTasks.add(e.name)
    }
  }
}

/**
 * Move `_processing` folders with dead/missing wrapper PID to `_done`.
 * Does NOT start new agent runs on those folders.
 */
export function recoverDeadTasks(): number {
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return 0

  const runningTasks = getRunningTasks()
  let recovered = 0

  for (const e of readdirSync(queueDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
    const folderPath = resolveQueueFolder(e.name)
    if (!folderPath || isWrapperAlive(folderPath)) continue

    const pidPath = resolveInside(folderPath, '.pid')
    if (pidPath) try { unlinkSync(pidPath) } catch { /* ignore */ }

    const doneName = e.name.replace('_processing', '_done')
    const doneDest = resolveQueueFolder(doneName)
    try {
      if (doneDest) {
        renameSync(folderPath, doneDest)
        console.log(`[hinge] Recovered dead task: ${e.name} → ${doneName}`)
        recovered++
      }
    } catch (err) {
      console.error(`[hinge] Failed to recover ${e.name}:`, err)
    }
    runningTasks.delete(e.name)
  }

  return recovered
}

// ── Prompt helpers ─────────────────────────────────────────────────────────

function injectAttachments(folderPath: string, prompt: string): string {
  const attachDir = resolve(folderPath, 'attach')
  if (!existsSync(attachDir)) return prompt
  const files = readdirSync(attachDir, { withFileTypes: true })
    .filter(e => e.isFile() && !e.name.startsWith('.'))
    .map(e => resolve(attachDir, e.name))
  if (files.length === 0) return prompt
  return prompt + '\n\n---\n**Attached files:**\n' +
    files.map(p => `- \`${p}\``).join('\n') +
    '\n\nYou can read any of these files to understand the context. When modifying them, write back to the same paths.\n'
}

function extractLastUserMessage(content: string): string {
  const sections = content.split(/\n---\n/)
  for (let i = sections.length - 1; i >= 0; i--) {
    const match = sections[i].match(/^\*\*User:\*\*\n([\s\S]*)/)
    if (match) return match[1].trim()
  }
  return content.trim()
}

// ── Spawn one wrapper for a _processing folder ─────────────────────────────

export function runTaskChunk(folderName: string): void {
  syncRunningTasksFromDisk()
  const runningTasks = getRunningTasks()

  const folderPath = resolveQueueFolder(folderName)
  if (!folderPath) return

  // Disk is source of truth: alive wrapper → do not spawn again
  if (isWrapperAlive(folderPath)) {
    runningTasks.add(folderName)
    return
  }

  if (runningTasks.has(folderName)) {
    console.log(`[hinge] Slot busy for ${folderName} — skipping duplicate spawn`)
    return
  }

  runningTasks.add(folderName)

  const chatPath = resolveInside(folderPath, 'chat.md')
  if (!chatPath || !existsSync(chatPath)) {
    runningTasks.delete(folderName)
    const doneDest = resolveQueueFolder(folderName.replace('_processing', '_done'))
    if (doneDest) try { renameSync(folderPath, doneDest) } catch { /* ignore */ }
    tryStartNextTask()
    return
  }

  const scripts = resolveAgentScripts()
  const alias = folderName.replace(/_processing$/, '')
  const sessionMarker = resolve(folderPath, '.session')
  const isFirstRun = !existsSync(sessionMarker)
  const content = readFileSync(chatPath, 'utf-8')

  let agentInput: string
  const scriptType = isFirstRun ? 'new' : 'continue'

  if (isFirstRun) {
    agentInput = injectAttachments(folderPath, content)
    const prompt = readPrompt()
    if (prompt) agentInput = prompt + '\n\n---\n\n' + agentInput
  } else {
    agentInput = extractLastUserMessage(content)
  }

  const logPath = resolve(folderPath, 'chat.log')
  try {
    appendFileSync(logPath, `=== Agent run started: ${new Date().toISOString()} ===\n`, 'utf-8')
  } catch { /* ignore */ }

  try {
    const child = spawn('/bin/bash', [scripts.wrapper, alias, scriptType], {
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    })
    child.unref()

    child.stdin.write(agentInput)
    child.stdin.end()

    child.stderr.on('data', (d: Buffer) => {
      try { appendFileSync(logPath, d.toString(), 'utf-8') } catch { /* ignore */ }
    })

    child.on('close', () => {
      runningTasks.delete(folderName)

      // Happy path: wrapper renamed folder to _done
      if (!existsSync(folderPath)) {
        tryStartNextTask()
        return
      }

      // Wrapper exited but folder still _processing — dead wrapper, let recovery rename
      console.log(`[hinge] Wrapper exited without rename for ${folderName} — recovering`)
      recoverDeadTasks()
      tryStartNextTask()
    })

    child.on('error', (err) => {
      console.error(`[hinge] Agent spawn error for ${folderName}:`, err)
      runningTasks.delete(folderName)
      recoverDeadTasks()
      tryStartNextTask()
    })
  } catch {
    runningTasks.delete(folderName)
    tryStartNextTask()
  }
}

// ── Queue scheduling ─────────────────────────────────────────────────────────

export function enqueueTask(folderName: string): void {
  syncRunningTasksFromDisk()
  const runningTasks = getRunningTasks()
  const taskQueue = getTaskQueue()
  if (runningTasks.has(folderName) || taskQueue.includes(folderName)) return
  taskQueue.push(folderName)
  tryStartNextTask()
}

/** Start the next task if no wrapper is running. */
export function tryStartNextTask(): void {
  syncRunningTasksFromDisk()
  const runningTasks = getRunningTasks()
  const taskQueue = getTaskQueue()

  if (runningTasks.size > 0) return

  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!
    runTaskChunk(next)
    return
  }

  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return

  const waitFolders = readdirSync(queueDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.endsWith('_wait'))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (waitFolders.length === 0) return

  const waitName = waitFolders[0].name
  const processingName = waitName.replace('_wait', '_processing')
  const waitPath = resolveQueueFolder(waitName)
  const processingPath = resolveQueueFolder(processingName)
  if (!waitPath || !processingPath) return

  try {
    renameSync(waitPath, processingPath)
  } catch (e) {
    console.error(`[hinge] Failed to promote ${waitName} to _processing:`, e)
    return
  }

  runTaskChunk(processingName)
}

/** Startup + periodic maintenance: clean dead folders, then schedule. */
export function recoverAndSchedule(): { recovered: number } {
  const recovered = recoverDeadTasks()
  tryStartNextTask()
  return { recovered }
}

/** For queue UI: is wrapper running for this processing folder? */
export function getAgentStatus(folderName: string): {
  status: string
  pid?: number
  elapsed?: number
} | null {
  if (!folderName.endsWith('_processing')) return null
  const folderPath = resolveQueueFolder(folderName)
  if (!folderPath) return null

  const pidPath = resolveInside(folderPath, '.pid')
  let elapsed: number | undefined

  if (pidPath && existsSync(pidPath)) {
    elapsed = Math.floor((Date.now() - statSync(pidPath).mtimeMs) / 1000)
    const pid = readWrapperPid(folderPath)
    if (pid && isWrapperAlive(folderPath)) {
      return { status: 'running', pid, elapsed }
    }
    return { status: 'stopped', elapsed }
  }

  const stem = folderName.replace(/_processing$/, '')
  const ts = stem.split('_')[0]
  if (ts) {
    const fixed = ts.replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, '$1T$2:$3:$4')
    const startMs = new Date(fixed).getTime()
    if (!isNaN(startMs)) elapsed = Math.floor((Date.now() - startMs) / 1000)
  }
  return { status: 'no_pid', elapsed }
}

export function isTaskRunning(folderName: string): boolean {
  syncRunningTasksFromDisk()
  return getRunningTasks().has(folderName)
}

export function clearTaskFromQueue(folderName: string): void {
  getRunningTasks().delete(folderName)
  const taskQueue = getTaskQueue()
  const idx = taskQueue.indexOf(folderName)
  if (idx !== -1) taskQueue.splice(idx, 1)
}

export function hasRunningTasks(): boolean {
  syncRunningTasksFromDisk()
  return getRunningTasks().size > 0
}

export function getRunningTaskNames(): string[] {
  syncRunningTasksFromDisk()
  return [...getRunningTasks()]
}
