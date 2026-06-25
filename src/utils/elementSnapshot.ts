export interface HingeElementSnapshot {
  html: string
  styles: Record<string, string>
  rect: {
    top: number
    left: number
    width: number
    height: number
  }
}

const COMPUTED_STYLE_KEYS = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'margin',
  'padding',
  'border',
  'borderRadius',
  'backgroundColor',
  'background',
  'color',
  'fontSize',
  'fontWeight',
  'fontFamily',
  'lineHeight',
  'textAlign',
  'flex',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'gap',
  'gridTemplateColumns',
  'opacity',
  'zIndex',
  'overflow',
  'boxSizing',
  'transform',
  'boxShadow',
  'cursor',
  'pointerEvents',
] as const

const MAX_HTML_LENGTH = 6000

export function captureElementSnapshot(el: Element | null): HingeElementSnapshot | null {
  if (!el || !el.isConnected) return null

  const rect = el.getBoundingClientRect()
  const styles = serializeComputedStyles(el)
  const html = serializeElementHtml(el)

  return {
    html,
    styles,
    rect: {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  }
}

function serializeElementHtml(el: Element): string {
  let html = el.outerHTML
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  if (html.length <= MAX_HTML_LENGTH) return html
  return `${html.slice(0, MAX_HTML_LENGTH)}\n<!-- hinge: truncated -->`
}

function serializeComputedStyles(el: Element): Record<string, string> {
  if (!(el instanceof HTMLElement)) {
    return {}
  }

  const computed = window.getComputedStyle(el)
  const out: Record<string, string> = {}

  for (const key of COMPUTED_STYLE_KEYS) {
    const value = computed[key as keyof CSSStyleDeclaration]
    if (typeof value === 'string' && value.length > 0) {
      out[key] = value
    }
  }

  return out
}
