import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Search,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  DATE_PRESETS,
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { useCashMovements } from '../hooks/useCashMovements'
import {
  addCashMovement,
  deleteCashMovement,
  updateCashMovement,
  type CashMovement,
  type CashMovementType,
  type CashOperation,
  type PaymentMethod,
} from '../lib/financialStore'
import { subscribeCashMovementRequest } from '../lib/financialUi'
import './Financeiro.css'

type FinanceTab = 'caixa' | 'pagar' | 'receber' | 'dre'
type PickerMode = 'menu' | 'calendar'

const PAYMENT_METHODS: PaymentMethod[] = [
  'Dinheiro',
  'PIX',
  'Cartão de crédito',
  'Cartão de débito',
  'Transferência',
  'Boleto',
]

const OPERATIONS: CashOperation[] = ['Aluguel', 'Venda', 'Outro']

const TYPE_FILTERS: { id: 'todos' | CashMovementType; label: string }[] = [
  { id: 'todos', label: 'Tipo de lançamento' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'saida', label: 'Saída' },
]

const PAYMENT_FILTERS: { id: 'todos' | PaymentMethod; label: string }[] = [
  { id: 'todos', label: 'Método de Pgto.' },
  ...PAYMENT_METHODS.map((method) => ({ id: method, label: method })),
]

const OPERATION_FILTERS: { id: 'todos' | CashOperation; label: string }[] = [
  { id: 'todos', label: 'Operação' },
  ...OPERATIONS.map((operation) => ({ id: operation, label: operation })),
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseIsoDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseMoneyInput(raw: string) {
  const cleaned = raw
    .replace(/[^\d.,-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : NaN
}

function tabFromParam(value: string | null): FinanceTab {
  if (value === 'pagar') return 'pagar'
  if (value === 'receber') return 'receber'
  if (value === 'dre') return 'dre'
  return 'caixa'
}

function defaultRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return { start: today, end: new Date(today) }
}

export function Financeiro() {
  const movements = useCashMovements()
  const [searchParams] = useSearchParams()
  const tab = tabFromParam(searchParams.get('tab'))

  const initial = defaultRange()
  const [query, setQuery] = useState('')
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)
  const [datePreset, setDatePreset] = useState<DatePreset>('hoje')
  const [dateOpen, setDateOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>('menu')
  const dateWrapRef = useRef<HTMLDivElement>(null)
  const dateMenuId = useId()

  const [typeFilter, setTypeFilter] = useState<'todos' | CashMovementType>('todos')
  const [paymentFilter, setPaymentFilter] = useState<'todos' | PaymentMethod>('todos')
  const [operationFilter, setOperationFilter] = useState<'todos' | CashOperation>('todos')
  const [attendantFilter, setAttendantFilter] = useState('todos')

  const [overviewOpen, setOverviewOpen] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CashMovement | null>(null)
  const [movementType, setMovementType] = useState<CashMovementType>('entrada')
  const [date, setDate] = useState(toInputDate(new Date()))
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Dinheiro')
  const [valueText, setValueText] = useState('')
  const [operation, setOperation] = useState<CashOperation>('Aluguel')
  const [attendant, setAttendant] = useState('')
  const [touched, setTouched] = useState(false)

  const attendants = useMemo(() => {
    const names = new Set<string>()
    movements.forEach((item) => {
      if (item.attendant.trim()) names.add(item.attendant.trim())
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [movements])

  const dateLabel = `${formatBr(rangeStart)} até ${formatBr(rangeEnd)}`

  useEffect(() => {
    if (!dateOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!dateWrapRef.current?.contains(event.target as Node)) {
        setDateOpen(false)
        setPickerMode('menu')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDateOpen(false)
        setPickerMode('menu')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dateOpen])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    const start = rangeStart.getTime()
    const end = rangeEnd.getTime()
    return movements.filter((item) => {
      if (item.canceled) return false
      const day = parseIsoDate(item.date)
      if (!day) return false
      const time = day.getTime()
      if (time < start || time > end) return false
      if (typeFilter !== 'todos' && item.type !== typeFilter) return false
      if (paymentFilter !== 'todos' && item.paymentMethod !== paymentFilter) return false
      if (operationFilter !== 'todos' && item.operation !== operationFilter) return false
      if (attendantFilter !== 'todos' && item.attendant !== attendantFilter) return false
      if (!q) return true
      return (
        item.description.toLocaleLowerCase('pt-BR').includes(q) ||
        item.paymentMethod.toLocaleLowerCase('pt-BR').includes(q) ||
        item.attendant.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
  }, [
    movements,
    query,
    rangeStart,
    rangeEnd,
    typeFilter,
    paymentFilter,
    operationFilter,
    attendantFilter,
  ])

  const totals = useMemo(() => {
    let credit = 0
    let canceled = 0
    let balance = 0
    movements.forEach((item) => {
      if (item.canceled) {
        canceled += item.value
        return
      }
      if (item.paymentMethod === 'Cartão de crédito') credit += item.value
      if (item.type === 'entrada') balance += item.value
      else balance -= item.value
    })
    return { credit, canceled, balance }
  }, [movements])

  const onMenuSelect = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset === 'escolher') {
      setPickerMode('calendar')
      return
    }
    const range = rangeForPreset(preset)
    setRangeStart(range.start)
    setRangeEnd(range.end)
    setDateOpen(false)
    setPickerMode('menu')
  }

  useEffect(() => {
    return subscribeCashMovementRequest((type) => {
      setEditing(null)
      setMovementType(type)
      setDate(toInputDate(new Date()))
      setDescription('')
      setPaymentMethod('Dinheiro')
      setValueText('')
      setOperation('Aluguel')
      setAttendant('')
      setTouched(false)
      setModalOpen(true)
    })
  }, [])

  const openEdit = (item: CashMovement) => {
    setEditing(item)
    setMovementType(item.type)
    setDate(item.date)
    setDescription(item.description)
    setPaymentMethod(item.paymentMethod)
    setValueText(
      item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    )
    setOperation(item.operation)
    setAttendant(item.attendant)
    setTouched(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const parsedValue = parseMoneyInput(valueText)
  const missingDescription = !description.trim()
  const missingDate = !date
  const missingValue = !Number.isFinite(parsedValue) || parsedValue <= 0

  const saveMovement = () => {
    setTouched(true)
    if (missingDescription || missingDate || missingValue) return
    const payload = {
      date,
      description,
      paymentMethod,
      value: parsedValue,
      type: movementType,
      operation,
      attendant,
    }
    if (editing) updateCashMovement(editing.id, payload)
    else addCashMovement(payload)
    closeModal()
  }

  if (tab !== 'caixa') {
    const titles: Record<Exclude<FinanceTab, 'caixa'>, string> = {
      pagar: 'Contas a pagar',
      receber: 'Contas a receber',
      dre: 'DRE',
    }
    return (
      <div className="financeiro">
        <section className="financeiro__card financeiro__card--placeholder">
          <h2>{titles[tab]}</h2>
          <p>Nenhum resultado encontrado</p>
        </section>
      </div>
    )
  }

  return (
    <div className={`financeiro${overviewOpen ? ' has-overview' : ''}`}>
      <section className="financeiro__card">
        <div className="financeiro__toolbar">
          <label className="financeiro__search">
            <Search size={16} strokeWidth={2} className="financeiro__search-icon" />
            <input
              type="search"
              className="financeiro__search-input"
              placeholder="Busca rápida"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className="financeiro__date" ref={dateWrapRef}>
            <button
              type="button"
              className={`financeiro__date-field${dateOpen ? ' is-open' : ''}`}
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={() => setDateOpen((open) => !open)}
            >
              {dateLabel}
            </button>
            <button
              type="button"
              className={`financeiro__date-cal${dateOpen ? ' is-open' : ''}`}
              aria-label="Abrir calendário"
              aria-expanded={dateOpen}
              aria-controls={dateMenuId}
              onClick={() => setDateOpen((open) => !open)}
            >
              <CalendarDays size={16} strokeWidth={2} />
            </button>

            {dateOpen && pickerMode === 'menu' ? (
              <div className="financeiro__date-menu" id={dateMenuId} role="listbox" aria-label="Período">
                {DATE_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={datePreset === item.id}
                    className={`financeiro__date-option${datePreset === item.id ? ' is-active' : ''}`}
                    onClick={() => onMenuSelect(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            {dateOpen && pickerMode === 'calendar' ? (
              <div className="financeiro__date-popover" id={dateMenuId}>
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
        </div>

        <div className="financeiro__filters">
          <label className="financeiro__select-wrap">
            <select
              className="financeiro__select"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as 'todos' | CashMovementType)
              }
              aria-label="Tipo de lançamento"
            >
              {TYPE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="financeiro__select-icon" />
          </label>

          <label className="financeiro__select-wrap">
            <select
              className="financeiro__select"
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(event.target.value as 'todos' | PaymentMethod)
              }
              aria-label="Método de pagamento"
            >
              {PAYMENT_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="financeiro__select-icon" />
          </label>

          <label className="financeiro__select-wrap">
            <select
              className="financeiro__select"
              value={operationFilter}
              onChange={(event) =>
                setOperationFilter(event.target.value as 'todos' | CashOperation)
              }
              aria-label="Operação"
            >
              {OPERATION_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="financeiro__select-icon" />
          </label>

          <label className="financeiro__select-wrap">
            <select
              className="financeiro__select"
              value={attendantFilter}
              onChange={(event) => setAttendantFilter(event.target.value)}
              aria-label="Atendente"
            >
              <option value="todos">Atendente</option>
              {attendants.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="financeiro__select-icon" />
          </label>
        </div>

        <div className="financeiro__table-wrap">
          <table className="financeiro__table">
            <thead>
              <tr>
                <th className="financeiro__col-date">Data</th>
                <th className="financeiro__col-desc">Descrição</th>
                <th className="financeiro__col-pay">Forma de pagamento</th>
                <th className="financeiro__col-value">Valor</th>
                <th className="financeiro__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="financeiro__empty" colSpan={5}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{formatBr(parseIsoDate(item.date) ?? new Date())}</td>
                    <td>
                      <div className="financeiro__desc">
                        <span className="financeiro__desc-text">{item.description}</span>
                        <span className="financeiro__desc-meta">
                          {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                          {item.operation ? ` • ${item.operation}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>{item.paymentMethod}</td>
                    <td
                      className={
                        item.type === 'entrada'
                          ? 'financeiro__value is-in'
                          : 'financeiro__value is-out'
                      }
                    >
                      {formatMoney(item.value)}
                    </td>
                    <td className="financeiro__actions-cell">
                      <button
                        type="button"
                        className="financeiro__icon-btn"
                        aria-label="Editar lançamento"
                        onClick={() => openEdit(item)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="financeiro__icon-btn is-danger"
                        aria-label="Excluir lançamento"
                        onClick={() => deleteCashMovement(item.id)}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className={`financeiro-overview${overviewOpen ? ' is-open' : ''}`}>
        {overviewOpen ? (
          <div className="financeiro-overview__panel">
            <button
              type="button"
              className="financeiro-overview__toggle"
              aria-expanded="true"
              aria-label="Recolher visão geral"
              onClick={() => setOverviewOpen(false)}
            >
              <ArrowUpDown size={18} strokeWidth={2.25} />
            </button>
            <div className="financeiro-overview__metrics">
              <div className="financeiro-overview__metric">
                <span className="financeiro-overview__label">Pagamentos com crédito</span>
                <span className="financeiro-overview__value">
                  {totals.credit > 0 ? formatMoney(totals.credit) : '—'}
                </span>
              </div>
              <div className="financeiro-overview__metric">
                <span className="financeiro-overview__label">Cancelamentos</span>
                <span className="financeiro-overview__value">
                  {totals.canceled > 0 ? formatMoney(totals.canceled) : '—'}
                </span>
              </div>
              <div className="financeiro-overview__metric">
                <span className="financeiro-overview__label">Total em caixa</span>
                <span className="financeiro-overview__value is-total">
                  {formatMoney(totals.balance)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="financeiro-overview__trigger"
            aria-expanded="false"
            onClick={() => setOverviewOpen(true)}
          >
            <ChevronUp size={16} strokeWidth={2.5} />
            Visão geral
          </button>
        )}
      </div>

      {modalOpen ? (
        <div className="financeiro-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="financeiro-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="financeiro-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="financeiro-modal__header">
              <h2 id="financeiro-modal-title">
                {editing
                  ? 'Editar lançamento'
                  : movementType === 'entrada'
                    ? 'Nova entrada'
                    : 'Nova saída'}
              </h2>
              <button
                type="button"
                className="financeiro-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="financeiro-modal__body">
              <label className="financeiro-modal__field">
                <span>
                  Data <span className="financeiro-modal__req">*</span>
                </span>
                <input
                  type="date"
                  className={`financeiro-modal__input${touched && missingDate ? ' is-invalid' : ''}`}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>

              <label className="financeiro-modal__field">
                <span>
                  Descrição <span className="financeiro-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`financeiro-modal__input${touched && missingDescription ? ' is-invalid' : ''}`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex.: Pagamento pedido 1"
                  autoFocus
                />
              </label>

              <label className="financeiro-modal__field">
                <span>Forma de pagamento</span>
                <select
                  className="financeiro-modal__input"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              <label className="financeiro-modal__field">
                <span>
                  Valor <span className="financeiro-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`financeiro-modal__input${touched && missingValue ? ' is-invalid' : ''}`}
                  value={valueText}
                  onChange={(event) => setValueText(event.target.value)}
                  placeholder="Ex.: 150,00"
                />
              </label>

              <label className="financeiro-modal__field">
                <span>Operação</span>
                <select
                  className="financeiro-modal__input"
                  value={operation}
                  onChange={(event) => setOperation(event.target.value as CashOperation)}
                >
                  {OPERATIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="financeiro-modal__field">
                <span>Atendente</span>
                <input
                  type="text"
                  className="financeiro-modal__input"
                  value={attendant}
                  onChange={(event) => setAttendant(event.target.value)}
                  placeholder="Ex.: Kelton"
                />
              </label>
            </div>

            <footer className="financeiro-modal__footer">
              <button type="button" className="financeiro-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="financeiro-modal__save" onClick={saveMovement}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
