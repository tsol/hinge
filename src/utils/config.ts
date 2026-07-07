import { existsSync, readFileSync, accessSync, constants } from 'fs'
import { resolve } from 'path'

// ── Built-in default system prompt (ships with package) ──
// User overrides via .hinge/prompt.md
export const DEFAULT_PROMPT_TEXT = `## Instructions
- Your task is described in the user message below.
- If you need to ask a clarifying question — just ask it directly in your response and finish. Do not use the clarify tool (there is no human to answer in non-interactive mode).`

/**
 * Resolve agent script paths in .hinge/ relative to cwd
 */
export function resolveAgentScripts(cwd = process.cwd()) {
  const hinge = resolve(cwd, '.hinge')
  return {
    new_session: resolve(hinge, 'new-session.sh'),
    continue_session: resolve(hinge, 'continue-session.sh'),
    wrapper: resolve(hinge, '.agent-wrapper.sh'),
  }
}

/** True when .hinge agent scripts exist and are executable (agent-agnostic). */
export function probeAgentScripts(cwd = process.cwd()): { ok: boolean; missing?: string } {
  const scripts = resolveAgentScripts(cwd)
  for (const [name, path] of Object.entries(scripts)) {
    if (!existsSync(path)) return { ok: false, missing: name }
    try {
      accessSync(path, constants.X_OK)
    } catch {
      return { ok: false, missing: name }
    }
  }
  return { ok: true }
}

/** Read the effective prompt (user override or built-in default) */
export function readPrompt(cwd = process.cwd()): string {
  const userPath = resolve(cwd, '.hinge', 'prompt.md')
  if (existsSync(userPath)) {
    try { return readFileSync(userPath, 'utf-8') } catch { /* fall through */ }
  }
  return DEFAULT_PROMPT_TEXT
}
