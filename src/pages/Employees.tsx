import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconAction } from '../components/ui/IconAction'
import { SaveToast } from '../components/ui/SaveToast'
import { useEmployees } from '../hooks/useEmployees'
import { setEmployeeActive } from '../lib/employeesStore'
import './Employees.css'

type SortDir = 'asc' | 'desc'
type StatusFilter = 'ativos' | 'inativos' | 'todos'

const TOAST_KEY = 'social-express:employee-toast'

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'ativos', label: 'Ativos' },
  { id: 'inativos', label: 'Inativos' },
  { id: 'todos', label: 'Todos' },
]

export function Employees() {
  const employees = useEmployees()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('tab') === 'permissoes') {
      navigate('/configuracoes?section=permissoes', { replace: true })
    }
  }, [navigate, searchParams])

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])

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
          item.email.toLocaleLowerCase('pt-BR').includes(q) ||
          item.level.toLocaleLowerCase('pt-BR').includes(q) ||
          item.unit.toLocaleLowerCase('pt-BR').includes(q)
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

  useEffect(() => {
    try {
      const message = sessionStorage.getItem(TOAST_KEY)
      if (message) {
        sessionStorage.removeItem(TOAST_KEY)
        setToast(message)
      }
    } catch {
      // ignore
    }
  }, [])

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
            {`Mostrando ${filtered.length === 0 ? 0 : pageStart} - ${pageEnd} do total de ${filtered.length}`}
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

  return (
    <div className="employees">
      <SaveToast open={Boolean(toast)} message={toast ?? undefined} onClose={closeToast} />
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

          <button type="button" className="employees__add" onClick={() => navigate('/funcionarios/cadastrar')}>
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
                      <span className="employees__actions">
                        <button
                          type="button"
                          className={`employees__status${item.active ? ' is-on' : ''}`}
                          role="switch"
                          aria-checked={item.active}
                          aria-label={item.active ? `Desativar ${item.name}` : `Ativar ${item.name}`}
                          onClick={() => {
                            setEmployeeActive(item.id, !item.active)
                            setToast('Funcionário atualizado.')
                          }}
                        >
                          <span className="employees__status-knob" aria-hidden="true">
                            {item.active ? <Check size={12} strokeWidth={3} /> : null}
                          </span>
                        </button>
                        <IconAction
                          kind="edit"
                          tip="Editar funcionário"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => navigate(`/funcionarios/${item.id}`)}
                        />
                      </span>
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
