/**
 * Framework-agnostic component resolution from DOM elements.
 *
 * To add another UI framework:
 * 1. Create `src/utils/<framework>_adapter.ts` (see `vue_adapter.ts`, `react_adapter.ts`).
 * 2. Put all framework-specific types, skip-lists, and DOM introspection there.
 * 3. Export a `ComponentFrameworkAdapter` object and append it to `COMPONENT_ADAPTERS`.
 */

import { reactAdapter } from './react_adapter'
import { vueAdapter } from './vue_adapter'

export interface ComponentFrameworkAdapter {
  /** Short id, e.g. "vue" | "react". */
  readonly id: string
  /** Source file suffixes for this framework, e.g. [".vue"] or [".tsx", ".jsx"]. */
  readonly fileExtensions: readonly string[]
  resolveFromElement(el: Element | null): {
    component: string | null
    props: Record<string, unknown>
  }
}

export interface ComponentResolution {
  component: string | null
  props: Record<string, unknown>
  /** Which adapter produced the result, e.g. "vue" | "react". */
  framework: string | null
}

/** Adapters tried in order; first named component wins. */
export const COMPONENT_ADAPTERS: ComponentFrameworkAdapter[] = [
  vueAdapter,
  reactAdapter,
]

export function registerComponentAdapter(adapter: ComponentFrameworkAdapter): void {
  COMPONENT_ADAPTERS.push(adapter)
}

export function resolveComponentFromElement(el: Element | null): ComponentResolution {
  if (!el) {
    return { component: null, props: {}, framework: null }
  }

  for (const adapter of COMPONENT_ADAPTERS) {
    const { component, props } = adapter.resolveFromElement(el)
    if (component) {
      return { component, props, framework: adapter.id }
    }
  }

  return { component: null, props: {}, framework: null }
}

/** All registered component file extensions (deduplicated, adapter order preserved). */
export function getComponentFileExtensions(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const adapter of COMPONENT_ADAPTERS) {
    for (const ext of adapter.fileExtensions) {
      if (!seen.has(ext)) {
        seen.add(ext)
        out.push(ext)
      }
    }
  }
  return out
}

/** Strip a known component extension from a filename: "Foo.tsx" → "Foo". */
export function stripComponentExtension(filename: string): string {
  const lower = filename.toLowerCase()
  for (const ext of getComponentFileExtensions()) {
    if (lower.endsWith(ext.toLowerCase())) {
      return filename.slice(0, -ext.length)
    }
  }
  return filename
}

/** Format props for display in labels and queue entries. */
export function formatPropsInline(
  props: Record<string, unknown>,
  maxEntries = 4,
): string {
  const entries = Object.entries(props).slice(0, maxEntries)
  if (entries.length === 0) return ''

  const parts = entries.map(([key, value]) => {
    const serialized = typeof value === 'string' ? `"${value}"` : JSON.stringify(value)
    return `${key}=${serialized}`
  })

  const suffix = Object.keys(props).length > maxEntries ? ' …' : ''
  return parts.join(' ') + suffix
}
