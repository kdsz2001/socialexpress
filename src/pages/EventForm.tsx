import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { CreatableSelect } from '../components/products/CreatableSelect'
import {
  EVENT_TOAST_KEY,
  EVENT_TYPE_OPTIONS,
  addEvent,
  getEvent,
  updateEvent,
} from '../lib/eventsStore'
import './EventForm.css'

const WEEKDAYS = ['D', '2ª', '3ª', '4ª', '5ª', '6ª', 'S']
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseIso(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatInput(value: string) {
  const date = parseIso(value)
  if (!date) return ''
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

export function EventForm() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const editing = eventId ? getEvent(eventId) : null
  const missing = Boolean(eventId && !editing)

  const [type, setType] = useState(editing?.type ?? '')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [date, setDate] = useState(editing?.date ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [touched, setTouched] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
    const current = parseIso(editing?.date ?? '') ?? new Date()
    return new Date(current.getFullYear(), current.getMonth(), 1)
  })
  const calendarRef = useRef<HTMLDivElement>(null)

  const cells = useMemo(() => monthCells(viewMonth), [viewMonth])
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])
  const selected = parseIso(date)

  useEffect(() => {
    if (!calendarOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) setCalendarOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCalendarOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [calendarOpen])

  const missingType = !type
  const missingTitle = !title.trim()
  const missingDate = !date

  const back = () => navigate('/eventos')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (missingType || missingTitle || missingDate) return
    const payload = { title, type, date, notes }
    if (editing) updateEvent(editing.id, payload)
    else addEvent(payload)
    try {
      sessionStorage.setItem(
        EVENT_TOAST_KEY,
        editing ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso.',
      )
    } catch {
      // ignore storage errors
    }
    navigate('/eventos')
  }

  const pickDay = (day: Date) => {
    if (day.getTime() < today.getTime()) return
    setDate(toIso(day))
    setCalendarOpen(false)
  }

  if (missing) {
    return (
      <div className="event-form">
        <section className="event-form__card">
          <header className="event-form__head">
            <h2>Evento não encontrado</h2>
            <button type="button" className="event-form__back" onClick={back}>
              <ArrowLeft size={14} strokeWidth={2.25} />
              Voltar
            </button>
          </header>
        </section>
      </div>
    )
  }

  return (
    <div className="event-form">
      <form className="event-form__card" onSubmit={onSubmit}>
        <header className="event-form__head">
          <h2>{editing ? 'Informações do evento' : 'Informações do novo evento'}</h2>
          <Actions onBack={back} saveLabel={editing ? 'Salvar' : 'Cadastrar'} />
        </header>

        <div className="event-form__body">
          <Field label="Tipo" required invalid={touched && missingType}>
            <CreatableSelect
              value={type}
              options={EVENT_TYPE_OPTIONS}
              placeholder="Selecione um tipo de evento"
              createLabel="Tipo"
              allowCreate={false}
              invalid={touched && missingType}
              onChange={setType}
              onCreate={() => undefined}
            />
            {touched && missingType ? (
              <p className="event-form__error">&quot;Tipo&quot; não pode ficar em branco.</p>
            ) : null}
          </Field>

          <Field label="Nome do evento" required invalid={touched && missingTitle}>
            <div className={`event-form__input-wrap${touched && missingTitle ? ' is-invalid' : ''}`}>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              {touched && missingTitle ? (
                <span className="event-form__error-icon" aria-hidden="true">
                  !
                </span>
              ) : null}
            </div>
            {touched && missingTitle ? (
              <p className="event-form__error">
                &quot;Nome do evento&quot; não pode ficar em branco.
              </p>
            ) : null}
          </Field>

          <Field label="Data" required invalid={touched && missingDate}>
            <div className="event-form__date" ref={calendarRef}>
              <div className={`event-form__date-field${touched && missingDate ? ' is-invalid' : ''}${calendarOpen ? ' is-open' : ''}`}>
                <input
                  type="text"
                  readOnly
                  value={formatInput(date)}
                  placeholder=""
                  aria-label="Data do evento"
                  onClick={() => setCalendarOpen(true)}
                />
                <span className="event-form__date-btn" aria-hidden="true">
                  <CalendarDays size={16} strokeWidth={2} />
                </span>
              </div>
              {calendarOpen ? (
                <div className="event-cal" role="dialog" aria-label="Escolher data">
                  <div className="event-cal__head">
                    <button
                      type="button"
                      className="event-cal__nav"
                      aria-label="Mês anterior"
                      onClick={() =>
                        setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
                      }
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <strong>
                      {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                    </strong>
                    <button
                      type="button"
                      className="event-cal__nav"
                      aria-label="Próximo mês"
                      onClick={() =>
                        setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
                      }
                    >
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                  <div className="event-cal__weekdays">
                    {WEEKDAYS.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="event-cal__grid">
                    {cells.map((day) => {
                      const inMonth = day.getMonth() === viewMonth.getMonth()
                      const isPast = day.getTime() < today.getTime()
                      const isSelected = selected ? sameDay(day, selected) : false
                      const isToday = sameDay(day, today)
                      return (
                        <button
                          key={toIso(day)}
                          type="button"
                          disabled={isPast}
                          className={[
                            'event-cal__day',
                            inMonth ? '' : 'is-outside',
                            isPast ? 'is-past' : '',
                            isSelected && !isPast ? 'is-selected' : '',
                            isToday ? 'is-today' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => pickDay(day)}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            {touched && missingDate ? (
              <p className="event-form__error">&quot;Data&quot; não pode ficar em branco.</p>
            ) : null}
          </Field>

          <Field label="Observações">
            <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </div>

        <footer className="event-form__footer">
          <Actions onBack={back} saveLabel={editing ? 'Salvar' : 'Cadastrar'} />
        </footer>
      </form>
    </div>
  )
}

function Actions({ onBack, saveLabel }: { onBack: () => void; saveLabel: string }) {
  return (
    <div className="event-form__actions">
      <button type="button" className="event-form__back" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={2.25} />
        Voltar
      </button>
      <button type="submit" className="event-form__save">
        <Check size={14} strokeWidth={2.5} />
        {saveLabel}
      </button>
    </div>
  )
}

function Field({
  label,
  required,
  invalid,
  children,
}: {
  label: string
  required?: boolean
  invalid?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`event-form__row${invalid ? ' is-invalid' : ''}`}>
      <div className="event-form__label">
        {label}
        {required ? <em>*</em> : null}
      </div>
      <div className="event-form__control">{children}</div>
    </div>
  )
}
