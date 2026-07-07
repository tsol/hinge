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
  type Dirent,
} from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { resolveAgentScripts, readPrompt } from './utils/config'
import { getHingeRoot, resolveInside, resolveQueueFolder } from './utils/pathSafety'
import { traceQueue, traceDebugSnapshot } from './utils/queueTrace'
import { withQueueDispatch } from './utils/queueDispatch'
import { parsePidFile, isForeignDispatchHost, type PidFileRecord } from './utils/dispatchHost'

export { isAgentSetupError } from './utils/agentReply'

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
    return parsePidFile(readFileSync(pidPath, 'utf-8')).pid
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
    const { pid, host } = parsePidFile(readFileSync(pidPath, 'utf-8'))
    if (!pid) return { liveness: 'stopped', elapsed }
    if (isForeignDispatchHost(host)) {
      return { liveness: 'running', pid, elapsed }
    }
    try {
      process.kill(pid, 0)
      return { liveness: 'running', pid, elapsed }
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code
      if (code === 'EPERM') return { liveness: 'running', pid, elapsed }
      if (code === 'ESRCH' && !existsSync(`/proc/${pid}`)) {
        return { liveness: 'running', pid, elapsed }
      }
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

/** Any live wrapper on disk — shared across HMR and duplicate API server processes. */
export function findActiveWrapperAlias(): string | null {
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return null

  let entries: Dirent[]
  try { entries = readdirSync(queueDir, { withFileTypes: true }) as Dirent[] } catch { return null }

  for (const e of entries) {
    if (!e.isFile() || !e.name.startsWith('.wrapper_') || !e.name.endsWith('.pid')) continue
    const pidPath = resolveInside(queueDir, e.name)
    if (!pidPath) continue
    const probe = probePidFile(pidPath)
    if (probe?.liveness === 'running') {
      return e.name.slice('.wrapper_'.length, -'.pid'.length)
    }
  }

  for (const e of entries) {
    if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
    const alias = taskAlias(e.name)
    const info = inspectWrapperByAlias(alias)
    if (info.liveness === 'running') return alias
  }

  return null
}

/** Wrapper claim file exists — do not recover when owned elsewhere or unverified. */
function hasWrapperClaim(alias: string): boolean {
  const rec = readWrapperClaim(alias)
  if (!rec) return false
  if (isForeignDispatchHost(rec.host)) return true
  return rec.pid !== null
}

function readWrapperClaim(alias: string): PidFileRecord | null {
  const queueDir = getHingeRoot()
  const claim = queueDir ? resolveInside(queueDir, `.wrapper_${alias}.pid`) : null
  if (!claim || !existsSync(claim)) return null
  try {
    return parsePidFile(readFileSync(claim, 'utf-8'))
  } catch {
    return null
  }
}

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

  const activeAlias = findActiveWrapperAlias()
  if (activeAlias) {
    const procName = `${activeAlias}_processing`
    if (resolveQueueFolder(procName)) runningTasks.add(procName)
  }

  for (const e of readdirSync(queueDir, { withFileTypes: true })) {
    if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
    const alias = taskAlias(e.name)
    if (inspectWrapperByAlias(alias).liveness === 'running') {
      runningTasks.add(e.name)
    }
  }
}

/**
 * Move `_processing` folders whose wrapper is not running to `_done`.
 * Uses `inspectWrapper()` — same PID probe as queue agentStatus / cancel.
 */
export function recoverDeadTasks(): number {
  return withQueueDispatch('recover_dead', () => recoverDeadTasksUnlocked()) ?? 0
}

function recoverDeadTasksUnlocked(): number {
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
    const alias = taskAlias(e.name)
    if (hasWrapperClaim(alias)) {
      traceQueue('recover_skip_claim', { folder: e.name, liveness })
      continue
    }
    // Skip only while wrapper process is actually alive — not stale RAM slot
    if (runningTasks.has(e.name) && inspectWrapper(folderPath, e.name).liveness === 'running') continue

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
        traceQueue('recover_dead', { folder: e.name, doneName, liveness })
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
  withQueueDispatch('run_chunk', () => runTaskChunkUnlocked(folderName))
}

function runTaskChunkUnlocked(folderName: string): void {
  syncRunningTasksFromDisk()
  const runningTasks = getRunningTasks()

  const folderPath = resolveQueueFolder(folderName)
  if (!folderPath) return

  // Disk is source of truth: alive wrapper → do not spawn again
  if (isWrapperAlive(folderPath)) {
    runningTasks.add(folderName)
    traceQueue('spawn_skip_alive', { folderName })
    return
  }

  if (runningTasks.has(folderName)) {
    const alias = taskAlias(folderName)
    const live = inspectWrapperByAlias(alias).liveness === 'running' || isWrapperAlive(folderPath)
    if (live) {
      console.log(`[hinge] Slot busy for ${folderName} — skipping duplicate spawn`)
      traceQueue('spawn_skip_busy', { folderName })
      return
    }
    // Stale in-memory slot — no wrapper on disk (e.g. sync added before spawn)
    runningTasks.delete(folderName)
    traceQueue('spawn_clear_stale_slot', { folderName })
  }

  runningTasks.add(folderName)

  const chatPath = resolveInside(folderPath, 'chat.md')
  if (!chatPath || !existsSync(chatPath)) {
    runningTasks.delete(folderName)
    const doneDest = resolveQueueFolder(folderName.replace('_processing', '_done'))
    if (doneDest) try { renameSync(folderPath, doneDest) } catch { /* ignore */ }
    tryStartNextTaskUnlocked()
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
    if (prompt) {
      agentInput = `Working in: ${process.cwd()}\n\n${prompt}` + '\n\n---\n\n' + agentInput
    }
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

    child.on('close', (code) => {
      traceQueue('wrapper_close', { folderName, alias, exitCode: code })
      const taskFolder =
        resolveQueueFolder(folderName)
        ?? resolveQueueFolder(folderName.replace('_processing', '_done'))
      void traceDebugSnapshot(`close:${alias}`, taskFolder ?? undefined)
      runningTasks.delete(folderName)
      syncRunningTasksFromDisk()
      tryStartNextTask()
    })

    child.on('error', (err) => {
      console.error(`[hinge] Agent spawn error for ${folderName}:`, err)
      traceQueue('wrapper_error', { folderName, alias, error: String(err) })
      runningTasks.delete(folderName)
      syncRunningTasksFromDisk()
      tryStartNextTask()
    })

    traceQueue('wrapper_spawn', {
      folderName,
      alias,
      scriptType,
      wrapperPid: child.pid,
      isFirstRun,
    })
    void traceDebugSnapshot(`spawn:${alias}`, folderPath)
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
  traceQueue('enqueue', { folderName, queueLen: taskQueue.length })
  tryStartNextTask()
}

/** Start the next task if no wrapper is running. */
export function tryStartNextTask(): void {
  withQueueDispatch('try_start', () => tryStartNextTaskUnlocked())
}

function tryStartNextTaskUnlocked(): void {
  syncRunningTasksFromDisk()
  const runningTasks = getRunningTasks()
  const taskQueue = getTaskQueue()

  const activeAlias = findActiveWrapperAlias()
  if (activeAlias) {
    const procName = `${activeAlias}_processing`
    if (resolveQueueFolder(procName)) runningTasks.add(procName)
    traceQueue('start_blocked_wrapper', { activeAlias, runningTasks: [...runningTasks] })
    return
  }

  if (runningTasks.size > 0) {
    traceQueue('start_blocked_slot', { runningTasks: [...runningTasks] })
    return
  }

  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!
    traceQueue('start_from_queue', { folderName: next, queueRemaining: taskQueue.length })
    runTaskChunkUnlocked(next)
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
    traceQueue('promote_wait', { waitName, processingName })
  } catch (e) {
    console.error(`[hinge] Failed to promote ${waitName} to _processing:`, e)
    traceQueue('promote_wait_failed', { waitName, error: String(e) })
    return
  }

  runTaskChunkUnlocked(processingName)
}

/** Startup + periodic maintenance: clean dead folders, then schedule. */
export function recoverAndSchedule(): { recovered: number } {
  const result = withQueueDispatch('recover_and_schedule', () => {
    const recovered = recoverDeadTasksUnlocked()
    if (recovered > 0) traceQueue('recover_and_schedule', { recovered })
    tryStartNextTaskUnlocked()
    return { recovered }
  })
  return result ?? { recovered: 0 }
}

/** For queue UI — always returns backend elapsed (pid mtime) when a pid file exists. */
export function getAgentStatus(folderName: string): {
  status: WrapperLiveness
  pid?: number
  elapsed?: number
} {
  const info = inspectWrapperByAlias(taskAlias(folderName))
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
