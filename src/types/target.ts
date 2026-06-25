export interface HingeTarget {
  /** Best-effort Vue component name under the cog. */
  component: string
  /** DOM description of the topmost hit element. */
  dom: string
  /** Resolved Vue props for the picked component (serializable values only). */
  props: Record<string, unknown>
}

export const EMPTY_TARGET: HingeTarget = {
  component: 'unknown',
  dom: 'unknown',
  props: {},
}
