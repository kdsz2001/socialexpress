import {
  buildFieldDiffs,
  logEventCreated,
  logEventDeleted,
  logEventUpdated,
} from './historyLog'
import { formatHistoryDate } from './historyStore'

export type EventItem = {
  id: string
  title: string
  type: string
  date: string // YYYY-MM-DD
  notes: string
  createdAt: string
}

export const EVENT_TYPE_OPTIONS = [
  'Aniversário',
  'Aniversário 15 anos',
  'Casamento',
  'Eventos corporativos',
  'Festa',
  'Formatura',
  'Debutante',
  'Noivado',
  'Batizado',
  'Confraternização',
]

const STORAGE_KEY = 'social-express:events'

export const EVENT_TOAST_KEY = 'social-express:event-toast'

let cachedEvents: EventItem[] | null = null

function normalize(raw: Partial<EventItem> | null | undefined): EventItem | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id) return null
  const date = String(raw.date || '')
  if (!date) return null
  return {
    id: raw.id,
    title: String(raw.title || '').trim(),
    type: String(raw.type || '').trim(),
    date,
    notes: String(raw.notes || ''),
    createdAt:
      typeof raw.createdAt === 'string' && raw.createdAt
        ? raw.createdAt
        : new Date().toISOString(),
  }
}

function readAll(): EventItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<EventItem>[]
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalize(item)).filter((item): item is EventItem => item !== null)
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

export function getEvent(id: string): EventItem | null {
  return readAll().find((item) => item.id === id) ?? null
}

export function addEvent(input: {
  title: string
  type: string
  date: string
  notes: string
}): EventItem {
  const item: EventItem = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    type: input.type.trim(),
    date: input.date,
    notes: input.notes.trim(),
    createdAt: new Date().toISOString(),
  }
  const next = [...readAll(), item]
  writeAll(next)
  logEventCreated(item.title, item.date)
  return item
}

export function updateEvent(
  id: string,
  input: { title: string; type: string; date: string; notes: string },
): EventItem | null {
  const all = readAll()
  const index = all.findIndex((item) => item.id === id)
  if (index < 0) return null
  const before = all[index]
  const updated: EventItem = {
    ...before,
    title: input.title.trim(),
    type: input.type.trim(),
    date: input.date,
    notes: input.notes.trim(),
  }
  all[index] = updated
  writeAll(all)
  logEventUpdated(
    updated.title,
    buildFieldDiffs(
      {
        title: before.title,
        type: before.type,
        date: formatHistoryDate(before.date),
        notes: before.notes,
      },
      {
        title: updated.title,
        type: updated.type,
        date: formatHistoryDate(updated.date),
        notes: updated.notes,
      },
      { title: 'evento', type: 'tipo', date: 'data', notes: 'observações' },
    ),
  )
  return updated
}

export function deleteEvent(id: string) {
  const item = readAll().find((entry) => entry.id === id)
  writeAll(readAll().filter((entry) => entry.id !== id))
  if (item) logEventDeleted(item.title)
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
