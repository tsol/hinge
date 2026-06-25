export interface VueComponentType {
  name?: string
  __name?: string
  displayName?: string
}

export interface VueInternalInstance {
  type?: VueComponentType
  props?: Record<string, unknown>
  parent?: VueInternalInstance
}

type VueElement = Element & {
  __vueParentComponent?: VueInternalInstance
}

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

export function getVueComponentName(instance: VueInternalInstance): string | null {
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

export function pickVueInstance(el: Element): VueInternalInstance | null {
  const chain = buildInstanceChain(el)

  for (const instance of chain) {
    const name = getVueComponentName(instance)
    if (name && !SKIP_COMPONENTS.has(name)) {
      return instance
    }
  }

  return chain[0] ?? null
}

export function serializeProps(props: Record<string, unknown>): Record<string, unknown> {
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

export function resolveVueFromElement(el: Element | null): {
  component: string | null
  props: Record<string, unknown>
} {
  if (!el) {
    return { component: null, props: {} }
  }

  const instance = pickVueInstance(el)
  if (!instance) {
    return { component: null, props: {} }
  }

  return {
    component: getVueComponentName(instance),
    props: serializeProps(instance.props ?? {}),
  }
}
