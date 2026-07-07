import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import * as http from 'node:http'
import { API_BASE } from './const'

export interface HingeApiProbe {
  ok: boolean
  projectRoot?: string
}

export function ourProjectRoot(): string {
  const cwd = resolve(process.cwd())
  try {
    return realpathSync(cwd)
  } catch {
    return cwd
  }
}

export function isSameProjectRoot(other?: string): boolean {
  if (!other) return false
  try {
    return realpathSync(other) === ourProjectRoot()
  } catch {
    return resolve(other) === resolve(process.cwd())
  }
}

/** Ping /hinge-api/status — returns projectRoot when the server identifies itself. */
export function probeHingeApi(port: number, timeoutMs = 400): Promise<HingeApiProbe> {
  return new Promise((resolveProbe) => {
    const req = http.request(
      { hostname: 'localhost', port, path: `${API_BASE}/status`, method: 'GET', timeout: timeoutMs },
      (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolveProbe({ ok: false })
            return
          }
          try {
            const data = JSON.parse(body) as { projectRoot?: string }
            resolveProbe({ ok: true, projectRoot: data.projectRoot })
          } catch {
            // Legacy server — treat as foreign; do not cross-attach projects
            resolveProbe({ ok: true })
          }
        })
      },
    )
    req.on('error', () => resolveProbe({ ok: false }))
    req.on('timeout', () => {
      req.destroy()
      resolveProbe({ ok: false })
    })
    req.end()
  })
}

export async function probeOurHingeApi(port: number, timeoutMs = 400): Promise<boolean> {
  const probe = await probeHingeApi(port, timeoutMs)
  return probe.ok && isSameProjectRoot(probe.projectRoot)
}
