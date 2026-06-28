import type { Plugin } from 'vite'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, unlinkSync, renameSync, statSync } from 'fs'
import { resolve, relative, sep } from 'path'
import { execFileSync, execSync } from 'child_process'
import type { IncomingMessage } from 'node:http'

// ── Shared config ─────────────────────────────────────────
import {
  loadConfig,
  saveConfig,
  getAction,
  resolveActionCommand,
  readPrompt,
} from './utils/config'

export interface HingePluginOptions {
  queueFile?: string
}

interface FileEntry {
  name: string
  path: string
  isDir: boolean
  isSymlink: boolean
}

interface QueueItem {
  name: string
  status: 'wait' | 'done'
  content: string
  component: string
  note: string
  url: string
  dom: string
}

function readBuffer(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolvePromise(Buffer.concat(chunks)))
    req.on('error', reject)
  })
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

function appendToQueue(content: string) {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) mkdirSync(queueDir, { recursive: true })
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const folderName = `${ts}_wait`
  const folderPath = resolve(queueDir, folderName)
  mkdirSync(folderPath, { recursive: true })
  const filePath = resolve(folderPath, 'input.md')
  writeFileSync(filePath, content || '', 'utf-8')
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
    if (!name.includes('_wait') && !name.includes('_done') && !name.includes('_processing')) continue
    const status = name.endsWith('_done') ? 'done' : name.endsWith('_processing') ? 'processing' as any : 'wait'
    const mdPath = resolve(queueDir, name, 'input.md')
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
  const newName = filename.endsWith('_done')
    ? filename.replace('_done', '_wait')
    : filename.replace('_(wait|processing)', '_done')
  renameSync(abs, resolve(queueDir, newName))
  return true
}

function setQueueItemStatus(name: string, status: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const folderPath = resolve(queueDir, name)
  if (!existsSync(folderPath)) return false
  const stem = name.replace(/_(wait|done|processing)$/, '')
  const newName = `${stem}_${status}`
  if (newName === name) return true
  renameSync(folderPath, resolve(queueDir, newName))
  return true
}

function deleteQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  try {
    rmSync(abs, { recursive: true, force: true })
    return true
  } catch { return false }
}

function rmSync(p: string, _opts: { recursive: boolean; force: boolean }) {
  // Node 14 compat — fallback to shell
  const { spawnSync } = require('child_process')
  spawnSync('rm', ['-rf', p])
}

function updateQueueItemNote(filename: string, newNote: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const mdPath = resolve(queueDir, filename, 'input.md')
  if (!existsSync(mdPath)) return false
  writeFileSync(mdPath, newNote, 'utf-8')
  return true
}

function listAttachments(folderName: string): { name: string; size: number }[] {
  const attachDir = resolve(process.cwd(), '.hinge', folderName, 'attach')
  if (!existsSync(attachDir)) return []
  const entries = readdirSync(attachDir, { withFileTypes: true })
  const files: { name: string; size: number }[] = []
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith('.')) continue
    try {
      const stat = statSync(resolve(attachDir, e.name))
      files.push({ name: e.name, size: stat.size })
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

// ── Plugin ────────────────────────────────────────────────

export default function hingePlugin(_options: HingePluginOptions = {}): Plugin {
  return {
    name: 'hinge-plugin',
    configureServer(server) {
      // ── Directory / file operations ──
      server.middlewares.use('/api/list-dir', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const dir = url.searchParams.get('path') || '.'
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(listDir(dir)))
      })

      server.middlewares.use('/api/read-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('path')
        if (!file) { res.statusCode = 400; res.end('missing path'); return }
        const content = readFilePath(file)
        if (content === null) { res.statusCode = 404; res.end('not found'); return }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(content)
      })

      server.middlewares.use('/api/find-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const name = url.searchParams.get('name')
        if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing name' })); return }
        const found = findFile(name)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ path: found }))
      })

      server.middlewares.use('/api/write-file', (req, res) => {
        if (req.method !== 'PUT') { res.statusCode = 405; res.end(JSON.stringify({ error: 'PUT only' })); return }
        readBuffer(req).then(buf => {
          try {
            const { path: filePath, content } = JSON.parse(buf.toString())
            if (!filePath || content === undefined || content === null) {
              res.statusCode = 400; res.end(JSON.stringify({ error: 'missing path or content' })); return
            }
            const abs = resolve(process.cwd(), filePath)
            mkdirSync(resolve(abs, '..'), { recursive: true })
            writeFileSync(abs, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
          } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
        })
      })

      // ── Transcribe ──
      server.middlewares.use('/api/transcribe', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        readBuffer(req).then(async buf => {
          const tmpPath = resolve(process.cwd(), `.hinge/_recording_${Date.now()}.webm`)
          try {
            writeFileSync(tmpPath, buf)
            const script = `
import sys
from faster_whisper import WhisperModel
model = WhisperModel('tiny', device='cpu', compute_type='int8')
segments, _ = model.transcribe(sys.argv[1])
for seg in segments:
    print(seg.text)
`
            const result = execFileSync('python3', ['-c', script, tmpPath], {
              encoding: 'utf-8', timeout: 30_000, maxBuffer: 10 * 1024 * 1024,
            })
            const text = result.trim().split('\n').map(l => l.trim()).filter(Boolean).join(' ')
            res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ text }))
          } catch (e: any) {
            res.statusCode = 500; res.end(JSON.stringify({ error: e.message || 'transcription failed' }))
          } finally {
            try { unlinkSync(tmpPath) } catch { }
          }
        })
      })

      // ── Queue API ──
      server.middlewares.use('/api/queue', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listQueue()))
          return
        }

        if (req.method === 'DELETE') {
          const url = new URL(req.url ?? '', `http://${req.headers.host}`)
          const file = url.searchParams.get('file')
          if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file param' })); return }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: deleteQueueItem(file) }))
          return
        }

        readBuffer(req).then(buf => {
          if (req.method === 'POST') {
            try {
              const { content } = JSON.parse(buf.toString())
              appendToQueue(content ?? '')
              res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid payload' })) }
            return
          }

          if (req.method === 'PATCH') {
            try {
              const { file, content } = JSON.parse(buf.toString())
              if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file' })); return }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: updateQueueItemNote(file, content ?? '') }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
            return
          }

          if (req.method === 'PUT') {
            try {
              const { file, status } = JSON.parse(buf.toString())
              if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file' })); return }
              const ok = status ? setQueueItemStatus(file, status) : toggleQueueItem(file)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
            return
          }

          res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
        })
      })

      // ── Attachments ──
      server.middlewares.use('/api/queue/attach', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const folder = url.searchParams.get('folder')

        if (req.method === 'GET') {
          if (!folder) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing folder' })); return }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listAttachments(folder)))
          return
        }

        if (req.method === 'DELETE') {
          if (!folder) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing folder' })); return }
          const fileName = url.searchParams.get('file')
          if (!fileName) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file' })); return }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: deleteAttachment(folder, fileName) }))
          return
        }

        if (req.method === 'POST') {
          if (!folder) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing folder' })); return }
          const attachDir = resolve(process.cwd(), '.hinge', folder, 'attach')
          mkdirSync(attachDir, { recursive: true })
          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', () => {
            try {
              const fullBody = Buffer.concat(chunks)
              const contentType = req.headers['content-type'] || ''
              const boundary = contentType.split('boundary=')[1]
              if (!boundary) { res.statusCode = 400; res.end(JSON.stringify({ error: 'no boundary' })); return }
              const boundaryBuf = Buffer.from(`--${boundary}`)
              const parts = splitBuffer(fullBody, boundaryBuf)
                .filter(p => p.length > 0 && !startsWithBuffer(p, Buffer.from('--\r\n')) && !startsWithBuffer(p, Buffer.from('--')))
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
              res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
            } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message || 'upload failed' })) }
          })
          return
        }

        res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // Serve attachment files
      server.middlewares.use('/api/queue/attach-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const folder = url.searchParams.get('folder')
        const file = url.searchParams.get('file')
        if (!folder || !file) { res.statusCode = 400; res.end('missing folder or file'); return }
        const abs = resolve(process.cwd(), '.hinge', folder, 'attach', file)
        if (!existsSync(abs)) { res.statusCode = 404; res.end('not found'); return }
        const ext = file.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown',
        }
        res.setHeader('Content-Type', mimeMap[ext ?? ''] || 'application/octet-stream')
        res.end(readFileSync(abs))
      })

      // ── Status ──
      server.middlewares.use('/api/status', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const queueDir = resolve(process.cwd(), '.hinge')
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

      // ── Config API (action-aware) ──
      server.middlewares.use('/api/config', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(loadConfig()))
          return
        }
        if (req.method === 'POST') {
          readBuffer(req).then(buf => {
            try {
              const config = JSON.parse(buf.toString())
              saveConfig(config)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid config' }))
            }
          })
          return
        }
        res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // ── Prompt API ──
      server.middlewares.use('/api/prompt', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(readPrompt())
          return
        }
        if (req.method === 'POST') {
          readBuffer(req).then(buf => {
            try {
              const { content } = JSON.parse(buf.toString())
              const hingeDir = resolve(process.cwd(), '.hinge')
              if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
              writeFileSync(resolve(hingeDir, 'prompt.md'), content, 'utf-8')
              res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid payload' })) }
          })
          return
        }
        if (req.method === 'DELETE') {
          const overridePath = resolve(process.cwd(), '.hinge', 'prompt.md')
          if (existsSync(overridePath)) unlinkSync(overridePath)
          res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
          return
        }
        res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      // ── Queue output ──
      server.middlewares.use('/api/queue/output', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('file')
        if (!file) { res.statusCode = 400; res.end('missing file'); return }
        const outputPath = resolve(process.cwd(), '.hinge', file, 'output.md')
        if (!existsSync(outputPath)) { res.statusCode = 404; res.end(''); return }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(readFileSync(outputPath, 'utf-8'))
      })

      // ── Execute agent (action-aware) ──
      server.middlewares.use('/api/execute', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        readBuffer(req).then(async buf => {
          try {
            const { action: actionId } = JSON.parse(buf.toString())
            const config = loadConfig()
            const action = getAction(config, actionId)
            if (!action) {
              res.statusCode = 400; res.end(JSON.stringify({ error: `action not found: ${actionId || config.defaultAction}` })); return
            }

            const cwd = resolve(process.cwd(), action.cwd || '.')
            const ts = Date.now()
            const execDir = resolve(process.cwd(), '.hinge')
            if (!existsSync(execDir)) mkdirSync(execDir, { recursive: true })

            // Collect input: prepend system prompt if configured
            let inputContent = ''
            if (action.injectPrompt) {
              inputContent += readPrompt() + '\n\n<!-- task -->\n'
            }

            // Collect content from all _processing task folders
            const queueDir = resolve(process.cwd(), '.hinge')
            if (existsSync(queueDir)) {
              const entries = readdirSync(queueDir, { withFileTypes: true })
              for (const e of entries) {
                if (e.isDirectory() && e.name.endsWith('_processing')) {
                  const mdPath = resolve(queueDir, e.name, 'input.md')
                  if (existsSync(mdPath)) {
                    inputContent += readFileSync(mdPath, 'utf-8') + '\n---\n'
                    // Mark as done
                    const stem = e.name.replace(/_(wait|done|processing)$/, '')
                    renameSync(resolve(queueDir, e.name), resolve(queueDir, `${stem}_done`))
                  }
                }
              }
            }

            const inputFile = resolve(execDir, `_exec_${ts}_input.md`)
            writeFileSync(inputFile, inputContent, 'utf-8')

            const fullCommand = resolveActionCommand(action, inputFile)
            const result = execSync(fullCommand, {
              cwd,
              encoding: 'utf-8',
              timeout: (action.timeout || 120) * 1000,
              maxBuffer: 10 * 1024 * 1024,
            })

            const outputFile = resolve(execDir, `_exec_${ts}_output.md`)
            writeFileSync(outputFile, result, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, output: result.trim() }))
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

// ── Buffer helpers ────────────────────────────────────────
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
