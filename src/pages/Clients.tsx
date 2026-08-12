import { useEffect, useId, useRef, useState } from 'react'
import { Search, Plus, CalendarDays, ArrowUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import './Clients.css'

type DatePreset =
  | 'hoje'
  | 'semana'
  | 'proxima-semana'
  | 'mes'
  | 'escolher'

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'hoje', label: 'De hoje' },
  { id: 'semana', label: 'Dessa semana' },
  { id: 'proxima-semana', label: 'Da próxima semana' },
  { id: 'mes', label: 'Desse mês' },
  { id: 'escolher', label: 'Escolher datas' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatBr(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

function rangeForPreset(preset: DatePreset): { start: Date; end: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === 'hoje') {
    return { start: today, end: new Date(today) }
  }

  if (preset === 'semana') {
    return { start: startOfWeek(today), end: endOfWeek(today) }
  }

  if (preset === 'proxima-semana') {
    const next = new Date(today)
    next.setDate(next.getDate() + 7)
    return { start: startOfWeek(next), end: endOfWeek(next) }
  }

  if (preset === 'mes') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { start, end }
  }

  return { start: today, end: new Date(today) }
}

export function Clients() {
  const [searchParams] = useSearchParams()
  const tab =
    searchParams.get('tab') === 'aniversariantes' ? 'aniversariantes' : 'todos'
  const [query, setQuery] = useState('')
  const [dateOpen, setDateOpen] = useState(false)
  const [datePreset, setDatePreset] = useState<DatePreset>('hoje')
  const [dateLabel, setDateLabel] = useState(() => {
    const { start, end } = rangeForPreset('hoje')
    return `${formatBr(start)} até ${formatBr(end)}`
  })
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

  useEffect(() => {
    if (!dateOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!dateWrapRef.current?.contains(event.target as Node)) {
        setDateOpen(false)
      }
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

  useEffect(() => {
    setDateOpen(false)
  }, [tab])

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset)
    const { start, end } = rangeForPreset(preset)
    setDateLabel(`${formatBr(start)} até ${formatBr(end)}`)
    setDateOpen(false)
  }

  return (
    <div className="clients">
      <section className="clients__card">
        <div className="clients__toolbar">
          <label className="clients__search">
            <Search size={16} strokeWidth={2} className="clients__search-icon" />
            <input
              type="search"
              className="clients__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {tab === 'aniversariantes' ? (
            <div className="clients__date" ref={dateWrapRef}>
              <button
                type="button"
                className={`clients__date-field${dateOpen ? ' is-open' : ''}`}
                aria-expanded={dateOpen}
                aria-controls={dateMenuId}
                onClick={() => setDateOpen((open) => !open)}
              >
                {dateLabel}
              </button>
              <button
                type="button"
                className={`clients__date-cal${dateOpen ? ' is-open' : ''}`}
                aria-label="Abrir período"
                aria-expanded={dateOpen}
                aria-controls={dateMenuId}
                onClick={() => setDateOpen((open) => !open)}
              >
                <CalendarDays size={16} strokeWidth={2} />
              </button>

              {dateOpen && (
                <div
                  className="clients__date-menu"
                  id={dateMenuId}
                  role="listbox"
                  aria-label="Período"
                >
                  {DATE_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={datePreset === item.id}
                      className={`clients__date-option${datePreset === item.id ? ' is-active' : ''}`}
                      onClick={() => applyPreset(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button type="button" className="clients__add">
              <Plus size={16} strokeWidth={2.5} />
              Cadastrar cliente
            </button>
          )}
        </div>

        <div className="clients__table-wrap">
          <table className="clients__table">
            <thead>
              {tab === 'aniversariantes' ? (
                <tr>
                  <th>
                    <span className="clients__th-sort">
                      Cliente
                      <ArrowUp size={12} strokeWidth={2.5} />
                    </span>
                  </th>
                  <th>Data de nascimento</th>
                  <th>Telefone</th>
                </tr>
              ) : (
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th className="clients__th-actions">Ações</th>
                </tr>
              )}
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="clients__empty">
                  Nenhum resultado encontrado
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
