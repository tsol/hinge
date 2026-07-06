import { describe, it, expect } from 'vitest'
import { reactAdapter } from '../utils/react_adapter'

interface ReactFiber {
  type?: unknown
  memoizedProps?: Record<string, unknown>
  return?: ReactFiber | null
}

function Card(props: { title: string }) {
  return props.title
}
Card.displayName = 'DevCard'

function attachReactFiber(el: Element, chain: ReactFiber[]): void {
  const key = '__reactFiber$test'
  let node: ReactFiber | null = chain[0] ?? null
  for (let i = 1; i < chain.length; i++) {
    chain[i].return = node
    node = chain[i]
  }
  ;(el as Element & Record<string, unknown>)[key] = chain[chain.length - 1]
}

describe('reactAdapter', () => {
  it('reads component name and props from React fiber', () => {
    const el = document.createElement('div')
    const inner: ReactFiber = { type: 'div', memoizedProps: {} }
    const outer: ReactFiber = { type: Card, memoizedProps: { title: 'Hello' } }
    attachReactFiber(el, [inner, outer])

    const result = reactAdapter.resolveFromElement(el)
    expect(result.component).toBe('DevCard')
    expect(result.props).toEqual({ title: 'Hello' })
  })

  it('skips Fragment wrappers', () => {
    const el = document.createElement('span')
    const fragment: ReactFiber = { type: { displayName: 'Fragment' }, memoizedProps: {} }
    const card: ReactFiber = { type: Card, memoizedProps: { title: 'X' } }
    attachReactFiber(el, [fragment, card])

    expect(reactAdapter.resolveFromElement(el).component).toBe('DevCard')
  })

  it('registers React file extensions', () => {
    expect(reactAdapter.fileExtensions).toEqual(['.tsx', '.jsx'])
  })
})
