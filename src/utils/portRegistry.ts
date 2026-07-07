export const API_PORT_START = 5177
export const API_PORT_END = 5197
export const API_SERVER_KEY_PREFIX = '__hinge_api_server_'

export function apiServerGlobalKey(port: number): string {
  return API_SERVER_KEY_PREFIX + port
}

/** First port in range with a registered hinge API server (survives HMR). */
export function findRegisteredApiPort(
  start = API_PORT_START,
  end = API_PORT_END,
): number | null {
  const g = globalThis as Record<string, unknown>
  for (let p = start; p <= end; p++) {
    if (g[apiServerGlobalKey(p)]) return p
  }
  return null
}
