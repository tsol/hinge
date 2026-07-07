/**
 * Queue dispatch gate — only one capable process (agent scripts + lock) may
 * recover, promote _wait, or spawn wrappers. Prevents orphan Vite instances
 * on a shared .hinge mount from stealing the queue.
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getHingeRoot } from './pathSafety'
import { getServerContext, traceQueue } from './queueTrace'
import { isForeignDispatchHost, localDispatchHost } from './dispatchHost'
import { probeAgentScripts } from './config'

const LOCK_NAME = '.queue-dispatch.lock'
const LOCK_STALE_MS = 10 * 60 * 1000

interface QueueLock {
  pid: number
  port: number | null
  at: number
  host: string
}

function lockPath(): string | null {
  const root = getHingeRoot()
  try {
    if (!existsSync(root)) mkdirSync(root, { recursive: true })
    return resolve(root, LOCK_NAME)
  } catch {
    return null
  }
}

function lockHolderAlive(lock: QueueLock): boolean {
  if (lock.pid === process.pid) return true
  try {
    process.kill(lock.pid, 0)
    return true
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code
    if (code === 'EPERM') return true
    return false
  }
}

function readLock(path: string): QueueLock | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as QueueLock
  } catch {
    return null
  }
}

function lockPayload(): string {
  return JSON.stringify({
    pid: process.pid,
    port: getServerContext()?.port ?? null,
    at: Date.now(),
    host: localDispatchHost(),
  } satisfies QueueLock)
}

/** True when this Node process can run .hinge agent scripts and dispatch the queue. */
export function canDispatchQueue(): boolean {
  return probeAgentScripts().ok
}

function tryAcquireQueueLock(): boolean {
  const path = lockPath()
  if (!path) return false

  try {
    writeFileSync(path, lockPayload(), { flag: 'wx' })
    return true
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'EEXIST') return false
  }

  const existing = readLock(path)
  if (!existing) {
    try {
      writeFileSync(path, lockPayload(), { flag: 'wx' })
      return true
    } catch {
      return false
    }
  }

  if (isForeignDispatchHost(existing.host)) {
    return false
  }

  const age = Date.now() - existing.at
  if (!lockHolderAlive(existing) || age > LOCK_STALE_MS) {
    try {
      unlinkSync(path)
      writeFileSync(path, lockPayload(), { flag: 'wx' })
      return true
    } catch {
      return false
    }
  }

  return existing.pid === process.pid
}

/**
 * Run queue mutation (recover / promote / spawn) when this process is allowed.
 * Returns null when skipped (no agent scripts or lock held elsewhere).
 */
export function withQueueDispatch<T>(label: string, fn: () => T): T | null {
  if (!canDispatchQueue()) {
    traceQueue('dispatch_skip_no_agent', { label })
    return null
  }
  if (!tryAcquireQueueLock()) {
    traceQueue('dispatch_skip_lock', { label })
    return null
  }
  try {
    return fn()
  } finally {
    const path = lockPath()
    if (path) {
      const existing = readLock(path)
      if (existing?.pid === process.pid) {
        try { unlinkSync(path) } catch { /* ignore */ }
      }
    }
  }
}
