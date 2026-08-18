export type AppointmentColor = 'coral' | 'blue' | 'teal' | 'purple' | 'navy'

export type Appointment = {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  title: string
  details: string
  color: AppointmentColor
  responsibleIds: string[]
  orderLabel: string
  createdAt: number
}

export const APPOINTMENT_COLORS: Array<{
  id: AppointmentColor
  hex: string
  label: string
}> = [
  { id: 'coral', hex: '#F64E60', label: 'Coral' },
  { id: 'blue', hex: '#3699FF', label: 'Azul' },
  { id: 'teal', hex: '#1BC5BD', label: 'Verde' },
  { id: 'purple', hex: '#8950FC', label: 'Roxo' },
  { id: 'navy', hex: '#181C32', label: 'Marinho' },
]

export function appointmentColorHex(color: AppointmentColor) {
  return APPOINTMENT_COLORS.find((item) => item.id === color)?.hex ?? '#3699FF'
}

const STORAGE_KEY = 'social-express:appointments'
const CHANGE_EVENT = 'social-express:appointments-change'

function readAll(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Appointment[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: Appointment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function getAppointments(): Appointment[] {
  return readAll().slice().sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return a.startTime.localeCompare(b.startTime)
  })
}

export function getAppointmentsOnDate(date: string) {
  return getAppointments().filter((item) => item.date === date)
}

export function addAppointment(
  input: Omit<Appointment, 'id' | 'createdAt'>,
): Appointment {
  const next: Appointment = {
    ...input,
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  }
  writeAll([...readAll(), next])
  return next
}

export function subscribeAppointments(onChange: () => void) {
  const handler = () => onChange()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseTimeToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}
