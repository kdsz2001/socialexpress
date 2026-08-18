export type NewAppointmentDefaults = {
  date?: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
}

const OPEN_EVENT = 'social-express:open-new-appointment'
const TOAST_EVENT = 'social-express:agenda-toast'

export function requestNewAppointment(defaults: NewAppointmentDefaults = {}) {
  window.dispatchEvent(
    new CustomEvent<NewAppointmentDefaults>(OPEN_EVENT, { detail: defaults }),
  )
}

export function subscribeNewAppointmentRequest(
  onRequest: (defaults: NewAppointmentDefaults) => void,
) {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<NewAppointmentDefaults>).detail ?? {}
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
