/**
 * Hinge config — open schema with typed actions.
 *
 * `.hinge/config.json` defines project-level agent behavior.
 * Any consumer can override actions, add plugin sections.
 *
 * Extensible via index signature: plugins add their own keys.
 */
export interface AgentAction {
  /** Unique action ID (e.g. "edit-code", "review-pr", "debug") */
  id: string
  /** Human label shown in UI */
  label: string
  /** Shell command to execute. `{input}` placeholder = task content file path */
  command: string
  /** Working directory for command */
  cwd?: string
  /** Timeout in seconds (default 120) */
  timeout?: number
  /** Inject system prompt before task content? */
  injectPrompt?: boolean
  /** Tags for UI grouping */
  tags?: string[]
}

export interface WhisperConfig {
  enabled: boolean
  model: string
  device: string
  compute_type: string
}

export interface HingeConfig {
  /** Schema version for forward compat */
  version?: number
  /** Agent actions available in this project */
  actions?: AgentAction[]
  /** Default action ID (falls back to first action) */
  defaultAction?: string

  // ── Known plugin sections ──
  whisper?: WhisperConfig

  // ── Extensible: any plugin can add its own section ──
  [key: string]: unknown
}
