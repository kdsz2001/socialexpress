import { useEffect, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, Pencil, Trash2, X } from 'lucide-react'
import {
  type Appointment,
  deleteAppointment,
} from '../../lib/agendaStore'
import {
  getUserDisplayName,
  getUserProfile,
} from '../../lib/userProfileStore'
import './AppointmentDetailModal.css'

type AppointmentDetailModalProps = {
  appointment: Appointment | null
  onClose: () => void
  onEdit?: (appointment: Appointment) => void
}

const MONTH_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const

function parseDateKey(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatCreatedLine(createdAt: number) {
  const date = new Date(createdAt)
  const name = getUserDisplayName(getUserProfile()) || 'Você'
  return `Agendado por ${name} em ${date.getDate()} de ${MONTH_LONG[date.getMonth()]} de ${date.getFullYear()}`
}

function formatScheduleBox(apt: Appointment) {
  const date = parseDateKey(apt.date)
  const dayLabel = `${date.getDate()} de ${MONTH_LONG[date.getMonth()]}`
  const weekday = WEEKDAY_LONG[date.getDay()]
  const hasTime = Boolean(apt.startTime.trim())
  const timePart = hasTime
    ? `${apt.startTime}${apt.endTime ? ` – ${apt.endTime}` : ''}`
    : 'o dia inteiro'
  return {
    dayLabel,
    subLabel: `${weekday} ${timePart}`,
  }
}

function responsibleNames(ids: string[]) {
  const selfName = getUserDisplayName(getUserProfile()) || 'Eu'
  return ids.map((id) => {
    if (id === 'all') return 'Todos'
    if (id === 'self') return selfName
    return id
  })
}

export function AppointmentDetailModal({
  appointment,
  onClose,
  onEdit,
}: AppointmentDetailModalProps) {
  const titleId = useId()
  const open = Boolean(appointment)

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

  const schedule = useMemo(
    () => (appointment ? formatScheduleBox(appointment) : null),
    [appointment],
  )

  if (!appointment || !schedule) return null

  const people = responsibleNames(appointment.responsibleIds)

  const onComplete = () => {
    deleteAppointment(appointment.id)
    onClose()
  }

  const onDelete = () => {
    deleteAppointment(appointment.id)
    onClose()
  }

  return createPortal(
    <div className="apt-detail" role="presentation">
      <button
        type="button"
        className="apt-detail__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div
        className="apt-detail__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="apt-detail__header">
          <div className="apt-detail__heading">
            <h2 id={titleId} className="apt-detail__title">
              {appointment.title}
            </h2>
            <p className="apt-detail__meta">{formatCreatedLine(appointment.createdAt)}</p>
          </div>
          <button
            type="button"
            className="apt-detail__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>

        <div className="apt-detail__body">
          <div className="apt-detail__schedule">
            <div className="apt-detail__schedule-text">
              <strong>{schedule.dayLabel}</strong>
              <span>{schedule.subLabel}</span>
            </div>
            <span className="apt-detail__schedule-icon" aria-hidden="true">
              <CalendarDays size={18} strokeWidth={1.75} />
            </span>
          </div>

          <section className="apt-detail__section">
            <h3 className="apt-detail__section-title">Detalhes</h3>
            <p className="apt-detail__section-text">
              {appointment.details.trim() || '—'}
            </p>
          </section>

          <section className="apt-detail__section">
            <h3 className="apt-detail__section-title">Responsáveis</h3>
            <p className="apt-detail__section-text">
              {people.length > 0 ? people.join(', ') : '—'}
            </p>
          </section>
        </div>

        <footer className="apt-detail__footer">
          <button
            type="button"
            className="apt-detail__btn apt-detail__btn--complete"
            onClick={onComplete}
          >
            <Check size={15} strokeWidth={2.5} />
            Concluir
          </button>
          <button
            type="button"
            className="apt-detail__btn apt-detail__btn--delete"
            onClick={onDelete}
          >
            <Trash2 size={15} strokeWidth={2.25} />
            Excluir
          </button>
          <button
            type="button"
            className="apt-detail__btn apt-detail__btn--edit"
            onClick={() => onEdit?.(appointment)}
          >
            <Pencil size={15} strokeWidth={2.25} />
            Editar
          </button>
          <button
            type="button"
            className="apt-detail__btn apt-detail__btn--close"
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
