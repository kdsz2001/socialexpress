import { useEffect, useId, useMemo, useState } from 'react'
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

function buildPeople() {
  const profile = getUserProfile()
  const selfId = 'self'
  const selfName = getUserDisplayName(profile)
  return [
    { id: selfId, name: selfName || 'Eu' },
    { id: 'ana', name: 'Ana Souza' },
    { id: 'bruno', name: 'Bruno Lima' },
    { id: 'carla', name: 'Carla Mendes' },
  ]
}

function emptyForm(defaultDate?: Date): FormState {
  return {
    date: toDateKey(defaultDate ?? new Date()),
    startTime: '',
    endTime: '',
    title: '',
    details: '',
    color: 'blue',
    responsibleIds: ['self'],
    orderLabel: '',
  }
}

export function NewAppointmentModal({
  open,
  onClose,
  defaultDate,
}: NewAppointmentModalProps) {
  const titleId = useId()
  const people = useMemo(() => buildPeople(), [open])
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
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const missingDate = !form.date
  const missingTitle = !form.title.trim()
  const missingPeople = form.responsibleIds.length === 0
  const invalid = missingDate || missingTitle || missingPeople

  const selectedPeopleLabel = people
    .filter((person) => form.responsibleIds.includes(person.id))
    .map((person) => person.name)
    .join(', ')

  const patch = (partial: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...partial }))
  }

  const togglePerson = (id: string) => {
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
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="new-apt__body">
          <div className="new-apt__row">
            <label className="new-apt__label" htmlFor="new-apt-date">
              Data <span className="new-apt__req">*</span>
            </label>
            <div
              className={`new-apt__date${touched && missingDate ? ' is-invalid' : ''}`}
            >
              <input
                id="new-apt-date"
                type="date"
                className="new-apt__input"
                value={form.date}
                onChange={(event) => patch({ date: event.target.value })}
              />
              <span className="new-apt__date-icon" aria-hidden="true">
                <CalendarDays size={16} strokeWidth={2} />
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
            <input
              id="new-apt-title"
              type="text"
              className={`new-apt__input${touched && missingTitle ? ' is-invalid' : ''}`}
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </div>

          <div className="new-apt__row new-apt__row--top">
            <label className="new-apt__label" htmlFor="new-apt-details">
              Detalhes
            </label>
            <textarea
              id="new-apt-details"
              className="new-apt__textarea"
              rows={4}
              value={form.details}
              onChange={(event) => patch({ details: event.target.value })}
            />
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
              className={`new-apt__people${touched && missingPeople ? ' is-invalid' : ''}`}
            >
              <button
                type="button"
                className={`new-apt__people-trigger${selectedPeopleLabel ? '' : ' is-placeholder'}`}
                aria-expanded={peopleOpen}
                onClick={() => setPeopleOpen((value) => !value)}
              >
                <span>
                  {selectedPeopleLabel || 'Selecione uma ou mais pessoas'}
                </span>
                <ChevronDown size={16} strokeWidth={2} />
              </button>
              {peopleOpen ? (
                <div className="new-apt__people-menu" role="listbox" aria-multiselectable="true">
                  {people.map((person) => {
                    const checked = form.responsibleIds.includes(person.id)
                    return (
                      <label key={person.id} className="new-apt__people-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePerson(person.id)}
                        />
                        <span>{person.name}</span>
                      </label>
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
            <div className="new-apt__select-wrap">
              <input
                id="new-apt-order"
                type="text"
                className="new-apt__input"
                placeholder="Nome de cliente ou código do pedido"
                value={form.orderLabel}
                onChange={(event) => patch({ orderLabel: event.target.value })}
                list="new-apt-order-suggestions"
              />
              <ChevronDown size={16} className="new-apt__select-caret" aria-hidden="true" />
              <datalist id="new-apt-order-suggestions">
                <option value="Pedido #1001" />
                <option value="Pedido #1002" />
                <option value="Cliente — Exemplo" />
              </datalist>
            </div>
          </div>
        </div>

        <footer className="new-apt__footer">
          <button type="button" className="new-apt__btn new-apt__btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="new-apt__btn new-apt__btn--save" onClick={onSave}>
            <Check size={16} strokeWidth={2.5} />
            Salvar
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
