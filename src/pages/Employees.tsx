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
  X,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useEmployees } from '../hooks/useEmployees'
import {
  addEmployee,
  setEmployeeActive,
  updateEmployee,
  type Employee,
  type EmployeeLevel,
} from '../lib/employeesStore'
import './Employees.css'

type SortDir = 'asc' | 'desc'
type StatusFilter = 'ativos' | 'inativos' | 'todos'
type EmployeesTab = 'lista' | 'permissoes'

const LEVELS: EmployeeLevel[] = ['Master', 'Administrador', 'Funcionário']

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'ativos', label: 'Ativos' },
  { id: 'inativos', label: 'Inativos' },
  { id: 'todos', label: 'Todos' },
]

function tabFromParam(value: string | null): EmployeesTab {
  return value === 'permissoes' ? 'permissoes' : 'lista'
}

export function Employees() {
  const employees = useEmployees()
  const [searchParams] = useSearchParams()
  const tab = tabFromParam(searchParams.get('tab'))

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [level, setLevel] = useState<EmployeeLevel>('Funcionário')
  const [active, setActive] = useState(true)
  const [touched, setTouched] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return employees
      .filter((item) => {
        if (statusFilter === 'ativos' && !item.active) return false
        if (statusFilter === 'inativos' && item.active) return false
        if (!q) return true
        return (
          item.name.toLocaleLowerCase('pt-BR').includes(q) ||
          item.username.toLocaleLowerCase('pt-BR').includes(q) ||
          item.phone.toLocaleLowerCase('pt-BR').includes(q) ||
          item.level.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [employees, query, statusFilter, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filtered.length)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, pageSize])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setUsername('')
    setLevel('Funcionário')
    setActive(true)
    setTouched(false)
    setModalOpen(true)
  }

  const openEdit = (item: Employee) => {
    setEditing(item)
    setName(item.name)
    setPhone(item.phone)
    setUsername(item.username)
    setLevel(item.level)
    setActive(item.active)
    setTouched(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const missingName = !name.trim()
  const missingUsername = !username.trim()

  const saveEmployee = () => {
    setTouched(true)
    if (missingName || missingUsername) return
    const payload = { name, phone, username, level, active }
    if (editing) {
      updateEmployee(editing.id, payload)
    } else {
      addEmployee(payload)
    }
    closeModal()
  }

  const pager = (
    <div className="employees__pager">
      <div className="employees__pager-left">
        <select
          className="employees__pager-size"
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
        <span className="employees__pager-info">
          {filtered.length === 0
            ? 'Mostrando 0 do total de 0'
            : `Mostrando ${pageStart} - ${pageEnd} do total de ${filtered.length}`}
        </span>
      </div>
      <div className="employees__pager-nav">
        <button
          type="button"
          className="employees__pager-btn"
          aria-label="Primeira página"
          disabled={currentPage <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="employees__pager-btn"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <button type="button" className="employees__pager-btn is-active" aria-current="page">
          {currentPage}
        </button>
        <button
          type="button"
          className="employees__pager-btn"
          aria-label="Próxima página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="employees__pager-btn"
          aria-label="Última página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )

  if (tab === 'permissoes') {
    return (
      <div className="employees">
        <section className="employees__card employees__card--placeholder">
          <h2>Gerenciar permissões</h2>
          <p>Nenhum resultado encontrado</p>
        </section>
      </div>
    )
  }

  return (
    <div className="employees">
      <section className="employees__card">
        <div className="employees__toolbar">
          <label className="employees__search">
            <Search size={16} strokeWidth={2} className="employees__search-icon" />
            <input
              type="search"
              className="employees__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="employees__select-wrap">
            <select
              className="employees__select"
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
            <ChevronDown size={16} strokeWidth={2} className="employees__select-icon" />
          </label>

          <button type="button" className="employees__add" onClick={openCreate}>
            <Plus size={16} strokeWidth={2.5} />
            Cadastrar funcionário
          </button>
        </div>

        {pager}

        <div className="employees__table-wrap">
          <table className="employees__table">
            <thead>
              <tr>
                <th className="employees__col-name">
                  <button
                    type="button"
                    className="employees__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    Nome
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="employees__col-user">Usuário</th>
                <th className="employees__col-level">Nível</th>
                <th className="employees__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="employees__empty" colSpan={4}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="employees__person">
                        <span className="employees__person-name">{item.name}</span>
                        {item.phone ? (
                          <span className="employees__person-phone">{item.phone}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.username}</td>
                    <td>{item.level}</td>
                    <td className="employees__actions-cell">
                      <button
                        type="button"
                        className={`employees__switch${item.active ? ' is-on' : ''}`}
                        role="switch"
                        aria-checked={item.active}
                        aria-label={
                          item.active
                            ? `Desativar ${item.name}`
                            : `Ativar ${item.name}`
                        }
                        onClick={() => setEmployeeActive(item.id, !item.active)}
                      >
                        <span className="employees__switch-knob" />
                      </button>
                      <button
                        type="button"
                        className="employees__icon-btn"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => openEdit(item)}
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

      {modalOpen ? (
        <div className="employees-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="employees-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employees-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="employees-modal__header">
              <h2 id="employees-modal-title">
                {editing ? 'Editar funcionário' : 'Cadastrar funcionário'}
              </h2>
              <button
                type="button"
                className="employees-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="employees-modal__body">
              <label className="employees-modal__field">
                <span>
                  Nome <span className="employees-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`employees-modal__input${touched && missingName ? ' is-invalid' : ''}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Kelton Djames Schulze"
                  autoFocus
                />
              </label>

              <label className="employees-modal__field">
                <span>Telefone</span>
                <input
                  type="text"
                  className="employees-modal__input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ex.: (47) 98927-4677"
                />
              </label>

              <label className="employees-modal__field">
                <span>
                  Usuário <span className="employees-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`employees-modal__input${touched && missingUsername ? ' is-invalid' : ''}`}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ex.: djamesz"
                />
              </label>

              <label className="employees-modal__field">
                <span>Nível</span>
                <select
                  className="employees-modal__input"
                  value={level}
                  onChange={(event) => setLevel(event.target.value as EmployeeLevel)}
                >
                  {LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="employees-modal__check">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                Funcionário ativo
              </label>
            </div>

            <footer className="employees-modal__footer">
              <button type="button" className="employees-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="employees-modal__save" onClick={saveEmployee}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
