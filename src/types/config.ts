export interface AgentAction {
  id: string
  label: string
  command: string
  cwd: string
  timeout: number
  injectPrompt: boolean
  tags: string[]
}

export interface WhisperConfig {
  enabled: boolean
  script?: string          // path to whisper.sh, default: .hinge/whisper.sh
  model?: string
  device?: string
  compute_type?: string
}

/** Agent script paths — each is an absolute or relative path to a shell script */
export interface AgentScripts {
  new_session: string     // receives prompt on stdin, alias as $1, outputs response on stdout
  continue_session: string // receives message on stdin, alias as $1, outputs response
  wrapper: string         // internal — spawned by server, calls new_session/continue_session, does cleanup
}

/** Agent configuration */
export interface AgentConfig {
  name: string            // 'hermes', 'opencode', etc. — used to find scripts in .hinge/agents/<name>/
  scripts?: AgentScripts  // optional full override paths
}

export interface HingeConfig {
  version: number
  defaultAction: string
  actions: AgentAction[]
  whisper?: WhisperConfig
  agent?: AgentConfig
}
