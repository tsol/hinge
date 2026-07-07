import { resolveComponentFromElement, formatPropsInline } from './componentTarget'
import { generateCSSSelector } from './cssSelector'

const STYLE_KEYS = [
  'display', 'position', 'flex-direction', 'align-items', 'justify-content',
  'gap', 'padding', 'margin', 'font-size', 'font-weight', 'color',
  'background', 'background-color', 'border-radius', 'border',
  'width', 'height', 'min-width', 'min-height', 'opacity', 'overflow',
  'text-align', 'white-space',
]

/** Build `### Component:` markdown block for queue submission. */
export function buildComponentBlock(label: string, el: Element | null): string {
  if (!label) return ''

  const fields: Record<string, string> = {}
  const url = window.location.pathname + window.location.search
  if (url) fields.Url = url

  if (el) {
    const resolved = resolveComponentFromElement(el)
    if (!resolved.component?.startsWith('Hinge')) {
      const propsStr = formatPropsInline(resolved.props, 6)
      if (propsStr) fields.Props = propsStr
    }
    const cs = el instanceof HTMLElement ? getComputedStyle(el) : null
    if (cs) {
      const styleStr = STYLE_KEYS
        .map(k => `${k}=${cs.getPropertyValue(k)}`)
        .filter(s => {
          const val = s.split('=')[1]
          return val && val !== 'none' && val !== 'auto' && val !== 'normal'
        })
        .join(' ')
      if (styleStr) fields.Styling = styleStr
    }
    const selector = generateCSSSelector(el)
    if (selector) fields.Selector = selector
  }

  let block = `### Component: ${label}`
  if (Object.keys(fields).length > 0) {
    block += '\n' + Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')
  }
  return block
}

export function buildQueueContent(componentBlock: string, text: string): string {
  const trimmed = text.trim()
  if (componentBlock && trimmed) return `${componentBlock}\n\n${trimmed}`
  return componentBlock || trimmed
}
