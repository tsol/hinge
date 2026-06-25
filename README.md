# Hinge

A draggable debug cog for Vue apps. Distribute as an npm package — host projects add the Vite plugin and mount the UI.

The cog stays out of the way until clicked; the panel lets users send a text note to a developer agent along with debug context (URL, active component).

## Install

```bash
pnpm add hinge
```

## Usage

**`vite.config.ts`** — add the dev-server plugin to log queue entries:

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import hingePlugin from 'hinge/plugin'

export default defineConfig({
  plugins: [
    vue(),
    hingePlugin({ queueFile: resolve(__dirname, 'HINGE_QUEUE.md') }),
  ],
})
```

**`main.ts`** — mount the overlay (Vue and styles are bundled in the package):

```ts
import { mountHinge } from 'hinge'
import 'hinge/style.css'
import { router } from './router'

// Optional: expose router so hinge reports the active route name
window.__hingeRouter = router

mountHinge('body')
```

For Vue apps that already have Vue, prefer the component export (no duplicate Vue runtime, no extra `body` child):

```ts
import { Hinge } from 'hinge/component'
import 'hinge/style.css'
```

```vue
<template>
  <v-app>...</v-app>
  <Hinge />
</template>
```

## Package exports

| Import | Description |
|--------|-------------|
| `hinge` | `mountHinge()` — UI library (ES + UMD, Vue bundled) |
| `hinge/style.css` | Component styles |
| `hinge/component` | `Hinge` Vue component (uses host Vue, for in-app integration) |

## Scripts

```bash
pnpm build   # typecheck + library build → dist/
pnpm dev     # local dev server
```
