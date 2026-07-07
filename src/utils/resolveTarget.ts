import type { HingeTarget } from '../types/target'
import { describeElement, getRouteComponentName } from './domTarget'
import { resolveComponentFromElement } from './componentTarget'

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
