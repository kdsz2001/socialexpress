import type { Appointment } from './agendaStore'

export type NewAppointmentDefaults = {
  date?: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
}

export type AppointmentEditorRequest = {
  mode: 'create' | 'edit'
  defaults?: NewAppointmentDefaults
  appointment?: Appointment
}

const OPEN_EVENT = 'social-express:open-new-appointment'
const TOAST_EVENT = 'social-express:agenda-toast'

export function requestNewAppointment(defaults: NewAppointmentDefaults = {}) {
  window.dispatchEvent(
    new CustomEvent<AppointmentEditorRequest>(OPEN_EVENT, {
      detail: { mode: 'create', defaults },
    }),
  )
}

export function requestEditAppointment(appointment: Appointment) {
  window.dispatchEvent(
    new CustomEvent<AppointmentEditorRequest>(OPEN_EVENT, {
      detail: { mode: 'edit', appointment },
    }),
  )
}

export function subscribeNewAppointmentRequest(
  onRequest: (request: AppointmentEditorRequest) => void,
) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AppointmentEditorRequest>).detail
    if (!detail) {
      onRequest({ mode: 'create', defaults: {} })
      return
    }
    // Back-compat if an old caller still sends NewAppointmentDefaults shape
    if (!('mode' in detail) && !('appointment' in detail)) {
      onRequest({
        mode: 'create',
        defaults: detail as unknown as NewAppointmentDefaults,
      })
      return
    }
    onRequest(detail)
  }
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}

export function notifyAgendaToast(message: string) {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }))
}

export function subscribeAgendaToast(onToast: (message: string) => void) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail
    if (typeof detail === 'string' && detail.trim()) onToast(detail)
  }
  window.addEventListener(TOAST_EVENT, handler)
  return () => window.removeEventListener(TOAST_EVENT, handler)
}
