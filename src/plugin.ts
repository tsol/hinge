import type { Plugin, UserConfig, ProxyOptions } from 'vite'
import { writeFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import * as http from 'http'

// ── Server state (module-level, survives Vite HMR) ────────
let _hingeServerStarted = false
export function isServerRunning(): boolean { return _hingeServerStarted }
export function markServerStarted(): void { _hingeServerStarted = true }
export function resetServerState(): void { _hingeServerStarted = false }

// ── Agent script templates ─────────────────────────────────
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
      printf '{"%s":"%s"}\n' "$ALIAS" "$SESSION_ID" > "$MAPFILE"
    fi
  else
    echo "$ALIAS=$SESSION_ID" >> "$DIR/.sessions_map.txt"
  fi
fi
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^$"`

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
        printf '{"%s":"%s"}\n' "$ALIAS" "$NEW_SESSION_ID" > "$MAPFILE"
      fi
    else
      echo "$ALIAS=$NEW_SESSION_ID" >> "$DIR/.sessions_map.txt"
    fi
  fi
fi
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^↻ Resumed" | grep -v "^$"`

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
" "$AUDIO_FILE" 2>/dev/null`

// ── Agent wrapper (internal, NOT user-editable) ──────────────
const SCRIPT_AGENT_WRAPPER = `#!/bin/bash
# .agent-wrapper.sh — Hinge internal cleanup wrapper
# AUTO-GENERATED — do not edit.
set -e
ALIAS="$1"
SCRIPT_TYPE="$2"
DIR="$(dirname "$0")"
FOLDER="$DIR/\${ALIAS}_processing"
PID_FILE="$FOLDER/.pid"
CHAT_MD="$FOLDER/chat.md"
echo "$$" > "$PID_FILE"
if [ "$SCRIPT_TYPE" = "continue" ]; then
    USER_SCRIPT="$DIR/continue-session.sh"
else
    USER_SCRIPT="$DIR/new-session.sh"
fi
OUTPUT=$("$USER_SCRIPT" "$ALIAS")
CODE=$?
if [ -f "$CHAT_MD" ] && [ -n "$OUTPUT" ]; then
    printf "\\n\\n---\\n\\n**Assistant:**\\n%s\\n" "$OUTPUT" >> "$CHAT_MD"
fi
echo "$OUTPUT"
rm -f "$PID_FILE"
mv "$FOLDER" "$DIR/\${ALIAS}_done" 2>/dev/null || true
exit $CODE`

const SCRIPTS_TO_ENSURE: Record<string, string> = {
  'new-session.sh': SCRIPT_NEW_SESSION,
  'continue-session.sh': SCRIPT_CONTINUE_SESSION,
  'whisper.sh': SCRIPT_WHISPER,
  '.agent-wrapper.sh': SCRIPT_AGENT_WRAPPER,
}

function ensureScripts() {
  const hingeDir = resolve(process.cwd(), '.hinge')
  if (!existsSync(hingeDir)) mkdirSync(hingeDir, { recursive: true })
  for (const [name, content] of Object.entries(SCRIPTS_TO_ENSURE)) {
    const p = resolve(hingeDir, name)
    const isInternal = name.startsWith('.')
    if (isInternal || !existsSync(p)) {
      try {
        writeFileSync(p, content, 'utf-8')
        try { chmodSync(p, 0o755) } catch { /* non-blocking */ }
        console.log(`[hinge] ${isInternal ? 'Updated' : 'Created'} script: .hinge/${name}`)
      } catch (e) {
        console.error(`[hinge] Failed to create .hinge/${name}:`, e)
      }
    }
  }
}

// ── Vite Plugin ────────────────────────────────────────────
export interface HingePluginOptions {
  serverPort?: number
}

export default function hingePlugin(options: HingePluginOptions = {}): Plugin {
  const port = options.serverPort ?? 5177

  return {
    name: 'hinge-plugin',

    config(userConfig: UserConfig) {
      // Inject Vite proxy — forward /api/* to the hinge API server
      const existingProxy = (userConfig.server as any)?.proxy ?? {}
      return {
        server: {
          proxy: {
            ...existingProxy,
            '/api': {
              target: `http://localhost:${port}`,
              changeOrigin: true,
            } as ProxyOptions,
          },
        },
      }
    },

    transformIndexHtml() {
      return [{ tag: 'script', injectTo: 'head-prepend', children: 'window.__HINGE_DEFAULT_PROJECT=true;' }]
    },

    configureServer() {
      // Auto-generate agent scripts if missing
      ensureScripts()

      // Start the API server once (survives Vite HMR)
      if (!isServerRunning()) {
        markServerStarted()
        // Dynamic import — avoids bundling server.ts in the component build
        import('./server').then(({ startHingeServer }) => {
          startHingeServer(port)
          console.log(`[hinge] API server on :${port}, proxy /api/* → :${port}`)
        }).catch((e) => {
          console.error('[hinge] Failed to start API server:', e)
        })
      }

      // Auto-recover stuck _processing folders — periodic check
      const RECOVERY_INTERVAL_MS = 5 * 60 * 1000

      function recoverStuckTasks() {
        const queueDir = resolve(process.cwd(), '.hinge')
        if (!existsSync(queueDir)) return
        const entries = readdirSync(queueDir, { withFileTypes: true })
        const recovered: string[] = []
        for (const e of entries) {
          if (!e.isDirectory() || !e.name.endsWith('_processing')) continue
          const pidPath = resolve(queueDir, e.name, '.pid')
          let pidAlive = false
          if (existsSync(pidPath)) {
            const pid = parseInt(readFileSync(pidPath, 'utf-8').trim(), 10)
            if (!isNaN(pid)) {
              try { process.kill(pid, 0); pidAlive = true } catch { /* dead */ }
            }
          }
          if (!pidAlive) recovered.push(e.name)
        }
        if (recovered.length > 0) {
          const req = http.request(
            { hostname: 'localhost', port, path: '/api/execute', method: 'POST' },
            (r: any) => {
              let body = ''
              r.on('data', (d: string) => body += d)
              r.on('end', () => {
                const result = JSON.parse(body)
                if (result.spawned > 0) {
                  console.log(`[hinge] Recovered ${result.spawned} stuck task(s)`)
                }
              })
            }
          )
          req.on('error', () => { /* server not ready yet */ })
          req.end()
        }
      }

      // First check after 1s, then every 5 minutes
      setTimeout(recoverStuckTasks, 1000)
      setInterval(recoverStuckTasks, RECOVERY_INTERVAL_MS)
      console.log(`[hinge] Recovery: every ${RECOVERY_INTERVAL_MS / 60000} min, first check in 1s`)
    },

    closeBundle() {
      if (isServerRunning()) {
        import('./server').then(({ stopHingeServer }) => stopHingeServer(port))
        resetServerState()
      }
    },
  }
}
