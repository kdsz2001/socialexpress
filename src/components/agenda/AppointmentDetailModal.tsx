import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, SquarePen, Trash2, X } from 'lucide-react'
import {
  type Appointment,
  completeAppointment,
  deleteAppointment,
  reopenAppointment,
} from '../../lib/agendaStore'
import { notifyAgendaToast } from '../../lib/agendaUi'
import {
  getUserDisplayName,
  getUserProfile,
} from '../../lib/userProfileStore'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
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

function formatPersonDateLine(prefix: string, at: number) {
  const date = new Date(at)
  const name = getUserDisplayName(getUserProfile()) || 'Você'
  return `${prefix} ${name} em ${date.getDate()} de ${MONTH_LONG[date.getMonth()]} de ${date.getFullYear()}`
}

function formatScheduleBox(apt: Appointment) {
  const date = parseDateKey(apt.date)
  const dayLabel = `${date.getDate()} de ${MONTH_LONG[date.getMonth()]}`
  const weekday = WEEKDAY_LONG[date.getDay()]
  const hasTime = Boolean(apt.startTime.trim())
  const timePart = hasTime ? `às ${apt.startTime}` : 'o dia inteiro'
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setConfirmDeleteOpen(false)
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirmDeleteOpen) {
        setConfirmDeleteOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, confirmDeleteOpen])

  const schedule = useMemo(
    () => (appointment ? formatScheduleBox(appointment) : null),
    [appointment],
  )

  if (!appointment || !schedule) return null

  const people = responsibleNames(appointment.responsibleIds)
  const isCompleted = appointment.completed

  const onComplete = () => {
    completeAppointment(appointment.id)
    notifyAgendaToast('Okay. Agendamento concluído.')
    onClose()
  }

  const onReopen = () => {
    reopenAppointment(appointment.id)
    notifyAgendaToast('Agendamento atualizado.')
  }

  const onConfirmDelete = () => {
    deleteAppointment(appointment.id)
    setConfirmDeleteOpen(false)
    onClose()
  }

  return (
    <>
      {createPortal(
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
                  {appointment.title || 'Sem título'}
                </h2>
                <p className="apt-detail__meta">
                  {formatPersonDateLine('Agendado por', appointment.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="apt-detail__close"
                aria-label="Fechar"
                onClick={onClose}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </header>

            <div className="apt-detail__body">
              <div className="apt-detail__schedule">
                <div className="apt-detail__schedule-text">
                  <strong>{schedule.dayLabel}</strong>
                  <span>{schedule.subLabel}</span>
                </div>
                <span className="apt-detail__schedule-icon" aria-hidden="true">
                  <CalendarDays size={22} strokeWidth={1.6} />
                </span>
              </div>

              {isCompleted ? (
                <div className="apt-detail__completed-banner">
                  {formatPersonDateLine(
                    'Marcado como concluído por',
                    appointment.completedAt ?? appointment.createdAt,
                  )}
                  .
                </div>
              ) : null}

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
              {isCompleted ? (
                <>
                  <div className="apt-detail__actions apt-detail__actions--start">
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--pending"
                      onClick={onReopen}
                    >
                      Marcar como pendente
                    </button>
                  </div>
                  <div className="apt-detail__actions apt-detail__actions--end">
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--edit"
                      onClick={() => onEdit?.(appointment)}
                    >
                      <SquarePen size={14} strokeWidth={2.25} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--close"
                      onClick={onClose}
                    >
                      Fechar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="apt-detail__actions apt-detail__actions--start">
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--complete"
                      onClick={onComplete}
                    >
                      <Check size={14} strokeWidth={2.75} />
                      Concluir
                    </button>
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--delete"
                      onClick={() => setConfirmDeleteOpen(true)}
                    >
                      <Trash2 size={14} strokeWidth={2.25} />
                      Excluir
                    </button>
                  </div>
                  <div className="apt-detail__actions apt-detail__actions--end">
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--edit"
                      onClick={() => onEdit?.(appointment)}
                    >
                      <SquarePen size={14} strokeWidth={2.25} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="apt-detail__btn apt-detail__btn--close"
                      onClick={onClose}
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </footer>
          </div>
        </div>,
        document.body,
      )}

      <ConfirmDeleteModal
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </>
  )
}
