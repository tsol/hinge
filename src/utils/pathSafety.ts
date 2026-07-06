import { existsSync, realpathSync } from 'node:fs'
import { basename, resolve, relative, sep } from 'node:path'

export function getProjectRoot(): string {
  return resolve(process.cwd())
}

export function getHingeRoot(): string {
  return resolve(getProjectRoot(), '.hinge')
}

function isInsideRoot(root: string, target: string): boolean {
  const rel = relative(root, target)
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep))
}

function hasUnsafeSegment(...segments: string[]): boolean {
  return segments.some(s => s.includes('\0'))
}

/** Resolve a path that must stay inside root (path need not exist yet). */
export function resolveInside(root: string, ...segments: string[]): string | null {
  if (hasUnsafeSegment(...segments)) return null
  const rootAbs = resolve(root)
  const candidate = resolve(rootAbs, ...segments)
  if (!isInsideRoot(rootAbs, candidate)) return null
  return candidate
}

/** Resolve an existing path inside root, following symlinks. */
export function resolveInsideExisting(root: string, ...segments: string[]): string | null {
  const candidate = resolveInside(root, ...segments)
  if (!candidate || !existsSync(candidate)) return null
  try {
    const rootReal = existsSync(root) ? realpathSync(root) : resolve(root)
    const real = realpathSync(candidate)
    if (!isInsideRoot(rootReal, real)) return null
    return real
  } catch {
    return null
  }
}

/** Parent directory for a write target — must also stay inside root. */
export function resolveWriteTarget(root: string, filePath: string): { file: string; parent: string } | null {
  const file = resolveInside(root, filePath)
  if (!file) return null
  const parent = resolve(file, '..')
  const rootAbs = resolve(root)
  if (!isInsideRoot(rootAbs, parent)) return null
  return { file, parent }
}

const QUEUE_FOLDER_RE = /^[^/\\\0]+$/

/** Queue / attach folder names are single path segments under .hinge. */
export function isValidQueueFolderName(name: string): boolean {
  return Boolean(name) && QUEUE_FOLDER_RE.test(name)
}

export function resolveQueueFolder(folderName: string, ...rest: string[]): string | null {
  if (!isValidQueueFolderName(folderName)) return null
  return resolveInside(getHingeRoot(), folderName, ...rest)
}

export function resolveQueueFolderExisting(folderName: string, ...rest: string[]): string | null {
  if (!isValidQueueFolderName(folderName)) return null
  return resolveInsideExisting(getHingeRoot(), folderName, ...rest)
}

export function safeBasename(name: string): string | null {
  const base = basename(name)
  if (!base || base === '.' || base === '..' || base.includes('\0')) return null
  return base
}

const QUEUE_STATUS = new Set(['new', 'wait', 'done', 'processing'])

export function isValidQueueStatus(status: string): boolean {
  return QUEUE_STATUS.has(status)
}
