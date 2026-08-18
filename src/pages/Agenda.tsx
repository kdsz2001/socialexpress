import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
const HOURS = hoursOfDay(0, 23)
const HOUR_HEIGHT = 56

function preferredView(): AgendaView {
  const pref = getUserProfile().preferences.calendarView
  return pref === 'semana' ? 'semana' : 'mes'
}

function titleFor(view: AgendaView, cursor: Date) {
  if (view === 'mes') return formatMonthTitle(cursor)
  if (view === 'dia') return formatDayTitle(cursor)
  return formatWeekTitle(cursor)
}

export function Agenda() {
  const [view, setView] = useState<AgendaView>(() => preferredView())
  const [cursor, setCursor] = useState(() => startOfDay(new Date()))
  const [now, setNow] = useState(() => new Date())
  const timeScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribeUserProfile(() => {
      const next = preferredView()
      setView((current) => (current === 'mes' || current === 'semana' ? next : current))
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (view !== 'semana' && view !== 'dia') return
    const el = timeScrollRef.current
    if (!el) return
    const hour = Math.max(0, now.getHours() - 1)
    el.scrollTop = hour * HOUR_HEIGHT
  }, [view, cursor])

  const today = startOfDay(now)
  const monthDays = useMemo(() => getMonthGrid(cursor), [cursor])
  const weekDays = useMemo(() => getWeekDays(cursor), [cursor])

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

  const renderNowLine = (day: Date) => {
    if (!isSameDay(day, today)) return null
    const top = (nowMinutes(now) / 60) * HOUR_HEIGHT
    return <div className="agenda__now has-triangle" style={{ top }} aria-hidden="true" />
  }

  const renderTimeGrid = (days: Date[], singleDay: boolean) => (
    <div className={`agenda__timegrid${singleDay ? ' is-day' : ''}`} ref={timeScrollRef}>
      <div
        className="agenda__timegrid-inner"
        style={{
          gridTemplateColumns: singleDay
            ? '64px minmax(0, 1fr)'
            : `64px repeat(${days.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${HOURS.length}, ${HOUR_HEIGHT}px)`,
        }}
      >
        <div className="agenda__timegrid-corner">ao longo do dia</div>
        {days.map((day) => (
          <div
            key={`allday-${day.toISOString()}`}
            className={`agenda__allday${isSameDay(day, today) ? ' is-today' : ''}`}
          />
        ))}

        <div className="agenda__hours" style={{ gridRow: `2 / span ${HOURS.length}` }}>
          {HOURS.map((hour) => (
            <div key={hour} className="agenda__hour-label" style={{ height: HOUR_HEIGHT }}>
              {String(hour).padStart(2, '0')}
            </div>
          ))}
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            className={`agenda__day-col${isSameDay(day, today) ? ' is-today' : ''}`}
            style={{ gridColumn: dayIndex + 2, gridRow: `2 / span ${HOURS.length}` }}
          >
            {HOURS.map((hour) => (
              <div key={hour} className="agenda__slot" style={{ height: HOUR_HEIGHT }}>
                <span className="agenda__slot-half" />
              </div>
            ))}
            {renderNowLine(day)}
          </div>
        ))}
      </div>
    </div>
  )

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
              {monthDays.map((day) => {
                const inMonth = isSameMonth(day, cursor)
                const isToday = isSameDay(day, today)
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={`agenda__month-cell${inMonth ? '' : ' is-outside'}${
                      isToday ? ' is-today' : ''
                    }`}
                    onClick={() => {
                      setCursor(startOfDay(day))
                      setView('dia')
                    }}
                  >
                    <span className="agenda__month-date">{day.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {view === 'semana' ? (
          <div className="agenda__week">
            <div
              className="agenda__week-head"
              style={{ gridTemplateColumns: `64px repeat(7, minmax(0, 1fr))` }}
            >
              <div className="agenda__week-head-spacer" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`agenda__week-head-day${isSameDay(day, today) ? ' is-today' : ''}`}
                >
                  {formatWeekdayDate(day)}
                </div>
              ))}
            </div>
            {renderTimeGrid(weekDays, false)}
          </div>
        ) : null}

        {view === 'dia' ? (
          <div className="agenda__day">
            <div className="agenda__day-head">{weekdayLong(cursor)}</div>
            {renderTimeGrid([cursor], true)}
          </div>
        ) : null}

        {view === 'lista' ? (
          <div className="agenda__list">
            <p className="agenda__list-empty">No events to display</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
