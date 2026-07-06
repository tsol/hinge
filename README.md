# HINGE

**HINGE** — browser-based agent UI for vibecoding, built for people who still want to see the code, think about structure, but do it from their phone in their free time.

Stop context-switching to a terminal. Open HINGE from the browser. Point at UI elements, select files, type instructions, and an LLM agent edits the code. All from the same tab — desktop or mobile.

Think of it as vibecoding, but with actual file access, a source code viewer, and enough tactility that you never feel *un-hinged*.

---

## Features

- **Cog overlay** — draggable floating button. Tap to open the panel. Drag to reposition. Stays out of your way.
- **Input tab** — type instructions for the agent, attach files/components, voice input (mic), send to queue.
- **File tree** — browse the project, select files to include in the task context.
- **Source viewer** — read any file with syntax highlighting (highlight.js). Live-updating when the agent is processing (polls `chat.log`).
- **Task queue** — all instructions go to a queue. Agent processes them one by one. Real-time chat history per task.
- **Element targeting** — click UI elements on the page to tell the agent exactly what to modify. Component highlights help you see what you're pointing at.
- **Voice input** — record and transcribe your instruction via whisper.
- **Persistence** — all state survives page reload: open tabs, file selections, expanded accordions, drawer width, exec mode, active locale.
- **i18n** — English and Russian (auto-saves locale preference).
- **Mobile-friendly** — responsive panel, touch-friendly controls, works from a phone browser.

---

## Architecture

```
┌──────────────┐      ┌───────────┐      ┌──────────┐
│  Browser UI   │◄────►│ Vite Dev  │◄────►│  Agent   │
│  (Vue 3 SPA)  │      │  Server   │      │ (Hermes) │
│               │      │  :5176    │      │          │
│  cog + panel  │      │  :5177    │      │ .hinge/  │
│  file tree    │      │  (API)    │      │ sessions │
│  source view  │      │           │      │          │
│  task queue   │      │  proxy    │      │ ch-tasks │
│  chat         │      │  /hinge   │      │          │
└──────────────┘      └───────────┘      └──────────┘
```

- **Vite dev server** serves the HINGE UI and proxies `/hinge-api/*` to the internal HTTP server.
- **API server** (`server.ts`) runs on `localhost:5177`, handles queue CRUD, file operations, agent spawning, transcription.
- **Agent** (Hermes) runs headless, reads tasks from `.hinge/` directory, writes back chat logs.

---

## Getting started

```bash
# Install dependencies
pnpm install

# Start dev server (Vite :5176 + API :5177)
pnpm dev
```

Open `http://localhost:5176` in your browser. The cog appears in the bottom-right corner.

---

## Usage

1. **Tap the cog** 🔧 — the panel slides out.
2. **Type what you want** — e.g. "Make the header sticky" or "Fix the padding on that button".
3. **Point at UI elements** — click elements on the page to attach them as context.
4. **Select files** — switch to the Files tab, check files the agent should read.
5. **Add to queue** — the instruction goes into the task queue.
6. **The agent works** — HINGE spawns a Hermes agent session, logs progress in real-time.
7. **Watch the source change** — switch to Source tab to see files being edited live.

---

## Package exports

| Import | Description |
|--------|-------------|
| `hinge` | `mountHinge()` — full UI (Vue bundled) |
| `hinge/style.css` | Component styles |
| `hinge/component` | `Hinge` Vue component (uses host Vue) |
| `hinge/plugin` | Vite plugin for API proxy + queue logging |

### Integration into an existing project

```ts
// vite.config.ts
import hingePlugin from 'hinge/plugin'
export default defineConfig({
  plugins: [
    vue(),
    hingePlugin({ queueFile: resolve(__dirname, 'HINGE_QUEUE.md') }),
  ],
})

// main.ts
import { mountHinge } from 'hinge'
import 'hinge/style.css'
mountHinge('body')
```

---

## Requirements

- Node.js 18+
- pnpm (recommended) or npm
- An agent runner (default: Hermes — bundled scripts in `.hinge/`)

---

## Scripts

```bash
pnpm dev      # Start dev server (:5176) + API (:5177)
pnpm build    # Typecheck + build to dist/
pnpm preview  # Preview production build
```

---

## Project structure

```
.hinge/                  # Agent runtime: sessions, state, helpers
├── new-session.sh       # Spawn a new agent session
├── continue-session.sh  # Resume an existing session
├── .agent-wrapper.sh    # Internal wrapper plugin
├── whisper.sh           # Audio transcription (whisper)
├── *.md / default-prompt.md
└── <task-folders>/      # Task directories per queue item
src/
├── main.ts              # mountHinge entry
├── component.ts         # Vue component export
├── plugin.ts            # Vite plugin
├── server.ts            # API server (standalone HTTP)
├── const.ts             # API_BASE, shared constants
├── Hinge.vue            # Root Vue component
├── components/
│   ├── HingeCog.vue         # Floating cog / burger button
│   ├── HingeMenuToggle.vue  # Mobile hamburger
│   ├── HingePanel.vue       # Main panel (tabs + layout)
│   ├── HingeTabQueue.vue    # Task queue + chat history
│   ├── HingeAttach.vue      # File/component attachment
│   ├── HingeMic.vue         # Voice recording
│   ├── NonBlockBtn.vue      # Non-blocking task button
│   ├── TestBtn.vue          # Test trigger button
│   └── ToastContainer.vue   # Toast notifications
├── composables/
│   ├── usePersistedState.ts # State persistence
│   ├── useI18n.ts           # i18n (en/ru)
│   ├── useFileTree.ts       # Project file tree
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
