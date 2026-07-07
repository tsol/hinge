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
 *   Only for `_processing` folders where `inspectWrapper()` is not `running`.
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

// ── Wrapper liveness (.pid written by .agent-wrapper.sh) ───────────────────

export type WrapperLiveness = 'running' | 'stopped' | 'no_pid'

export interface WrapperLivenessInfo {
  liveness: WrapperLiveness
  pid?: number
  /** Seconds since .pid mtime, or folder-name timestamp when no .pid yet */
  elapsed?: number
}

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

function elapsedFromFolderName(folderName: string): number | undefined {
  const stem = folderName.replace(/_processing$/, '')
  const ts = stem.split('_')[0]
  if (!ts) return undefined
  const fixed = ts.replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, '$1T$2:$3:$4')
  const startMs = new Date(fixed).getTime()
  if (isNaN(startMs)) return undefined
  return Math.floor((Date.now() - startMs) / 1000)
}

function probePidFile(pidPath: string): WrapperLivenessInfo | null {
  if (!existsSync(pidPath)) return null
  const elapsed = Math.floor((Date.now() - statSync(pidPath).mtimeMs) / 1000)
  try {
    const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
    if (!pid || isNaN(pid)) return { liveness: 'stopped', elapsed }
    try {
      process.kill(pid, 0)
      return { liveness: 'running', pid, elapsed }
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code
      // EPERM = process exists but not signalable — still alive
      if (code === 'EPERM') return { liveness: 'running', pid, elapsed }
      return { liveness: 'stopped', pid, elapsed }
    }
  } catch {
    return { liveness: 'stopped', elapsed }
  }
}

function taskAlias(folderName: string): string {
  return folderName.replace(/_(new|wait|done|processing)$/, '')
}

function wrapperPidCandidates(folderPath: string, folderName: string): string[] {
  const alias = taskAlias(folderName)
  const queueDir = getHingeRoot()
  const paths: string[] = []

  const rootPid = queueDir ? resolveInside(queueDir, `.wrapper_${alias}.pid`) : null
  if (rootPid) paths.push(rootPid)

  const inFolder = resolveInside(folderPath, '.pid')
  if (inFolder) paths.push(inFolder)

  if (folderName.endsWith('_processing')) {
    const donePath = resolveQueueFolder(folderName.replace('_processing', '_done'))
    const donePid = donePath ? resolveInside(donePath, '.pid') : null
    if (donePid) paths.push(donePid)
  }

  return paths
}

/** Probe wrapper by task stem — survives _processing → _done rename during recovery race. */
export function inspectWrapperByAlias(alias: string): WrapperLivenessInfo {
  const queueDir = getHingeRoot()
  const paths: string[] = []

  const rootPid = queueDir ? resolveInside(queueDir, `.wrapper_${alias}.pid`) : null
  if (rootPid) paths.push(rootPid)

  for (const suffix of ['_processing', '_done'] as const) {
    const folderPath = resolveQueueFolder(`${alias}${suffix}`)
    if (!folderPath) continue
    const pidPath = resolveInside(folderPath, '.pid')
    if (pidPath) paths.push(pidPath)
  }

  for (const pidPath of paths) {
    const probe = probePidFile(pidPath)
    if (probe?.liveness === 'running') return probe
  }
  for (const pidPath of paths) {
    const probe = probePidFile(pidPath)
    if (probe) return probe
  }

  return { liveness: 'no_pid', elapsed: elapsedFromFolderName(`${alias}_processing`) }
}

/**
 * Single source of truth: read `.pid`, probe process with kill(0), derive elapsed.
 * Used by recovery, queue UI (agentStatus), cancel, and spawn guards.
 */
export function inspectWrapper(folderPath: string, folderName?: string): WrapperLivenessInfo {
  const name = folderName ?? folderPath.split(/[/\\]/).pop() ?? ''

  for (const pidPath of wrapperPidCandidates(folderPath, name)) {
    const probe = probePidFile(pidPath)
    if (probe?.liveness === 'running') return probe
  }
  for (const pidPath of wrapperPidCandidates(folderPath, name)) {
    const probe = probePidFile(pidPath)
    if (probe) return probe
  }

  return inspectWrapperByAlias(taskAlias(name))
}

/** True when wrapper bash process is alive (`.pid` + kill(0)). */
export function isWrapperAlive(folderPath: string): boolean {
  return inspectWrapper(folderPath).liveness === 'running'
}

/** Reconcile in-memory slot with disk after HMR or before scheduling. */
export function syncRunningTasksFromDisk(): void {
  const runningTasks = getRunningTasks()
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return

  for (const name of [...runningTasks]) {
    const alias = taskAlias(name)
    const folderPath = resolveQueueFolder(name)
    const alive = inspectWrapperByAlias(alias).liveness === 'running'
      || (folderPath !== null && existsSync(folderPath) && isWrapperAlive(folderPath))
    if (!alive) runningTasks.delete(name)
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
 * Move `_processing` folders whose wrapper is not running to `_done`.
 * Uses `inspectWrapper()` — same PID probe as queue agentStatus / cancel.
 */
export function recoverDeadTasks(): number {
  syncRunningTasksFromDisk()
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return 0

  const runningTasks = getRunningTasks()
  let recovered = 0

  for (const e of readdirSync(queueDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
    const folderPath = resolveQueueFolder(e.name)
    if (!folderPath) continue

    const { liveness } = inspectWrapper(folderPath, e.name)
    if (liveness === 'running') continue
    if (inspectWrapperByAlias(taskAlias(e.name)).liveness === 'running') continue
    // Spawn in flight — wrapper may not have written .pid yet
    if (runningTasks.has(e.name)) continue

    if (liveness === 'stopped') {
      const pidPath = resolveInside(folderPath, '.pid')
      if (pidPath) try { unlinkSync(pidPath) } catch { /* ignore */ }
    }

    const doneName = e.name.replace('_processing', '_done')
    const doneDest = resolveQueueFolder(doneName)
    try {
      if (doneDest) {
        renameSync(folderPath, doneDest)
        console.log(`[hinge] Recovered dead task: ${e.name} → ${doneName} (${liveness})`)
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
      syncRunningTasksFromDisk()
      tryStartNextTask()
    })

    child.on('error', (err) => {
      console.error(`[hinge] Agent spawn error for ${folderName}:`, err)
      runningTasks.delete(folderName)
      syncRunningTasksFromDisk()
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

/** For queue UI and GET /wrapper — wrapper liveness for a queue folder or stem. */
export function getAgentStatus(folderName: string): {
  status: WrapperLiveness
  pid?: number
  elapsed?: number
} | null {
  const alias = taskAlias(folderName)
  const info = inspectWrapperByAlias(alias)
  if (info.liveness === 'no_pid') return null
  return { status: info.liveness, pid: info.pid, elapsed: info.elapsed }
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
