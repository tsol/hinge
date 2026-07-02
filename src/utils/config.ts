import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { HingeConfig, AgentAction, AgentScripts } from '../types/config'

// ── Built-in default system prompt (ships with package) ──
// User overrides via .hinge/prompt.md
export const DEFAULT_PROMPT_TEXT = `# Hinge Panel — {{project_type}} project

Context: full task description in conversation history.`

// ── Defaults ──────────────────────────────────────────────

export const DEFAULT_ACTIONS: AgentAction[] = [
  {
    id: 'edit-code',
    label: 'Edit code',
    command: 'hermes -z {input}',
    cwd: '.',
    timeout: 120,
    injectPrompt: true,
    tags: ['default'],
  },
]

/**
 * Resolve agent script paths — looks in .hinge/ relative to cwd (flat structure: .hinge/new-session.sh, .hinge/continue-session.sh)
 * @deprecated agentName parameter is ignored — scripts are now in .hinge/ root
 */
export function resolveAgentScripts(_agentName?: string, cwd = process.cwd()): AgentScripts {
  const hinge = resolve(cwd, '.hinge')

  return {
    new_session: resolve(hinge, 'new-session.sh'),
    continue_session: resolve(hinge, 'continue-session.sh'),
  }
}

/** Resolve whisper script path — looks in .hinge/ relative to cwd */
export function resolveWhisperScript(cwd = process.cwd()): string {
  return resolve(cwd, '.hinge', 'whisper.sh')
}

export const DEFAULT_CONFIG: HingeConfig = {
  version: 1,
  defaultAction: 'edit-code',
  actions: DEFAULT_ACTIONS,
  whisper: {
    enabled: true,
    model: 'tiny',
    device: 'cpu',
    compute_type: 'int8',
  },
  agent: {
    name: 'hermes',
  },
}

// ── Paths ─────────────────────────────────────────────────

export function hingeDir(cwd = process.cwd()): string {
  return resolve(cwd, '.hinge')
}

export function configPath(cwd = process.cwd()): string {
  return resolve(hingeDir(cwd), 'config.json')
}

// ── Load / save ───────────────────────────────────────────

export function loadConfig(cwd = process.cwd()): HingeConfig {
  const p = configPath(cwd)
  if (!existsSync(p)) return { ...DEFAULT_CONFIG }
  try {
    const raw = readFileSync(p, 'utf-8')
    const user = JSON.parse(raw) as Partial<HingeConfig>
    return mergeConfig(DEFAULT_CONFIG, user)
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: HingeConfig, cwd = process.cwd()) {
  const dir = hingeDir(cwd)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(configPath(cwd), JSON.stringify(config, null, 2), 'utf-8')
}

// ── Helpers ───────────────────────────────────────────────

export function getActions(config: HingeConfig): AgentAction[] {
  return config.actions ?? DEFAULT_ACTIONS
}

export function getAction(config: HingeConfig, id?: string): AgentAction | undefined {
  const actions = getActions(config)
  if (id) return actions.find(a => a.id === id)
  const defaultId = config.defaultAction
  if (defaultId) return actions.find(a => a.id === defaultId)
  return actions[0]
}

export function resolveActionCommand(action: AgentAction, inputFile: string): string {
  return action.command.replace('{input}', inputFile)
}

/** Read the effective prompt (user override or built-in) */
export function readPrompt(cwd = process.cwd()): string {
  const userPath = resolve(cwd, '.hinge', 'prompt.md')
  if (existsSync(userPath)) {
    try { return readFileSync(userPath, 'utf-8') } catch { /* fall through */ }
  }
  return DEFAULT_PROMPT_TEXT
}

// ── Merge ─────────────────────────────────────────────────

/**
 * Deep merge user config over defaults.
 */
function mergeConfig(base: HingeConfig, user: Partial<HingeConfig>): HingeConfig {
  const result: HingeConfig = { ...base }

  if (user.version !== undefined) result.version = user.version
  if (user.defaultAction !== undefined) result.defaultAction = user.defaultAction

  // actions[]: user replaces entirely
  if (user.actions !== undefined) {
    result.actions = user.actions
  }

  // shallow merge sections
  if (user.whisper) {
    result.whisper = { ...(base.whisper as object), ...user.whisper } as typeof result.whisper
  }
  if (user.agent) {
    result.agent = { ...(base.agent as object), ...user.agent } as typeof result.agent
  }

  // anything extra: copy verbatim
  const knownKeys = new Set(['version', 'defaultAction', 'actions', 'whisper', 'agent'])
  for (const [k, v] of Object.entries(user)) {
    if (!knownKeys.has(k)) {
      ;(result as unknown as Record<string, unknown>)[k] = v
    }
  }

  return result
}
