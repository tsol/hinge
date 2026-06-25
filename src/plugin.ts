import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import type { IncomingMessage } from 'node:http'

export interface HingePluginOptions {
  /** Path to the markdown file where queue entries are appended. Defaults to HINGE_QUEUE.md in process.cwd(). */
  queueFile?: string
}

interface QueuePayload {
  note?: string
  url?: string
  component?: string
  dom?: string
  props?: Record<string, unknown>
  elementHtml?: string
  computedStyles?: Record<string, string>
  elementRect?: {
    top: number
    left: number
    width: number
    height: number
  }
  queueInfo?: QueuePayload
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

function formatQueueEntry(data: QueuePayload): string {
  const lines = [
    '',
    '---',
    `Date: ${new Date().toISOString()}`,
    `URL: ${data.url ?? 'N/A'}`,
    `Component: ${data.component ?? 'N/A'}`,
  ]

  if (data.dom) lines.push(`DOM: ${data.dom}`)
  if (data.props && Object.keys(data.props).length > 0) {
    lines.push(`Props: ${JSON.stringify(data.props)}`)
  }
  if (data.elementRect) {
    lines.push(
      `Rect: top=${data.elementRect.top} left=${data.elementRect.left} width=${data.elementRect.width} height=${data.elementRect.height}`,
    )
  }
  if (data.computedStyles && Object.keys(data.computedStyles).length > 0) {
    lines.push('Computed styles:')
    lines.push('```json')
    lines.push(JSON.stringify(data.computedStyles, null, 2))
    lines.push('```')
  }
  if (data.elementHtml) {
    lines.push('Element HTML:')
    lines.push('```html')
    lines.push(data.elementHtml)
    lines.push('```')
  }
  lines.push(`Note: ${data.note ?? 'N/A'}`)

  return `${lines.join('\n')}\n`
}

export default function hingePlugin(options: HingePluginOptions = {}): Plugin {
  const queueFile = options.queueFile ?? resolve(process.cwd(), 'HINGE_QUEUE.md')

  return {
    name: 'hinge-plugin',
    configureServer(server) {
      server.middlewares.use('/api/queue', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          const body = JSON.parse(raw) as QueuePayload
          const data = body.queueInfo ?? body

          appendFileSync(queueFile, formatQueueEntry(data))

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'success' }))
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error('[hinge] queue write error:', message)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ status: 'error', message }))
        }
      })
    },
  }
}
