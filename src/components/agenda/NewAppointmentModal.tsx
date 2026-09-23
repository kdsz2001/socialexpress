import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  APPOINTMENT_COLORS,
  type Appointment,
  type AppointmentColor,
  addAppointment,
  toDateKey,
  updateAppointment,
} from '../../lib/agendaStore'
import { notifyAgendaToast } from '../../lib/agendaUi'
import {
  getUserDisplayName,
  getUserProfile,
} from '../../lib/userProfileStore'
import './NewAppointmentModal.css'

type NewAppointmentModalProps = {
  open: boolean
  onClose: () => void
  defaultDate?: Date
  defaultStartTime?: string
  defaultEndTime?: string
  editingAppointment?: Appointment | null
}

type FormState = {
  date: string
  startTime: string
  endTime: string
  title: string
  details: string
  color: AppointmentColor
  responsibleIds: string[]
  orderLabel: string
}

const ALL_ID = 'all'
const SELF_ID = 'self'

function buildResponsibleOptions() {
  const profile = getUserProfile()
  const selfName = getUserDisplayName(profile) || 'Eu'
  return [
    { id: ALL_ID, name: 'Todos' },
    { id: SELF_ID, name: selfName },
  ]
}

const CAL_WEEKDAYS = ['D', '2ª', '3ª', '4ª', '5ª', '6ª', 'S']
const CAL_MONTHS = [
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

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatBrDate(value: string) {
  const date = parseIsoDate(value)
  if (!date) return ''
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)
  if (digits.length <= 2) return day
  if (digits.length <= 4) return `${day}/${month}`
  return `${day}/${month}/${year}`
}

function parseBrDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return ''
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return ''
  }
  return toDateKey(date)
}

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function isBeforeToday(day: Date) {
  return day.getTime() < startOfToday().getTime()
}

function emptyForm(
  defaultDate?: Date,
  defaultStartTime = '',
  defaultEndTime = '',
): FormState {
  return {
    date: toDateKey(defaultDate ?? new Date()),
    startTime: defaultStartTime || '00:00',
    endTime: defaultEndTime || '00:00',
    title: '',
    details: '',
    color: 'coral',
    responsibleIds: [],
    orderLabel: '',
  }
}

function formFromAppointment(appointment: Appointment): FormState {
  return {
    date: appointment.date,
    startTime: appointment.startTime || '00:00',
    endTime: appointment.endTime || '00:00',
    title: appointment.title,
    details: appointment.details,
    color: appointment.color,
    responsibleIds: [...appointment.responsibleIds],
    orderLabel: appointment.orderLabel,
  }
}

/** Digita só números; formata automaticamente como hh:mm */
function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''

  let hours = digits.slice(0, 2)
  let minutes = digits.slice(2)

  if (hours.length === 2 && Number(hours) > 23) hours = '23'
  if (minutes.length === 2 && Number(minutes) > 59) minutes = '59'

  if (!minutes) return hours
  return `${hours}:${minutes}`
}

export function NewAppointmentModal({
  open,
  onClose,
  defaultDate,
  defaultStartTime = '',
  defaultEndTime = '',
  editingAppointment = null,
}: NewAppointmentModalProps) {
  const titleId = useId()
  const peopleRef = useRef<HTMLDivElement>(null)
  const peopleMenuRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const options = useMemo(() => buildResponsibleOptions(), [open])
  const isEditing = Boolean(editingAppointment)
  const [form, setForm] = useState<FormState>(() =>
    editingAppointment
      ? formFromAppointment(editingAppointment)
      : emptyForm(defaultDate, defaultStartTime, defaultEndTime),
  )
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [peopleMenuStyle, setPeopleMenuStyle] = useState<CSSProperties>({})
  const [touched, setTouched] = useState(false)
  const [dateText, setDateText] = useState('')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calMonth, setCalMonth] = useState(() => new Date())

  useEffect(() => {
    if (!open) return
    const next = editingAppointment
      ? formFromAppointment(editingAppointment)
      : emptyForm(defaultDate, defaultStartTime, defaultEndTime)
    setForm(next)
    setDateText(formatBrDate(next.date))
    setCalMonth(parseIsoDate(next.date) ?? new Date())
    setCalendarOpen(false)
    setPeopleOpen(false)
    setTouched(false)
  }, [open, defaultDate, defaultStartTime, defaultEndTime, editingAppointment])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (calendarOpen) setCalendarOpen(false)
        else if (peopleOpen) setPeopleOpen(false)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, peopleOpen, calendarOpen])

  useEffect(() => {
    if (!calendarOpen) return
    const onPointer = (event: MouseEvent) => {
      if (dateRef.current?.contains(event.target as Node)) return
      setCalendarOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [calendarOpen])

  useEffect(() => {
    if (!peopleOpen) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (peopleRef.current?.contains(target) || peopleMenuRef.current?.contains(target)) {
        return
      }
      setPeopleOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [peopleOpen])

  useEffect(() => {
    if (!peopleOpen) return
    const updateMenuPosition = () => {
      const field = peopleRef.current?.querySelector('.new-apt__people-field')
      if (!(field instanceof HTMLElement)) return
      const rect = field.getBoundingClientRect()
      const gap = 4
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceAbove >= 120 || spaceAbove > spaceBelow

      setPeopleMenuStyle(
        openUp
          ? {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              bottom: window.innerHeight - rect.top + gap,
              top: 'auto',
              zIndex: 320,
            }
          : {
              position: 'fixed',
              left: rect.left,
              width: rect.width,
              top: rect.bottom + gap,
              bottom: 'auto',
              zIndex: 320,
            },
      )
    }
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    document.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      document.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [peopleOpen])

  if (!open) return null

  const missingDate = !form.date
  const missingTitle = !form.title.trim()
  const missingPeople = form.responsibleIds.length === 0
  const invalid = missingDate || missingTitle || missingPeople

  const selectedPeople = options.filter((person) =>
    form.responsibleIds.includes(person.id),
  )

  const patch = (partial: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...partial }))
  }

  const selectResponsible = (id: string) => {
    setForm((current) => {
      if (current.responsibleIds.includes(id)) return current
      return {
        ...current,
        responsibleIds: [...current.responsibleIds, id],
      }
    })
    setPeopleOpen(false)
  }

  const removeResponsible = (id: string) => {
    setForm((current) => ({
      ...current,
      responsibleIds: current.responsibleIds.filter((item) => item !== id),
    }))
  }

  const onSave = () => {
    setTouched(true)
    if (invalid) return
    const payload = {
      date: form.date,
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      title: form.title.trim(),
      details: form.details.trim(),
      color: form.color,
      responsibleIds: form.responsibleIds,
      orderLabel: form.orderLabel.trim(),
    }
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, payload)
      notifyAgendaToast('Agendamento atualizado.')
    } else {
      addAppointment(payload)
      notifyAgendaToast('Agendamento cadastrado.')
    }
    onClose()
  }

  return createPortal(
    <div className="new-apt" role="presentation">
      <button
        type="button"
        className="new-apt__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        className="new-apt__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="new-apt__header">
          <h2 id={titleId} className="new-apt__title">
            {isEditing ? 'Atualizando agendamento' : 'Novo agendamento'}
          </h2>
          <button
            type="button"
            className="new-apt__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>

        <div className="new-apt__body">
          <div className="new-apt__row">
            <label className="new-apt__label" htmlFor="new-apt-date">
              Data <span className="new-apt__req">*</span>
            </label>
            <div
              className={`new-apt__control new-apt__date${touched && missingDate ? ' is-invalid' : ''}${calendarOpen ? ' is-open' : ''}`}
              ref={dateRef}
            >
              <input
                id="new-apt-date"
                type="text"
                className="new-apt__input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="dd/mm/aaaa"
                maxLength={10}
                value={dateText}
                onChange={(event) => {
                  const next = maskDate(event.target.value)
                  setDateText(next)
                  const iso = parseBrDate(next)
                  const parsed = iso ? parseIsoDate(iso) : null
                  if (parsed && !isBeforeToday(parsed)) {
                    patch({ date: iso })
                    setCalMonth(parsed)
                  } else {
                    patch({ date: '' })
                  }
                }}
                onClick={() => setCalendarOpen(true)}
              />
              <span className="new-apt__date-btn" aria-hidden="true">
                <CalendarDays size={16} strokeWidth={2} />
              </span>
              {calendarOpen ? (
                <div className="new-apt-cal" role="dialog" aria-label="Calendário">
                  <div className="new-apt-cal__head">
                    <button
                      type="button"
                      className="new-apt-cal__nav"
                      aria-label="Mês anterior"
                      onClick={() =>
                        setCalMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                      }
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>
                      {CAL_MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
                    </span>
                    <button
                      type="button"
                      className="new-apt-cal__nav"
                      aria-label="Próximo mês"
                      onClick={() =>
                        setCalMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                      }
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="new-apt-cal__weekdays">
                    {CAL_WEEKDAYS.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="new-apt-cal__grid">
                    {monthCells(calMonth).map((day) => {
                      const selected = parseIsoDate(form.date)
                      const today = startOfToday()
                      const outside = day.getMonth() !== calMonth.getMonth()
                      const past = isBeforeToday(day)
                      const isToday = sameDay(day, today)
                      const isSelected = Boolean(selected) && !past && sameDay(day, selected as Date)
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={past}
                          className={[
                            'new-apt-cal__day',
                            outside ? 'is-outside' : '',
                            past ? 'is-past' : '',
                            isToday ? 'is-today' : '',
                            isSelected ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => {
                            if (past) return
                            const iso = toDateKey(day)
                            patch({ date: iso })
                            setDateText(formatBrDate(iso))
                            setCalMonth(new Date(day.getFullYear(), day.getMonth(), 1))
                            setCalendarOpen(false)
                          }}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="new-apt__row">
            <span className="new-apt__label">Horário</span>
            <div className="new-apt__time">
              <input
                type="text"
                className="new-apt__time-input"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                value={form.startTime}
                onChange={(event) => patch({ startTime: maskTime(event.target.value) })}
                aria-label="Horário inicial"
              />
              <span className="new-apt__time-sep">até</span>
              <input
                type="text"
                className="new-apt__time-input"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                value={form.endTime}
                onChange={(event) => patch({ endTime: maskTime(event.target.value) })}
                aria-label="Horário final"
              />
            </div>
          </div>

          <div className="new-apt__row">
            <label className="new-apt__label" htmlFor="new-apt-title">
              Título do agendamento <span className="new-apt__req">*</span>
            </label>
            <div className="new-apt__control">
              <input
                id="new-apt-title"
                type="text"
                className={`new-apt__input${touched && missingTitle ? ' is-invalid' : ''}`}
                value={form.title}
                onChange={(event) => patch({ title: event.target.value })}
              />
            </div>
          </div>

          <div className="new-apt__row new-apt__row--top">
            <label className="new-apt__label" htmlFor="new-apt-details">
              Detalhes
            </label>
            <div className="new-apt__control">
              <textarea
                id="new-apt-details"
                className="new-apt__textarea"
                rows={3}
                value={form.details}
                onChange={(event) => patch({ details: event.target.value })}
              />
            </div>
          </div>

          <div className="new-apt__row">
            <span className="new-apt__label">Cor</span>
            <div className="new-apt__colors" role="radiogroup" aria-label="Cor">
              {APPOINTMENT_COLORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={form.color === item.id}
                  aria-label={item.label}
                  className={`new-apt__color${form.color === item.id ? ' is-active' : ''}`}
                  style={{ background: item.hex }}
                  onClick={() => patch({ color: item.id })}
                />
              ))}
            </div>
          </div>

          <div className="new-apt__row new-apt__row--top">
            <span className="new-apt__label">
              Responsáveis <span className="new-apt__req">*</span>
            </span>
            <div
              className={`new-apt__control new-apt__people${touched && missingPeople ? ' is-invalid' : ''}${peopleOpen ? ' is-open' : ''}`}
              ref={peopleRef}
            >
              <div
                className={`new-apt__people-field${selectedPeople.length === 0 ? ' is-placeholder' : ''}`}
                role="combobox"
                aria-expanded={peopleOpen}
                aria-haspopup="listbox"
                tabIndex={0}
                onClick={() => setPeopleOpen((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setPeopleOpen((value) => !value)
                  }
                }}
              >
                <div className="new-apt__people-chips">
                  {selectedPeople.map((person) => (
                    <span key={person.id} className="new-apt__people-chip">
                      <button
                        type="button"
                        className="new-apt__people-chip-remove"
                        aria-label={`Remover ${person.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          removeResponsible(person.id)
                        }}
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                      {person.name}
                    </span>
                  ))}
                  {selectedPeople.length === 0 ? (
                    <span className="new-apt__people-placeholder">
                      Selecione uma ou mais pessoas
                    </span>
                  ) : null}
                </div>
                <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="new-apt__row">
            <label className="new-apt__label" htmlFor="new-apt-order">
              Vincular a um pedido?
            </label>
            <div className="new-apt__control new-apt__select-wrap">
              <input
                id="new-apt-order"
                type="text"
                className="new-apt__input"
                placeholder="Nome de cliente ou código do pedido"
                value={form.orderLabel}
                onChange={(event) => patch({ orderLabel: event.target.value })}
              />
              <ChevronDown size={15} className="new-apt__select-caret" aria-hidden="true" />
            </div>
          </div>
        </div>

        <footer className="new-apt__footer">
          <button type="button" className="new-apt__btn new-apt__btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="new-apt__btn new-apt__btn--save" onClick={onSave}>
            <Check size={15} strokeWidth={2.5} />
            Salvar
          </button>
        </footer>
      </div>

      {peopleOpen
        ? createPortal(
            <div
              ref={peopleMenuRef}
              className="new-apt__people-menu"
              role="listbox"
              style={peopleMenuStyle}
            >
              {options.map((person) => {
                const selected = form.responsibleIds.includes(person.id)
                return (
                  <button
                    key={person.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`new-apt__people-option${selected ? ' is-selected' : ''}`}
                    onClick={() => selectResponsible(person.id)}
                  >
                    {person.name}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>,
    document.body,
  )
}
