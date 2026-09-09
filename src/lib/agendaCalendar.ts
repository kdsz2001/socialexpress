const WEEKDAY_SHORT = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'] as const
const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const
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
const MONTH_SHORT = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
] as const

export type AgendaView = 'mes' | 'semana' | 'dia' | 'lista'

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

export function startOfWeek(date: Date) {
  const next = startOfDay(date)
  next.setDate(next.getDate() - next.getDay())
  return next
}

export function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6)
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

/** Grade de 42 dias (6 semanas) começando no domingo da semana do dia 1. */
export function getMonthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

export function getWeekDays(anchor: Date) {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function formatMonthTitle(date: Date) {
  return `${MONTH_LONG[date.getMonth()].toUpperCase()} DE ${date.getFullYear()}`
}

export function formatDayTitle(date: Date) {
  return `${date.getDate()} DE ${MONTH_LONG[date.getMonth()].toUpperCase()} DE ${date.getFullYear()}`
}

export function formatWeekTitle(anchor: Date) {
  const start = startOfWeek(anchor)
  const end = endOfWeek(anchor)
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} DE ${MONTH_SHORT[start.getMonth()].toUpperCase()} DE ${start.getFullYear()}`
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} DE ${MONTH_SHORT[start.getMonth()].toUpperCase()} – ${end.getDate()} DE ${MONTH_SHORT[end.getMonth()].toUpperCase()} DE ${start.getFullYear()}`
  }
  return `${start.getDate()} DE ${MONTH_SHORT[start.getMonth()].toUpperCase()} DE ${start.getFullYear()} – ${end.getDate()} DE ${MONTH_SHORT[end.getMonth()].toUpperCase()} DE ${end.getFullYear()}`
}

export function weekdayShort(date: Date) {
  return WEEKDAY_SHORT[date.getDay()]
}

export function weekdayLong(date: Date) {
  return WEEKDAY_LONG[date.getDay()]
}

export function formatWeekdayDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${weekdayShort(date)} ${dd}/${mm}`
}

export function hoursOfDay(startHour = 0, endHour = 23) {
  return Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
}

/** Minutos desde meia-noite para o ponteiro “agora”. */
export function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}
