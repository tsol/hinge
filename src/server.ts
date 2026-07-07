/**
 * hinge-server — standalone HTTP server for Hinge API
 *
 * Runs on port 5177 inside the same Node process as Vite.
 * Vite proxies /hinge-api/* → localhost:5177.
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
import { resolve, relative, sep } from 'node:path'
import { API_BASE } from './const'
import { spawn } from 'node:child_process'
import {
  enqueueTask,
  tryStartNextTask,
  recoverAndSchedule,
  syncRunningTasksFromDisk,
  getAgentStatus,
  inspectWrapperByAlias,
  isTaskRunning,
  clearTaskFromQueue,
  inspectWrapper,
  getRunningTaskNames,
  hasRunningTasks,
} from './agentRunner'
import { readPrompt } from './utils/config'
import {
  getProjectRoot,
  getHingeRoot,
  resolveInside,
  resolveInsideExisting,
  resolveWriteTarget,
  resolveQueueFolder,
  resolveQueueFolderExisting,
  isValidQueueStatus,
  safeBasename,
} from './utils/pathSafety'
import { apiServerGlobalKey } from './utils/portRegistry'

// ── Shared state → agentRunner.ts (persistent across HMR) ──
function globalKey(port: number): string {
  return apiServerGlobalKey(port)
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
    recoverAndSchedule()
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

// ── Request router ────────────────────────────────────────
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  try {
  const method = req.method ?? 'GET'
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const pathname = url.pathname

  // ── Directory / file operations ──
  if (pathname === `${API_BASE}/list-dir`) {
    const dir = url.searchParams.get('path') || '.'
    json(res, listDir(dir))
    return
  }

  if (pathname === `${API_BASE}/read-file`) {
    const file = url.searchParams.get('path')
    if (!file) { status(res, 400, 'missing path'); return }
    const content = readFilePath(file)
    if (content === null) { status(res, 404, 'not found'); return }
    text(res, content)
    return
  }

  if (pathname === `${API_BASE}/raw-file`) {
    const filePath = url.searchParams.get('path')
    if (!filePath) { status(res, 400, 'missing path'); return }
    const abs = resolveInsideExisting(getProjectRoot(), filePath)
    if (!abs) { status(res, 404, 'not found'); return }
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

  if (pathname === `${API_BASE}/find-file`) {
    const name = url.searchParams.get('name')
    if (!name) { json(res, { error: 'missing name' }, 400); return }
    if (name.includes('/') || name.includes('\\') || name.includes('..')) {
      json(res, { path: null }); return
    }
    json(res, { path: findFile(name) })
    return
  }

  // ── Write file ──
  if (pathname === `${API_BASE}/write-file`) {
    if (method !== 'PUT') { json(res, { error: 'PUT only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { path: filePath, content } = JSON.parse(body.toString())
      if (!filePath || content === undefined || content === null) {
        json(res, { error: 'missing path or content' }, 400); return
      }
      const target = resolveWriteTarget(getProjectRoot(), filePath)
      if (!target) { json(res, { error: 'path outside project' }, 403); return }
      mkdirSync(target.parent, { recursive: true })
      writeFileSync(target.file, content, 'utf-8')
      json(res, { ok: true })
    } catch { json(res, { error: 'invalid request' }, 400) }
    return
  }

  // ── Transcribe ──
  if (pathname === `${API_BASE}/transcribe`) {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const buf = await readBuffer(req)
    const tmpPath = resolveInside(getHingeRoot(), `_recording_${Date.now()}.webm`)
    if (!tmpPath) { json(res, { error: 'invalid path' }, 500); return }
    try {
      writeFileSync(tmpPath, buf)
      const whisperScript = resolveInsideExisting(getHingeRoot(), 'whisper.sh')
      if (!whisperScript) {
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
  if (pathname === `${API_BASE}/attach`) {
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
      const attachDir = resolveQueueFolder(folder, 'attach')
      if (!attachDir) { json(res, { error: 'invalid folder' }, 400); return }
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
              const safeName = safeBasename(match[2])
              if (!safeName) continue
              const dest = resolveInside(attachDir, safeName)
              if (!dest) continue
              writeFileSync(dest, trimmed)
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
  if (pathname === `${API_BASE}/attach-file`) {
    const folder = url.searchParams.get('folder')
    const file = url.searchParams.get('file')
    if (!folder || !file) { status(res, 400, 'missing folder or file'); return }
    const safeFile = safeBasename(file)
    if (!safeFile) { status(res, 400, 'invalid file'); return }
    const abs = resolveQueueFolderExisting(folder, 'attach', safeFile)
    if (!abs) { status(res, 404, 'not found'); return }
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
  if (pathname === `${API_BASE}/output`) {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    const file = url.searchParams.get('file')
    if (!file) { status(res, 400, 'missing file'); return }
    const chatPath = resolveQueueFolderExisting(file, 'chat.md')
    if (!chatPath) { status(res, 404, ''); return }
    text(res, readFileSync(chatPath, 'utf-8'))
    return
  }

  // ── Queue log ──
  if (pathname === `${API_BASE}/log`) {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    const file = url.searchParams.get('file')
    if (!file) { status(res, 400, 'missing file'); return }
    const logPath = resolveQueueFolderExisting(file, 'chat.log')
    if (!logPath) { status(res, 404, ''); return }
    text(res, readFileSync(logPath, 'utf-8'))
    return
  }

  // ── Queue run (trigger processing of queued tasks) ──
  if (pathname === `${API_BASE}/queue/run`) {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    tryStartNextTask()
    json(res, { ok: true })
    return
  }

  // ── Queue CRUD ──
  if (pathname === `${API_BASE}/queue`) {
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
        if (status && !isValidQueueStatus(status)) {
          json(res, { error: 'invalid status' }, 400); return
        }
        const ok = status ? setQueueItemStatus(file, status) : toggleQueueItem(file)
        if (ok && status !== 'wait') tryStartNextTask()
        json(res, { ok })
      } catch { json(res, { error: 'invalid request' }, 400) }
      return
    }

    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Chat send ──
  if (pathname === `${API_BASE}/chat/send`) {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { name, message } = JSON.parse(body.toString())
      if (!name || !message) {
        json(res, { error: 'missing name or message' }, 400); return
      }
      if (name.includes('/') || name.includes('\\')) {
        json(res, { error: 'invalid name' }, 400); return
      }
      const stem = name.replace(/_(new|wait|done|processing)$/, '')
      const candidates = [`${stem}_wait`, `${stem}_done`, `${stem}_processing`, `${stem}_new`, stem]
      let folderPath: string | null = null
      let foundName = ''
      for (const c of candidates) {
        const p = resolveQueueFolder(c)
        if (p && existsSync(p)) { folderPath = p; foundName = c; break }
      }
      if (!folderPath) {
        const exact = resolveQueueFolder(name)
        if (exact && existsSync(exact)) { folderPath = exact; foundName = name }
        else { json(res, { error: 'task not found' }, 404); return }
      }
      appendUserMessage(foundName, message)
      const processingName = `${stem}_processing`
      if (foundName !== processingName) {
        const dest = resolveQueueFolder(processingName)
        if (!dest) { json(res, { error: 'invalid name' }, 400); return }
        renameSync(folderPath, dest)
      }
      if (!isTaskRunning(processingName)) {
        enqueueTask(processingName)
      }
      json(res, { ok: true, processingName })
    } catch (e: any) {
      json(res, { error: e.message || 'invalid request' }, 400)
    }
    return
  }

  // ── Wrapper liveness (same probe as queue agentStatus / recovery) ──
  if (pathname === `${API_BASE}/wrapper`) {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    const folder = url.searchParams.get('folder')
    if (!folder) { json(res, { error: 'missing folder' }, 400); return }
    const folderPath = resolveQueueFolderExisting(folder)
    if (folderPath) {
      json(res, inspectWrapper(folderPath, folder))
      return
    }
    const alias = folder.replace(/_(new|wait|done|processing)$/, '')
    json(res, inspectWrapperByAlias(alias))
    return
  }

  // ── Status ──
  if (pathname === `${API_BASE}/status`) {
    if (method !== 'GET') { status(res, 405, 'GET only'); return }
    json(res, {
      running: hasRunningTasks(),
      processing: getRunningTaskNames(),
      projectRoot: getProjectRoot(),
    })
    return
  }

  // ── Cancel ──
  if (pathname === `${API_BASE}/cancel`) {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const body = await readBuffer(req)
    try {
      const { name } = JSON.parse(body.toString())
      if (!name) { json(res, { error: 'missing name' }, 400); return }
      if (name.includes('/') || name.includes('\\')) {
        json(res, { error: 'invalid name' }, 400); return
      }
      const stemName = name.replace(/_(new|wait|done|processing)$/, '')
      const queueDir = getHingeRoot()

      // Determine the actual current status by checking which folder exists
      const candidates = [`${stemName}_processing`, `${stemName}_wait`, `${stemName}_new`, `${stemName}_done`, stemName]
      let foundName: string | null = null
      for (const c of candidates) {
        const p = resolveQueueFolder(c)
        if (p && existsSync(p)) { foundName = c; break }
      }

      const logLine = `[cancel] name="${name}" stem="${stemName}" found="${foundName||'none'}"`
      try { appendFileSync(resolveInside(queueDir, '.cancel.log')!, `${new Date().toISOString()} ${logLine}\n`) } catch {}

      if (!foundName) { json(res, { ok: true }); return }

      const folderPath = resolveQueueFolder(foundName)
      if (!folderPath) { json(res, { error: 'invalid name' }, 400); return }

      if (foundName.endsWith('_processing')) {
        clearTaskFromQueue(foundName)
        const { liveness, pid } = inspectWrapper(folderPath, foundName)
        if (liveness === 'running' && pid) {
          try { process.kill(pid, 'SIGTERM') } catch { /* ignore */ }
        }
        try { unlinkSync(resolve(folderPath, '.pid')) } catch { /* ignore */ }
        // Rename processing → new (allow retry)
        const newName = `${stemName}_new`
        const dest = resolveQueueFolder(newName)
        if (dest) try { renameSync(folderPath, dest) } catch { /* ignore */ }
        tryStartNextTask()
        try { appendFileSync(resolveInside(queueDir, '.cancel.log')!, `  → _processing → _new, tryStartNextTask()\n`) } catch {}
      } else {
        // _wait or _new → user cancelled, archive to _done
        const doneName = `${stemName}_done`
        const dest = resolveQueueFolder(doneName)
        if (dest) try { renameSync(folderPath, dest) } catch { /* ignore */ }
        try { appendFileSync(resolveInside(queueDir, '.cancel.log')!, `  → _wait/_new → _done, NO processNextTask\n`) } catch {}
        // Don't call processNextTask — nothing was running, don't start the task user just cancelled
      }
      json(res, { ok: true })
    } catch (e: any) {
      json(res, { error: e.message || 'invalid request' }, 400)
    }
    return
  }

  // ── Prompt ──
  if (pathname === `${API_BASE}/prompt`) {
    if (method === 'GET') {
      text(res, readPrompt())
      return
    }
    if (method === 'POST') {
      const body = await readBuffer(req)
      try {
        const { content } = JSON.parse(body.toString())
        const hingeDir = getHingeRoot()
        if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
        const promptPath = resolveInside(hingeDir, 'prompt.md')
        if (!promptPath) { json(res, { error: 'invalid path' }, 500); return }
        writeFileSync(promptPath, content, 'utf-8')
        json(res, { ok: true })
      } catch { json(res, { error: 'invalid payload' }, 400) }
      return
    }
    if (method === 'DELETE') {
      const overridePath = resolveInsideExisting(getHingeRoot(), 'prompt.md')
      if (overridePath) unlinkSync(overridePath)
      json(res, { ok: true })
      return
    }
    json(res, { error: 'method not allowed' }, 405)
    return
  }

  // ── Execute (recovery maintenance — does NOT re-run agents on stuck folders) ──
  if (pathname === `${API_BASE}/execute`) {
    if (method !== 'POST') { json(res, { error: 'POST only' }, 405); return }
    const { recovered } = recoverAndSchedule()
    json(res, { ok: true, recovered })
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
  const abs = resolveInsideExisting(getProjectRoot(), dirPath)
  if (!abs) return []
  const entries = readdirSync(abs, { withFileTypes: true })
  const projectRoot = getProjectRoot()
  const result: FileEntry[] = []
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.hinge') continue
    if (e.name === 'node_modules') continue
    const fullPath = resolveInside(abs, e.name)
    if (!fullPath) continue
    try {
      result.push({
        name: e.name,
        path: relative(projectRoot, fullPath).split(sep).join('/'),
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
  const projectRoot = getProjectRoot()
  const relDir = scanDir.startsWith(projectRoot)
    ? relative(projectRoot, scanDir) || '.'
    : scanDir
  const abs = resolveInsideExisting(projectRoot, relDir)
  if (!abs) return null
  let entries: string[]
  try { entries = readdirSync(abs) } catch { return null }
  for (const e of entries) {
    if (e === 'node_modules') continue
    if (e.startsWith('.') && e !== '.hinge') continue
    const full = resolveInside(abs, e)
    if (!full) continue
    try {
      const st = statSync(full)
      if (st.isDirectory()) {
        const relDepth = relative(projectRoot, full).split(sep).filter(Boolean).length
        if (relDepth < 6) {
          const found = findFile(filename, full)
          if (found) return found
        }
      } else if (e.toLowerCase() === filename.toLowerCase()) {
        return relative(projectRoot, full).split(sep).join('/')
      }
    } catch { /* skip */ }
  }
  return null
}

function readFilePath(filePath: string): string | null {
  const abs = resolveInsideExisting(getProjectRoot(), filePath)
  if (!abs) return null
  try { return readFileSync(abs, 'utf-8') } catch { return null }
}

// ── Queue helpers ──────────────────────────────────────────

interface QueueItem {
  name: string; status: 'wait' | 'done' | 'processing' | 'error'; content: string
  component: string; note: string; url: string; dom: string
  failed?: boolean
  agentStatus?: { status: string; pid?: number; elapsed?: number } | null
}

function appendToQueue(content: string) {
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) mkdirSync(queueDir, { recursive: true })
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const folderName = `${ts}_new`
  const folderPath = resolveQueueFolder(folderName)
  if (!folderPath) return
  mkdirSync(folderPath, { recursive: true })
  const chatPath = resolveInside(folderPath, 'chat.md')
  if (!chatPath) return
  writeFileSync(chatPath, content || '', 'utf-8')
}

function appendUserMessage(folderName: string, message: string) {
  const chatPath = resolveQueueFolder(folderName, 'chat.md')
  if (!chatPath) return
  if (!existsSync(chatPath)) {
    writeFileSync(chatPath, message, 'utf-8'); return
  }
  appendFileSync(chatPath, `\n\n---\n\n**User:**\n${message}\n`, 'utf-8')
}

function listQueue(): QueueItem[] {
  const queueDir = getHingeRoot()
  if (!existsSync(queueDir)) return []
  // Read-only sync for UI — no recovery side effects on GET
  syncRunningTasksFromDisk()
  const entries = readdirSync(queueDir, { withFileTypes: true })
  const items: QueueItem[] = []
  for (const e of entries) {
    if (!e.isDirectory()) continue
    const name = e.name
    if (name.startsWith('.')) continue
    if (!name.includes('_new') && !name.includes('_wait') && !name.includes('_done') && !name.includes('_processing')) continue
    const status = name.endsWith('_done') ? 'done' : name.endsWith('_processing') ? 'processing' as any : name.endsWith('_wait') ? 'wait' : 'new'
    const mdPath = resolveQueueFolder(name, 'chat.md')
    if (!mdPath || !existsSync(mdPath)) continue
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
    const errorPath = resolveQueueFolder(name, '.error')
    const failed = errorPath ? existsSync(errorPath) : false
    const alias = name.replace(/_(new|wait|done|processing)$/, '')
    let displayStatus: QueueItem['status'] = failed ? 'error' : status
    let agentStatus = status === 'processing' ? getAgentStatus(name) : null
    // Recovery can rename _processing → _done before wrapper writes **Assistant:**
    if (displayStatus === 'done' && !content.includes('**Assistant:**')) {
      const live = inspectWrapperByAlias(alias)
      if (live.liveness === 'running') {
        displayStatus = 'processing'
        agentStatus = { status: live.liveness, pid: live.pid, elapsed: live.elapsed }
      }
    }
    items.push({ name, status: displayStatus, content: content || '', component, note, url, dom, failed, agentStatus } as QueueItem)
  }
  items.sort((a, b) => b.name.localeCompare(a.name))
  return items
}

function toggleQueueItem(filename: string): boolean {
  const abs = resolveQueueFolderExisting(filename)
  if (!abs) return false
  const stem = filename.replace(/_(new|wait|done|processing)$/, '')
  let suffix: string
  if (filename.endsWith('_new')) suffix = '_wait'
  else if (filename.endsWith('_wait')) suffix = '_done'
  else if (filename.endsWith('_processing')) suffix = '_done'
  else suffix = '_new'
  const dest = resolveQueueFolder(`${stem}${suffix}`)
  if (!dest) return false
  renameSync(abs, dest)
  return true
}

function setQueueItemStatus(name: string, status: string): boolean {
  const folderPath = resolveQueueFolderExisting(name)
  if (!folderPath) return false
  const stem = name.replace(/_(new|wait|done|processing)$/, '')
  const newName = `${stem}_${status}`
  if (newName === name) return true
  const dest = resolveQueueFolder(newName)
  if (!dest) return false
  renameSync(folderPath, dest)
  return true
}

function deleteQueueItem(filename: string): boolean {
  const abs = resolveQueueFolderExisting(filename)
  if (!abs) return false
  try { rmSync(abs, { recursive: true, force: true }); return true } catch { return false }
}

function updateQueueItemNote(filename: string, newNote: string): boolean {
  const mdPath = resolveQueueFolderExisting(filename, 'chat.md')
  if (!mdPath) return false
  writeFileSync(mdPath, newNote, 'utf-8')
  return true
}

// ── Attachment helpers ────────────────────────────────────

function listAttachments(folderName: string): { name: string; size: number }[] {
  const attachDir = resolveQueueFolderExisting(folderName, 'attach')
  if (!attachDir) return []
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
  const safeFile = safeBasename(fileName)
  if (!safeFile) return false
  const filePath = resolveQueueFolderExisting(folderName, 'attach', safeFile)
  if (!filePath) return false
  unlinkSync(filePath)
  return true
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
