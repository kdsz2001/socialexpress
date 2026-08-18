import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react'
import {
  APPOINTMENT_COLORS,
  type AppointmentColor,
  addAppointment,
  toDateKey,
} from '../../lib/agendaStore'
import {
  getUserDisplayName,
  getUserProfile,
} from '../../lib/userProfileStore'
import './NewAppointmentModal.css'

type NewAppointmentModalProps = {
  open: boolean
  onClose: () => void
  defaultDate?: Date
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

function emptyForm(defaultDate?: Date): FormState {
  return {
    date: toDateKey(defaultDate ?? new Date()),
    startTime: '',
    endTime: '',
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
}: NewAppointmentModalProps) {
  const titleId = useId()
  const peopleRef = useRef<HTMLDivElement>(null)
  const options = useMemo(() => buildResponsibleOptions(), [open])
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultDate))
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm(defaultDate))
    setPeopleOpen(false)
    setTouched(false)
  }, [open, defaultDate])

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
      if (!peopleRef.current?.contains(event.target as Node)) {
        setPeopleOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [peopleOpen])

  if (!open) return null

  const missingDate = !form.date
  const missingTitle = !form.title.trim()
  const missingPeople = form.responsibleIds.length === 0
  const invalid = missingDate || missingTitle || missingPeople

  const selectedPeopleLabel = options
    .filter((person) => form.responsibleIds.includes(person.id))
    .map((person) => person.name)
    .join(', ')

  const patch = (partial: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...partial }))
  }

  const toggleResponsible = (id: string) => {
    setForm((current) => {
      const has = current.responsibleIds.includes(id)
      return {
        ...current,
        responsibleIds: has
          ? current.responsibleIds.filter((item) => item !== id)
          : [...current.responsibleIds, id],
      }
    })
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
              <button
                type="button"
                className={`new-apt__people-trigger${selectedPeopleLabel ? '' : ' is-placeholder'}`}
                aria-expanded={peopleOpen}
                aria-haspopup="listbox"
                onClick={() => setPeopleOpen((value) => !value)}
              >
                <span>
                  {selectedPeopleLabel || 'Selecione uma ou mais pessoas'}
                </span>
                <ChevronDown size={15} strokeWidth={2} />
              </button>
              {peopleOpen ? (
                <div className="new-apt__people-menu" role="listbox" aria-multiselectable="true">
                  {options.map((person) => {
                    const selected = form.responsibleIds.includes(person.id)
                    return (
                      <button
                        key={person.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`new-apt__people-option${selected ? ' is-selected' : ''}`}
                        onClick={() => toggleResponsible(person.id)}
                      >
                        {person.name}
                      </button>
                    )
                  })}
                </div>
              ) : null}
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
    </div>,
    document.body,
  )
}
