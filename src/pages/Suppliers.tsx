import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Search } from 'lucide-react'
import { IconAction, IconActions } from '../components/ui/IconAction'
import { SaveToast } from '../components/ui/SaveToast'
import { useSuppliers } from '../hooks/useSuppliers'
import { onlyDigits } from '../lib/cpfCnpj'
import {
  supplierListPhone,
  type Supplier,
  type SupplierType,
} from '../lib/suppliersStore'
import './Suppliers.css'

const TOAST_KEY = 'social-express:supplier-toast'
const PAGE_SIZES = [5, 10, 20, 30, 50, 100]
const TYPE_FILTERS: { id: 'todos' | SupplierType; label: string }[] = [
  { id: 'todos', label: 'Todos tipos' },
  { id: 'Consignado', label: 'Consignado' },
  { id: 'Empresas', label: 'Empresas' },
]

function whatsAppHref(number: string) {
  const digits = onlyDigits(number)
  const full = digits.startsWith('55') && digits.length > 11 ? digits : `55${digits}`
  return `https://wa.me/${full}`
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

export function Suppliers() {
  const navigate = useNavigate()
  const suppliers = useSuppliers()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'todos' | SupplierType>('todos')
  const [typeOpen, setTypeOpen] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const typeRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return suppliers.filter((item) => {
      if (typeFilter !== 'todos' && item.type !== typeFilter) return false
      if (!q) return true
      const phone = supplierListPhone(item)
      const hay = [
        item.name,
        item.document,
        item.type,
        item.email,
        item.niceName,
        item.companyName,
        item.companyFantasy,
        item.city,
        phone?.number ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      return hay.includes(q)
    })
  }, [suppliers, query, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const pageEnd = Math.min(currentPage * pageSize, filtered.length)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter, pageSize])

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

  useEffect(() => {
    if (!typeOpen) return
    const close = (event: MouseEvent) => {
      if (!typeRef.current?.contains(event.target as Node)) setTypeOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [typeOpen])

  const typeLabel = TYPE_FILTERS.find((item) => item.id === typeFilter)?.label ?? 'Todos tipos'

  return (
    <div className="suppliers">
      <SaveToast open={Boolean(toast)} message={toast || undefined} onClose={() => setToast('')} />
      <section className="suppliers__card">
        <div className="suppliers__toolbar">
          <label className="suppliers__search">
            <Search size={16} strokeWidth={2} className="suppliers__search-icon" />
            <input
              type="search"
              className="suppliers__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className={`suppliers__select-wrap${typeOpen ? ' is-open' : ''}`} ref={typeRef}>
            <button
              type="button"
              className="suppliers__select"
              aria-label="Filtro por tipo"
              aria-haspopup="listbox"
              aria-expanded={typeOpen}
              onClick={() => setTypeOpen((open) => !open)}
            >
              {typeLabel}
            </button>
            <ChevronDown size={16} strokeWidth={2} className="suppliers__select-icon" />
            {typeOpen ? (
              <ul className="suppliers__select-menu" role="listbox" aria-label="Filtro por tipo">
                {TYPE_FILTERS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={item.id === typeFilter}
                      className={item.id === typeFilter ? 'is-selected' : undefined}
                      onClick={() => {
                        setTypeFilter(item.id)
                        setTypeOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <button type="button" className="suppliers__add" onClick={() => navigate('/fornecedores/novo')}>
            <Plus size={16} strokeWidth={2.5} />
            Novo fornecedor
          </button>
        </div>

        <div className="suppliers__body">
          <div className="suppliers__pager">
            <div className="suppliers__pager-left">
              <select
                className="suppliers__pager-size"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                aria-label="Itens por página"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="suppliers__pager-info">
                {`Mostrando ${filtered.length === 0 ? 0 : pageStart} - ${pageEnd} do total de ${filtered.length}`}
              </span>
            </div>
            <div className="suppliers__pager-nav">
              <button type="button" className="suppliers__pager-btn" title="Primeira página" aria-label="Primeira página" disabled={currentPage <= 1} onClick={() => setPage(1)}>
                <ChevronsLeft size={12} strokeWidth={2} />
              </button>
              <button type="button" className="suppliers__pager-btn" title="Anterior" aria-label="Anterior" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft size={12} strokeWidth={2} />
              </button>
              <button type="button" className="suppliers__pager-btn is-active" aria-current="page">
                {currentPage}
              </button>
              <button type="button" className="suppliers__pager-btn" title="Próxima" aria-label="Próxima" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                <ChevronRight size={12} strokeWidth={2} />
              </button>
              <button type="button" className="suppliers__pager-btn" title="Última página" aria-label="Última página" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
                <ChevronsRight size={12} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="suppliers__table-wrap">
            <table className="suppliers__table">
              <thead>
                <tr>
                  <th className="suppliers__col-name">Fornecedor</th>
                  <th className="suppliers__col-phone">Telefone</th>
                  <th className="suppliers__col-type">Tipo</th>
                  <th className="suppliers__col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td className="suppliers__empty" colSpan={4}>
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => <SupplierRow key={item.id} item={item} onEdit={() => navigate(`/fornecedores/${item.id}`)} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function SupplierRow({ item, onEdit }: { item: Supplier; onEdit: () => void }) {
  const phone = supplierListPhone(item)
  return (
    <tr>
      <td>
        <div className="suppliers__who">
          <div className="suppliers__who-name">{item.name}</div>
          {item.document ? <div className="suppliers__who-doc">{item.document}</div> : null}
        </div>
      </td>
      <td>
        {phone ? (
          phone.whatsapp ? (
            <a className="suppliers__phone" href={whatsAppHref(phone.number)} target="_blank" rel="noreferrer">
              {phone.number}
              <WhatsAppIcon />
            </a>
          ) : (
            <span className="suppliers__phone-plain">{phone.number}</span>
          )
        ) : null}
      </td>
      <td>{item.type}</td>
      <td className="suppliers__actions">
        <IconActions>
          <IconAction kind="edit" tip="Editar fornecedor" aria-label={`Editar fornecedor ${item.name}`} onClick={onEdit} />
        </IconActions>
      </td>
    </tr>
  )
}
