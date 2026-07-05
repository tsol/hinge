/**
 * hinge-server — standalone HTTP server for Hinge API
 *
 * Runs on port 5177 inside the same Node process as Vite.
 * Vite proxies /api/* → localhost:5177.
 * The http.Server survives Vite HMR (module-level let), so agent
 * processes spawned with detached:true are never killed by HMR.
 */

import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  readFileSync, readdirSync, existsSync, mkdirSync,
  writeFileSync, appendFileSync, unlinkSync, renameSync,
  rmSync, statSync,
} from 'node:fs'
import type { Dirent } from 'node:fs'
import { resolve, relative, sep } from 'node:path'
import { spawn } from 'node:child_process'
import { loadConfig, resolveAgentScripts, saveConfig, readPrompt } from './utils/config'

// ── Shared state ──────────────────────────────────────────
const runningTasks = new Set<string>()
const taskQueue: string[] = []

// Store HTTP server reference globally so it survives Vite HMR module re-evaluation
// Key includes port so each project has its OWN server — projects don't share
const GLOBAL_KEY_PREFIX = '__hinge_api_server_'

function globalKey(port: number): string {
  return GLOBAL_KEY_PREFIX + port
}

function getApiServer(port: number): http.Server | null {
  return (globalThis as any)[globalKey(port)] ?? null
}

function setApiServer(port: number, s: http.Server | null) {
  if (s) (globalThis as any)[globalKey(port)] = s
  else delete (globalThis as any)[globalKey(port)]
}

// Catch-all for process-level errors so a crash doesn't orphan running tasks
process.on('uncaughtException', (err) => {
  console.error('[hinge] uncaughtException:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[hinge] unhandledRejection:', reason)
})

// ── Public entry point ────────────────────────────────────
export function startHingeServer(port = 5177): http.Server {
  const existing = getApiServer(port)
  if (existing) return existing
  const server = http.createServer(handleRequest)
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[hinge] Port ${port} already in use — server from previous cycle still alive, reusing`)
      setApiServer(port, null)
      return
    }
    console.error('[hinge] HTTP server error:', err)
  })
  server.listen(port, () => {
    console.log(`[hinge-server] Listening on :${port}`)
    // Recover orphaned processing tasks after server restart/reload
    recoverOrphanedTasks()
  })
  setApiServer(port, server)
  return server
}

export function stopHingeServer(port = 5177): void {
  const server = getApiServer(port)
  if (server) {
    try { server.close() } catch { /* ignore */ }
    setApiServer(port, null)
  }
}

/** True while the server has been started (survives Vite HMR module re-eval) */
let serverStarted = false
export function isRunning(): boolean { return serverStarted }
export function markRunning(): void { serverStarted = true }

// ── Request router ────────────────────────────────────────
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  try {
  const method = req.method ?? 'GET'
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname

  // ── Directory / file operations ──
  if (pathname === '/api/list-dir') {
    const dir = url.searchParams.get('path') || '.'
    json(res, listDir(dir))
    return
  }

  if (pathname === '/api/read-file') {
    const file = url.searchParams.get('path')
    if (!file) { status(res, 400, 'missing path'); return }
    const content = readFilePath(file)
    if (content === null) { status(res, 404, 'not found'); return }
    text(res, content)
    return
  }

  if (pathname === '/api/raw-file') {
    const filePath = url.searchParams.get('path')
    if (!filePath) { status(res, 400, 'missing path'); return }
    const abs = resolve(process.cwd(), filePath)
    if (!existsSync(abs)) { status(res, 404, 'not found'); return }
    if (!statSync(abs).isFile()) { status(res, 400, 'not a file'); return }
    const ext = filePath.split('.').pop()?.toLowerCase()
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      bmp: 'image/bmp', ico: 'image/x-icon',
    }
    res.setHeader('Content-Type', mimeMap[ext ?? ''] || 'application/octet-stream')
    res.end(readFileSync(abs))
    return
  }

  if (pathname === '/api/find-file') {
    const name = url.searchParams.get('name')
    if (!name) { json(res, { error: 'missing name' }, 400); return }
    json(res, { path: findFile(name) })
    return
  }

  // ── Write file ──
  if (pathname === '/api/write-file') {
    if (method !== 'PUT') { json(res, { error: 'PUT only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { path: filePath, content } = JSON.parse(body.toString())
      if (!filePath || content === undefined || content === null) {
        json(res, { error: 'missing path or content' }, 400); return
      }
      const abs = resolve(process.cwd(), filePath)
      mkdirSync(resolve(abs, '..'), { recursive: true })
      writeFileSync(abs, content, 'utf-8')
      json(res, { ok: true })
    } catch { json(res, { error: 'invalid request' }, 400) }
    return
  }

  // ── Transcribe ──
  if (pathname === '/api/transcribe') {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const buf = await readBuffer(req)
    const tmpPath = resolve(process.cwd(), `.hinge/_recording_${Date.now()}.webm`)
    try {
      writeFileSync(tmpPath, buf)
      const whisperScript = resolve(process.cwd(), '.hinge/whisper.sh')
      if (!existsSync(whisperScript)) {
        throw new Error('whisper.sh not found — create .hinge/whisper.sh')
      }
      const result = await new Promise<string>((resolvePromise, reject) => {
        const child = spawn('/bin/bash', [whisperScript, tmpPath], {
          timeout: 30_000, env: { ...process.env },
        })
        let out = '', err = ''
        child.stdout.on('data', (d: Buffer) => out += d.toString())
        child.stderr.on('data', (d: Buffer) => err += d.toString())
        child.on('close', (code) => code === 0 ? resolvePromise(out) : reject(new Error(err || `exit ${code}`)))
        child.on('error', reject)
      })
      const text = result.trim().split('\n').map(l => l.trim()).filter(Boolean).join(' ')
      json(res, { text })
    } catch (e: any) {
      json(res, { error: e.message || 'transcription failed' }, 500)
    } finally {
      try { unlinkSync(tmpPath) } catch { /* ignore */ }
    }
    return
  }

  // ── Attachments ──
  if (pathname === '/api/attach') {
    const folder = url.searchParams.get('folder')
    if (method === 'GET') {
      if (!folder) { json(res, { error: 'missing folder' }, 400); return }
      json(res, listAttachments(folder))
      return
    }
    if (method === 'DELETE') {
      if (!folder) { json(res, { error: 'missing folder' }, 400); return }
      const fileName = url.searchParams.get('file')
      if (!fileName) { json(res, { error: 'missing file' }, 400); return }
      json(res, { ok: deleteAttachment(folder, fileName) })
      return
    }
    if (method === 'POST') {
      if (!folder) { json(res, { error: 'missing folder' }, 400); return }
      const attachDir = resolve(process.cwd(), '.hinge', folder, 'attach')
      mkdirSync(attachDir, { recursive: true })
      const chunks: Buffer[] = []
      req.on('data', (chunk: Buffer) => chunks.push(chunk))
      req.on('end', () => {
        try {
          const fullBody = Buffer.concat(chunks)
          const contentType = req.headers['content-type'] || ''
          const boundary = contentType.split('boundary=')[1]
          if (!boundary) { json(res, { error: 'no boundary' }, 400); return }
          const boundaryBuf = Buffer.from(`--${boundary}`)
          const parts = splitBuffer(fullBody, boundaryBuf)
            .filter(p => p.length > 0 &&
              !bufStartsWith(p, Buffer.from('--\r\n')) &&
              !bufStartsWith(p, Buffer.from('--')))
          for (const part of parts) {
            const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
            if (headerEnd === -1) continue
            const headers = part.slice(0, headerEnd).toString('utf-8')
            const data = part.slice(headerEnd + 4)
            const trimmed = data.slice(0, data.length - 2)
            const match = headers.match(/name="([^"]+)"(?:; filename="([^"]+)")?/)
            if (match && match[2]) {
              writeFileSync(resolve(attachDir, match[2]), trimmed)
            }
          }
          json(res, { ok: true })
        } catch (e: any) { json(res, { error: e.message || 'upload failed' }, 500) }
      })
      return
    }
    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Serve attachment files ──
  if (pathname === '/api/attach-file') {
    const folder = url.searchParams.get('folder')
    const file = url.searchParams.get('file')
    if (!folder || !file) { status(res, 400, 'missing folder or file'); return }
    const abs = resolve(process.cwd(), '.hinge', folder, 'attach', file)
    if (!existsSync(abs)) { status(res, 404, 'not found'); return }
    const ext = file.split('.').pop()?.toLowerCase()
    const mimeMap: Record<string, string> = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
      pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown',
    }
    res.setHeader('Content-Type', mimeMap[ext ?? ''] || 'application/octet-stream')
    res.end(readFileSync(abs))
    return
  }

  // ── Queue output ──
  if (pathname === '/api/output') {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    const file = url.searchParams.get('file')
    if (!file) { status(res, 400, 'missing file'); return }
    const chatPath = resolve(process.cwd(), '.hinge', file, 'chat.md')
    if (!existsSync(chatPath)) { status(res, 404, ''); return }
    text(res, readFileSync(chatPath, 'utf-8'))
    return
  }

  // ── Queue log ──
  if (pathname === '/api/log') {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    const file = url.searchParams.get('file')
    if (!file) { status(res, 400, 'missing file'); return }
    const logPath = resolve(process.cwd(), '.hinge', file, 'chat.log')
    if (!existsSync(logPath)) { status(res, 404, ''); return }
    text(res, readFileSync(logPath, 'utf-8'))
    return
  }

  // ── Queue run (trigger processing of queued tasks) ──
  if (pathname === '/api/queue/run') {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    processNextTask()
    json(res, { ok: true })
    return
  }

  // ── Queue CRUD ──
  if (pathname === '/api/queue') {
    if (method === 'GET') { json(res, listQueue()); return }

    if (method === 'DELETE') {
      const file = url.searchParams.get('file')
      if (!file) { json(res, { error: 'missing file param' }, 400); return }
      json(res, { ok: deleteQueueItem(file) })
      return
    }

    const body = await readBuffer(req)
    if (method === 'POST') {
      try {
        const { content } = JSON.parse(body.toString())
        appendToQueue(content ?? '')
        json(res, { ok: true })
      } catch { json(res, { error: 'invalid payload' }, 400) }
      return
    }

    if (method === 'PATCH') {
      try {
        const { file, content } = JSON.parse(body.toString())
        if (!file) { json(res, { error: 'missing file' }, 400); return }
        json(res, { ok: updateQueueItemNote(file, content ?? '') })
      } catch { json(res, { error: 'invalid request' }, 400) }
      return
    }

    if (method === 'PUT') {
      try {
        const { file, status } = JSON.parse(body.toString())
        if (!file) { json(res, { error: 'missing file' }, 400); return }
        const ok = status ? setQueueItemStatus(file, status) : toggleQueueItem(file)
        if (ok && status !== 'wait') processNextTask()
        json(res, { ok })
      } catch { json(res, { error: 'invalid request' }, 400) }
      return
    }

    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Chat send ──
  if (pathname === '/api/chat/send') {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { name, message } = JSON.parse(body.toString())
      if (!name || !message) {
        json(res, { error: 'missing name or message' }, 400); return
      }
      const queueDir = resolve(process.cwd(), '.hinge')
      const stem = name.replace(/_(new|wait|done|processing)$/, '')
      const candidates = [`${stem}_wait`, `${stem}_done`, `${stem}_processing`, `${stem}_new`, stem]
      let folderPath: string | null = null
      let foundName = ''
      for (const c of candidates) {
        const p = resolve(queueDir, c)
        if (existsSync(p)) { folderPath = p; foundName = c; break }
      }
      if (!folderPath) {
        const exact = resolve(queueDir, name)
        if (existsSync(exact)) { folderPath = exact; foundName = name }
        else { json(res, { error: 'task not found' }, 404); return }
      }
      appendUserMessage(foundName, message)
      const processingName = `${stem}_processing`
      if (foundName !== processingName) {
        renameSync(folderPath, resolve(queueDir, processingName))
      }
      if (!runningTasks.has(processingName)) {
        enqueueTask(processingName)
      }
      json(res, { ok: true, processingName })
    } catch (e: any) {
      json(res, { error: e.message || 'invalid request' }, 400)
    }
    return
  }

  // ── Status ──
  if (pathname === '/api/status') {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    json(res, { running: runningTasks.size > 0, processing: Array.from(runningTasks) })
    return
  }

  // ── Cancel ──
  if (pathname === '/api/cancel') {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { name } = JSON.parse(body.toString())
      if (!name) { json(res, { error: 'missing name' }, 400); return }
      const stemName = name.replace(/_(new|wait|done|processing)$/, '')
      const queueDir = resolve(process.cwd(), '.hinge')

      // Determine the actual current status by checking which folder exists
      const candidates = [`${stemName}_processing`, `${stemName}_wait`, `${stemName}_new`, `${stemName}_done`, stemName]
      let foundName: string | null = null
      for (const c of candidates) {
        const p = resolve(queueDir, c)
        if (existsSync(p)) { foundName = c; break }
      }

      const logLine = `[cancel] name="${name}" stem="${stemName}" found="${foundName||'none'}"`
      try { appendFileSync(resolve(queueDir, '.cancel.log'), `${new Date().toISOString()} ${logLine}\n`) } catch {}

      if (!foundName) { json(res, { ok: true }); return }

      const folderPath = resolve(queueDir, foundName)

      if (foundName.endsWith('_processing')) {
        // Kill running process
        const qIdx = taskQueue.indexOf(foundName)
        if (qIdx !== -1) taskQueue.splice(qIdx, 1)
        if (runningTasks.has(foundName)) {
          runningTasks.delete(foundName)
          const pidPath = resolve(folderPath, '.pid')
          try {
            const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
            if (pid > 0) { try { process.kill(pid, 'SIGTERM') } catch { /* ignore */ } }
          } catch { /* ignore */ }
          try { unlinkSync(pidPath) } catch { /* ignore */ }
        }
        // Rename processing → new (allow retry)
        const newName = `${stemName}_new`
        try { renameSync(folderPath, resolve(queueDir, newName)) } catch { /* ignore */ }
        // Free up a slot — start next task
        processNextTask()
        try { appendFileSync(resolve(queueDir, '.cancel.log'), `  → _processing → _new, processNextTask()\n`) } catch {}
      } else {
        // _wait or _new → user cancelled, archive to _done
        const doneName = `${stemName}_done`
        try { renameSync(folderPath, resolve(queueDir, doneName)) } catch { /* ignore */ }
        try { appendFileSync(resolve(queueDir, '.cancel.log'), `  → _wait/_new → _done, NO processNextTask\n`) } catch {}
        // Don't call processNextTask — nothing was running, don't start the task user just cancelled
      }
      json(res, { ok: true })
    } catch (e: any) {
      json(res, { error: e.message || 'invalid request' }, 400)
    }
    return
  }

  // ── Config ──
  if (pathname === '/api/config') {
    if (method === 'GET') { json(res, loadConfig()); return }
    if (method === 'POST') {
      const body = await readBuffer(req)
      try {
        const config = JSON.parse(body.toString())
        saveConfig(config)
        json(res, { ok: true })
      } catch { json(res, { error: 'invalid config' }, 400) }
      return
    }
    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Prompt ──
  if (pathname === '/api/prompt') {
    if (method === 'GET') {
      text(res, readPrompt())
      return
    }
    if (method === 'POST') {
      const body = await readBuffer(req)
      try {
        const { content } = JSON.parse(body.toString())
        const hingeDir = resolve(process.cwd(), '.hinge')
        if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
        writeFileSync(resolve(hingeDir, 'prompt.md'), content, 'utf-8')
        json(res, { ok: true })
      } catch { json(res, { error: 'invalid payload' }, 400) }
      return
    }
    if (method === 'DELETE') {
      const overridePath = resolve(process.cwd(), '.hinge', 'prompt.md')
      if (existsSync(overridePath)) unlinkSync(overridePath)
      json(res, { ok: true })
      return
    }
    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Execute ──
  if (pathname === '/api/execute') {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const queueDir = resolve(process.cwd(), '.hinge')
    if (!existsSync(queueDir)) { json(res, { ok: true, spawned: 0 }); return }
    const entries = readdirSync(queueDir, { withFileTypes: true })
    let spawned = 0
    for (const e of entries) {
      if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
      if (runningTasks.has(e.name)) continue
      spawned++
      enqueueTask(e.name)
    }
    json(res, { ok: true, spawned })
    return
  }

  // ── 404 ──
  status(res, 404, 'not found')
  } catch (e: any) {
    console.error(`[hinge] Unhandled error in handleRequest:`, e)
    try { status(res, 500, e?.message || 'Internal Server Error') } catch { /* avoid double-error */ }
  }
}

// ── Helpers ────────────────────────────────────────────────

function json(res: ServerResponse, data: unknown, code = 200) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function status(res: ServerResponse, code: number, msg: string) {
  res.statusCode = code
  res.end(msg)
}

function text(res: ServerResponse, content: string) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(content)
}

function readBuffer(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolvePromise) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolvePromise(Buffer.concat(chunks)))
  })
}

// ── File helpers ───────────────────────────────────────────

interface FileEntry {
  name: string; path: string; isDir: boolean; isSymlink: boolean
}

function listDir(dirPath: string): FileEntry[] {
  const abs = resolve(process.cwd(), dirPath)
  if (!existsSync(abs)) return []
  const entries = readdirSync(abs, { withFileTypes: true })
  const result: FileEntry[] = []
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.hinge') continue
    if (e.name === 'node_modules') continue
    const fullPath = resolve(abs, e.name)
    try {
      result.push({
        name: e.name,
        path: relative(process.cwd(), fullPath).split(sep).join('/'),
        isDir: e.isDirectory(),
        isSymlink: e.isSymbolicLink(),
      })
    } catch { /* skip */ }
  }
  result.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return result
}

function findFile(filename: string, scanDir = '.'): string | null {
  const abs = resolve(process.cwd(), scanDir)
  if (!existsSync(abs)) return null
  let entries: string[]
  try { entries = readdirSync(abs) } catch { return null }
  for (const e of entries) {
    if (e === 'node_modules') continue
    if (e.startsWith('.') && e !== '.hinge') continue
    const full = resolve(abs, e)
    try {
      const st = statSync(full)
      if (st.isDirectory()) {
        const relDepth = relative(process.cwd(), full).split(sep).filter(Boolean).length
        if (relDepth < 6) {
          const found = findFile(filename, full)
          if (found) return found
        }
      } else if (e.toLowerCase() === filename.toLowerCase()) {
        return relative(process.cwd(), full).split(sep).join('/')
      }
    } catch { /* skip */ }
  }
  return null
}

function readFilePath(filePath: string): string | null {
  const abs = resolve(process.cwd(), filePath)
  if (!existsSync(abs)) return null
  try { return readFileSync(abs, 'utf-8') } catch { return null }
}

// ── Recovery: handle orphaned _processing tasks after server restart ──
function recoverOrphanedTasks() {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) return
  let entries
  try { entries = readdirSync(queueDir, { withFileTypes: true }) as Dirent[] } catch { return }

  const orphans = entries.filter(e => e.isDirectory() && e.name.endsWith('_processing'))
  if (orphans.length > 0) {
    console.log(`[hinge] Found ${orphans.length} orphaned _processing tasks — recovering...`)
  for (const e of orphans) {
    const folderPath = resolve(queueDir, e.name)
    const pidPath = resolve(folderPath, '.pid')
    let pidDead = false

    if (existsSync(pidPath)) {
      try {
        const raw = readFileSync(pidPath, 'utf-8').trim()
        const pid = parseInt(raw, 10)
        if (pid && !isNaN(pid)) {
          try { process.kill(pid, 0); /* alive */ } catch { pidDead = true }
        } else {
          pidDead = true
        }
      } catch { pidDead = true }
    } else {
      pidDead = true
    }

    if (pidDead) {
      // Agent process is gone — move to _done so next task can start
      try {
        unlinkSync(pidPath)
      } catch { /* ignore */ }
      const doneName = e.name.replace('_processing', '_done')
      try {
        renameSync(folderPath, resolve(queueDir, doneName))
        console.log(`[hinge] Recovered orphan: ${e.name} → ${doneName}`)
      } catch (err) {
        console.error(`[hinge] Failed to recover ${e.name}:`, err)
      }
    } else {
      // PID still alive — track it so processNextTask doesn't start another
      console.log(`[hinge] Orphan ${e.name} still running (PID alive), tracking.`)
      runningTasks.add(e.name)
    }
  }
  }

  // Process next waiting task — always, even if no orphans found
  processNextTask()
}

// ── Queue helpers ──────────────────────────────────────────

interface QueueItem {
  name: string; status: 'wait' | 'done' | 'processing' | 'error'; content: string
  component: string; note: string; url: string; dom: string
  failed?: boolean
  agentStatus?: { status: string; pid?: number; elapsed?: number } | null
}

function appendToQueue(content: string) {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) mkdirSync(queueDir, { recursive: true })
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const folderName = `${ts}_new`
  const folderPath = resolve(queueDir, folderName)
  mkdirSync(folderPath, { recursive: true })
  writeFileSync(resolve(folderPath, 'chat.md'), content || '', 'utf-8')
}

function appendUserMessage(folderName: string, message: string) {
  const queueDir = resolve(process.cwd(), '.hinge')
  const chatPath = resolve(queueDir, folderName, 'chat.md')
  if (!existsSync(chatPath)) {
    writeFileSync(chatPath, message, 'utf-8'); return
  }
  appendFileSync(chatPath, `\n\n---\n\n**User:**\n${message}\n`, 'utf-8')
}

function listQueue(): QueueItem[] {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) return []
  // Auto-recover orphaned _processing tasks on every list
  recoverOrphanedTasks()
  const entries = readdirSync(queueDir, { withFileTypes: true })
  const items: QueueItem[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const name = e.name
    if (name.startsWith('.')) continue
    if (!name.includes('_new') && !name.includes('_wait') && !name.includes('_done') && !name.includes('_processing')) continue
    const status = name.endsWith('_done') ? 'done' : name.endsWith('_processing') ? 'processing' as any : name.endsWith('_wait') ? 'wait' : 'new'
    const mdPath = resolve(queueDir, name, 'chat.md')
    if (!existsSync(mdPath)) continue
    const content = readFileSync(mdPath, 'utf-8')
    const component = content.match(/^### Component: (.+)/m)?.[1] ?? ''
    const url = content.match(/^### Page: (.+)/m)?.[1] ?? ''
    const dom = content.match(/^DOM: (.+)/m)?.[1] ?? ''
    const note = (() => {
      // 1) Last **User:** message — take next line(s) until blank or **Assistant:**
      const userIdx = content.lastIndexOf('**User:**\n')
      if (userIdx !== -1) {
        const after = content.slice(userIdx + '**User:**\n'.length)
        const end = after.search(/\n\n|\*\*Assistant:\*\*/)
        return (end === -1 ? after.trim() : after.slice(0, end).trim())
      }
      // 2) No follow-ups: strip ### headers & fields, return first meaningful text
      const beforeAgent = content.split(/\n---\n/)[0]
      const textLines: string[] = []
      let inHeader = false
      for (const line of beforeAgent.split('\n')) {
        if (/^### (Page|Component|File):/.test(line)) { inHeader = true; continue }
        if (inHeader && /^[A-Za-z]\w+: /.test(line)) continue
        if (inHeader && line.trim() === '') { inHeader = false; continue }
        inHeader = false
        textLines.push(line)
      }
      return textLines.filter(l => l.trim()).join('\n').trim()
    })()
    // Detect failed tasks
    const errorPath = resolve(queueDir, name, '.error')
    const failed = existsSync(errorPath)
    const displayStatus: QueueItem['status'] = failed ? 'error' : status
    // Agent status for processing tasks
    let agentStatus: { status: string; pid?: number; elapsed?: number } | null = null
    if (status === 'processing') {
      // Calculate elapsed seconds from .pid file mtime (process start time), not folder creation time
      let elapsed: number | undefined
      const pidPath = resolve(queueDir, name, '.pid')
      if (existsSync(pidPath)) {
        // Use .pid mtime as the authoritative process start time
        const pidStat = statSync(pidPath)
        elapsed = Math.floor((Date.now() - pidStat.mtimeMs) / 1000)

        const raw = readFileSync(pidPath, 'utf-8').trim()
        const pid = parseInt(raw, 10)
        if (pid && !isNaN(pid)) {
          try { process.kill(pid, 0); agentStatus = { status: 'running', pid, elapsed } }
          catch { agentStatus = { status: 'stopped', elapsed } }
        } else {
          agentStatus = { status: 'stopped', elapsed }
        }
      } else {
        // Fallback: compute from folder name timestamp if .pid is missing
        const stem = name.replace(/_(new|wait|done|processing)$/, '')
        const ts = stem.split('_')[0]
        if (ts) {
          const fixed = ts.replace(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})/, '$1T$2:$3:$4')
          const startMs = new Date(fixed).getTime()
          if (!isNaN(startMs)) elapsed = Math.floor((Date.now() - startMs) / 1000)
        }
        agentStatus = { status: 'no_pid', elapsed }
      }
    }
    items.push({ name, status: displayStatus, content: content || '', component, note, url, dom, failed, agentStatus } as QueueItem)
  }
  items.sort((a, b) => b.name.localeCompare(a.name))
  return items
}

function toggleQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  const stem = filename.replace(/_(new|wait|done|processing)$/, '')
  let suffix: string
  if (filename.endsWith('_new')) suffix = '_wait'
  else if (filename.endsWith('_wait')) suffix = '_done'
  else if (filename.endsWith('_processing')) suffix = '_done'
  else suffix = '_new'
  renameSync(abs, resolve(queueDir, `${stem}${suffix}`))
  return true
}

function setQueueItemStatus(name: string, status: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const folderPath = resolve(queueDir, name)
  if (!existsSync(folderPath)) return false
  const stem = name.replace(/_(new|wait|done|processing)$/, '')
  const newName = `${stem}_${status}`
  if (newName === name) return true
  renameSync(folderPath, resolve(queueDir, newName))
  return true
}

function deleteQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  try { rmSync(abs, { recursive: true, force: true }); return true } catch { return false }
}

function updateQueueItemNote(filename: string, newNote: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const mdPath = resolve(queueDir, filename, 'chat.md')
  if (!existsSync(mdPath)) return false
  writeFileSync(mdPath, newNote, 'utf-8')
  return true
}

// ── Attachment helpers ────────────────────────────────────

function listAttachments(folderName: string): { name: string; size: number }[] {
  const attachDir = resolve(process.cwd(), '.hinge', folderName, 'attach')
  if (!existsSync(attachDir)) return []
  const entries = readdirSync(attachDir, { withFileTypes: true })
  const files: { name: string; size: number }[] = []
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith('.')) continue
    try {
      const st = statSync(resolve(attachDir, e.name))
      files.push({ name: e.name, size: st.size })
    } catch { /* skip */ }
  }
  files.sort((a, b) => a.name.localeCompare(b.name))
  return files
}

function deleteAttachment(folderName: string, fileName: string): boolean {
  const filePath = resolve(process.cwd(), '.hinge', folderName, 'attach', fileName)
  if (!existsSync(filePath)) return false
  unlinkSync(filePath)
  return true
}

// ── Agent runner ───────────────────────────────────────────

function injectAttachments(folderPath: string, prompt: string): string {
  const attachDir = resolve(folderPath, 'attach')
  if (!existsSync(attachDir)) return prompt
  const entries = readdirSync(attachDir, { withFileTypes: true })
  const files = entries
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

function runTaskChunk(folderName: string) {
  runningTasks.add(folderName)
  const queueDir = resolve(process.cwd(), '.hinge')
  const folderPath = resolve(queueDir, folderName)
  const chatPath = resolve(folderPath, 'chat.md')
  if (!existsSync(chatPath)) {
    runningTasks.delete(folderName)
    try { renameSync(folderPath, resolve(queueDir, folderName.replace('_processing', '_done'))) } catch { /* ignore */ }
    processNextTask()
    return
  }

  const config = loadConfig()
  const agentName = config.agent?.name || 'hermes'
  const scripts = resolveAgentScripts(agentName)

  const alias = folderName.replace(/_processing$/, '')
  const sessionMarker = resolve(folderPath, '.session')
  const isFirstRun = !existsSync(sessionMarker)

  const content = readFileSync(chatPath, 'utf-8')

  let agentInput: string
  let scriptType: string   // "new" or "continue" — used by wrapper

  if (isFirstRun) {
    agentInput = injectAttachments(folderPath, content)
    // Prepend system prompt as first message — instructs agent on async mode
    const prompt = readPrompt()
    if (prompt) {
      agentInput = prompt + '\n\n---\n\n' + agentInput
    }
    scriptType = 'new'
    try { writeFileSync(sessionMarker, alias, 'utf-8') } catch { /* ignore */ }
  } else {
    agentInput = extractLastUserMessage(content)
    scriptType = 'continue'
  }

  const logPath = resolve(folderPath, 'chat.log')
  try { appendFileSync(logPath, `=== Agent run started: ${new Date().toISOString()} ===\n`, 'utf-8') } catch { /* ignore */ }

  try {
    const child = spawn('/bin/bash', [scripts.wrapper, alias, scriptType], {
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    })
    child.unref()

    const pidPath = resolve(folderPath, '.pid')
    try { writeFileSync(pidPath, String(child.pid ?? ''), 'utf-8') } catch { /* ignore */ }

    child.stdin.write(agentInput)
    child.stdin.end()

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
      try { appendFileSync(logPath, d.toString(), 'utf-8') } catch { /* ignore */ }
    })

    child.on('close', (exitCode) => {
      runningTasks.delete(folderName)

      // If folder was already renamed by script self-cleanup, nothing to do
      if (!existsSync(folderPath)) {
        console.log(`[hinge] Task ${folderName} already cleaned up by script`)
        processNextTask()
        return
      }

      // Mark failed tasks (non-zero exit code)
      if (exitCode !== 0 && exitCode !== null) {
        try { writeFileSync(resolve(folderPath, '.error'), String(exitCode), 'utf-8') } catch { /* ignore */ }
      }

      if (stderr) {
        try { appendFileSync(logPath, `\n[stderr]\n${stderr}\n`, 'utf-8') } catch {}
      }

      const finalAnswer = stdout.trim() || '(no output)'
      const appendix = `\n\n---\n\n**Assistant:**\n${finalAnswer}\n`
      try {
        const existing = readFileSync(chatPath, 'utf-8')
        writeFileSync(chatPath, existing + appendix, 'utf-8')
      } catch (e: any) {
        console.error(`[hinge] Failed to write chat.md for ${folderName}:`, e)
      }

      // Remove .pid BEFORE rename so recovery doesn't try to re-spawn mid-rename
      try { unlinkSync(resolve(folderPath, '.pid')) } catch {}

      // Rename _processing → _done, THEN pick next task (avoids race)
      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
        console.log(`[hinge] Task ${folderName} → ${doneName}`)
      } catch (e: any) {
        console.error(`[hinge] Failed to rename ${folderName} to _done:`, e)
      }

      processNextTask()
    })

    child.on('error', (err) => {
      console.error(`[hinge] Agent spawn error for ${folderName}:`, err)
      runningTasks.delete(folderName)
      try { unlinkSync(resolve(folderPath, '.pid')) } catch {}
      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
        console.log(`[hinge] Error recovery: ${folderName} → ${doneName}`)
      } catch (e: any) {
        console.error(`[hinge] Failed to rename on error for ${folderName}:`, e)
      }
      processNextTask()
    })
  } catch {
    runningTasks.delete(folderName)
    processNextTask()
  }
}

// ── Sequential task queue ──────────────────────────────────

function enqueueTask(folderName: string) {
  if (runningTasks.has(folderName) || taskQueue.includes(folderName)) return
  taskQueue.push(folderName)
  processNextTask()
}

function processNextTask() {
  // Clean stale runningTasks entries — folders no longer on disk (child completed and renamed)
  const queueDir = resolve(process.cwd(), '.hinge')
  for (const task of runningTasks) {
    const folderPath = resolve(queueDir, task)
    if (!existsSync(folderPath)) {
      runningTasks.delete(task)
      console.log(`[hinge] Cleaned stale runningTasks: ${task} (folder gone)`)
    }
  }

  if (runningTasks.size > 0) return

  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!
    runTaskChunk(next)
    return
  }

  if (!existsSync(queueDir)) return
  const entries = readdirSync(queueDir, { withFileTypes: true })
  const waitFolders = entries
    .filter(e => e.isDirectory() && e.name.endsWith('_wait'))
    .sort((a, b) => a.name.localeCompare(b.name))
  if (waitFolders.length === 0) return

  const waitName = waitFolders[0].name
  const processingName = waitName.replace('_wait', '_processing')
  try {
    renameSync(resolve(queueDir, waitName), resolve(queueDir, processingName))
  } catch (e: any) {
    console.error(`[hinge] Failed to promote ${waitName} to _processing:`, e)
    return
  }

  runTaskChunk(processingName)
}

// ── Buffer helpers ─────────────────────────────────────────

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = []
  let start = 0
  let idx = buf.indexOf(delimiter, start)
  while (idx !== -1) {
    parts.push(buf.slice(start, idx))
    start = idx + delimiter.length
    idx = buf.indexOf(delimiter, start)
  }
  parts.push(buf.slice(start))
  return parts
}

function bufStartsWith(buf: Buffer, prefix: Buffer): boolean {
  if (buf.length < prefix.length) return false
  return buf.slice(0, prefix.length).equals(prefix)
}
