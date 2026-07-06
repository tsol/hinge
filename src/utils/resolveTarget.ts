import { COG_SIZE } from '../constants'
import type { HingeTarget } from '../types/target'
import { EMPTY_TARGET } from '../types/target'
import {
  describeElement,
  getElementsAtPoint,
  getRouteComponentName,
  pickBestDomElement,
} from './domTarget'
import { formatPropsInline, resolveComponentFromElement } from './componentTarget'

export function formatTargetSummary(
  target: HingeTarget,
  index = 0,
  total = 1,
): string {
  const prefix = total > 1 ? `[${index + 1}/${total}] ` : ''
  const props = formatPropsInline(target.props, 3)
  if (props) return `${prefix}${target.component} · ${props}`
  return `${prefix}${target.component}`
}

export function resolveTargetFromElement(el: Element | null): HingeTarget {
  if (!el) {
    const route = getRouteComponentName()
    return {
      component: route ?? 'unknown',
      dom: route ?? 'unknown',
      props: {},
    }
  }

  const dom = describeElement(el)
  const resolved = resolveComponentFromElement(el)

  return {
    component: resolved.component ?? dom,
    dom,
    props: resolved.props,
  }
}

export function resolveTargetAtPoint(x: number, y: number, cogSize = COG_SIZE): HingeTarget {
  const elements = getElementsAtPoint(x, y, cogSize)
  const domEl = pickBestDomElement(elements)
  return resolveTargetFromElement(domEl)
}

export function isEmptyTarget(target: HingeTarget): boolean {
  return target.component === EMPTY_TARGET.component && target.dom === EMPTY_TARGET.dom
}
