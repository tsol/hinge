/** True when wrapper wrote the new-session.sh "agent not configured" help text. */
export function isAgentSetupError(text: string): boolean {
  return text.includes('Agent not found. Hinge cannot run tasks')
}
