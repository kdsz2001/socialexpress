export type NewAppointmentDefaults = {
  date?: string // YYYY-MM-DD
  startTime?: string
  endTime?: string
}

const OPEN_EVENT = 'social-express:open-new-appointment'

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
