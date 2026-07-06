export interface HingeTarget {
  /** Best-effort component name under the cog (Vue, React, …). */
  component: string
  /** DOM description of the topmost hit element. */
  dom: string
  /** Resolved component props (serializable values only). */
  props: Record<string, unknown>
}

export const EMPTY_TARGET: HingeTarget = {
  component: 'unknown',
  dom: 'unknown',
  props: {},
}
