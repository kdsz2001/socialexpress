import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DateRangePicker,
  formatBr,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { ConfirmDeleteModal } from '../components/products/ConfirmDeleteModal'
import { SaveToast } from '../components/ui/SaveToast'
import { useEvents } from '../hooks/useEvents'
import { EVENT_TOAST_KEY, deleteEvent, type EventItem } from '../lib/eventsStore'
import './Events.css'

const EVENT_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'semana', label: 'Dessa semana' },
  { id: 'proxima-semana', label: 'Da próxima semana' },
  { id: 'mes', label: 'Desse mês' },
  { id: 'escolher', label: 'Escolher datas' },
]

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

type SortDir = 'asc' | 'desc'

function parseIsoDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatEventDate(value: string) {
  const date = parseIsoDate(value)
  if (!date) return value
  return `${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}. de ${date.getFullYear()}`
}

function defaultRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 10)
  return { start, end }
}

export function Events() {
  const navigate = useNavigate()
  const events = useEvents()
  const [query, setQuery] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const initial = defaultRange()
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const [datePreset, setDatePreset] = useState<DatePreset>('escolher')
  const [dateOpen, setDateOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [removing, setRemoving] = useState<EventItem | null>(null)
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

  useEffect(() => {
    try {
      const message = sessionStorage.getItem(EVENT_TOAST_KEY)
      if (!message) return
      sessionStorage.removeItem(EVENT_TOAST_KEY)
      setToast(message)
    } catch {
      // ignore storage errors
    }
  }, [])

  const dateLabel = `${formatBr(rangeStart)} até ${formatBr(rangeEnd)}`

  useEffect(() => {
    if (!dateOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!dateWrapRef.current?.contains(event.target as Node)) setDateOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDateOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dateOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    const start = rangeStart.getTime()
    const end = rangeEnd.getTime()

    return events
      .filter((item) => {
        const day = parseIsoDate(item.date)
        if (!day) return false
        const t = day.getTime()
        if (t < start || t > end) return false
        if (!q) return true
        return (
          item.title.toLocaleLowerCase('pt-BR').includes(q) ||
          item.type.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [events, query, rangeStart, rangeEnd, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filtered.length)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, pageSize, rangeStart, rangeEnd])

  const pager = (
    <div className="events__pager">
      <div className="events__pager-left">
        <select
          className="events__pager-size"
          value={pageSize}
          aria-label="Itens por página"
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="events__pager-info">
          Mostrando {pageStart} - {pageEnd} do total de {filtered.length}
        </span>
      </div>
      <div className="events__pager-nav">
        <button type="button" className="events__pager-btn" aria-label="Primeira página" disabled={currentPage <= 1} onClick={() => setPage(1)}>
          <ChevronsLeft size={16} strokeWidth={2.25} />
        </button>
        <button type="button" className="events__pager-btn" aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          <ChevronLeft size={16} strokeWidth={2.25} />
        </button>
        <button type="button" className="events__pager-btn is-active" aria-current="page">
          {currentPage}
        </button>
        <button type="button" className="events__pager-btn" aria-label="Próxima página" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
          <ChevronRight size={16} strokeWidth={2.25} />
        </button>
        <button type="button" className="events__pager-btn" aria-label="Última página" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
          <ChevronsRight size={16} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="events">
      <SaveToast open={Boolean(toast)} message={toast ?? undefined} onClose={() => setToast(null)} />
      <section className="events__card">
        <div className="events__toolbar">
          <label className="events__search">
            <Search size={16} strokeWidth={2} className="events__search-icon" />
            <input
              type="search"
              className="events__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className="events__date" ref={dateWrapRef}>
            <button
              type="button"
              className={`events__date-field${dateOpen ? ' is-open' : ''}`}
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={() => setDateOpen((open) => !open)}
            >
              {dateLabel}
            </button>
            <span className="events__date-cal" aria-hidden="true">
              <CalendarDays size={16} strokeWidth={2} />
            </span>

            {dateOpen ? (
              <div className="events__date-popover" id={dateMenuId}>
                <DateRangePicker
                  start={rangeStart}
                  end={rangeEnd}
                  preset={datePreset}
                  presets={EVENT_PRESETS}
                  onCancel={() => setDateOpen(false)}
                  onApply={({ start, end, preset: nextPreset }) => {
                    setRangeStart(start)
                    setRangeEnd(end)
                    setDatePreset(nextPreset)
                    setDateOpen(false)
                  }}
                />
              </div>
            ) : null}
          </div>

          <button type="button" className="events__add" onClick={() => navigate('/eventos/novo')}>
            <Plus size={16} strokeWidth={2.5} />
            Novo evento
          </button>
        </div>

        {filtered.length > 0 ? pager : null}

        <div className="events__table-wrap">
          <table className="events__table">
            <thead>
              <tr>
                <th className="events__col-name">Evento</th>
                <th className="events__col-date">
                  <button
                    type="button"
                    className="events__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    Data
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="events__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="events__empty" colSpan={3}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <EventRow
                    key={item.id}
                    item={item}
                    onEdit={() => navigate(`/eventos/${item.id}`)}
                    onRemove={() => setRemoving(item)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? pager : null}
      </section>

      <ConfirmDeleteModal
        className="events-remove"
        open={removing !== null}
        title="Remover evento?"
        message={
          <>
            Você está prestes a remover esse evento.
            <br />
            Essa ação é irreversível.
          </>
        }
        confirmLabel="Remover"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) deleteEvent(removing.id)
          setRemoving(null)
        }}
      />
    </div>
  )
}

function EventRow({
  item,
  onEdit,
  onRemove,
}: {
  item: EventItem
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <tr>
      <td>
        <div className="events__event">
          <strong>{item.title}</strong>
          {item.type ? <span>{item.type}</span> : null}
        </div>
      </td>
      <td className="events__date-cell">{formatEventDate(item.date)}</td>
      <td className="events__actions-cell">
        <div className="events__actions">
          <button type="button" className="events__icon-btn" aria-label="Visualizar detalhes" onClick={onEdit}>
            <SquarePen size={15} strokeWidth={2} />
            <span className="events__tip" role="tooltip">
              Visualizar detalhes
            </span>
          </button>
          <button type="button" className="events__icon-btn is-danger" aria-label="Remover evento" onClick={onRemove}>
            <Trash2 size={15} strokeWidth={2} />
            <span className="events__tip" role="tooltip">
              Remover evento
            </span>
          </button>
        </div>
      </td>
    </tr>
  )
}
