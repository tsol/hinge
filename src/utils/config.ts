import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// ── Built-in default system prompt (ships with package) ──
// User overrides via .hinge/prompt.md
export const DEFAULT_PROMPT_TEXT = `# Hinge Panel

Context: full task description in conversation history.

## Instructions
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

/** Read the effective prompt (user override or built-in default) */
export function readPrompt(cwd = process.cwd()): string {
  const userPath = resolve(cwd, '.hinge', 'prompt.md')
  if (existsSync(userPath)) {
    try { return readFileSync(userPath, 'utf-8') } catch { /* fall through */ }
  }
  return DEFAULT_PROMPT_TEXT
}
