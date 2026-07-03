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
import { resolve, relative, sep } from 'node:path'
import { spawn } from 'node:child_process'
import { loadConfig, resolveAgentScripts } from './utils/config'

// ── Shared state ──────────────────────────────────────────
const runningTasks = new Set<string>()
const taskQueue: string[] = []
let apiServer: http.Server | null = null

// ── Public entry point ────────────────────────────────────
export function startHingeServer(port = 5177): http.Server {
  if (apiServer) return apiServer
  apiServer = http.createServer(handleRequest)
  apiServer.listen(port, () => {
    console.log(`[hinge-server] Listening on :${port}`)
  })
  return apiServer
}

export function stopHingeServer(): void {
  if (apiServer) {
    try { apiServer.close() } catch { /* ignore */ }
    apiServer = null
  }
}

/** True while the server has been started (survives Vite HMR module re-eval) */
let serverStarted = false
export function isRunning(): boolean { return serverStarted }
export function markRunning(): void { serverStarted = true }

// ── Request router ────────────────────────────────────────
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
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
        if (ok) processNextTask()
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
      const processingName = `${stemName}_processing`
      const queueDir = resolve(process.cwd(), '.hinge')
      const folderPath = resolve(queueDir, processingName)

      const qIdx = taskQueue.indexOf(processingName)
      if (qIdx !== -1) taskQueue.splice(qIdx, 1)

      if (runningTasks.has(processingName)) {
        runningTasks.delete(processingName)
        const pidPath = resolve(folderPath, '.pid')
        try {
          const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
          if (pid > 0) { try { process.kill(pid, 'SIGTERM') } catch { /* ignore */ } }
        } catch { /* ignore */ }
        try { unlinkSync(pidPath) } catch { /* ignore */ }
      }

      if (existsSync(folderPath)) {
        const newName = `${stemName}_new`
        try { renameSync(folderPath, resolve(queueDir, newName)) } catch { /* ignore */ }
      }
      processNextTask()
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
        const { saveConfig } = require('./utils/config')
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
      const { readPrompt } = require('./utils/config')
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

// ── Queue helpers ──────────────────────────────────────────

interface QueueItem {
  name: string; status: 'wait' | 'done'; content: string
  component: string; note: string; url: string; dom: string
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
      const sections = content.split(/^### /m)
      if (sections.length <= 1) return ''
      const last = sections[sections.length - 1]
      const afterFields = last.split('\n')
      let inFields = true
      const noteLines: string[] = []
      for (const line of afterFields.slice(1)) {
        if (inFields && /^[A-Za-z]\w+: /.test(line)) continue
        if (inFields && line.trim() === '') { inFields = false; continue }
        inFields = false
        noteLines.push(line)
      }
      return noteLines.join('\n').trim()
    })()
    items.push({ name, status, content: content || '', component, note, url, dom })
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
  let scriptPath: string

  if (isFirstRun) {
    agentInput = injectAttachments(folderPath, content)
    scriptPath = scripts.new_session
    try { writeFileSync(sessionMarker, alias, 'utf-8') } catch { /* ignore */ }
  } else {
    agentInput = extractLastUserMessage(content)
    scriptPath = scripts.continue_session
  }

  const timeout = 300_000
  const logPath = resolve(folderPath, 'chat.log')
  try { appendFileSync(logPath, `=== Agent run started: ${new Date().toISOString()} ===\n`, 'utf-8') } catch { /* ignore */ }

  try {
    const child = spawn('/bin/bash', [scriptPath, alias], {
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

    const killTimer = setTimeout(() => { try { child.kill('SIGTERM') } catch { /* ignore */ } }, timeout)

    child.on('close', () => {
      clearTimeout(killTimer)
      runningTasks.delete(folderName)
      try { unlinkSync(resolve(folderPath, '.pid')) } catch { /* ignore */ }
      processNextTask()

      if (stderr) {
        try { appendFileSync(logPath, `\n[stderr]\n${stderr}\n`, 'utf-8') } catch { /* ignore */ }
      }

      const finalAnswer = stdout.trim() || '(no output)'
      const appendix = `\n\n---\n\n**Assistant:**\n${finalAnswer}\n`
      try {
        const existing = readFileSync(chatPath, 'utf-8')
        writeFileSync(chatPath, existing + appendix, 'utf-8')
      } catch { /* ignore */ }

      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
      } catch { /* ignore */ }
    })

    child.on('error', () => {
      clearTimeout(killTimer)
      runningTasks.delete(folderName)
      try { unlinkSync(resolve(folderPath, '.pid')) } catch { /* ignore */ }
      processNextTask()
      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
      } catch { /* ignore */ }
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
  if (runningTasks.size > 0) return

  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!
    runTaskChunk(next)
    return
  }

  const queueDir = resolve(process.cwd(), '.hinge')
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
  } catch { return }

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
