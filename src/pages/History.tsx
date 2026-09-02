import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import {
  DATE_PRESETS,
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { useHistory } from '../hooks/useHistory'
import {
  HISTORY_MODULES,
  formatHistoryDateTime,
  type HistoryEntry,
  type HistoryModule,
} from '../lib/historyStore'
import { getUserDisplayName, getUserProfile } from '../lib/userProfileStore'
import './History.css'

type SortKey = 'module' | 'date'
type SortDir = 'asc' | 'desc'
type PickerMode = 'menu' | 'calendar'

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function defaultRange() {
  return rangeForPreset('mes')
}

function pageNumbers(current: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, Math.min(5, total)].filter((v, i, arr) => arr.indexOf(v) === i)
  if (current >= total - 2) {
    return [total - 3, total - 2, total - 1, total].filter((n) => n >= 1)
  }
  return [current - 1, current, current + 1]
}

export function History() {
  const entries = useHistory()
  const dateMenuId = useId()
  const userMenuId = useId()
  const moduleMenuId = useId()

  const initial = defaultRange()
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const [datePreset, setDatePreset] = useState<DatePreset>('mes')
  const [dateOpen, setDateOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('menu')
  const dateWrapRef = useRef<HTMLDivElement>(null)

  const [userFilter, setUserFilter] = useState('todos')
  const [moduleFilter, setModuleFilter] = useState<'todos' | HistoryModule>('todos')
  const [userOpen, setUserOpen] = useState(false)
  const [moduleOpen, setModuleOpen] = useState(false)
  const userWrapRef = useRef<HTMLDivElement>(null)
  const moduleWrapRef = useRef<HTMLDivElement>(null)

  const [sortKey, setSortKey] = useState<SortKey>('module')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const users = useMemo(() => {
    const names = new Set<string>()
    const self = getUserDisplayName(getUserProfile())
    if (self) names.add(self)
    names.add('Sistema')
    for (const entry of entries) {
      if (entry.userName.trim()) names.add(entry.userName.trim())
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [entries])

  const filtered = useMemo(() => {
    const from = startOfDay(rangeStart).getTime()
    const to = endOfDay(rangeEnd).getTime()
    const list = entries.filter((entry) => {
      if (entry.createdAt < from || entry.createdAt > to) return false
      if (userFilter !== 'todos' && entry.userName !== userFilter) return false
      if (moduleFilter !== 'todos' && entry.module !== moduleFilter) return false
      return true
    })

    list.sort((a, b) => {
      if (sortKey === 'module') {
        const byModule = a.module.localeCompare(b.module, 'pt-BR')
        if (byModule !== 0) return sortDir === 'asc' ? byModule : -byModule
        return b.createdAt - a.createdAt
      }
      const byDate = a.createdAt - b.createdAt
      return sortDir === 'asc' ? byDate : -byDate
    })

    return list
  }, [entries, rangeStart, rangeEnd, userFilter, moduleFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(filtered.length, currentPage * pageSize)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [rangeStart, rangeEnd, userFilter, moduleFilter, pageSize, sortKey, sortDir])

  useEffect(() => {
    if (!dateOpen && !userOpen && !moduleOpen) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (dateOpen && dateWrapRef.current && !dateWrapRef.current.contains(target)) {
        setDateOpen(false)
        setPickerMode('menu')
      }
      if (userOpen && userWrapRef.current && !userWrapRef.current.contains(target)) {
        setUserOpen(false)
      }
      if (moduleOpen && moduleWrapRef.current && !moduleWrapRef.current.contains(target)) {
        setModuleOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDateOpen(false)
        setPickerMode('menu')
        setUserOpen(false)
        setModuleOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [dateOpen, userOpen, moduleOpen])

  const dateLabel = `${formatBr(rangeStart)} até ${formatBr(rangeEnd)}`

  const openDate = () => {
    setUserOpen(false)
    setModuleOpen(false)
    setDateOpen((open) => !open)
    setPickerMode('menu')
  }

  const onMenuSelect = (preset: DatePreset) => {
    if (preset === 'escolher') {
      setPickerMode('calendar')
      setDatePreset('escolher')
      return
    }
    const range = rangeForPreset(preset)
    setRangeStart(range.start)
    setRangeEnd(range.end)
    setDatePreset(preset)
    setDateOpen(false)
    setPickerMode('menu')
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'module' ? 'asc' : 'desc')
  }

  const userLabel = userFilter === 'todos' ? 'Todos usuários' : userFilter
  const moduleLabel = moduleFilter === 'todos' ? 'Todos módulos' : moduleFilter

  return (
    <div className="history">
      <section className="history__card">
        <div className="history__toolbar">
          <div className="history__date" ref={dateWrapRef}>
            <button
              type="button"
              className={`history__date-field${dateOpen ? ' is-open' : ''}`}
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={openDate}
            >
              {dateLabel}
            </button>
            <button
              type="button"
              className={`history__date-cal${dateOpen ? ' is-open' : ''}`}
              aria-label="Abrir período"
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={openDate}
            >
              <CalendarDays size={16} strokeWidth={2} />
            </button>

            {dateOpen && pickerMode === 'menu' ? (
              <div className="history__date-menu" id={dateMenuId} role="listbox" aria-label="Período">
                {DATE_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={datePreset === item.id}
                    className={`history__date-option${datePreset === item.id ? ' is-active' : ''}`}
                    onClick={() => onMenuSelect(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {dateOpen && pickerMode === 'calendar' ? (
              <div className="history__date-popover" id={dateMenuId}>
                <DateRangePicker
                  start={rangeStart}
                  end={rangeEnd}
                  preset={datePreset}
                  onCancel={() => {
                    setDateOpen(false)
                    setPickerMode('menu')
                  }}
                  onApply={({ start, end, preset: nextPreset }) => {
                    setRangeStart(start)
                    setRangeEnd(end)
                    setDatePreset(nextPreset)
                    setDateOpen(false)
                    setPickerMode('menu')
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="history__filter" ref={userWrapRef}>
            <button
              type="button"
              className={`history__filter-btn${userOpen ? ' is-open' : ''}${userFilter !== 'todos' ? ' is-active' : ''}`}
              aria-expanded={userOpen}
              aria-controls={userMenuId}
              onClick={() => {
                setDateOpen(false)
                setModuleOpen(false)
                setUserOpen((open) => !open)
              }}
            >
              <span>{userLabel}</span>
              <ChevronDown size={14} strokeWidth={2.25} />
            </button>
            {userOpen ? (
              <div className="history__filter-menu" id={userMenuId} role="listbox">
                <button
                  type="button"
                  role="option"
                  aria-selected={userFilter === 'todos'}
                  className={`history__filter-option${userFilter === 'todos' ? ' is-active' : ''}`}
                  onClick={() => {
                    setUserFilter('todos')
                    setUserOpen(false)
                  }}
                >
                  Todos usuários
                </button>
                {users.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={userFilter === name}
                    className={`history__filter-option${userFilter === name ? ' is-active' : ''}`}
                    onClick={() => {
                      setUserFilter(name)
                      setUserOpen(false)
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="history__filter" ref={moduleWrapRef}>
            <button
              type="button"
              className={`history__filter-btn${moduleOpen ? ' is-open' : ''}${moduleFilter !== 'todos' ? ' is-active' : ''}`}
              aria-expanded={moduleOpen}
              aria-controls={moduleMenuId}
              onClick={() => {
                setDateOpen(false)
                setUserOpen(false)
                setModuleOpen((open) => !open)
              }}
            >
              <span>{moduleLabel}</span>
              <ChevronDown size={14} strokeWidth={2.25} />
            </button>
            {moduleOpen ? (
              <div className="history__filter-menu" id={moduleMenuId} role="listbox">
                <button
                  type="button"
                  role="option"
                  aria-selected={moduleFilter === 'todos'}
                  className={`history__filter-option${moduleFilter === 'todos' ? ' is-active' : ''}`}
                  onClick={() => {
                    setModuleFilter('todos')
                    setModuleOpen(false)
                  }}
                >
                  Todos módulos
                </button>
                {HISTORY_MODULES.map((module) => (
                  <button
                    key={module}
                    type="button"
                    role="option"
                    aria-selected={moduleFilter === module}
                    className={`history__filter-option${moduleFilter === module ? ' is-active' : ''}`}
                    onClick={() => {
                      setModuleFilter(module)
                      setModuleOpen(false)
                    }}
                  >
                    {module}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="history__table-wrap">
          <table className="history__table">
            <thead>
              <tr>
                <th className="history__col-module">
                  <button
                    type="button"
                    className={`history__th-sort${sortKey === 'module' ? ' is-sorted' : ''}`}
                    onClick={() => toggleSort('module')}
                  >
                    Módulo
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortKey === 'module' && sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="history__col-desc">Descrição</th>
                <th className="history__col-date">
                  <button
                    type="button"
                    className={`history__th-sort${sortKey === 'date' ? ' is-sorted' : ''}`}
                    onClick={() => toggleSort('date')}
                  >
                    Data
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortKey === 'date' && sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="history__col-user">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="history__empty" colSpan={4}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="history__pager">
          <div className="history__pager-nav">
            <button
              type="button"
              className="history__pager-btn"
              aria-label="Primeira página"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft size={16} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className="history__pager-btn"
              aria-label="Página anterior"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} strokeWidth={2.25} />
            </button>
            {pageNumbers(currentPage, totalPages).map((num) => (
              <button
                key={num}
                type="button"
                className={`history__pager-btn${num === currentPage ? ' is-active' : ''}`}
                aria-current={num === currentPage ? 'page' : undefined}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="history__pager-btn"
              aria-label="Próxima página"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className="history__pager-btn"
              aria-label="Última página"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight size={16} strokeWidth={2.25} />
            </button>
          </div>

          <div className="history__pager-right">
            <select
              className="history__pager-size"
              value={pageSize}
              aria-label="Itens por página"
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="history__pager-info">
              {filtered.length === 0
                ? 'Mostrando 0 - 0 do total de 0'
                : `Mostrando ${pageStart} - ${pageEnd} do total de ${filtered.length}`}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <tr>
      <td className="history__module">{entry.module}</td>
      <td className="history__desc">
        <p className="history__desc-text">
          {entry.segments.map((seg, index) =>
            seg.bold ? <strong key={`${entry.id}-s-${index}`}>{seg.text}</strong> : (
              <span key={`${entry.id}-s-${index}`}>{seg.text}</span>
            ),
          )}
        </p>
        {entry.diffs.length > 0 ? (
          <div className="history__diffs">
            {entry.diffs.map((diff, index) => (
              <div
                key={`${entry.id}-d-${index}`}
                className={`history__diff history__diff--${diff.op}`}
              >
                {diff.op === 'remove' ? '- ' : '+ '}
                {diff.text}
              </div>
            ))}
          </div>
        ) : null}
      </td>
      <td className="history__date-cell">{formatHistoryDateTime(entry.createdAt)}</td>
      <td className="history__user">{entry.userName}</td>
    </tr>
  )
}
