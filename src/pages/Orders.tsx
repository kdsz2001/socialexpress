import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageCircle,
  Plus,
  Search,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAction, IconActions } from '../components/ui/IconAction'
import { useOrders } from '../hooks/useOrders'
import { deleteOrder, type OrderOperation, type OrderStatus } from '../lib/ordersStore'
import './Orders.css'

type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: { id: 'todos' | OrderStatus; label: string }[] = [
  { id: 'todos', label: 'Qualquer status' },
  { id: 'Aberto', label: 'Aberto' },
  { id: 'Confirmado', label: 'Confirmado' },
  { id: 'Concluído', label: 'Concluído' },
  { id: 'Cancelado', label: 'Cancelado' },
  { id: 'Anulado', label: 'Anulado' },
  { id: 'Orçamento', label: 'Orçamento' },
]

const OPERATION_OPTIONS: { id: 'todos' | OrderOperation; label: string }[] = [
  { id: 'todos', label: 'Ambas operações' },
  { id: 'Aluguel', label: 'Aluguel' },
  { id: 'Venda', label: 'Venda' },
]

function formatBrDate(value: string) {
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

function statusClass(status: OrderStatus) {
  if (status === 'Anulado' || status === 'Cancelado') return 'is-canceled'
  if (status === 'Confirmado') return 'is-confirmed'
  if (status === 'Concluído') return 'is-done'
  if (status === 'Orçamento') return 'is-quote'
  return 'is-open'
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

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return orders
      .filter((item) => {
        if (statusFilter !== 'todos' && item.status !== statusFilter) return false
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

  const openEdit = (id: string) => {
    navigate(`/pedidos/${id}`)
  }

  useEffect(() => {
    const orderId = searchParams.get('order')
    if (!orderId) return
    const item = orders.find((order) => order.id === orderId)
    if (!item) return
    navigate(`/pedidos/${item.id}`, { replace: true })
  }, [orders, searchParams, navigate])

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
                          {item.kind === 'Orçamento' ? 'Orçamento' : 'Pedido'} {item.number} • {item.operation}
                        </span>
                      </div>
                    </td>
                    <td>{item.eventDate ? formatBrDate(item.eventDate) : ''}</td>
                    <td>
                      {item.phone ? (
                        <span className="orders__phone">
                          <MessageCircle size={13} strokeWidth={2.25} />
                          {item.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="orders__total">
                      <span>{item.total}</span>
                    </td>
                    <td>
                      <span className={`orders__status ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="orders__actions-cell">
                      <IconActions>
                        <IconAction
                          kind="edit"
                          tip="Editar pedido"
                          aria-label={`Editar pedido ${item.number}`}
                          onClick={() => openEdit(item.id)}
                        />
                        <IconAction
                          kind="delete"
                          tip="Excluir pedido"
                          aria-label={`Excluir pedido ${item.number}`}
                          onClick={() => deleteOrder(item.id)}
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
    </div>
  )
}
