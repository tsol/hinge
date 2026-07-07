/**
 * Queue forensic logging → .hinge/queue-trace.log + snapshot files.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { getHingeRoot, getProjectRoot } from './pathSafety'
import { localDispatchHost } from './dispatchHost'
import { probeAgentScripts } from './config'

const execFileAsync = promisify(execFile)
const TRACE_FILE = 'queue-trace.log'
const SNAPSHOT_FILE = 'queue-snapshot.json'
const SNAPSHOTS_LOG = 'queue-snapshots.log'
const PORTS_FILE = 'queue-ports.txt'
const TASK_DEBUG_FILE = 'debug-server.json'

const SERVER_CTX_KEY = '__hinge_server_ctx'

export interface ServerContext {
  port: number
  startedAt: string
  mode: 'middleware' | 'standalone'
}

export function setServerContext(port: number, mode: ServerContext['mode']): void {
  const g = globalThis as Record<string, unknown>
  g[SERVER_CTX_KEY] = { port, startedAt: new Date().toISOString(), mode } satisfies ServerContext
}

export function getServerContext(): ServerContext | null {
  return (globalThis as Record<string, unknown>)[SERVER_CTX_KEY] as ServerContext | null
}

function hingeFile(name: string): string | null {
  const root = getHingeRoot()
  const p = resolve(root, name)
  return p.startsWith(root) ? p : null
}

function tracePath(): string | null {
  return hingeFile(TRACE_FILE)
}

function ensureHingeDir(): string | null {
  const root = getHingeRoot()
  try {
    if (!existsSync(root)) mkdirSync(root, { recursive: true })
    return root
  } catch {
    return null
  }
}

/** Append one JSON line to .hinge/queue-trace.log */
export function traceQueue(event: string, detail: Record<string, unknown> = {}): void {
  const path = tracePath()
  if (!path) return
  const ctx = getServerContext()
  const agent = probeAgentScripts()
  const row = {
    ts: new Date().toISOString(),
    event,
    nodePid: process.pid,
    vitePort: ctx?.port ?? null,
    serverMode: ctx?.mode ?? null,
    cwd: process.cwd(),
    projectRoot: getProjectRoot(),
    projectRootReal: safeRealpath(getProjectRoot()),
    agentOk: agent.ok,
    agentMissing: agent.missing ?? null,
    dispatchHost: localDispatchHost(),
    ...detail,
  }
  try {
    appendFileSync(path, JSON.stringify(row) + '\n', 'utf-8')
  } catch { /* ignore */ }
}

function safeRealpath(p: string): string {
  try { return realpathSync(p) } catch { return p }
}

/** ss/lsof lines for the Vite/API listen port when known. */
export async function snapshotListenProcesses(port?: number | null): Promise<string[]> {
  if (!port) return []
  const portRe = new RegExp(`:${port}([^0-9]|$)`)
  try {
    const { stdout } = await execFileAsync('ss', ['-H', '-tlnp'], { timeout: 4000, maxBuffer: 512 * 1024 })
    return stdout.split('\n').filter((line) => portRe.test(line))
  } catch {
    try {
      const { stdout } = await execFileAsync('lsof', ['-iTCP', '-sTCP:LISTEN', '-P', '-n'], {
        timeout: 4000,
        maxBuffer: 512 * 1024,
      })
      return stdout.split('\n').filter((line) => portRe.test(line))
    } catch {
      return []
    }
  }
}

export interface QueueDebugSnapshot {
  at: string
  thisProcess: {
    pid: number
    vitePort: number | null
    mode: ServerContext['mode'] | null
    cwd: string
    projectRoot: string
    projectRootReal: string
    agentScripts: ReturnType<typeof probeAgentScripts>
    dispatchHost: string
  }
  listenProcesses: string[]
}

export async function buildDebugSnapshot(): Promise<QueueDebugSnapshot> {
  const ctx = getServerContext()
  const listenProcesses = await snapshotListenProcesses(ctx?.port)

  return {
    at: new Date().toISOString(),
    thisProcess: {
      pid: process.pid,
      vitePort: ctx?.port ?? null,
      mode: ctx?.mode ?? null,
      cwd: process.cwd(),
      projectRoot: getProjectRoot(),
      projectRootReal: safeRealpath(getProjectRoot()),
      agentScripts: probeAgentScripts(),
      dispatchHost: localDispatchHost(),
    },
    listenProcesses,
  }
}

function writeSnapshotFiles(reason: string, snap: QueueDebugSnapshot): void {
  ensureHingeDir()
  const jsonPath = hingeFile(SNAPSHOT_FILE)
  const logPath = hingeFile(SNAPSHOTS_LOG)
  const row = { reason, ...snap }

  try {
    if (jsonPath) writeFileSync(jsonPath, JSON.stringify(row, null, 2) + '\n', 'utf-8')
  } catch { /* ignore */ }

  try {
    if (logPath) appendFileSync(logPath, JSON.stringify(row) + '\n', 'utf-8')
  } catch { /* ignore */ }

  const portsPath = hingeFile(PORTS_FILE)
  try {
    if (portsPath) {
      const lines = [
        `# updated ${snap.at} — reason: ${reason}`,
        `# pid=${snap.thisProcess.pid} port=${snap.thisProcess.vitePort ?? '?'} mode=${snap.thisProcess.mode ?? '?'}`,
        `# agentOk=${snap.thisProcess.agentScripts.ok}`,
        `# dispatchHost=${snap.thisProcess.dispatchHost}`,
        `# cwd: ${snap.thisProcess.cwd}`,
        `# projectRootReal: ${snap.thisProcess.projectRootReal}`,
        '',
        '## LISTEN (ss/lsof)',
        ...(snap.listenProcesses.length ? snap.listenProcesses : ['(none)']),
      ]
      writeFileSync(portsPath, lines.join('\n') + '\n', 'utf-8')
    }
  } catch { /* ignore */ }

  traceQueue('snapshot', {
    reason,
    snapshotFile: SNAPSHOT_FILE,
    listenLines: snap.listenProcesses.length,
  })
}

/** Per-task copy — lives in _processing / _done folder next to chat.md */
export function writeTaskDebugFile(
  taskFolderPath: string,
  phase: string,
  detail: Record<string, unknown>,
): void {
  try {
    const path = resolve(taskFolderPath, TASK_DEBUG_FILE)
    if (!path.startsWith(taskFolderPath)) return
    const prev = existsSync(path)
      ? JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>
      : {}
    const row = {
      ...prev,
      updatedAt: new Date().toISOString(),
      phases: {
        ...(prev.phases as Record<string, unknown> | undefined),
        [phase]: detail,
      },
    }
    writeFileSync(path, JSON.stringify(row, null, 2) + '\n', 'utf-8')
  } catch { /* ignore */ }
}

/** Build snapshot + write to .hinge/queue-snapshot.json and task folder when given. */
export async function traceDebugSnapshot(
  reason: string,
  taskFolderPath?: string,
): Promise<QueueDebugSnapshot> {
  const snap = await buildDebugSnapshot()
  writeSnapshotFiles(reason, snap)
  if (taskFolderPath) {
    writeTaskDebugFile(taskFolderPath, reason, snap as unknown as Record<string, unknown>)
  }
  return snap
}
