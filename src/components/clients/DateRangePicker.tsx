import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './DateRangePicker.css'

export type DatePreset =
  | 'hoje'
  | 'semana'
  | 'proxima-semana'
  | 'mes'
  | 'escolher'

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'hoje', label: 'De hoje' },
  { id: 'semana', label: 'Dessa semana' },
  { id: 'proxima-semana', label: 'Da próxima semana' },
  { id: 'mes', label: 'Desse mês' },
  { id: 'escolher', label: 'Escolher datas' },
]

const WEEKDAYS = ['2ª', '3ª', '4ª', '5ª', '6ª', 'Sá', 'Do']
const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function formatBr(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeek(date: Date) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  return d
}

export function rangeForPreset(preset: Exclude<DatePreset, 'escolher'>): {
  start: Date
  end: Date
} {
  const today = startOfDay(new Date())

  if (preset === 'hoje') return { start: today, end: new Date(today) }
  if (preset === 'semana') return { start: startOfWeek(today), end: endOfWeek(today) }
  if (preset === 'proxima-semana') {
    const next = new Date(today)
    next.setDate(next.getDate() + 7)
    return { start: startOfWeek(next), end: endOfWeek(next) }
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return { start, end }
}

/** Se o intervalo bater com um atalho, devolve o preset; senão "escolher". */
export function matchPreset(start: Date, end: Date): DatePreset {
  const a = startOfDay(start)
  const b = startOfDay(end)
  const shortcuts: Exclude<DatePreset, 'escolher'>[] = [
    'hoje',
    'semana',
    'proxima-semana',
    'mes',
  ]

  for (const id of shortcuts) {
    const range = rangeForPreset(id)
    if (sameDay(a, range.start) && sameDay(b, range.end)) return id
  }

  return 'escolher'
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function buildMonthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = startOfWeek(first)
  const cells: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push(d)
  }
  return cells
}

type DateRangePickerProps = {
  start: Date
  end: Date
  preset: DatePreset
  onCancel: () => void
  onApply: (range: { start: Date; end: Date; preset: DatePreset }) => void
}

export function DateRangePicker({
  start,
  end,
  preset,
  onCancel,
  onApply,
}: DateRangePickerProps) {
  const [draftStart, setDraftStart] = useState(() => startOfDay(start))
  const [draftEnd, setDraftEnd] = useState(() => startOfDay(end))
  const [draftPreset, setDraftPreset] = useState<DatePreset>(preset)
  const [viewMonth, setViewMonth] = useState(
    () => new Date(start.getFullYear(), start.getMonth(), 1),
  )
  const [picking, setPicking] = useState<'start' | 'end'>('start')

  const leftMonth = viewMonth
  const rightMonth = addMonths(viewMonth, 1)

  const leftCells = useMemo(() => buildMonthCells(leftMonth), [leftMonth])
  const rightCells = useMemo(() => buildMonthCells(rightMonth), [rightMonth])

  const selectPreset = (id: DatePreset) => {
    setDraftPreset(id)
    if (id === 'escolher') {
      setPicking('start')
      return
    }
    const range = rangeForPreset(id)
    setDraftStart(range.start)
    setDraftEnd(range.end)
    setViewMonth(new Date(range.start.getFullYear(), range.start.getMonth(), 1))
  }

  const selectDay = (day: Date) => {
    const value = startOfDay(day)

    if (picking === 'start' || value < draftStart) {
      setDraftStart(value)
      setDraftEnd(value)
      setDraftPreset(matchPreset(value, value))
      setPicking('end')
      return
    }

    setDraftEnd(value)
    setDraftPreset(matchPreset(draftStart, value))
    setPicking('start')
  }

  const renderMonth = (month: Date, cells: Date[]) => (
    <div className="daterange__month">
      <div className="daterange__month-title">
        {MONTHS[month.getMonth()]} {month.getFullYear()}
      </div>
      <div className="daterange__weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="daterange__grid">
        {cells.map((day) => {
          const inMonth = day.getMonth() === month.getMonth()
          const selected = sameDay(day, draftStart) || sameDay(day, draftEnd)
          const inRange = day >= draftStart && day <= draftEnd
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={[
                'daterange__day',
                inMonth ? '' : ' is-outside',
                selected ? ' is-selected' : '',
                inRange && !selected ? ' is-in-range' : '',
              ]
                .filter(Boolean)
                .join('')}
              onClick={() => selectDay(day)}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="daterange" role="dialog" aria-label="Escolher datas">
      <div className="daterange__body">
        <aside className="daterange__presets">
          {DATE_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`daterange__preset${draftPreset === item.id ? ' is-active' : ''}`}
              onClick={() => selectPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <div className="daterange__calendars">
          <div className="daterange__nav">
            <button
              type="button"
              className="daterange__nav-btn"
              aria-label="Mês anterior"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="daterange__nav-btn"
              aria-label="Próximo mês"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="daterange__months">
            {renderMonth(leftMonth, leftCells)}
            {renderMonth(rightMonth, rightCells)}
          </div>
        </div>
      </div>

      <footer className="daterange__footer">
        <span className="daterange__summary">
          {formatBr(draftStart)} até {formatBr(draftEnd)}
        </span>
        <div className="daterange__actions">
          <button type="button" className="daterange__cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="daterange__apply"
            onClick={() =>
              onApply({
                start: draftStart,
                end: draftEnd,
                preset: draftPreset,
              })
            }
          >
            Aplicar
          </button>
        </div>
      </footer>
    </div>
  )
}
