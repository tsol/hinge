import type { Plugin } from 'vite'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, unlinkSync, renameSync, statSync } from 'fs'
import { resolve, relative, sep, basename } from 'path'
import { execFileSync } from 'child_process'

export interface FileEntry {
  name: string
  path: string
  isDir: boolean
  isSymlink: boolean
}

export interface QueuePayload {
  note: string
  url: string
  component: string
  dom: string
  props: Record<string, unknown>
  elementHtml?: string
  computedStyles?: Record<string, string>
  elementRect?: {
    top: number
    left: number
    width: number
    height: number
  }
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

function appendToQueue(payload: QueuePayload) {
  const queueDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(queueDir)) {
    mkdirSync(queueDir, { recursive: true })
  }
  const ts = new Date().toISOString().replace(/:/g, '-').replace('.', '_')
  const filePath = resolve(queueDir, `${ts}_wait.md`)

  const lines: string[] = [
    `### ${payload.component}`,
    `**Note:** ${payload.note}`,
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
    if (!e.isFile()) continue
    if (!e.name.endsWith('.md')) continue
    const status = e.name.endsWith('_done.md') ? 'done' : 'wait'
    const abs = resolve(queueDir, e.name)
    const content = readFileSync(abs, 'utf-8')
    const component = (content.match(/^### (.+)/m)?.[1]) ?? basename(e.name, '.md')
    const note = (content.match(/\*\*Note:\*\* (.+)/)?.[1]) ?? ''
    const url = (content.match(/\*\*URL:\*\* (.+)/)?.[1]) ?? ''
    const dom = (content.match(/\*\*DOM:\*\* (.+)/)?.[1]) ?? ''
    items.push({ name: e.name, status, content, component, note, url, dom })
  }
  items.sort((a, b) => b.name.localeCompare(a.name)) // newest first
  return items
}

function toggleQueueItem(filename: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const abs = resolve(queueDir, filename)
  if (!existsSync(abs)) return false
  const newName = filename.endsWith('_done.md')
    ? filename.replace('_done.md', '_wait.md')
    : filename.replace('_wait.md', '_done.md')
  const newAbs = resolve(queueDir, newName)
  renameSync(abs, newAbs)
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
  // Replace the **Note:** line; if not found, append it after the heading
  const updated = content.replace(
    /^(\*\*Note:\*\* ).*/m,
    (_, prefix) => `${prefix}${newNote}`
  )
  if (updated === content) {
    // No **Note:** line found — insert after first heading
    const withNote = content.replace(
      /^(#+ .+)/m,
      `$1\n**Note:** ${newNote}`
    )
    writeFileSync(abs, withNote, 'utf-8')
  } else {
    writeFileSync(abs, updated, 'utf-8')
  }
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
          const tmpPath = resolve(process.cwd(), `.hinge/_recording_${Date.now()}.webm`)
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

      server.middlewares.use('/api/queue', (req, res) => {
        // GET — list queue items
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(listQueue()))
          return
        }

        // DELETE — delete a queue item
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

        // POST — create a queue item
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const payload: QueuePayload = JSON.parse(body)
              appendToQueue(payload)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'invalid payload' }))
            }
          })
          return
        }

        // PATCH — update note of a queue item
        if (req.method === 'PATCH') {
          let body = ''
          req.on('data', (chunk: string) => { body += chunk })
          req.on('end', () => {
            try {
              const { file, note } = JSON.parse(body)
              if (!file) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'missing file' }))
                return
              }
              const ok = updateQueueItemNote(file, note ?? '')
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
              const { file } = JSON.parse(body)
              if (!file) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: 'missing file' }))
                return
              }
              const ok = toggleQueueItem(file)
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
    },
  }
}
