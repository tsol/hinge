import type { Plugin } from 'vite'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, unlinkSync, renameSync, rmSync, statSync } from 'fs'
import { resolve, relative, sep, basename, dirname } from 'path'
import { execFileSync } from 'child_process'

// ── Shared config ─────────────────────────────────────────
import {
  loadConfig,
  saveConfig,
  getAction,
  resolveActionCommand,
  readPrompt,
} from './src/utils/config'

export interface FileEntry {
  name: string
  path: string
  isDir: boolean
  isSymlink: boolean
}

export interface QueueItem {
  name: string
  status: 'wait' | 'done'
  content: string
  component: string
  note: string
  url: string
  dom: string
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
    } catch { /* skip unreadable */ }
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
      const stat = statSync(full)
      if (stat.isDirectory()) {
        const rel = relative(process.cwd(), full)
        const depth = rel.split(sep).filter(Boolean).length
        if (depth < 6) {
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
  try {
    return readFileSync(abs, 'utf-8')
  } catch {
    return null
  }
}

// ──────────────────────────────────────────
// Task folder format: .hinge/<ts>_<status>/
//   - input.md  — the markdown content
//   - attach/   — attached files
// ──────────────────────────────────────────

function getQueueDir(): string {
  return resolve(process.cwd(), '.hinge')
}

function getTaskFolder(name: string): string {
  return resolve(getQueueDir(), name)
}

function getInputMdPath(name: string): string {
  return resolve(getTaskFolder(name), 'input.md')
}

function getAttachDir(name: string): string {
  return resolve(getTaskFolder(name), 'attach')
}

function getTaskStatus(name: string): 'wait' | 'processing' | 'done' {
  if (name.endsWith('_done')) return 'done'
  if (name.endsWith('_processing')) return 'processing'
  return 'wait'
}

function appendToQueue(content: string): string {
  const queueDir = getQueueDir()
  if (!existsSync(queueDir)) {
    mkdirSync(queueDir, { recursive: true })
  }
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const folderName = `${ts}_wait`
  const folderPath = resolve(queueDir, folderName)

  mkdirSync(folderPath, { recursive: true })

  const filePath = resolve(folderPath, 'input.md')
  writeFileSync(filePath, content || '', 'utf-8')
  return folderName
}

function listQueue(): QueueItem[] {
  const queueDir = getQueueDir()
  if (!existsSync(queueDir)) return []

  const entries = readdirSync(queueDir, { withFileTypes: true })
  const items: QueueItem[] = []

  for (const e of entries) {
    if (!e.isDirectory()) continue
    const name = e.name
    // Skip system dirs and non-task dirs
    if (name.startsWith('.')) continue
    if (!name.includes('_wait') && !name.includes('_done') && !name.includes('_processing')) continue

    const status = getTaskStatus(name)
    const inputMdPath = getInputMdPath(name)

    if (!existsSync(inputMdPath)) continue
    const raw = readFileSync(inputMdPath, 'utf-8')
    // Strip system prompt prefix if present
    const taskMarker = '<!-- task -->'
    const taskIdx = raw.indexOf(taskMarker)
    const content = taskIdx >= 0 ? raw.slice(taskIdx + taskMarker.length).trim() : raw
    const component = content.match(/^### Component: (.+)/m)?.[1] ?? ''
    const pageUrl = content.match(/^### Page: (.+)/m)?.[1] ?? ''
    const filePath = content.match(/^### File: (.+)/m)?.[1] ?? ''
    const dom = content.match(/^DOM: (.+)/m)?.[1] ?? ''
    const note = (() => {
      const sections = content.split(/^### /m)
      if (sections.length <= 1) return ''
      const last = sections[sections.length - 1]
      const afterFields = last.split('\n')
      // Drop header line and field lines, find note after first blank line
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

    items.push({ name, status, content: content || '', component, note, url: pageUrl, dom })
  }

  items.sort((a, b) => b.name.localeCompare(a.name)) // newest first
  return items
}

function toggleQueueItem(name: string): boolean {
  const folderPath = getTaskFolder(name)
  if (!existsSync(folderPath)) return false

  const newName = name.endsWith('_done')
    ? name.replace('_done', '_wait')
    : name.replace('_wait', '_done')
  const newPath = resolve(getQueueDir(), newName)

  renameSync(folderPath, newPath)
  return true
}

function setQueueItemStatus(name: string, status: string): boolean {
  if (status !== 'wait' && status !== 'done' && status !== 'processing') return false
  const targetSuffix = `_${status}`
  if (name.endsWith(targetSuffix)) return true // already that status
  const folderPath = getTaskFolder(name)
  if (!existsSync(folderPath)) return false

  const stem = name.replace(/_(wait|done)$/, '')
  const newName = `${stem}${targetSuffix}`
  const newPath = resolve(getQueueDir(), newName)
  renameSync(folderPath, newPath)
  return true
}

function deleteQueueItem(name: string): boolean {
  const folderPath = getTaskFolder(name)
  if (!existsSync(folderPath)) return false

  rmSync(folderPath, { recursive: true, force: true })
  return true
}

function updateQueueItemNote(name: string, newContent: string): boolean {
  const mdPath = getInputMdPath(name)
  if (!existsSync(mdPath)) return false
  writeFileSync(mdPath, newContent, 'utf-8')
  return true
}

// ──────────────────────────────────────────
// Attachments API
// ──────────────────────────────────────────

function listAttachments(folderName: string): { name: string; size: number }[] {
  const attachDir = getAttachDir(folderName)
  if (!existsSync(attachDir)) return []

  const entries = readdirSync(attachDir, { withFileTypes: true })
  const files: { name: string; size: number }[] = []

  for (const e of entries) {
    if (!e.isFile()) continue
    if (e.name.startsWith('.')) continue
    try {
      const stat = statSync(resolve(attachDir, e.name))
      files.push({ name: e.name, size: stat.size })
    } catch { /* skip */ }
  }

  files.sort((a, b) => a.name.localeCompare(b.name))
  return files
}

function deleteAttachment(folderName: string, fileName: string): boolean {
  const filePath = resolve(getAttachDir(folderName), fileName)
  if (!existsSync(filePath)) return false
  unlinkSync(filePath)
  return true
}

export function hingeApiPlugin(): Plugin {
  return {
    name: 'hinge-api',
    configureServer(server) {
      server.middlewares.use('/api/list-dir', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const dir = url.searchParams.get('path') || '.'
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(listDir(dir)))
      })

      server.middlewares.use('/api/read-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('path')
        if (!file) {
          res.statusCode = 400
          res.end('missing path')
          return
        }
        const content = readFilePath(file)
        if (content === null) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(content)
      })

      server.middlewares.use('/api/find-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const name = url.searchParams.get('name')
        if (!name) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'missing name' }))
          return
        }
        const found = findFile(name)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ path: found }))
      })

      // PUT /api/write-file — write content to a file
      server.middlewares.use('/api/write-file', (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'PUT only' }))
          return
        }
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            const { path: filePath, content } = JSON.parse(body)
            if (!filePath || content === undefined || content === null) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'missing path or content' }))
              return
            }
            const abs = resolve(process.cwd(), filePath)
            mkdirSync(dirname(abs), { recursive: true })
            writeFileSync(abs, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'invalid request' }))
          }
        })
      })

      // POST /api/transcribe — transcribe audio via faster-whisper (Python subprocess)
      server.middlewares.use('/api/transcribe', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'POST only' }))
          return
        }
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          const tmpPath = resolve(getQueueDir(), `_recording_${Date.now()}.webm`)
          try {
            writeFileSync(tmpPath, Buffer.concat(chunks))
            const script = `
import sys
from faster_whisper import WhisperModel
model = WhisperModel('tiny', device='cpu', compute_type='int8')
segments, _ = model.transcribe(sys.argv[1])
for seg in segments:
    print(seg.text)
`
            const result = execFileSync('python3', ['-c', script, tmpPath], {
              encoding: 'utf-8',
              timeout: 30_000,
              maxBuffer: 10 * 1024 * 1024,
            })
            const text = result.trim().split('\n').map(l => l.trim()).filter(Boolean).join(' ')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ text }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message || 'transcription failed' }))
          } finally {
            try { unlinkSync(tmpPath) } catch {}
          }
        })
      })

      // ─── Task queue endpoints ────────────────
      server.middlewares.use('/api/queue', (req, res, next) => {
        // Skip sub-paths (/api/queue/attach, /api/queue/attach-file)
        const urlPath = req.url?.split('?')[0] ?? ''
        if (urlPath && urlPath !== '/') return next()

        // GET — list queue items
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listQueue()))
          return
        }

        // DELETE — delete a queue item (folder)
        if (req.method === 'DELETE') {
          const url = new URL(req.url ?? '', `http://${req.headers.host}`)
          const file = url.searchParams.get('file')
          if (!file) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'missing file param' }))
            return
          }
          const ok = deleteQueueItem(file)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok }))
          return
        }

        // POST — create a queue item, return its folder name
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body)
              const name = appendToQueue(content ?? '')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, name }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid payload' }))
            }
          })
          return
        }

        // PATCH — update full content of a queue item
        if (req.method === 'PATCH') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const { file, content } = JSON.parse(body)
              if (!file) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'missing file' }))
                return
              }
              const ok = updateQueueItemNote(file, content ?? '')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid request' }))
            }
          })
          return
        }

        // PUT — toggle status (wait ↔ done)
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const { file, status } = JSON.parse(body)
              if (!file) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'missing file' }))
                return
              }
              const ok = status
                ? setQueueItemStatus(file, status)
                : toggleQueueItem(file)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid request' }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // ─── Attachments endpoints ────────────────
      server.middlewares.use('/api/queue/attach', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const folder = url.searchParams.get('folder')

        // GET — list attachments for a task folder
        if (req.method === 'GET') {
          if (!folder) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'missing folder param' }))
            return
          }
          const files = listAttachments(folder)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(files))
          return
        }

        // DELETE — remove an attachment
        if (req.method === 'DELETE') {
          if (!folder) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'missing folder param' }))
            return
          }
          const fileName = url.searchParams.get('file')
          if (!fileName) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'missing file param' }))
            return
          }
          const ok = deleteAttachment(folder, fileName)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok }))
          return
        }

        // POST — upload an attachment
        if (req.method === 'POST') {
          if (!folder) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'missing folder param' }))
            return
          }
          const contentType = req.headers['content-type'] || ''
          if (!contentType.startsWith('multipart/form-data')) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'multipart/form-data required' }))
            return
          }

          const attachDir = getAttachDir(folder)
          mkdirSync(attachDir, { recursive: true })

          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            try {
              const fullBody = Buffer.concat(chunks)
              const boundary = contentType.split('boundary=')[1]
              if (!boundary) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'no boundary' }))
                return
              }
              // Naive multipart parser — extract filename and content
              const boundaryBuf = Buffer.from(`--${boundary}`)
              const parts = splitBuffer(fullBody, boundaryBuf)
                .filter(p => p.length > 0 && !startsWithBuffer(p, Buffer.from('--\r\n')) && !startsWithBuffer(p, Buffer.from('--')))
              for (const part of parts) {
                const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
                if (headerEnd === -1) continue
                const headers = part.slice(0, headerEnd).toString('utf-8')
                const data = part.slice(headerEnd + 4)
                // Trim trailing \r\n
                const trimmed = data.slice(0, data.length - 2)
                const match = headers.match(/name="([^"]+)"(?:; filename="([^"]+)")?/)
                if (match && match[2]) {
                  // Save the file
                  const filePath = resolve(attachDir, match[2])
                  writeFileSync(filePath, trimmed)
                }
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message || 'upload failed' }))
            }
          })
          return
        }

        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // Serve attachment files from .hinge/<folder>/attach/<file>
      server.middlewares.use('/api/queue/attach-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const folder = url.searchParams.get('folder')
        const file = url.searchParams.get('file')
        if (!folder || !file) {
          res.statusCode = 400
          res.end('missing folder or file param')
          return
        }
        const abs = resolve(getAttachDir(folder), file)
        if (!existsSync(abs)) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        // Guess MIME type from extension
        const ext = file.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown',
        }
        res.setHeader('Content-Type', mimeMap[ext ?? ''] || 'application/octet-stream')
        const data = readFileSync(abs)
        res.end(data)
      })

      // ─── Status API (lightweight polling) ──
      server.middlewares.use('/api/status', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const queueDir = getQueueDir()
        let running = false
        const processing: string[] = []
        if (existsSync(queueDir)) {
          const entries = readdirSync(queueDir, { withFileTypes: true })
          for (const e of entries) {
            if (e.isDirectory() && e.name.endsWith('_processing')) {
              running = true
              processing.push(e.name)
            }
          }
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ running, processing }))
      })

      // ─── Config API ───────────────────────
      server.middlewares.use('/api/config', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(loadConfig()))
          return
        }
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              saveConfig(JSON.parse(body))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid config' }))
            }
          })
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // ─── Prompt API ───────────────────────
      server.middlewares.use('/api/prompt', (req, res) => {
        // GET — return current prompt (user override or default)
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(readPrompt())
          return
        }
        // POST — write user prompt override to .hinge/prompt.md
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const { content } = JSON.parse(body)
              const hingeDir = resolve(process.cwd(), '.hinge')
              if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
              writeFileSync(resolve(hingeDir, 'prompt.md'), content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid payload' }))
            }
          })
          return
        }
        // DELETE — remove user override, restore default
        if (req.method === 'DELETE') {
          const overridePath = resolve(process.cwd(), '.hinge', 'prompt.md')
          if (existsSync(overridePath)) unlinkSync(overridePath)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // ─── Queue output endpoint ────────────
      server.middlewares.use('/api/queue/output', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('file')
        if (!file) { res.statusCode = 400; res.end('missing file'); return }
        const outputPath = resolve(getTaskFolder(file), 'output.md')
        if (!existsSync(outputPath)) {
          res.statusCode = 404
          res.end('')
          return
        }
        const content = readFileSync(outputPath, 'utf-8')
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(content)
      })

      // ─── Execute agent ────────────────────
      // POST /api/execute — non-blocking. Just marks tasks as ready for cron.
      // The cron job handles actual agent execution.
      server.middlewares.use('/api/execute', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        let body = ''
        req.on('data', (chunk: string) => { body += chunk })
        req.on('end', () => {
          try {
            // Frontend already renamed tasks to _processing
            // Nothing else needed — cron picks them up
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, status: 'delegated' }))
          } catch (e: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message || e.toString() }))
          }
        })
      })
    },
  }
}

// ─── Buffer helpers ───────────────────────
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

function startsWithBuffer(buf: Buffer, prefix: Buffer): boolean {
  if (buf.length < prefix.length) return false
  return buf.slice(0, prefix.length).equals(prefix)
}

// ─── Background task execution ────────────
// No longer spawns agent — cron job handles execution.
// runTasks intentionally removed.
