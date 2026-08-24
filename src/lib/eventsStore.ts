export type EventItem = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  createdAt: string
}

const STORAGE_KEY = 'social-express:events'

let cachedEvents: EventItem[] | null = null

function readAll(): EventItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EventItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: EventItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  cachedEvents = null
  window.dispatchEvent(new Event('social-express:events-changed'))
}

export function listEvents(): EventItem[] {
  if (!cachedEvents) {
    cachedEvents = readAll()
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR'))
  }
  return cachedEvents
}

export function addEvent(input: { title: string; date: string }): EventItem {
  const item: EventItem = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    date: input.date,
    createdAt: new Date().toISOString(),
  }
  const next = [...readAll(), item]
  writeAll(next)
  return item
}

export function updateEvent(id: string, input: { title: string; date: string }): EventItem | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const updated: EventItem = {
    ...all[index],
    title: input.title.trim(),
    date: input.date,
  }
  all[index] = updated
  writeAll(all)
  return updated
}

export function deleteEvent(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function subscribeEvents(onChange: () => void) {
  const handler = () => {
    cachedEvents = null
    onChange()
  }
  window.addEventListener('social-express:events-changed', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('social-express:events-changed', handler)
    window.removeEventListener('storage', handler)
  }
}
