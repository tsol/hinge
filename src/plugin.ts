import type { Plugin } from 'vite'
import { writeFileSync, chmodSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { attachHingeApiMiddleware, onHingeViteListening } from './server'
import { recoverAndSchedule } from './agentRunner'

// ── Server state (globalThis — survives Vite HMR module reload) ────────
const PLUGIN_STATE_KEY = '__hinge_plugin_state'

interface PluginState {
  recoveryTimer?: ReturnType<typeof setTimeout>
  recoveryInterval?: ReturnType<typeof setInterval>
}

function pluginState(): PluginState {
  const g = globalThis as unknown as Record<string, PluginState>
  if (!g[PLUGIN_STATE_KEY]) {
    g[PLUGIN_STATE_KEY] = {}
  }
  return g[PLUGIN_STATE_KEY]
}

function clearRecoveryTimers(): void {
  const state = pluginState()
  if (state.recoveryTimer) clearTimeout(state.recoveryTimer)
  if (state.recoveryInterval) clearInterval(state.recoveryInterval)
  state.recoveryTimer = undefined
  state.recoveryInterval = undefined
}

// ── Agent script templates ─────────────────────────────────
const SCRIPT_NEW_SESSION = `#!/bin/bash
# new-session.sh — Create a new agent session
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
Agent not found. Hinge cannot run tasks until a coding agent is configured. Edit .hinge/new-session.sh: set HERMES_BIN to your agent CLI executable, or install the agent and make sure it is available in PATH. The script is generated once — replace the default command with whatever backend you use.
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
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^$" || true`

const SCRIPT_CONTINUE_SESSION = `#!/bin/bash
# continue-session.sh — Continue an existing agent session, or create new if not found
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
Agent not found. Hinge cannot run tasks until a coding agent is configured. Edit .hinge/continue-session.sh: set HERMES_BIN to your agent CLI executable, or install the agent and make sure it is available in PATH. The script is generated once — replace the default command with whatever backend you use.
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
echo "$OUTPUT" | grep -v "^session_id:" | grep -v "^↻ Resumed" | grep -v "^$" || true`

const SCRIPT_WHISPER = `#!/bin/bash
# whisper.sh — Transcribe audio file to text
# Hinge auto-generated — edit as needed
set -e
AUDIO_FILE="$1"
if ! command -v python3 &>/dev/null; then
  cat <<'HELP'
Python 3 is required for voice transcription. Install Python 3, or edit .hinge/whisper.sh to point at a different interpreter or transcription command. The script is generated once — customize it for your setup.
HELP
  exit 1
fi
if ! python3 -c "import faster_whisper" 2>/dev/null; then
  cat <<'HELP'
Voice transcription dependency is missing (faster-whisper). Install it with pip install faster-whisper, or edit .hinge/whisper.sh to use a different transcription backend. The script is generated once — customize it for your setup.
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
#
# Sole owner of: chat.md assistant reply, .pid, .session (on first success), _processing → _done.
# Server spawns this detached and only schedules the next _wait task when wrapper exits.
# NOTE: no 'set -e'
ALIAS="$1"
SCRIPT_TYPE="$2"
DIR="$(dirname "$0")"
PROC="$DIR/\${ALIAS}_processing"
DONE="$DIR/\${ALIAS}_done"
PID_FILE="$PROC/.pid"
WRAPPER_PID="$DIR/.wrapper_\${ALIAS}.pid"
HINGE_HOST="$(hostname -s 2>/dev/null || hostname)"

_write_pid_files() {
  printf '%s\\n%s\\n' "$$" "$HINGE_HOST" > "$PID_FILE" 2>/dev/null || true
  printf '%s\\n%s\\n' "$$" "$HINGE_HOST" > "$WRAPPER_PID" 2>/dev/null || true
}

_resolve_folder() {
  if [ -d "$PROC" ]; then echo "$PROC"
  elif [ -d "$DONE" ]; then echo "$DONE"
  else echo ""
  fi
}

# On cancel (SIGTERM): drop pid only — server renames folder to _new
_cleanup() {
  rm -f "$PID_FILE" "$DONE/.pid" "$WRAPPER_PID" 2>/dev/null || true
  exit 0
}
trap _cleanup TERM INT

mkdir -p "$PROC" 2>/dev/null || true
_write_pid_files

if [ "$SCRIPT_TYPE" = "continue" ]; then
    USER_SCRIPT="$DIR/continue-session.sh"
else
    USER_SCRIPT="$DIR/new-session.sh"
fi

OUTPUT=$("$USER_SCRIPT" "$ALIAS")
CODE=$?

FOLDER="$(_resolve_folder)"
if [ -z "$FOLDER" ]; then
  FOLDER="$DONE"
  mkdir -p "$FOLDER" 2>/dev/null || true
fi
CHAT_MD="$FOLDER/chat.md"

printf "\\n\\n---\\n\\n**Assistant:**\\n%s\\n" "\${OUTPUT:-*(no output)*}" >> "$CHAT_MD"

if [ "$SCRIPT_TYPE" = "new" ] && [ "$CODE" -eq 0 ]; then
  touch "$FOLDER/.session" 2>/dev/null || true
fi

echo "$OUTPUT" || true
rm -f "$PID_FILE" "$DONE/.pid" "$WRAPPER_PID" 2>/dev/null || true
if [ -d "$PROC" ]; then
  mv "$PROC" "$DONE" 2>/dev/null || true
fi
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
  /** Mark as the main app (dev playground) — sets __HINGE_DEFAULT_PROJECT for always-on-top cog */
  isMainApp?: boolean
}

export default function hingePlugin(options: HingePluginOptions = {}): Plugin {
  return {
    name: 'hinge-plugin',
    enforce: 'pre',

    transformIndexHtml() {
      // Only set __HINGE_DEFAULT_PROJECT for the main dev app (not lib consumers like MOGU)
      if (options.isMainApp) {
        return [{ tag: 'script', injectTo: 'head-prepend', children: 'window.__HINGE_DEFAULT_PROJECT=true;' }]
      }
    },

    configureServer(server) {
      ensureScripts()

      const state = pluginState()
      clearRecoveryTimers()

      attachHingeApiMiddleware(server.middlewares)

      const syncVitePort = () => {
        const addr = server.httpServer?.address()
        const vitePort =
          typeof addr === 'object' && addr && 'port' in addr
            ? addr.port
            : (server.config.server.port ?? 5173)
        onHingeViteListening(vitePort)
      }

      if (server.httpServer?.listening) syncVitePort()
      else server.httpServer?.once('listening', syncVitePort)

      const RECOVERY_INTERVAL_MS = 5 * 60 * 1000

      function runRecovery() {
        const { recovered } = recoverAndSchedule()
        if (recovered > 0) {
          console.log(`[hinge] Recovered ${recovered} dead task(s)`)
        }
      }

      state.recoveryTimer = setTimeout(runRecovery, 5000)
      state.recoveryInterval = setInterval(runRecovery, RECOVERY_INTERVAL_MS)
      console.log(`[hinge] Recovery: every ${RECOVERY_INTERVAL_MS / 60000} min, first check in 5s`)

      // Re-attach after Vite finishes internal middleware setup (stack may be rebuilt)
      return () => {
        attachHingeApiMiddleware(server.middlewares)
      }
    },

    closeBundle() {
      clearRecoveryTimers()
    },
  }
}
