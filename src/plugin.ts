import type { Plugin } from 'vite'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, unlinkSync, renameSync, statSync } from 'fs'
import { resolve, relative, sep, basename } from 'path'
import { execFileSync } from 'child_process'
import type { IncomingMessage } from 'node:http'

export interface HingePluginOptions {
  queueFile?: string
}

interface FileEntry {
  name: string
  path: string
  isDir: boolean
  isSymlink: boolean
}

interface QueuePayload {
  note: string
  url: string
  filePath: string
  component: string
  dom: string
  props: Record<string, unknown>
  elementHtml?: string
  computedStyles?: Record<string, string>
  elementRect?: { top: number; left: number; width: number; height: number }
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

function appendToQueue(payload: QueuePayload) {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) mkdirSync(queueDir, { recursive: true })
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const filePath = resolve(queueDir, `${ts}_wait.md`)
  const basename = payload.filePath ? payload.filePath.split('/').pop() || '' : ''
  const title = basename || payload.component || 'untitled'
  const lines: string[] = [
    `### ${title}`,
    `**Note:** ${payload.note}`,
    `**File:** ${payload.filePath || ''}`,
    `**DOM:** ${payload.dom}`,
    `**URL:** ${payload.url}`,
    `**Props:** \`${JSON.stringify(payload.props)}\``,
  ]
  if (payload.elementRect) {
    lines.push(`**Rect:** ${payload.elementRect.width}×${payload.elementRect.height} at ${payload.elementRect.left},${payload.elementRect.top}`)
  }
  if (payload.elementHtml) {
    lines.push('')
    lines.push('```html')
    lines.push(payload.elementHtml.slice(0, 2000))
    lines.push('```')
  }
  lines.push('')
  writeFileSync(filePath, lines.join('\n'), 'utf-8')
}

function listQueue(): QueueItem[] {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) return []
  const entries = readdirSync(queueDir, { withFileTypes: true })
  const items: QueueItem[] = []
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue
    const status = e.name.endsWith('_done.md') ? 'done' : 'wait'
    const abs = resolve(queueDir, e.name)
    const content = readFileSync(abs, 'utf-8')
    const component = (content.match(/^### (.+)/m)?.[1]) ?? basename(e.name, '.md')
    const note = (content.match(/\*\*Note:\*\* (.+)/)?.[1]) ?? ''
    const url = (content.match(/\*\*URL:\*\* (.+)/)?.[1]) ?? ''
    const dom = (content.match(/\*\*DOM:\*\* (.+)/)?.[1]) ?? ''
    items.push({ name: e.name, status, content, component, note, url, dom })
  }
  items.sort((a, b) => b.name.localeCompare(a.name))
  return items
}

function toggleQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  const newName = filename.endsWith('_done.md')
    ? filename.replace('_done.md', '_wait.md')
    : filename.replace('_wait.md', '_done.md')
  renameSync(abs, resolve(queueDir, newName))
  return true
}

function deleteQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  unlinkSync(abs)
  return true
}

function updateQueueItemNote(filename: string, newNote: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  const content = readFileSync(abs, 'utf-8')
  const updated = content.replace(/^(\*\*Note:\*\* ).*/m, (_, prefix) => `${prefix}${newNote}`)
  if (updated === content) {
    const withNote = content.replace(/^(#+ .+)/m, `$1\n**Note:** ${newNote}`)
    writeFileSync(abs, withNote, 'utf-8')
  } else {
    writeFileSync(abs, updated, 'utf-8')
  }
  return true
}

export default function hingePlugin(_options: HingePluginOptions = {}): Plugin {
  return {
    name: 'hinge-plugin',
    configureServer(server) {
      // List directory
      server.middlewares.use('/api/list-dir', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const dir = url.searchParams.get('path') || '.'
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(listDir(dir)))
      })

      // Read file
      server.middlewares.use('/api/read-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('path')
        if (!file) { res.statusCode = 400; res.end('missing path'); return }
        const content = readFilePath(file)
        if (content === null) { res.statusCode = 404; res.end('not found'); return }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(content)
      })

      // Find file
      server.middlewares.use('/api/find-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const name = url.searchParams.get('name')
        if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing name' })); return }
        const found = findFile(name)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ path: found }))
      })

      // Write file (PUT)
      server.middlewares.use('/api/write-file', (req, res) => {
        if (req.method !== 'PUT') { res.statusCode = 405; res.end(JSON.stringify({ error: 'PUT only' })); return }
        readBuffer(req).then(buf => {
          try {
            const { path: filePath, content } = JSON.parse(buf.toString())
            if (!filePath || content === undefined || content === null) {
              res.statusCode = 400; res.end(JSON.stringify({ error: 'missing path or content' })); return
            }
            writeFileSync(resolve(process.cwd(), filePath), content, 'utf-8')
            res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
          } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
        })
      })

      // Transcribe (POST)
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

      // Queue API (GET/POST/PUT/DELETE/PATCH)
      server.middlewares.use('/api/queue', (req, res) => {
        // GET — list
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listQueue()))
          return
        }

        // DELETE
        if (req.method === 'DELETE') {
          const url = new URL(req.url ?? '', `http://${req.headers.host}`)
          const file = url.searchParams.get('file')
          if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file param' })); return }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: deleteQueueItem(file) }))
          return
        }

        readBuffer(req).then(buf => {
          // POST — create
          if (req.method === 'POST') {
            try {
              const payload: QueuePayload = JSON.parse(buf.toString())
              appendToQueue(payload)
              res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid payload' })) }
            return
          }

          // PATCH — update note
          if (req.method === 'PATCH') {
            try {
              const { file, note } = JSON.parse(buf.toString())
              if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file' })); return }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: updateQueueItemNote(file, note ?? '') }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
            return
          }

          // PUT — toggle status
          if (req.method === 'PUT') {
            try {
              const { file } = JSON.parse(buf.toString())
              if (!file) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing file' })); return }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: toggleQueueItem(file) }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
            return
          }

          res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
        })
      })
    },
  }
}
