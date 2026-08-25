export type HistoryModule =
  | 'Agendamentos'
  | 'Clientes'
  | 'Eventos'
  | 'Pedidos'
  | 'Produtos'
  | 'Funcionários'
  | 'Financeiro'
  | 'Fornecedores'
  | 'Configurações'

export type HistorySegment = {
  text: string
  bold?: boolean
}

export type HistoryDiff = {
  op: 'add' | 'remove'
  text: string
}

export type HistoryEntry = {
  id: string
  module: HistoryModule
  segments: HistorySegment[]
  diffs: HistoryDiff[]
  userName: string
  createdAt: number
}

export const HISTORY_MODULES: HistoryModule[] = [
  'Agendamentos',
  'Clientes',
  'Eventos',
  'Pedidos',
  'Produtos',
  'Funcionários',
  'Financeiro',
  'Fornecedores',
  'Configurações',
]

const STORAGE_KEY = 'social-express:history'
const CHANGE_EVENT = 'social-express:history-changed'
const MAX_ENTRIES = 2000

let cache: HistoryEntry[] | null = null

function normalizeEntry(raw: unknown): HistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<HistoryEntry>
  if (typeof item.id !== 'string') return null
  if (typeof item.module !== 'string') return null
  if (typeof item.userName !== 'string') return null
  if (typeof item.createdAt !== 'number') return null
  const segments = Array.isArray(item.segments)
    ? item.segments
        .filter(
          (seg): seg is HistorySegment =>
            Boolean(seg) && typeof seg === 'object' && typeof (seg as HistorySegment).text === 'string',
        )
        .map((seg) => ({ text: seg.text, bold: Boolean(seg.bold) }))
    : [{ text: '' }]
  const diffs = Array.isArray(item.diffs)
    ? item.diffs
        .filter(
          (diff): diff is HistoryDiff =>
            Boolean(diff) &&
            typeof diff === 'object' &&
            ((diff as HistoryDiff).op === 'add' || (diff as HistoryDiff).op === 'remove') &&
            typeof (diff as HistoryDiff).text === 'string',
        )
        .map((diff) => ({ op: diff.op, text: diff.text }))
    : []
  return {
    id: item.id,
    module: item.module as HistoryModule,
    segments,
    diffs,
    userName: item.userName,
    createdAt: item.createdAt,
  }
}

function readAll(): HistoryEntry[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      cache = []
      return cache
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      cache = []
      return cache
    }
    cache = parsed
      .map(normalizeEntry)
      .filter((item): item is HistoryEntry => item !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
    return cache
  } catch {
    cache = []
    return cache
  }
}

function writeAll(entries: HistoryEntry[]) {
  const next = entries.slice(0, MAX_ENTRIES)
  cache = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getHistory(): HistoryEntry[] {
  return readAll()
}

export function logHistory(input: {
  module: HistoryModule
  segments: HistorySegment[]
  diffs?: HistoryDiff[]
  userName: string
  createdAt?: number
}): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    module: input.module,
    segments: input.segments,
    diffs: input.diffs ?? [],
    userName: input.userName.trim() || 'Sistema',
    createdAt: input.createdAt ?? Date.now(),
  }
  writeAll([entry, ...readAll()])
  return entry
}

export function clearHistory() {
  writeAll([])
}

export function subscribeHistory(onChange: () => void) {
  const handler = () => {
    cache = null
    onChange()
  }
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function formatHistoryDateTime(ts: number) {
  const date = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatHistoryDate(isoOrYmd: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrYmd)) {
    const [y, m, d] = isoOrYmd.slice(0, 10).split('-')
    return `${d}/${m}/${y}`
  }
  const date = new Date(isoOrYmd)
  if (Number.isNaN(date.getTime())) return isoOrYmd
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

export function bold(text: string): HistorySegment {
  return { text, bold: true }
}

export function plain(text: string): HistorySegment {
  return { text }
}

export function segs(...parts: Array<string | HistorySegment>): HistorySegment[] {
  return parts.map((part) => (typeof part === 'string' ? plain(part) : part))
}
