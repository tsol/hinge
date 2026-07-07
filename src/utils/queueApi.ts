import { API_BASE } from '../const'

export async function postQueueContent(content: string): Promise<void> {
  await fetch(`${API_BASE}/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function patchQueueContent(file: string, content: string): Promise<void> {
  await fetch(`${API_BASE}/queue`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, content }),
  })
}

/** Promote newest `_new` task to `_wait` and trigger execution. */
export async function runNewestQueuedItem(): Promise<void> {
  const res = await fetch(`${API_BASE}/queue`)
  if (!res.ok) return
  const items: { name: string; status: string }[] = await res.json()
  const newItem = items.find(i => i.status === 'new')
  if (!newItem) return
  await fetch(`${API_BASE}/queue`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: newItem.name, status: 'wait' }),
  })
  await fetch(`${API_BASE}/queue/run`, { method: 'POST' })
}
