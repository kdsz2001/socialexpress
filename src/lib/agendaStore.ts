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
  completed: boolean
  completedAt?: number
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

function normalizeAppointment(raw: Partial<Appointment> & Pick<Appointment, 'id' | 'date' | 'title'>): Appointment {
  return {
    id: raw.id,
    date: raw.date,
    startTime: raw.startTime ?? '',
    endTime: raw.endTime ?? '',
    title: raw.title,
    details: raw.details ?? '',
    color: raw.color ?? 'blue',
    responsibleIds: Array.isArray(raw.responsibleIds) ? raw.responsibleIds : [],
    orderLabel: raw.orderLabel ?? '',
    createdAt: raw.createdAt ?? Date.now(),
    completed: Boolean(raw.completed),
    completedAt: raw.completedAt,
  }
}

function readAll(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Partial<Appointment> & Pick<Appointment, 'id' | 'date' | 'title'>>
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeAppointment)
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
  input: Omit<Appointment, 'id' | 'createdAt' | 'completed' | 'completedAt'> & {
    completed?: boolean
    completedAt?: number
  },
): Appointment {
  const next: Appointment = {
    ...input,
    id: `apt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    completed: Boolean(input.completed),
    completedAt: input.completedAt,
  }
  writeAll([...readAll(), next])
  return next
}

export function updateAppointment(
  id: string,
  patch: Partial<Omit<Appointment, 'id' | 'createdAt'>>,
): Appointment | null {
  const items = readAll()
  const index = items.findIndex((item) => item.id === id)
  if (index < 0) return null
  const next = { ...items[index], ...patch }
  items[index] = next
  writeAll(items)
  return next
}

export function completeAppointment(id: string) {
  return updateAppointment(id, {
    completed: true,
    completedAt: Date.now(),
  })
}

export function reopenAppointment(id: string) {
  return updateAppointment(id, {
    completed: false,
    completedAt: undefined,
  })
}

export function deleteAppointment(id: string) {
  writeAll(readAll().filter((item) => item.id !== id))
}

export function getAppointmentById(id: string) {
  return readAll().find((item) => item.id === id) ?? null
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
