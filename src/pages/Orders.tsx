import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { useOrders } from '../hooks/useOrders'
import {
  addOrder,
  deleteOrder,
  updateOrder,
  type Order,
  type OrderOperation,
  type OrderStatus,
} from '../lib/ordersStore'
import './Orders.css'

type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: { id: 'todos' | OrderStatus; label: string }[] = [
  { id: 'todos', label: 'Qualquer status' },
  { id: 'Aberto', label: 'Aberto' },
  { id: 'Confirmado', label: 'Confirmado' },
  { id: 'Concluído', label: 'Concluído' },
  { id: 'Anulado', label: 'Anulado' },
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
  if (status === 'Anulado') return 'is-canceled'
  if (status === 'Confirmado') return 'is-confirmed'
  if (status === 'Concluído') return 'is-done'
  return 'is-open'
}

export function Orders() {
  const orders = useOrders()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos')
  const [operationFilter, setOperationFilter] = useState<'todos' | OrderOperation>('todos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

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

  const openCreate = () => {
    setEditing(null)
    setClientName('')
    setPhone('')
    setEventDate(toInputDate(new Date()))
    setTotal('')
    setStatus('Aberto')
    setOperation('Aluguel')
    setTouched(false)
    setModalOpen(true)
  }

  const openEdit = (item: Order) => {
    setEditing(item)
    setClientName(item.clientName)
    setPhone(item.phone)
    setEventDate(item.eventDate)
    setTotal(item.total)
    setStatus(item.status)
    setOperation(item.operation)
    setTouched(false)
    setModalOpen(true)
  }

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

          <label className="orders__select-wrap">
            <select
              className="orders__select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'todos' | OrderStatus)
              }
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
              onChange={(event) =>
                setOperationFilter(event.target.value as 'todos' | OrderOperation)
              }
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

          <button type="button" className="orders__add" onClick={openCreate}>
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
                  <button
                    type="button"
                    className="orders__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    Cliente
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
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
                    <td>{item.phone}</td>
                    <td>{item.total}</td>
                    <td>
                      <span className={`orders__status ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="orders__actions-cell">
                      <button
                        type="button"
                        className="orders__icon-btn"
                        aria-label={`Editar pedido ${item.number}`}
                        onClick={() => openEdit(item)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="orders__icon-btn is-danger"
                        aria-label={`Excluir pedido ${item.number}`}
                        onClick={() => deleteOrder(item.id)}
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

        {pager}
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
