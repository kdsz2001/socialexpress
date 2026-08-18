import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import {
  type AgendaView,
  addDays,
  addMonths,
  formatDayTitle,
  formatMonthTitle,
  formatWeekTitle,
  formatWeekdayDate,
  getMonthGrid,
  getWeekDays,
  hoursOfDay,
  isSameDay,
  isSameMonth,
  nowMinutes,
  startOfDay,
  weekdayLong,
  weekdayShort,
} from '../lib/agendaCalendar'
import {
  type Appointment,
  appointmentColorHex,
  getAppointments,
  parseTimeToMinutes,
  subscribeAppointments,
  toDateKey,
} from '../lib/agendaStore'
import { requestNewAppointment } from '../lib/agendaUi'
import {
  getUserProfile,
  subscribeUserProfile,
} from '../lib/userProfileStore'
import './Agenda.css'

const VIEWS: Array<{ id: AgendaView; label: string }> = [
  { id: 'mes', label: 'mês' },
  { id: 'semana', label: 'semana' },
  { id: 'dia', label: 'dia' },
  { id: 'lista', label: 'lista' },
]

const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
const SLOT_START_HOUR = 7
const SLOT_END_HOUR = 20
const HOURS = hoursOfDay(SLOT_START_HOUR, SLOT_END_HOUR)
const HOUR_HEIGHT = 68
const ALL_DAY_HEIGHT = 54
const HEAD_HEIGHT = 40
const TIME_GUTTER = 72
const GRID_START_MIN = SLOT_START_HOUR * 60
const GRID_END_MIN = (SLOT_END_HOUR + 1) * 60

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

type CreateTarget = {
  date: Date
  hour?: number
}

function preferredView(): AgendaView {
  const pref = getUserProfile().preferences.calendarView
  return pref === 'semana' ? 'semana' : 'mes'
}

function titleFor(view: AgendaView, cursor: Date) {
  if (view === 'mes') return formatMonthTitle(cursor)
  if (view === 'dia') return formatDayTitle(cursor)
  return formatWeekTitle(cursor)
}

function minutesIntoGrid(date: Date) {
  const total = nowMinutes(date)
  if (total < GRID_START_MIN || total >= GRID_END_MIN) return null
  return total - GRID_START_MIN
}

function appointmentLayout(apt: Appointment) {
  const start = parseTimeToMinutes(apt.startTime)
  const end = parseTimeToMinutes(apt.endTime)
  if (start == null) return null
  const rawEnd = end == null || end <= start ? start + 60 : end
  const clampedStart = Math.max(start, GRID_START_MIN)
  const clampedEnd = Math.min(rawEnd, GRID_END_MIN)
  if (clampedEnd <= clampedStart) return null
  return {
    top: ((clampedStart - GRID_START_MIN) / 60) * HOUR_HEIGHT,
    height: Math.max(22, ((clampedEnd - clampedStart) / 60) * HOUR_HEIGHT - 2),
  }
}

function formatListDate(date: Date) {
  return `${date.getDate()} de ${MONTH_LONG[date.getMonth()]} de ${date.getFullYear()}`
}

function formatCreateDayLabel(date: Date) {
  return `${date.getDate()} de ${MONTH_LONG[date.getMonth()]}`
}

function padTime(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function timeLabel(apt: Appointment) {
  if (apt.startTime && apt.endTime) return `${apt.startTime} - ${apt.endTime}`
  if (apt.startTime) return apt.startTime
  return 'Dia todo'
}

function isSameCreateTarget(a: CreateTarget | null, day: Date, hour?: number) {
  if (!a) return false
  if (!isSameDay(a.date, day)) return false
  if (hour == null) return a.hour == null
  return a.hour === hour
}

/** Mês: só hoje e dias futuros. */
function canCreateOnMonthDay(day: Date, today: Date) {
  return startOfDay(day).getTime() >= today.getTime()
}

/**
 * Semana/dia: só no futuro (abaixo da linha vermelha).
 * - dias passados: bloqueado
 * - hoje: a partir da hora atual (inclusive)
 * - dias futuros: liberado
 */
function canCreateOnTimeSlot(day: Date, hour: number, now: Date) {
  const dayStart = startOfDay(day).getTime()
  const todayStart = startOfDay(now).getTime()
  if (dayStart < todayStart) return false
  if (dayStart > todayStart) return true
  return hour >= now.getHours()
}

export function Agenda() {
  const [view, setView] = useState<AgendaView>(() => preferredView())
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [now, setNow] = useState(() => new Date())
  const [appointments, setAppointments] = useState(() => getAppointments())
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null)
  const timeScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribeUserProfile(() => {
      const next = preferredView()
      setView((current) => (current === 'mes' || current === 'semana' ? next : current))
    })
  }, [])

  useEffect(() => {
    return subscribeAppointments(() => setAppointments(getAppointments()))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setCreateTarget(null)
  }, [view, cursor])

  useEffect(() => {
    if (!createTarget) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateTarget(null)
    }
    const onPointer = (event: MouseEvent) => {
      const node = event.target as HTMLElement | null
      if (!node) return
      if (
        node.closest('.agenda__create-tip') ||
        node.closest('.agenda__create-wrap') ||
        node.closest('.agenda__create-layer') ||
        node.closest('.agenda__month-cell--bookable') ||
        node.closest('.agenda__slot--bookable')
      ) {
        return
      }
      setCreateTarget(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [createTarget])

  useEffect(() => {
    if (view !== 'semana' && view !== 'dia') return
    const el = timeScrollRef.current
    if (!el) return
    const into = minutesIntoGrid(now)
    if (into == null) {
      el.scrollTop = 0
      return
    }
    el.scrollTop = Math.max(0, ALL_DAY_HEIGHT + (into / 60 - 1) * HOUR_HEIGHT)
  }, [view, cursor])

  const today = startOfDay(now)
  const monthDays = useMemo(() => getMonthGrid(cursor), [cursor])
  const weekDays = useMemo(() => getWeekDays(cursor), [cursor])

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const apt of appointments) {
      const list = map.get(apt.date) ?? []
      list.push(apt)
      map.set(apt.date, list)
    }
    return map
  }, [appointments])

  const listGroups = useMemo(
    () =>
      weekDays
        .map((day) => ({
          date: day,
          items: appointmentsByDate.get(toDateKey(day)) ?? [],
        }))
        .filter((group) => group.items.length > 0),
    [appointmentsByDate, weekDays],
  )

  const goPrev = () => {
    if (view === 'mes') setCursor((d) => addMonths(d, -1))
    else if (view === 'dia') setCursor((d) => addDays(d, -1))
    else setCursor((d) => addDays(d, -7))
  }

  const goNext = () => {
    if (view === 'mes') setCursor((d) => addMonths(d, 1))
    else if (view === 'dia') setCursor((d) => addDays(d, 1))
    else setCursor((d) => addDays(d, 7))
  }

  const goToday = () => setCursor(startOfDay(new Date()))

  const openCreateFromTarget = (target: CreateTarget) => {
    const defaults: { date: string; startTime?: string; endTime?: string } = {
      date: toDateKey(target.date),
    }
    if (target.hour != null) {
      defaults.startTime = padTime(target.hour)
      defaults.endTime = padTime(Math.min(target.hour + 1, 23))
    }
    setCreateTarget(null)
    requestNewAppointment(defaults)
  }

  const renderCreateTip = (day: Date, hour?: number) => {
    const hasTime = hour != null
    const startLabel = hasTime ? padTime(hour) : ''
    const endLabel = hasTime ? padTime(Math.min(hour + 1, 23)) : ''

    return (
      <span className={`agenda__create-wrap${hasTime ? ' has-time' : ''}`}>
        {hasTime ? (
          <span className="agenda__create-time" aria-hidden="true" title={`${startLabel} – ${endLabel}`}>
            <Clock size={15} strokeWidth={2.5} />
            <span>
              {startLabel}–{endLabel}
            </span>
          </span>
        ) : null}
        <button
          type="button"
          className="agenda__create-tip"
          onClick={(event) => {
            event.stopPropagation()
            openCreateFromTarget({ date: day, hour })
          }}
        >
          <span className="agenda__create-tip-line">Criar agendamento para</span>
          <span className="agenda__create-tip-line">
            o dia <strong>{formatCreateDayLabel(day)}</strong>
          </span>
        </button>
      </span>
    )
  }

  const renderEventCard = (apt: Appointment, compact: boolean) => {
    const layout = appointmentLayout(apt)
    if (!layout) return null
    const color = appointmentColorHex(apt.color)
    return (
      <div
        key={apt.id}
        className={`agenda__event${compact ? ' is-compact' : ''}`}
        style={{
          top: layout.top,
          height: layout.height,
          background: color,
        }}
        title={apt.title}
      >
        <span className="agenda__event-dot" />
        <div className="agenda__event-body">
          {!compact ? (
            <span className="agenda__event-time">
              {apt.startTime}
              {apt.endTime ? ` - ${apt.endTime}` : ''}
            </span>
          ) : null}
          <span className="agenda__event-title">{apt.title}</span>
        </div>
      </div>
    )
  }

  const renderTimeGrid = (days: Date[], singleDay: boolean) => {
    const into = minutesIntoGrid(now)
    const nowOffset = into == null ? null : Math.round((into / 60) * HOUR_HEIGHT)

    return (
      <div className={`agenda__timegrid${singleDay ? ' is-day' : ''}`} ref={timeScrollRef}>
        <div
          className="agenda__timegrid-inner"
          style={{
            gridTemplateColumns: singleDay
              ? `${TIME_GUTTER}px minmax(0, 1fr)`
              : `${TIME_GUTTER}px repeat(${days.length}, minmax(0, 1fr))`,
            gridTemplateRows: `${HEAD_HEIGHT}px ${ALL_DAY_HEIGHT}px repeat(${HOURS.length}, ${HOUR_HEIGHT}px)`,
          }}
        >
          <div className="agenda__col-head agenda__col-head--gutter" />
          {days.map((day) => (
            <div
              key={`head-${day.toISOString()}`}
              className={`agenda__col-head${isSameDay(day, today) ? ' is-today' : ''}`}
            >
              {singleDay ? weekdayLong(day) : formatWeekdayDate(day)}
            </div>
          ))}

          <div className="agenda__allday-label">
            <span>ao longo do dia</span>
          </div>
          {days.map((day) => (
            <div
              key={`allday-${day.toISOString()}`}
              className={`agenda__allday${isSameDay(day, today) ? ' is-today' : ''}`}
            />
          ))}

          <div className="agenda__hours" style={{ gridRow: `3 / span ${HOURS.length}` }}>
            {HOURS.map((hour) => (
              <div key={hour} className="agenda__hour-label" style={{ height: HOUR_HEIGHT }}>
                <span>{String(hour).padStart(2, '0')}</span>
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const dayApts = appointmentsByDate.get(toDateKey(day)) ?? []
            const selectedHour =
              createTarget &&
              isSameDay(createTarget.date, day) &&
              createTarget.hour != null &&
              canCreateOnTimeSlot(day, createTarget.hour, now)
                ? createTarget.hour
                : null

            return (
              <div
                key={day.toISOString()}
                className={`agenda__day-col${isSameDay(day, today) ? ' is-today' : ''}${
                  selectedHour != null ? ' has-create' : ''
                }`}
                style={{ gridColumn: dayIndex + 2, gridRow: `3 / span ${HOURS.length}` }}
              >
                {nowOffset != null && isSameDay(day, today) ? (
                  <div className="agenda__now" style={{ top: nowOffset }} aria-hidden="true">
                    <span className="agenda__now-arrow" />
                    <span className="agenda__now-line" />
                  </div>
                ) : null}
                {HOURS.map((hour, hourIndex) => {
                  const bookable = canCreateOnTimeSlot(day, hour, now)
                  const selected = bookable && isSameCreateTarget(createTarget, day, hour)
                  const slotClass = `agenda__slot${hourIndex === HOURS.length - 1 ? ' is-last' : ''}${
                    selected ? ' is-selected' : ''
                  }${bookable ? ' agenda__slot--bookable' : ' is-past'}`

                  if (!bookable) {
                    return (
                      <div
                        key={hour}
                        className={slotClass}
                        style={{ height: HOUR_HEIGHT }}
                        aria-hidden="true"
                      >
                        <span className="agenda__slot-half" />
                      </div>
                    )
                  }

                  return (
                    <button
                      key={hour}
                      type="button"
                      className={slotClass}
                      style={{ height: HOUR_HEIGHT }}
                      onClick={(event) => {
                        event.stopPropagation()
                        setCreateTarget({ date: startOfDay(day), hour })
                      }}
                    >
                      <span className="agenda__slot-half" />
                    </button>
                  )
                })}
                {dayApts.map((apt) => renderEventCard(apt, !singleDay))}
                {selectedHour != null ? (
                  <div
                    className={`agenda__create-layer${
                      days.length > 1 && dayIndex === 0 ? ' is-edge-start' : ''
                    }${days.length > 1 && dayIndex === days.length - 1 ? ' is-edge-end' : ''}`}
                    style={{
                      top: (selectedHour - SLOT_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    }}
                  >
                    {renderCreateTip(day, selectedHour)}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="agenda">
      <section className="agenda__card">
        <header className="agenda__toolbar">
          <div className="agenda__nav">
            <div className="agenda__nav-arrows">
              <button type="button" className="agenda__nav-btn" aria-label="Anterior" onClick={goPrev}>
                <ChevronLeft size={16} strokeWidth={2.25} />
              </button>
              <button type="button" className="agenda__nav-btn" aria-label="Próximo" onClick={goNext}>
                <ChevronRight size={16} strokeWidth={2.25} />
              </button>
            </div>
            <button type="button" className="agenda__today" onClick={goToday}>
              Hoje
            </button>
          </div>

          <h2 className="agenda__range">{titleFor(view, cursor)}</h2>

          <div className="agenda__views" role="tablist" aria-label="Visualização da agenda">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                className={`agenda__view-btn${view === item.id ? ' is-active' : ''}`}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        {view === 'mes' ? (
          <div className="agenda__month">
            <div className="agenda__month-head">
              {WEEKDAY_KEYS.map((_, i) => (
                <div key={WEEKDAY_KEYS[i]} className="agenda__month-weekday">
                  {weekdayShort(new Date(2026, 7, 2 + i))}
                </div>
              ))}
            </div>
            <div className="agenda__month-grid">
              {monthDays.map((day, index) => {
                const inMonth = isSameMonth(day, cursor)
                const isToday = isSameDay(day, today)
                const bookable = canCreateOnMonthDay(day, today)
                const selected = bookable && isSameCreateTarget(createTarget, day)
                const dayApts = appointmentsByDate.get(toDateKey(day)) ?? []
                const col = index % 7
                const cellClass = `agenda__month-cell${inMonth ? '' : ' is-outside'}${
                  isToday ? ' is-today' : ''
                }${selected ? ' is-selected' : ''}${
                  bookable ? ' agenda__month-cell--bookable' : ' is-past'
                }${col === 0 ? ' is-edge-start' : ''}${col === 6 ? ' is-edge-end' : ''}`

                const body = (
                  <>
                    <span className="agenda__month-date">{day.getDate()}</span>
                    <div className="agenda__month-events">
                      {dayApts.slice(0, 3).map((apt) => (
                        <span
                          key={apt.id}
                          className="agenda__month-chip"
                          style={{ background: appointmentColorHex(apt.color) }}
                        >
                          <span className="agenda__month-chip-dot" />
                          {apt.startTime ? `${apt.startTime.slice(0, 2)} ` : ''}
                          {apt.title}
                        </span>
                      ))}
                    </div>
                    {selected ? renderCreateTip(day) : null}
                  </>
                )

                if (!bookable) {
                  return (
                    <div key={day.toISOString()} className={cellClass} aria-hidden="true">
                      {body}
                    </div>
                  )
                }

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={cellClass}
                    onClick={(event) => {
                      event.stopPropagation()
                      setCreateTarget({ date: startOfDay(day) })
                    }}
                  >
                    {body}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {view === 'semana' ? <div className="agenda__week">{renderTimeGrid(weekDays, false)}</div> : null}

        {view === 'dia' ? <div className="agenda__day">{renderTimeGrid([cursor], true)}</div> : null}

        {view === 'lista' ? (
          <div className="agenda__list">
            {listGroups.length === 0 ? (
              <p className="agenda__list-empty">No events to display</p>
            ) : (
              listGroups.map((group) => (
                <div key={toDateKey(group.date)} className="agenda__list-group">
                  <div className="agenda__list-day">
                    <strong>{weekdayLong(group.date).toUpperCase()}</strong>
                    <span>{formatListDate(group.date)}</span>
                  </div>
                  <ul className="agenda__list-items">
                    {group.items.map((apt) => (
                      <li key={apt.id} className="agenda__list-item">
                        <span
                          className="agenda__list-time"
                          style={{ background: appointmentColorHex(apt.color) }}
                        >
                          {timeLabel(apt)}
                        </span>
                        <span
                          className="agenda__list-dot"
                          style={{ background: appointmentColorHex(apt.color) }}
                        />
                        <span className="agenda__list-title">{apt.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}
