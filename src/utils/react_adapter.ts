import type { ComponentFrameworkAdapter } from './componentTarget'

// ── React-specific types ────────────────────────────────────────────────────

interface ReactFiber {
  type?: unknown
  elementType?: unknown
  memoizedProps?: Record<string, unknown>
  return?: ReactFiber | null
}

type ReactDomElement = Element & Record<string, unknown>

// ── React-specific config ───────────────────────────────────────────────────

const FILE_EXTENSIONS = ['.tsx', '.jsx'] as const

const FIBER_KEY_PREFIXES = ['__reactFiber$', '__reactInternalInstance$']

/** Generic wrappers — prefer the nearest app component instead. */
const SKIP_COMPONENTS = new Set([
  'Fragment',
  'StrictMode',
  'Suspense',
  'Profiler',
  'Routes',
  'Route',
  'Outlet',
  'BrowserRouter',
  'HashRouter',
  'MemoryRouter',
  'RouterProvider',
])

// ── React-specific helpers ──────────────────────────────────────────────────

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

function getFiberKey(el: Element): string | null {
  for (const key of Object.keys(el)) {
    if (FIBER_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      return key
    }
  }
  return null
}

function getFiberFromElement(el: Element): ReactFiber | null {
  const key = getFiberKey(el)
  if (!key) return null
  const fiber = (el as ReactDomElement)[key]
  return fiber && typeof fiber === 'object' ? (fiber as ReactFiber) : null
}

function getComponentName(fiber: ReactFiber): string | null {
  const type = fiber.type ?? fiber.elementType
  if (!type || typeof type === 'string') return null

  if (typeof type === 'function') {
    const fn = type as { displayName?: string; name?: string }
    return fn.displayName ?? fn.name ?? null
  }

  if (typeof type === 'object') {
    const obj = type as {
      displayName?: string
      render?: { displayName?: string; name?: string }
      type?: unknown
    }
    if (obj.displayName) return obj.displayName
    if (typeof obj.render === 'function') {
      const render = obj.render as { displayName?: string; name?: string }
      return render.displayName ?? render.name ?? null
    }
    if (obj.type) return getComponentName({ type: obj.type })
  }

  return null
}

function buildFiberChain(el: Element): ReactFiber[] {
  const chain: ReactFiber[] = []
  let fiber = getFiberFromElement(el)

  while (fiber) {
    chain.push(fiber)
    fiber = fiber.return ?? null
  }

  return chain
}

function pickFiber(el: Element): ReactFiber | null {
  const chain = buildFiberChain(el)

  for (const fiber of chain) {
    const name = getComponentName(fiber)
    if (name && !SKIP_COMPONENTS.has(name)) {
      return fiber
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

  const fiber = pickFiber(el)
  if (!fiber) {
    return { component: null, props: {} }
  }

  return {
    component: getComponentName(fiber),
    props: serializeProps(fiber.memoizedProps ?? {}),
  }
}

// ── Adapter export ──────────────────────────────────────────────────────────

export const reactAdapter: ComponentFrameworkAdapter = {
  id: 'react',
  fileExtensions: FILE_EXTENSIONS,
  resolveFromElement,
}
