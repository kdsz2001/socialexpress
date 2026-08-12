import { useEffect, useId, useRef, useState } from 'react'
import { Search, Plus, CalendarDays, ArrowUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  DATE_PRESETS,
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import './Clients.css'

type PickerMode = 'menu' | 'calendar'

export function Clients() {
  const [searchParams] = useSearchParams()
  const tab =
    searchParams.get('tab') === 'aniversariantes' ? 'aniversariantes' : 'todos'
  const [query, setQuery] = useState('')
  const [dateOpen, setDateOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('menu')
  const [datePreset, setDatePreset] = useState<DatePreset>('hoje')
  const initial = rangeForPreset('hoje')
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

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

  useEffect(() => {
    setDateOpen(false)
    setPickerMode('menu')
  }, [tab])

  const openDate = () => {
    setPickerMode(datePreset === 'escolher' ? 'calendar' : 'menu')
    setDateOpen((open) => !open)
  }

  const applyPreset = (preset: Exclude<DatePreset, 'escolher'>) => {
    const range = rangeForPreset(preset)
    setDatePreset(preset)
    setRangeStart(range.start)
    setRangeEnd(range.end)
    setDateOpen(false)
    setPickerMode('menu')
  }

  const onMenuSelect = (preset: DatePreset) => {
    if (preset === 'escolher') {
      setDatePreset('escolher')
      setPickerMode('calendar')
      return
    }
    applyPreset(preset)
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
                onClick={openDate}
              >
                {dateLabel}
              </button>
              <button
                type="button"
                className={`clients__date-cal${dateOpen ? ' is-open' : ''}`}
                aria-label="Abrir período"
                aria-expanded={dateOpen}
                aria-controls={dateMenuId}
                onClick={openDate}
              >
                <CalendarDays size={16} strokeWidth={2} />
              </button>

              {dateOpen && pickerMode === 'menu' && (
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
                      onClick={() => onMenuSelect(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {dateOpen && pickerMode === 'calendar' && (
                <div className="clients__date-popover" id={dateMenuId}>
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
