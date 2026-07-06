import type { ComponentFrameworkAdapter } from './componentTarget'

// ── Vue-specific types ──────────────────────────────────────────────────────

interface VueComponentType {
  name?: string
  __name?: string
  displayName?: string
}

interface VueInternalInstance {
  type?: VueComponentType
  props?: Record<string, unknown>
  parent?: VueInternalInstance
}

type VueElement = Element & {
  __vueParentComponent?: VueInternalInstance
}

// ── Vue-specific config ─────────────────────────────────────────────────────

const FILE_EXTENSIONS = ['.vue'] as const

/** Generic wrappers — prefer the nearest app component instead. */
const SKIP_COMPONENTS = new Set([
  'AsyncComponentWrapper',
  'BaseTransition',
  'KeepAlive',
  'RouterView',
  'Teleport',
  'Transition',
  'VApp',
  'VBtn',
  'VCard',
  'VIcon',
  'VMain',
  'VOverlay',
  'VToolbar',
])

// ── Vue-specific helpers ────────────────────────────────────────────────────

function serializeProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') continue
    if (value === undefined) continue

    try {
      JSON.stringify(value)
      out[key] = value
    } catch {
      out[key] = String(value)
    }
  }

  return out
}

function getComponentName(instance: VueInternalInstance): string | null {
  return (
    instance.type?.displayName ??
    instance.type?.name ??
    instance.type?.__name ??
    null
  )
}

function getInstanceFromElement(el: Element): VueInternalInstance | null {
  return (el as VueElement).__vueParentComponent ?? null
}

function buildInstanceChain(el: Element): VueInternalInstance[] {
  const chain: VueInternalInstance[] = []
  let instance = getInstanceFromElement(el)

  while (instance) {
    chain.push(instance)
    instance = instance.parent ?? null
  }

  return chain
}

function pickInstance(el: Element): VueInternalInstance | null {
  const chain = buildInstanceChain(el)

  for (const instance of chain) {
    const name = getComponentName(instance)
    if (name && !SKIP_COMPONENTS.has(name)) {
      return instance
    }
  }

  return chain[0] ?? null
}

function resolveFromElement(el: Element | null): {
  component: string | null
  props: Record<string, unknown>
} {
  if (!el) {
    return { component: null, props: {} }
  }

  const instance = pickInstance(el)
  if (!instance) {
    return { component: null, props: {} }
  }

  return {
    component: getComponentName(instance),
    props: serializeProps(instance.props ?? {}),
  }
}

// ── Adapter export ──────────────────────────────────────────────────────────

export const vueAdapter: ComponentFrameworkAdapter = {
  id: 'vue',
  fileExtensions: FILE_EXTENSIONS,
  resolveFromElement,
}
