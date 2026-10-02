import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAction, IconActions } from '../components/ui/IconAction'
import { useOrders } from '../hooks/useOrders'
import {
  addOrder,
  updateOrder,
  type Order,
  type OrderOperation,
  type OrderStatus,
} from '../lib/ordersStore'
import './Orders.css'

type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: { id: 'todos' | OrderStatus; label: string }[] = [
  { id: 'todos', label: 'Qualquer status' },
  { id: 'Adiado', label: 'Adiado' },
  { id: 'Cancelado', label: 'Cancelado' },
  { id: 'Concluído', label: 'Concluído' },
  { id: 'Confirmado', label: 'Confirmado' },
  { id: 'Orçamento', label: 'Orçamento' },
  { id: 'Perdido', label: 'Perdido' },
]

const OPERATION_OPTIONS: { id: 'todos' | OrderOperation; label: string }[] = [
  { id: 'todos', label: 'Ambas operações' },
  { id: 'Aluguel', label: 'Aluguel' },
  { id: 'Venda', label: 'Venda' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatBrDate(value: string) {
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

function statusClass(status: OrderStatus) {
  if (status === 'Anulado' || status === 'Cancelado') return 'is-canceled'
  if (status === 'Confirmado') return 'is-confirmed'
  if (status === 'Concluído') return 'is-done'
  if (status === 'Adiado') return 'is-delayed'
  if (status === 'Perdido') return 'is-lost'
  return 'is-open'
}

function displayStatus(status: OrderStatus) {
  if (status === 'Anulado') return 'Cancelado'
  return status
}

function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '#'
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.5h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.6 11.4 11.4 0 0 0 4.4 3.9 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"
      />
    </svg>
  )
}

export function Orders() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orders = useOrders()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos')
  const [operationFilter, setOperationFilter] = useState<'todos' | OrderOperation>('todos')
  const [statusOpen, setStatusOpen] = useState(false)
  const [operationOpen, setOperationOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const operationRef = useRef<HTMLDivElement>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const statusLabel = STATUS_OPTIONS.find((item) => item.id === statusFilter)?.label ?? 'Qualquer status'
  const operationLabel =
    OPERATION_OPTIONS.find((item) => item.id === operationFilter)?.label ?? 'Ambas operações'

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Order | null>(null)
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [eventDate, setEventDate] = useState(toInputDate(new Date()))
  const [total, setTotal] = useState('')
  const [status, setStatus] = useState<OrderStatus>('Aberto')
  const [operation, setOperation] = useState<OrderOperation>('Aluguel')
  const [touched, setTouched] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return orders
      .filter((item) => {
        if (statusFilter === 'Orçamento') {
          if (item.kind !== 'Orçamento' && item.status !== 'Orçamento') return false
        } else if (statusFilter === 'Cancelado') {
          if (item.status !== 'Cancelado' && item.status !== 'Anulado') return false
        } else if (statusFilter !== 'todos' && item.status !== statusFilter) return false
        if (operationFilter !== 'todos' && item.operation !== operationFilter) return false
        if (!q) return true
        return (
          item.clientName.toLocaleLowerCase('pt-BR').includes(q) ||
          item.phone.toLocaleLowerCase('pt-BR').includes(q) ||
          String(item.number).includes(q) ||
          item.status.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .sort((a, b) => {
        const cmp = a.clientName.localeCompare(b.clientName, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [orders, query, statusFilter, operationFilter, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filtered.length)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, operationFilter, pageSize])

  useEffect(() => {
    if (!statusOpen && !operationOpen) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (statusOpen && !statusRef.current?.contains(target)) setStatusOpen(false)
      if (operationOpen && !operationRef.current?.contains(target)) setOperationOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStatusOpen(false)
        setOperationOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [statusOpen, operationOpen])

  const openCreate = () => {
    navigate('/pedidos/novo')
  }

  useEffect(() => {
    const orderId = searchParams.get('order')
    if (!orderId) return
    const item = orders.find((order) => order.id === orderId)
    if (item) navigate(`/pedidos/${item.id}`, { replace: true })
  }, [navigate, orders, searchParams])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const missingClient = !clientName.trim()
  const missingDate = !eventDate

  const saveOrder = () => {
    setTouched(true)
    if (missingClient || missingDate) return
    const payload = { clientName, phone, eventDate, total, status, operation }
    if (editing) {
      updateOrder(editing.id, payload)
    } else {
      addOrder(payload)
    }
    closeModal()
  }

  const pager = (
    <div className="orders__pager">
      <div className="orders__pager-left">
        <select
          className="orders__pager-size"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          aria-label="Itens por página"
        >
          {[5, 10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="orders__pager-info">
          {filtered.length === 0
            ? 'Mostrando 0 do total de 0'
            : `Mostrando ${pageStart} - ${pageEnd} do total de ${filtered.length}`}
        </span>
      </div>
      <div className="orders__pager-nav">
        <button
          type="button"
          className="orders__pager-btn"
          aria-label="Primeira página"
          disabled={currentPage <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="orders__pager-btn"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <button type="button" className="orders__pager-btn is-active" aria-current="page">
          {currentPage}
        </button>
        <button
          type="button"
          className="orders__pager-btn"
          aria-label="Próxima página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="orders__pager-btn"
          aria-label="Última página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="orders">
      <section className="orders__card">
        <div className="orders__toolbar">
          <label className="orders__search">
            <Search size={16} strokeWidth={2} className="orders__search-icon" />
            <input
              type="search"
              className="orders__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className={`orders__select-wrap${statusOpen ? ' is-open' : ''}`} ref={statusRef}>
            <button
              type="button"
              className="orders__select"
              aria-label="Filtro por status"
              aria-haspopup="listbox"
              aria-expanded={statusOpen}
              onClick={() => {
                setStatusOpen((open) => !open)
                setOperationOpen(false)
              }}
            >
              {statusLabel}
            </button>
            <ChevronDown size={16} strokeWidth={2} className="orders__select-icon" />
            {statusOpen ? (
              <ul className="orders__select-menu" role="listbox" aria-label="Filtro por status">
                {STATUS_OPTIONS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.id === statusFilter}
                      className={item.id === statusFilter ? 'is-selected' : undefined}
                      onClick={() => {
                        setStatusFilter(item.id)
                        setStatusOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div
            className={`orders__select-wrap orders__select-wrap--op${operationOpen ? ' is-open' : ''}`}
            ref={operationRef}
          >
            <button
              type="button"
              className="orders__select"
              aria-label="Filtro por operação"
              aria-haspopup="listbox"
              aria-expanded={operationOpen}
              onClick={() => {
                setOperationOpen((open) => !open)
                setStatusOpen(false)
              }}
            >
              {operationLabel}
            </button>
            <ChevronDown size={16} strokeWidth={2} className="orders__select-icon" />
            {operationOpen ? (
              <ul className="orders__select-menu" role="listbox" aria-label="Filtro por operação">
                {OPERATION_OPTIONS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.id === operationFilter}
                      className={item.id === operationFilter ? 'is-selected' : undefined}
                      onClick={() => {
                        setOperationFilter(item.id)
                        setOperationOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <button type="button" className="orders__add" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Novo pedido
          </button>
        </div>

        <div className="orders__body">
        {filtered.length > 0 ? pager : null}

        <div className="orders__table-wrap">
          <table className="orders__table">
            <thead>
              <tr>
                <th className="orders__col-client">
                  <button
                    type="button"
                    className="orders__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    Cliente
                    <ArrowUp
                      size={10}
                      strokeWidth={2.5}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="orders__col-event">Evento</th>
                <th className="orders__col-phone">Telefone</th>
                <th className="orders__col-total">
                  <span>Total</span>
                </th>
                <th className="orders__col-status">Status</th>
                <th className="orders__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="orders__empty" colSpan={6}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="orders__client">
                        <span className="orders__client-name">{item.clientName}</span>
                        <span className="orders__client-meta">
                          {item.kind === 'Orçamento' ? 'Orçamento' : 'Pedido'} {item.number}
                          {' • '}
                          <span className="orders__op">{item.operation}</span>
                        </span>
                      </div>
                    </td>
                    <td>{item.eventDate ? formatBrDate(item.eventDate) : ''}</td>
                    <td>
                      {item.phone ? (
                        <a className="orders__phone" href={whatsAppHref(item.phone)} target="_blank" rel="noreferrer">
                          {item.phone}
                          <WhatsAppIcon />
                        </a>
                      ) : null}
                    </td>
                    <td className="orders__total">
                      <span>{item.total}</span>
                    </td>
                    <td>
                      <span className={`orders__status ${statusClass(item.status)}`}>
                        {displayStatus(item.status)}
                      </span>
                    </td>
                    <td className="orders__actions-cell">
                      <IconActions>
                        <IconAction
                          kind="edit"
                          tip="Editar pedido"
                          aria-label={`Editar pedido ${item.number}`}
                          onClick={() => navigate(`/pedidos/${item.id}`)}
                        />
                      </IconActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 ? pager : null}
        </div>
      </section>

      {modalOpen ? (
        <div className="orders-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="orders-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="orders-modal__header">
              <h2 id="orders-modal-title">{editing ? 'Editar pedido' : 'Novo pedido'}</h2>
              <button
                type="button"
                className="orders-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="orders-modal__body">
              <label className="orders-modal__field">
                <span>
                  Cliente <span className="orders-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`orders-modal__input${touched && missingClient ? ' is-invalid' : ''}`}
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Ex.: Rodrigo Silva"
                  autoFocus
                />
              </label>

              <label className="orders-modal__field">
                <span>Telefone</span>
                <input
                  type="text"
                  className="orders-modal__input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ex.: (47) 99999-9999"
                />
              </label>

              <label className="orders-modal__field">
                <span>
                  Data do evento <span className="orders-modal__req">*</span>
                </span>
                <input
                  type="date"
                  className={`orders-modal__input${touched && missingDate ? ' is-invalid' : ''}`}
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </label>

              <label className="orders-modal__field">
                <span>Total</span>
                <input
                  type="text"
                  className="orders-modal__input"
                  value={total}
                  onChange={(event) => setTotal(event.target.value)}
                  placeholder="Ex.: R$ 1.200,00"
                />
              </label>

              <label className="orders-modal__field">
                <span>Operação</span>
                <select
                  className="orders-modal__input"
                  value={operation}
                  onChange={(event) => setOperation(event.target.value as OrderOperation)}
                >
                  <option value="Aluguel">Aluguel</option>
                  <option value="Venda">Venda</option>
                </select>
              </label>

              <label className="orders-modal__field">
                <span>Status</span>
                <select
                  className="orders-modal__input"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as OrderStatus)}
                >
                  {STATUS_OPTIONS.filter((item) => item.id !== 'todos').map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <footer className="orders-modal__footer">
              <button type="button" className="orders-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="orders-modal__save" onClick={saveOrder}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
