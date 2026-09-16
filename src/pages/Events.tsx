import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowUp, CalendarDays, Plus, Search, SquarePen, Trash2, X } from 'lucide-react'
import {
  DATE_PRESETS,
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { useEvents } from '../hooks/useEvents'
import {
  addEvent,
  deleteEvent,
  updateEvent,
  type EventItem,
} from '../lib/eventsStore'
import './Events.css'

type PickerMode = 'menu' | 'calendar'
type SortDir = 'asc' | 'desc'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseIsoDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatEventDate(value: string) {
  const date = parseIsoDate(value)
  return date ? formatBr(date) : value
}

function defaultRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 10)
  return { start, end }
}

export function Events() {
  const events = useEvents()
  const [query, setQuery] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const initial = defaultRange()
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const [datePreset, setDatePreset] = useState<DatePreset>('escolher')
  const [dateOpen, setDateOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('menu')
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toInputDate(new Date()))
  const [touched, setTouched] = useState(false)

  const dateLabel = `${formatBr(rangeStart)} até ${formatBr(rangeEnd)}`

  useEffect(() => {
    if (!dateOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!dateWrapRef.current?.contains(event.target as Node)) {
        setDateOpen(false)
        setPickerMode('menu')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDateOpen(false)
        setPickerMode('menu')
      }
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
        return item.title.toLocaleLowerCase('pt-BR').includes(q)
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [events, query, rangeStart, rangeEnd, sortDir])

  const openDate = () => {
    setDateOpen(true)
    setPickerMode('menu')
  }

  const onMenuSelect = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset === 'escolher') {
      setPickerMode('calendar')
      return
    }
    const range = rangeForPreset(preset)
    setRangeStart(range.start)
    setRangeEnd(range.end)
    setDateOpen(false)
    setPickerMode('menu')
  }

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setDate(toInputDate(new Date()))
    setTouched(false)
    setModalOpen(true)
  }

  const openEdit = (item: EventItem) => {
    setEditing(item)
    setTitle(item.title)
    setDate(item.date)
    setTouched(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const missingTitle = !title.trim()
  const missingDate = !date

  const saveEvent = () => {
    setTouched(true)
    if (missingTitle || missingDate) return
    if (editing) {
      updateEvent(editing.id, { title, date })
    } else {
      addEvent({ title, date })
    }
    closeModal()
  }

  return (
    <div className="events">
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
              onClick={openDate}
            >
              {dateLabel}
            </button>
            <button
              type="button"
              className={`events__date-cal${dateOpen ? ' is-open' : ''}`}
              aria-label="Abrir período"
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={openDate}
            >
              <CalendarDays size={16} strokeWidth={2} />
            </button>

            {dateOpen && pickerMode === 'menu' ? (
              <div className="events__date-menu" id={dateMenuId} role="listbox" aria-label="Período">
                {DATE_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={datePreset === item.id}
                    className={`events__date-option${datePreset === item.id ? ' is-active' : ''}`}
                    onClick={() => onMenuSelect(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {dateOpen && pickerMode === 'calendar' ? (
              <div className="events__date-popover" id={dateMenuId}>
                <DateRangePicker
                  start={rangeStart}
                  end={rangeEnd}
                  preset={datePreset}
                  onCancel={() => {
                    setDateOpen(false)
                    setPickerMode('menu')
                  }}
                  onApply={({ start, end, preset: nextPreset }) => {
                    setRangeStart(start)
                    setRangeEnd(end)
                    setDatePreset(nextPreset)
                    setDateOpen(false)
                    setPickerMode('menu')
                  }}
                />
              </div>
            ) : null}
          </div>

          <button type="button" className="events__add" onClick={openCreate}>
            <Plus size={16} strokeWidth={2.5} />
            Novo evento
          </button>
        </div>

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
              {filtered.length === 0 ? (
                <tr>
                  <td className="events__empty" colSpan={3}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{formatEventDate(item.date)}</td>
                    <td className="events__actions-cell">
                      <button
                        type="button"
                        className="events__icon-btn"
                        aria-label={`Editar ${item.title}`}
                        onClick={() => openEdit(item)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="events__icon-btn is-danger"
                        aria-label={`Excluir ${item.title}`}
                        onClick={() => deleteEvent(item.id)}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="events-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="events-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="events-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="events-modal__header">
              <h2 id="events-modal-title">{editing ? 'Editar evento' : 'Novo evento'}</h2>
              <button type="button" className="events-modal__close" aria-label="Fechar" onClick={closeModal}>
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="events-modal__body">
              <label className="events-modal__field">
                <span>
                  Nome do evento <span className="events-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`events-modal__input${touched && missingTitle ? ' is-invalid' : ''}`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Casamento"
                  autoFocus
                />
              </label>

              <label className="events-modal__field">
                <span>
                  Data <span className="events-modal__req">*</span>
                </span>
                <input
                  type="date"
                  className={`events-modal__input${touched && missingDate ? ' is-invalid' : ''}`}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
            </div>

            <footer className="events-modal__footer">
              <button type="button" className="events-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="events-modal__save" onClick={saveEvent}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
