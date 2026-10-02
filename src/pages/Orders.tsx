import { useEffect, useMemo, useState } from 'react'
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
  SquarePen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../hooks/useOrders'
import type { OrderOperation, OrderStatus } from '../lib/ordersStore'
import './Orders.css'

type SortDir = 'asc' | 'desc'
type StatusFilter = 'todos' | 'Confirmado' | 'Cancelado' | 'Orçamento' | 'Concluído'

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'todos', label: 'Qualquer status' },
  { id: 'Confirmado', label: 'Confirmado' },
  { id: 'Cancelado', label: 'Cancelado' },
  { id: 'Orçamento', label: 'Orçamento' },
  { id: 'Concluído', label: 'Concluído' },
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

function visibleStatus(status: OrderStatus) {
  if (status === 'Anulado' || status === 'Cancelado') return 'Cancelado'
  if (status === 'Aberto' || status === 'Confirmado') return 'Confirmado'
  return status
}

function statusClass(status: OrderStatus) {
  const label = visibleStatus(status)
  if (label === 'Cancelado') return 'is-canceled'
  if (label === 'Orçamento') return 'is-quote'
  if (label === 'Concluído') return 'is-done'
  return 'is-confirmed'
}

export function Orders() {
  const orders = useOrders()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [operationFilter, setOperationFilter] = useState<'todos' | OrderOperation>('todos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return orders
      .filter((item) => {
        const label = visibleStatus(item.status)
        if (statusFilter !== 'todos' && label !== statusFilter) return false
        if (operationFilter !== 'todos' && item.operation !== operationFilter) return false
        if (!q) return true
        return (
          item.clientName.toLocaleLowerCase('pt-BR').includes(q) ||
          item.phone.toLocaleLowerCase('pt-BR').includes(q) ||
          String(item.number).includes(q) ||
          label.toLocaleLowerCase('pt-BR').includes(q)
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

  const pager = (
    <div className="orders__pager">
      <div className="orders__pager-left">
        <select
          className="orders__pager-size"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          aria-label="Itens por página"
        >
          {[10, 25, 50, 100].map((size) => (
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
        <button type="button" className="orders__pager-btn" aria-label="Primeira página" disabled={currentPage <= 1} onClick={() => setPage(1)}>
          <ChevronsLeft size={16} strokeWidth={2} />
        </button>
        <button type="button" className="orders__pager-btn" aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <button type="button" className="orders__pager-btn is-active" aria-current="page">
          {currentPage}
        </button>
        <button type="button" className="orders__pager-btn" aria-label="Próxima página" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button type="button" className="orders__pager-btn" aria-label="Última página" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
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

          <label className="orders__select-wrap">
            <select
              className="orders__select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filtro por status"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="orders__select-icon" />
          </label>

          <label className="orders__select-wrap">
            <select
              className="orders__select"
              value={operationFilter}
              onChange={(event) => setOperationFilter(event.target.value as 'todos' | OrderOperation)}
              aria-label="Filtro por operação"
            >
              {OPERATION_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="orders__select-icon" />
          </label>

          <button type="button" className="orders__add" onClick={() => navigate('/pedidos/novo')}>
            <Plus size={16} strokeWidth={2.5} />
            Novo pedido
          </button>
        </div>

        {pager}

        <div className="orders__table-wrap">
          <table className="orders__table">
            <thead>
              <tr>
                <th className="orders__col-client">
                  <button type="button" className="orders__th-sort" onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}>
                    Cliente
                    <ArrowUp size={14} strokeWidth={2.25} className={sortDir === 'desc' ? 'is-desc' : undefined} />
                  </button>
                </th>
                <th className="orders__col-event">Evento</th>
                <th className="orders__col-phone">Telefone</th>
                <th className="orders__col-total">Total</th>
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
                          Pedido {item.number} • {item.operation}
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
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{item.total}</td>
                    <td>
                      <span className={`orders__status ${statusClass(item.status)}`}>{visibleStatus(item.status)}</span>
                    </td>
                    <td className="orders__actions-cell">
                      <button
                        type="button"
                        className="orders__icon-btn"
                        aria-label={`Editar pedido ${item.number}`}
                        onClick={() => navigate(`/pedidos/${item.id}`)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pager}
      </section>
    </div>
  )
}
