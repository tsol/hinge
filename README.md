# HINGE

**HINGE** — browser-based agent UI for vibecoding, built for people who still want to see the code, think about structure, but do it from their phone in their free time.

Stop context-switching to a terminal. Open HINGE from the browser. Point at UI elements, select files, type instructions, and an LLM agent edits the code. All from the same tab — desktop or mobile.

Think of it as vibecoding, but with actual file access, a source code viewer, and enough tactility that you never feel *un-hinged*.

---

## Features

- **Cog overlay** — draggable floating button. Tap to open the panel. Drag to reposition.
- **Input tab** — type instructions, attach files/components, voice input (mic), send to queue.
- **File tree** — browse the project, select files to include in the task context.
- **Source viewer** — read any file with syntax highlighting (highlight.js). Live-updates while the agent works (polls `chat.log`).
- **Task queue** — all instructions go to a queue. Agent processes them one by one. Real-time chat history per task.
- **Element targeting** — click UI elements on the page to tell the agent exactly what to modify.
- **Voice input** — record and transcribe via whisper.
- **Persistence** — all state survives page reload: tabs, file selections, expanded accordions, drawer width, exec mode, locale.
- **i18n** — English and Russian (auto-saves preference).
- **Mobile-friendly** — responsive panel, touch controls, works from a phone browser.

---

## Agent scripts

HINGE is agent-agnostic. To plug in any agent backend (Claude Code, Codex, OpenCode, Aider, etc.), edit the three scripts in `.hinge/`. They are auto-generated on first `pnpm dev` — edit freely.

### `new-session.sh`

Called when a new task is submitted to the queue.

| | |
|---|---|
| **argv[1]** | alias — task folder name (e.g. `2026-07-06T19-36-40_139Z`) |
| **stdin** | user instruction + attached context (file tree, component targets) |
| **stdout** | agent's response (markdown text) |
| **Side effect** | save `alias → session_id` mapping for follow-up messages |

```bash
#!/bin/bash
set -e
ALIAS="$1"
INPUT=$(cat)

# Your agent call here — example with any CLI agent:
# OUTPUT=$(my-agent --input "$INPUT" 2>&1)

# Extract session ID (if your agent supports resumable sessions)
# SESSION_ID=...
# echo "$ALIAS=$SESSION_ID" >> "$(dirname "$0")/.sessions_map.txt"

echo "$OUTPUT"
```

### `continue-session.sh`

Called when the user sends a follow-up message in an existing task.

| | |
|---|---|
| **argv[1]** | alias — same task folder name |
| **stdin** | follow-up message text |
| **stdout** | agent's response (markdown text) |
| **Lookup** | reads `alias → session_id` from `.sessions.json` or `.sessions_map.txt` |

```bash
#!/bin/bash
set -e
ALIAS="$1"
INPUT=$(cat)
DIR="$(dirname "$0")"

# Look up session ID saved by new-session.sh
SESSION_ID=""
[ -f "$DIR/.sessions_map.txt" ] && SESSION_ID=$(grep "^$ALIAS=" "$DIR/.sessions_map.txt" | cut -d= -f2)

if [ -n "$SESSION_ID" ]; then
  # Resume session
  OUTPUT=$(my-agent --resume "$SESSION_ID" --input "$INPUT" 2>&1)
else
  # Fallback: create new session
  OUTPUT=$(my-agent --input "$INPUT" 2>&1)
  NEW_ID=...
  # echo "$ALIAS=$NEW_ID" >> "$DIR/.sessions_map.txt"
fi

echo "$OUTPUT"
```

### `whisper.sh`

Called when the user records a voice message.

| | |
|---|---|
| **argv[1]** | path to `.webm` audio file |
| **stdout** | transcribed text |

```bash
#!/bin/bash
set -e
AUDIO_FILE="$1"

# Example with faster-whisper:
python3 -c "
import sys
from faster_whisper import WhisperModel
model = WhisperModel('tiny', device='cpu', compute_type='int8')
segments, _ = model.transcribe(sys.argv[1])
for seg in segments:
    print(seg.text)
" "$AUDIO_FILE"
```

### Internal wrapper (do not edit)

`.agent-wrapper.sh` is auto-generated and handles lifecycle: writes PID, calls `new-session.sh` or `continue-session.sh`, appends output to `chat.md`, renames `_processing` → `_done` on exit, cleans up on SIGTERM. The three scripts above are the only customization surface.

---

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5176` in your browser. The cog appears in the bottom-right corner.

---

## Usage

1. **Tap the cog** 🔧 — the panel slides out.
2. **Type what you want** — e.g. "Make the header sticky".
3. **Point at UI elements** — click elements on the page to attach them as context.
4. **Select files** — switch to the Files tab, check files the agent should read.
5. **Add to queue** — the instruction goes into the task queue.
6. **The agent works** — HINGE spawns an agent session, logs progress in real-time.
7. **Watch the source change** — switch to Source tab to see files being edited live.

---

## Integration

### Component pattern (recommended for Vue apps)

```ts
// vite.config.ts
import hingePlugin from 'hinge/plugin'
export default defineConfig({
  plugins: [vue(), hingePlugin()],
})
```

```vue
<!-- App.vue — add <Hinge /> inside your root layout -->
<template>
  <v-app>
    <router-view />
    <Hinge />
  </v-app>
</template>

<script setup>
import { Hinge } from 'hinge/component'
import 'hinge/style.css'
</script>
```

### Standalone pattern (for non-Vue projects)

```ts
import { mountHinge } from 'hinge'
import 'hinge/style.css'
mountHinge('body')
```

### Package exports

| Import | Path | Description |
|--------|------|-------------|
| `hinge` | `hinge` | `mountHinge()` — full UI with bundled Vue |
| `hinge/style.css` | `hinge/style.css` | Component styles |
| `hinge/component` | `hinge/component` | `Hinge` Vue component (uses host Vue) |
| `hinge/plugin` | `hinge/plugin` | Vite plugin (API proxy + auto-generated agent scripts) |

---

## Requirements

- Node.js 18+
- pnpm (recommended) or npm
- An agent runner (default: Hermes — bundled scripts in `.hinge/`)

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (:5176) + API (:5177) |
| `pnpm build` | Typecheck + build to `dist/` |
| `pnpm preview` | Preview production build |

---

## Project structure

```
.hinge/                  # Agent runtime: sessions, state, helpers
├── new-session.sh       # Spawn a new agent session
├── continue-session.sh  # Resume an existing session
├── .agent-wrapper.sh    # Internal wrapper
├── whisper.sh           # Audio transcription
└── <task-folders>/      # Per-task directories

src/
├── main.ts              # mountHinge() entry point
├── component.ts         # Vue component export
├── plugin.ts            # Vite plugin
├── server.ts            # API server (standalone HTTP)
├── const.ts             # API_BASE, shared constants
├── Hinge.vue            # Root Vue component
├── components/
│   ├── HingeCog.vue         # Floating cog / burger
│   ├── HingeMenuToggle.vue  # Mobile hamburger
│   ├── HingePanel.vue       # Main panel (tabs + layout)
│   ├── HingeTabQueue.vue    # Task queue + chat
│   ├── HingeAttach.vue      # File/component attachment
│   ├── HingeMic.vue         # Voice recording
│   ├── NonBlockBtn.vue      # Non-blocking task button
│   ├── TestBtn.vue          # Test trigger
│   └── ToastContainer.vue   # Toast notifications
├── composables/
│   ├── usePersistedState.ts # State persistence
│   ├── useI18n.ts           # i18n (en/ru)
│   ├── useFileTree.ts       # Project file browser
│   ├── useFileSource.ts     # File content viewer
│   ├── useSelectionStore.ts # UI element selection
│   ├── useElementHighlights.ts
│   ├── useCogPosition.ts    # Drag positioning
│   ├── useQueueSubmit.ts    # Queue submission
│   ├── useTaskDraft.ts      # Draft management
│   └── ...
├── locales/
│   ├── en.ts                # English strings
│   └── ru.ts                # Russian strings
└── types/
    ├── target.ts
    └── config.ts
```

---

## Philosophy

Vibecoding is amazing for rapid prototyping. But sometimes you want to see what the agent changed, browse the file tree, and have a real conversation with the code — not just a one-shot prompt.

HINGE bridges that gap: the tactile feel of a full IDE, the convenience of a browser overlay, the power of agent-driven code modification. Use it on desktop. Use it on mobile. Use it anywhere you have a browser and an idea.
