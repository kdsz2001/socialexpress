/** Helpers for the Aniversariantes tab (Clarial-style). */

export type ParsedBirthDate = {
  day: number
  month: number
  year: number
}

const MONTHS_PT = [
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

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function occurrenceOnYear(birth: ParsedBirthDate, year: number) {
  const lastDay = new Date(year, birth.month, 0).getDate()
  const day = Math.min(birth.day, lastDay)
  return startOfDay(new Date(year, birth.month - 1, day))
}

/** Parse stored birth date `DD/MM/YYYY`. */
export function parseBirthDate(value: string): ParsedBirthDate | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null
  const probe = new Date(year, month - 1, day)
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null
  }
  return { day, month, year }
}

/** Long date like "11 de fevereiro de 2001". */
export function formatBirthDateLong(birth: ParsedBirthDate) {
  return `${birth.day} de ${MONTHS_PT[birth.month - 1]} de ${birth.year}`
}

/**
 * True when the client's month/day birthday falls on any day
 * inside [start, end] (inclusive).
 */
export function birthdayInRange(
  birth: ParsedBirthDate,
  start: Date,
  end: Date,
): boolean {
  const from = startOfDay(start)
  const to = startOfDay(end)
  if (to < from) return false

  for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
    const occurrence = occurrenceOnYear(birth, year)
    if (occurrence >= from && occurrence <= to) return true
  }
  return false
}

/** Year of the birthday occurrence inside the selected range (first match). */
export function birthdayOccurrenceYear(
  birth: ParsedBirthDate,
  start: Date,
  end: Date,
): number {
  const from = startOfDay(start)
  const to = startOfDay(end)
  for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
    const occurrence = occurrenceOnYear(birth, year)
    if (occurrence >= from && occurrence <= to) return year
  }
  return from.getFullYear()
}

/**
 * Year of the next birthday on/after `from`.
 * Ex.: nascido em 11/02/2001, em 18/08/2026 → 2027 (completará 26).
 */
export function nextBirthdayYear(
  birth: ParsedBirthDate,
  from: Date = new Date(),
) {
  const cursor = startOfDay(from)
  let year = cursor.getFullYear()
  if (occurrenceOnYear(birth, year) < cursor) year += 1
  return year
}

/** Age the client will turn on that birthday ("Completará X anos"). */
export function ageTurningOnBirthday(
  birth: ParsedBirthDate,
  occurrenceYear: number,
) {
  return occurrenceYear - birth.year
}
