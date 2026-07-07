import { hostname } from 'node:os'

export function localDispatchHost(): string {
  return hostname()
}

export interface PidFileRecord {
  pid: number | null
  host: string | null
}

/** `.pid` / `.wrapper_*.pid` — line 1: pid, line 2: hostname (optional, legacy = pid only). */
export function parsePidFile(raw: string): PidFileRecord {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { pid: null, host: null }
  const pid = parseInt(lines[0], 10)
  const host = lines.length >= 2 ? lines[1] : null
  return { pid: pid && !isNaN(pid) ? pid : null, host }
}

export function isForeignDispatchHost(host: string | null | undefined): boolean {
  if (!host) return false
  return host !== localDispatchHost()
}
