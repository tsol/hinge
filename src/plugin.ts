import type { Plugin } from 'vite'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, appendFileSync, unlinkSync, renameSync, rmSync, statSync, chmodSync } from 'fs'
import { resolve, relative, sep } from 'path'
import { spawn } from 'child_process'
import type { IncomingMessage } from 'node:http'

// ── Running tasks tracking ────────────────────────────────
const runningTasks = new Set<string>()
const taskQueue: string[] = []

// ── Shared config ─────────────────────────────────────────
import {
  loadConfig,
  saveConfig,
  readPrompt,
  resolveAgentScripts,
  resolveWhisperScript,
} from './utils/config'

export interface HingePluginOptions {
  // currently unused — kept for API compatibility
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

// ── Helpers ───────────────────────────────────────────────

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
  const folderName = `${ts}_new`
  const folderPath = resolve(queueDir, folderName)
  mkdirSync(folderPath, { recursive: true })
  const filePath = resolve(folderPath, 'chat.md')
  writeFileSync(filePath, content || '', 'utf-8')
}

/** Append a user message to an existing task's chat.md */
function appendUserMessage(folderName: string, message: string) {
  const queueDir = resolve(process.cwd(), '.hinge')
  const chatPath = resolve(queueDir, folderName, 'chat.md')
  if (!existsSync(chatPath)) {
    writeFileSync(chatPath, message, 'utf-8')
    return
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
  try {
    rmSync(abs, { recursive: true, force: true })
    return true
  } catch { return false }
}

function updateQueueItemNote(filename: string, newNote: string): boolean {
  const queueDir = resolve(process.cwd(), '.hinge')
  const mdPath = resolve(queueDir, filename, 'chat.md')
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

/** Inject attachment file references into the prompt */
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

/** Extract the last user message from chat.md for session continuation */
function extractLastUserMessage(content: string): string {
  // Split on --- section markers
  const sections = content.split(/\n---\n/)
  // Find last section that starts with **User:**
  for (let i = sections.length - 1; i >= 0; i--) {
    const match = sections[i].match(/^\*\*User:\*\*\n([\s\S]*)/)
    if (match) return match[1].trim()
  }
  // No User section — return entire content (first message)
  return content.trim()
}

// ── Auto-generate agent scripts ────────────────────────────
const SCRIPT_NEW_SESSION = `#!/bin/bash
# new-session.sh — Create a new Hermes session
# Hinge auto-generated — edit as needed
set -e
ALIAS="$1"
INPUT=$(cat)
DIR="$(dirname "$0")"
MAPFILE="$DIR/.sessions.json"
HERMES_BIN="/opt/hermes/.venv/bin/hermes"
if [ ! -x "$HERMES_BIN" ]; then
  HERMES_BIN="$(command -v hermes 2>/dev/null || true)"
fi
if [ -z "$HERMES_BIN" ] || [ ! -x "$HERMES_BIN" ]; then
  cat <<'HELP'
┌────────────────────────────────────────────────────────────┐
│  Hinge — Hermes Agent not found                           │
│                                                            │
│  To use Hermes as the AI agent backend, you need to:       │
│                                                            │
│  1. Install Hermes:                                        │
│     pip install hermes-agent                               │
│     or follow: https://hermes-agent.nousresearch.com/docs  │
│                                                            │
│  2. Make sure \`hermes\` is in your PATH, or update the      │
│     HERMES_BIN path in .hinge/new-session.sh               │
│                                                            │
│  3. Verify with: hermes --version                          │
│                                                            │
│  See https://github.com/nousresearch/hermes-agent          │
│  for installation guides and configuration.                │
└────────────────────────────────────────────────────────────┘
HELP
  exit 1
fi
HAVE_JQ=false
command -v jq &>/dev/null && HAVE_JQ=true
OUTPUT=$("$HERMES_BIN" chat -q "$INPUT" -Q --yolo --source hinge 2>&1)
SESSION_ID=$(echo "$OUTPUT" | grep "^session_id:" | awk '{print $2}')
if [ -n "$SESSION_ID" ]; then
  if $HAVE_JQ; then
    TMP=$(mktemp)
    if [ -f "$MAPFILE" ]; then
      jq --arg a "$ALIAS" --arg s "$SESSION_ID" '.[$a]=$s' "$MAPFILE" > "$TMP" && mv "$TMP" "$MAPFILE"
    else
      printf '{"%s":"%s"}\\n' "$ALIAS" "$SESSION_ID" > "$MAPFILE"
    fi
  else
    echo "$ALIAS=$SESSION_ID" >> "$DIR/.sessions_map.txt"
  fi
fi
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^$"
`

const SCRIPT_CONTINUE_SESSION = `#!/bin/bash
# continue-session.sh — Continue an existing Hermes session, or create new if not found
# Hinge auto-generated — edit as needed
set -e
ALIAS="$1"
INPUT=$(cat)
DIR="$(dirname "$0")"
MAPFILE="$DIR/.sessions.json"
HERMES_BIN="/opt/hermes/.venv/bin/hermes"
if [ ! -x "$HERMES_BIN" ]; then
  HERMES_BIN="$(command -v hermes 2>/dev/null || true)"
fi
if [ -z "$HERMES_BIN" ] || [ ! -x "$HERMES_BIN" ]; then
  cat <<'HELP'
┌────────────────────────────────────────────────────────────┐
│  Hinge — Hermes Agent not found                           │
│                                                            │
│  To use Hermes as the AI agent backend, you need to:       │
│                                                            │
│  1. Install Hermes:                                        │
│     pip install hermes-agent                               │
│     or follow: https://hermes-agent.nousresearch.com/docs  │
│                                                            │
│  2. Make sure \`hermes\` is in your PATH, or update the      │
│     HERMES_BIN path in .hinge/continue-session.sh          │
│                                                            │
│  3. Verify with: hermes --version                          │
│                                                            │
│  See https://github.com/nousresearch/hermes-agent          │
│  for installation guides and configuration.                │
└────────────────────────────────────────────────────────────┘
HELP
  exit 1
fi
SESSION_ID=""
if command -v jq &>/dev/null && [ -f "$MAPFILE" ]; then
  SESSION_ID=$(jq -r --arg a "$ALIAS" '.[$a] // empty' "$MAPFILE")
fi
if [ -z "$SESSION_ID" ] && [ -f "$DIR/.sessions_map.txt" ]; then
  SESSION_ID=$(grep "^$ALIAS=" "$DIR/.sessions_map.txt" | cut -d= -f2)
fi
if [ -n "$SESSION_ID" ]; then
  OUTPUT=$("$HERMES_BIN" chat -q "$INPUT" --resume "$SESSION_ID" -Q --yolo --source hinge 2>&1)
else
  # Fallback: create new session if alias not found (e.g. cancelled + re-run)
  HAVE_JQ=false
  command -v jq &>/dev/null && HAVE_JQ=true
  OUTPUT=$("$HERMES_BIN" chat -q "$INPUT" -Q --yolo --source hinge 2>&1)
  NEW_SESSION_ID=$(echo "$OUTPUT" | grep "^session_id:" | awk '{print $2}')
  if [ -n "$NEW_SESSION_ID" ]; then
    if $HAVE_JQ; then
      TMP=$(mktemp)
      if [ -f "$MAPFILE" ]; then
        jq --arg a "$ALIAS" --arg s "$NEW_SESSION_ID" '.[$a]=$s' "$MAPFILE" > "$TMP" && mv "$TMP" "$MAPFILE"
      else
        printf '{"%s":"%s"}\\n' "$ALIAS" "$NEW_SESSION_ID" > "$MAPFILE"
      fi
    else
      echo "$ALIAS=$NEW_SESSION_ID" >> "$DIR/.sessions_map.txt"
    fi
  fi
fi
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^↻ Resumed" | grep -v "^$"
`

const SCRIPT_WHISPER = `#!/bin/bash
# whisper.sh — Transcribe audio file to text
# Hinge auto-generated — edit as needed
set -e
AUDIO_FILE="$1"
if ! command -v python3 &>/dev/null; then
  cat <<'HELP'
┌────────────────────────────────────────────────────────────┐
│  Hinge — Python 3 not found                               │
│                                                            │
│  To use voice transcription, you need:                     │
│                                                            │
│  1. Install Python 3:                                      │
│     https://www.python.org/downloads/                      │
│                                                            │
│  2. Install faster-whisper:                                │
│     pip install faster-whisper                             │
│                                                            │
│  See https://github.com/SYSTRAN/faster-whisper             │
│  for details.                                              │
└────────────────────────────────────────────────────────────┘
HELP
  exit 1
fi
if ! python3 -c "import faster_whisper" 2>/dev/null; then
  cat <<'HELP'
┌────────────────────────────────────────────────────────────┐
│  Hinge — faster-whisper not installed                     │
│                                                            │
│  To use voice transcription, install:                      │
│                                                            │
│    pip install faster-whisper                              │
│                                                            │
│  It may also need:                                         │
│    pip install ctranslate2                                 │
│                                                            │
│  See https://github.com/SYSTRAN/faster-whisper             │
│  for details.                                              │
└────────────────────────────────────────────────────────────┘
HELP
  exit 1
fi
python3 -c "
import sys
from faster_whisper import WhisperModel
model = WhisperModel('tiny', device='cpu', compute_type='int8')
segments, _ = model.transcribe(sys.argv[1])
for seg in segments:
    print(seg.text)
" "$AUDIO_FILE" 2>/dev/null
`

const SCRIPTS_TO_ENSURE: Record<string, string> = {
  'new-session.sh': SCRIPT_NEW_SESSION,
  'continue-session.sh': SCRIPT_CONTINUE_SESSION,
  'whisper.sh': SCRIPT_WHISPER,
}

function ensureScripts() {
  const hingeDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
  for (const [name, content] of Object.entries(SCRIPTS_TO_ENSURE)) {
    const p = resolve(hingeDir, name)
    if (!existsSync(p)) {
      try {
        writeFileSync(p, content, 'utf-8')
        // Make executable — chmod +x
        try {
          chmodSync(p, 0o755)
        } catch { /* non-blocking */ }
        console.log(`[hinge] Created default script: .hinge/${name}`)
      } catch (e) {
        console.error(`[hinge] Failed to create .hinge/${name}:`, e)
      }
    }
  }
}

// ── Plugin ────────────────────────────────────────────────

export default function hingePlugin(_options: HingePluginOptions = {}): Plugin {
  return {
    name: 'hinge-plugin',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: 'window.__HINGE_DEFAULT_PROJECT=true;',
        },
      ]
    },
    configureServer(server) {
      // ── Auto-generate agent scripts if missing ──
      ensureScripts()

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

      // Serve any file with proper MIME type (for image preview in Source tab)
      server.middlewares.use('/api/raw-file', (req, res) => {
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const filePath = url.searchParams.get('path')
        if (!filePath) { res.statusCode = 400; res.end('missing path'); return }
        const abs = resolve(process.cwd(), filePath)
        if (!existsSync(abs)) { res.statusCode = 404; res.end('not found'); return }
        if (!statSync(abs).isFile()) { res.statusCode = 400; res.end('not a file'); return }
        const ext = filePath.split('.').pop()?.toLowerCase()
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
          bmp: 'image/bmp', ico: 'image/x-icon',
        }
        res.setHeader('Content-Type', mimeMap[ext ?? ''] || 'application/octet-stream')
        res.end(readFileSync(abs))
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

      // ── Transcribe (via whisper.sh) ──
      server.middlewares.use('/api/transcribe', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        readBuffer(req).then(async buf => {
          const tmpPath = resolve(process.cwd(), `.hinge/_recording_${Date.now()}.webm`)
          try {
            writeFileSync(tmpPath, buf)
            const whisperScript = resolveWhisperScript()
            if (!existsSync(whisperScript)) {
              throw new Error('whisper.sh not found — create .hinge/whisper.sh')
            }
            const result = await new Promise<string>((resolvePromise, reject) => {
              const child = spawn('/bin/bash', [whisperScript, tmpPath], {
                timeout: 30_000,
                env: { ...process.env },
              })
              let out = '', err = ''
              child.stdout.on('data', (d: Buffer) => out += d.toString())
              child.stderr.on('data', (d: Buffer) => err += d.toString())
              child.on('close', (code) => code === 0 ? resolvePromise(out) : reject(new Error(err || `exit ${code}`)))
              child.on('error', reject)
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

      // ── Attachments (distinct path, no /api/queue prefix collision) ──
      server.middlewares.use('/api/attach', (req, res) => {
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
      server.middlewares.use('/api/attach-file', (req, res) => {
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

      // ── Queue API ──

      // ── Queue output (distinct path) ──
      server.middlewares.use('/api/output', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('file')
        if (!file) { res.statusCode = 400; res.end('missing file'); return }
        const chatPath = resolve(process.cwd(), '.hinge', file, 'chat.md')
        if (!existsSync(chatPath)) { res.statusCode = 404; res.end(''); return }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(readFileSync(chatPath, 'utf-8'))
      })

      // ── Queue log (streaming agent output) ──
      server.middlewares.use('/api/log', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const url = new URL(req.url ?? '', `http://${req.headers.host}`)
        const file = url.searchParams.get('file')
        if (!file) { res.statusCode = 400; res.end('missing file'); return }
        const logPath = resolve(process.cwd(), '.hinge', file, 'chat.log')
        if (!existsSync(logPath)) { res.statusCode = 404; res.end(''); return }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(readFileSync(logPath, 'utf-8'))
      })

      // ── Execute agent (async) ──
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
              if (ok) processNextTask()
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok }))
            } catch { res.statusCode = 400; res.end(JSON.stringify({ error: 'invalid request' })) }
            return
          }

          res.statusCode = 405; res.end(JSON.stringify({ error: 'method not allowed' }))
        })
      })

      // ── Chat send endpoint ──
      // POST /api/chat/send — append user message, set _processing, run agent
      server.middlewares.use('/api/chat/send', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        readBuffer(req).then(buf => {
          try {
            const { name, message } = JSON.parse(buf.toString())
            if (!name || !message) {
              res.statusCode = 400; res.end(JSON.stringify({ error: 'missing name or message' })); return
            }
            const queueDir = resolve(process.cwd(), '.hinge')
            // Strip status suffix, try all possible current names
            const stem = name.replace(/_(new|wait|done|processing)$/, '')
            const candidates = [`${stem}_wait`, `${stem}_done`, `${stem}_processing`, `${stem}_new`, stem]
            let folderPath: string | null = null
            let foundName = ''
            for (const c of candidates) {
              const p = resolve(queueDir, c)
              if (existsSync(p)) { folderPath = p; foundName = c; break }
            }
            if (!folderPath) {
              // Try exact name as fallback
              const exact = resolve(queueDir, name)
              if (existsSync(exact)) { folderPath = exact; foundName = name }
              else {
                res.statusCode = 404; res.end(JSON.stringify({ error: 'task not found' })); return
              }
            }
            // Append user message to chat.md
            appendUserMessage(foundName, message)
            // Set to _processing
            const processingName = `${stem}_processing`
            if (foundName !== processingName) {
              renameSync(folderPath, resolve(queueDir, processingName))
            }
            // Fire agent immediately
            if (!runningTasks.has(processingName)) {
              enqueueTask(processingName)
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, processingName }))
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ error: e.message || 'invalid request' }))
          }
        })
      })

      // ── Status ──
      server.middlewares.use('/api/status', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('GET only'); return }
        const processing = Array.from(runningTasks)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ running: processing.length > 0, processing }))
      })

      // ── Cancel task endpoint ──
      // POST /api/cancel — kills a _processing task, reverts folder to _new + cleans .session
      server.middlewares.use('/api/cancel', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        readBuffer(req).then(buf => {
          try {
            const { name } = JSON.parse(buf.toString())
            if (!name) { res.statusCode = 400; res.end(JSON.stringify({ error: 'missing name' })); return }
            const stemName = name.replace(/_(new|wait|done|processing)$/, '')
            const processingName = `${stemName}_processing`
            const queueDir = resolve(process.cwd(), '.hinge')
            const folderPath = resolve(queueDir, processingName)

            // Remove from queue if still pending
            const qIdx = taskQueue.indexOf(processingName)
            if (qIdx !== -1) taskQueue.splice(qIdx, 1)

            // Kill running process if active
            if (runningTasks.has(processingName)) {
              runningTasks.delete(processingName)
              const pidPath = resolve(folderPath, '.pid')
              try {
                const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
                if (pid > 0) {
                  try { process.kill(pid, 'SIGTERM') } catch { /* already dead */ }
                }
              } catch { /* no pid file */ }
              try { unlinkSync(pidPath) } catch {}
            }

            // Revert to _new (so user can edit and re-run)
            if (existsSync(folderPath)) {
              const newName = `${stemName}_new`
              try { renameSync(folderPath, resolve(queueDir, newName)) } catch { /* already renamed */ }
            }

            // Continue queue if something was running
            processNextTask()

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e: any) {
            res.statusCode = 400; res.end(JSON.stringify({ error: e.message || 'invalid request' }))
          }
        })
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
      // POST /api/execute — scans _processing folders, runs agent script for each,
      // appends output to chat.md, renames to _done.
      server.middlewares.use('/api/execute', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ error: 'POST only' })); return }
        const queueDir = resolve(process.cwd(), '.hinge')
        if (!existsSync(queueDir)) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, spawned: 0 }))
          return
        }
        const entries = readdirSync(queueDir, { withFileTypes: true })
        let spawned = 0
        for (const e of entries) {
          if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
          if (runningTasks.has(e.name)) continue
          spawned++
          enqueueTask(e.name)
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, spawned }))
      })

      // ── Auto-recover stuck _processing folders on Vite restart ──
      setTimeout(() => {
        const queueDir = resolve(process.cwd(), '.hinge')
        if (!existsSync(queueDir)) return
        const entries = readdirSync(queueDir, { withFileTypes: true })
        const recovered: string[] = []
        for (const e of entries) {
          if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
          if (runningTasks.has(e.name)) continue
          // Check if old detached child is still alive
          const pidPath = resolve(queueDir, e.name, '.pid')
          if (existsSync(pidPath)) {
            const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
            if (!isNaN(pid)) {
              try { process.kill(pid, 0); continue } catch {}  // still alive → skip
            }
          }
          recovered.push(e.name)
          enqueueTask(e.name)
        }
        if (recovered.length > 0) {
          console.log(`[hinge] Recovered ${recovered.length} stuck task(s): ${recovered.join(', ')}`)
        }
      }, 500)
    },
  }
}

// ── Background task execution ────────────
function runTaskChunk(folderName: string) {
  runningTasks.add(folderName)
  const queueDir = resolve(process.cwd(), '.hinge')
  const folderPath = resolve(queueDir, folderName)
  const chatPath = resolve(folderPath, 'chat.md')
  if (!existsSync(chatPath)) {
    runningTasks.delete(folderName)
    try { renameSync(folderPath, resolve(queueDir, folderName.replace('_processing', '_done'))) } catch {}
    processNextTask()
    return
  }

  // Resolve agent from config
  const config = loadConfig()
  const agentName = config.agent?.name || 'hermes'
  const scripts = resolveAgentScripts(agentName)

  // Task alias = folder name without _processing suffix
  const alias = folderName.replace(/_processing$/, '')
  const sessionMarker = resolve(folderPath, '.session')
  const isFirstRun = !existsSync(sessionMarker)

  // Read chat content
  const content = readFileSync(chatPath, 'utf-8')

  // Build input for agent
  let agentInput: string
  let scriptPath: string

  if (isFirstRun) {
    // First message: inject attach files + full chat.md → new-session.sh
    agentInput = injectAttachments(folderPath, content)
    scriptPath = scripts.new_session
    // Create session marker
    try { writeFileSync(sessionMarker, alias, 'utf-8') } catch {}
  } else {
    // Continuation: extract last user message → continue-session.sh
    agentInput = extractLastUserMessage(content)
    scriptPath = scripts.continue_session
  }

  const timeout = 300_000
  const logPath = resolve(folderPath, 'chat.log')
  try {
    appendFileSync(logPath, `=== Agent run started: ${new Date().toISOString()} ===\n`, 'utf-8')
  } catch {}

  try {
    const child = spawn('/bin/bash', [scriptPath, alias], {
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    })
    child.unref()

    // Write PID so auto-recovery can detect live child
    const pidPath = resolve(folderPath, '.pid')
    try { writeFileSync(pidPath, String(child.pid ?? ''), 'utf-8') } catch {}

    // Write input via stdin
    child.stdin.write(agentInput)
    child.stdin.end()

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
      // Also write to chat.log for real-time viewing (polling)
      try { appendFileSync(logPath, d.toString(), 'utf-8') } catch {}
    })

    const killTimer = setTimeout(() => { try { child.kill('SIGTERM') } catch {} }, timeout)

    child.on('close', () => {
      clearTimeout(killTimer)
      runningTasks.delete(folderName)
      // Clean up PID file
      try { unlinkSync(resolve(folderPath, '.pid')) } catch {}
      // Start next queued task
      processNextTask()

      // Save stderr to chat.log for debugging
      if (stderr) {
        try { appendFileSync(logPath, `\n[stderr]\n${stderr}\n`, 'utf-8') } catch {}
      }

      // Append assistant response to chat.md
      const finalAnswer = stdout.trim() || '(no output)'
      const appendix = `\n\n---\n\n**Assistant:**\n${finalAnswer}\n`
      try {
        const existing = readFileSync(chatPath, 'utf-8')
        writeFileSync(chatPath, existing + appendix, 'utf-8')
      } catch {}

      // Rename to _done
      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
      } catch {}
    })

    child.on('error', () => {
      clearTimeout(killTimer)
      runningTasks.delete(folderName)
      // Clean up PID file
      try { unlinkSync(resolve(folderPath, '.pid')) } catch {}
      // Start next queued task
      processNextTask()
      try {
        const doneName = folderName.replace('_processing', '_done')
        renameSync(folderPath, resolve(queueDir, doneName))
      } catch {}
    })
  } catch {
    runningTasks.delete(folderName)
    processNextTask()
  }
}

// ── Sequential task queue ──────────────────────────
function enqueueTask(folderName: string) {
  if (runningTasks.has(folderName) || taskQueue.includes(folderName)) return
  taskQueue.push(folderName)
  processNextTask()
}

function processNextTask() {
  if (runningTasks.size > 0) return

  // If there are queued items (pushed via enqueueTask), process the oldest one
  if (taskQueue.length > 0) {
    const next = taskQueue.shift()!
    runTaskChunk(next)
    return
  }

  // Find the oldest _wait folder on disk and enqueue it
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
