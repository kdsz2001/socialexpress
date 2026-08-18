import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'
import {
  APPOINTMENT_COLORS,
  type AppointmentColor,
  addAppointment,
  toDateKey,
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

function emptyForm(
  defaultDate?: Date,
  defaultStartTime = '',
  defaultEndTime = '',
): FormState {
  return {
    date: toDateKey(defaultDate ?? new Date()),
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    title: '',
    details: '',
    color: 'coral',
    responsibleIds: [],
    orderLabel: '',
  }
}

export function NewAppointmentModal({
  open,
  onClose,
  defaultDate,
  defaultStartTime = '',
  defaultEndTime = '',
}: NewAppointmentModalProps) {
  const titleId = useId()
  const peopleRef = useRef<HTMLDivElement>(null)
  const peopleMenuRef = useRef<HTMLDivElement>(null)
  const options = useMemo(() => buildResponsibleOptions(), [open])
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(defaultDate, defaultStartTime, defaultEndTime),
  )
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [peopleMenuStyle, setPeopleMenuStyle] = useState<CSSProperties>({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm(defaultDate, defaultStartTime, defaultEndTime))
    setPeopleOpen(false)
    setTouched(false)
  }, [open, defaultDate, defaultStartTime, defaultEndTime])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (peopleOpen) setPeopleOpen(false)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, peopleOpen])

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
    addAppointment({
      date: form.date,
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim(),
      title: form.title.trim(),
      details: form.details.trim(),
      color: form.color,
      responsibleIds: form.responsibleIds,
      orderLabel: form.orderLabel.trim(),
    })
    notifyAgendaToast('Agendamento cadastrado.')
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
            Novo agendamento
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
              className={`new-apt__control new-apt__date${touched && missingDate ? ' is-invalid' : ''}`}
            >
              <input
                id="new-apt-date"
                type="date"
                className="new-apt__input"
                value={form.date}
                onChange={(event) => patch({ date: event.target.value })}
              />
              <span className="new-apt__date-icon" aria-hidden="true">
                <CalendarDays size={15} strokeWidth={2} />
              </span>
            </div>
          </div>

          <div className="new-apt__row">
            <span className="new-apt__label">Horário</span>
            <div className="new-apt__time">
              <input
                type="text"
                className="new-apt__input new-apt__input--time"
                placeholder="hh:mm"
                inputMode="numeric"
                value={form.startTime}
                onChange={(event) => patch({ startTime: event.target.value })}
                aria-label="Horário inicial"
              />
              <span className="new-apt__time-sep">até</span>
              <input
                type="text"
                className="new-apt__input new-apt__input--time"
                placeholder="hh:mm"
                inputMode="numeric"
                value={form.endTime}
                onChange={(event) => patch({ endTime: event.target.value })}
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
