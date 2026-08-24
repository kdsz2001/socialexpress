import { useMemo, useState } from 'react'
import { ArrowUp, ChevronDown, Plus, Search, SquarePen, Trash2, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import {
  addProduct,
  deleteProduct,
  updateProduct,
  type Product,
  type ProductStatus,
} from '../lib/productsStore'
import './Products.css'

type SortDir = 'asc' | 'desc'
type ProductsTab = 'consulta' | 'todos' | 'atributos' | 'tipos' | 'alteracao'

const PRODUCT_TYPES = ['Traje', 'Acessório', 'Calçado', 'Outro'] as const
const STATUS_OPTIONS: { id: 'todos' | ProductStatus; label: string }[] = [
  { id: 'todos', label: 'Filtro por status' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'inativo', label: 'Inativo' },
]

function tabFromParam(value: string | null): ProductsTab {
  if (value === 'consulta') return 'consulta'
  if (value === 'atributos') return 'atributos'
  if (value === 'tipos') return 'tipos'
  if (value === 'alteracao') return 'alteracao'
  return 'todos'
}

const TAB_PLACEHOLDERS: Record<Exclude<ProductsTab, 'todos'>, string> = {
  consulta: 'Consulta de produtos',
  atributos: 'Atributos',
  tipos: 'Tipos de produtos',
  alteracao: 'Alteração em massa',
}

export function Products() {
  const products = useProducts()
  const [searchParams] = useSearchParams()
  const tab = tabFromParam(searchParams.get('tab'))

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | ProductStatus>('todos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<string>(PRODUCT_TYPES[0])
  const [rental, setRental] = useState('')
  const [attributes, setAttributes] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ativo')
  const [touched, setTouched] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return products
      .filter((item) => {
        if (typeFilter !== 'todos' && item.type !== typeFilter) return false
        if (statusFilter !== 'todos' && item.status !== statusFilter) return false
        if (!q) return true
        return (
          item.name.toLocaleLowerCase('pt-BR').includes(q) ||
          item.type.toLocaleLowerCase('pt-BR').includes(q) ||
          item.attributes.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [products, query, typeFilter, statusFilter, sortDir])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setType(PRODUCT_TYPES[0])
    setRental('')
    setAttributes('')
    setStatus('ativo')
    setTouched(false)
    setModalOpen(true)
  }

  const openEdit = (item: Product) => {
    setEditing(item)
    setName(item.name)
    setType(item.type || PRODUCT_TYPES[0])
    setRental(item.rental)
    setAttributes(item.attributes)
    setStatus(item.status)
    setTouched(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setTouched(false)
  }

  const missingName = !name.trim()

  const saveProduct = () => {
    setTouched(true)
    if (missingName) return
    const payload = { name, type, rental, attributes, status }
    if (editing) {
      updateProduct(editing.id, payload)
    } else {
      addProduct(payload)
    }
    closeModal()
  }

  if (tab !== 'todos') {
    return (
      <div className="products">
        <section className="products__card products__card--placeholder">
          <h2>{TAB_PLACEHOLDERS[tab]}</h2>
          <p>Nenhum resultado encontrado</p>
        </section>
      </div>
    )
  }

  return (
    <div className="products">
      <section className="products__card">
        <div className="products__toolbar">
          <label className="products__search">
            <Search size={16} strokeWidth={2} className="products__search-icon" />
            <input
              type="search"
              className="products__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <label className="products__select-wrap">
            <select
              className="products__select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filtro por tipo de produto"
            >
              <option value="todos">Filtro por tipo de produto</option>
              {PRODUCT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="products__select-icon" />
          </label>

          <label className="products__select-wrap">
            <select
              className="products__select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'todos' | ProductStatus)
              }
              aria-label="Filtro por status"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} strokeWidth={2} className="products__select-icon" />
          </label>

          <button type="button" className="products__add" onClick={openCreate}>
            <Plus size={16} strokeWidth={2.5} />
            Novo produto
          </button>
        </div>

        <div className="products__table-wrap">
          <table className="products__table">
            <thead>
              <tr>
                <th className="products__col-name">
                  <button
                    type="button"
                    className="products__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    Produto
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th className="products__col-type">Tipo</th>
                <th className="products__col-rental">Aluguel</th>
                <th className="products__col-attrs">Atributos</th>
                <th className="products__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="products__empty" colSpan={5}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="products__name-cell">
                        <span className="products__name">{item.name}</span>
                        {item.status === 'inativo' ? (
                          <span className="products__badge">Inativo</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.type || '—'}</td>
                    <td>{item.rental || '—'}</td>
                    <td>{item.attributes || '—'}</td>
                    <td className="products__actions-cell">
                      <button
                        type="button"
                        className="products__icon-btn"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => openEdit(item)}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="products__icon-btn is-danger"
                        aria-label={`Excluir ${item.name}`}
                        onClick={() => deleteProduct(item.id)}
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

      {modalOpen ? (
        <div className="products-modal" role="presentation" onMouseDown={closeModal}>
          <div
            className="products-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="products-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal__header">
              <h2 id="products-modal-title">{editing ? 'Editar produto' : 'Novo produto'}</h2>
              <button
                type="button"
                className="products-modal__close"
                aria-label="Fechar"
                onClick={closeModal}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </header>

            <div className="products-modal__body">
              <label className="products-modal__field">
                <span>
                  Nome do produto <span className="products-modal__req">*</span>
                </span>
                <input
                  type="text"
                  className={`products-modal__input${touched && missingName ? ' is-invalid' : ''}`}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Smoking preto"
                  autoFocus
                />
              </label>

              <label className="products-modal__field">
                <span>Tipo</span>
                <select
                  className="products-modal__input"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  {PRODUCT_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="products-modal__field">
                <span>Aluguel</span>
                <input
                  type="text"
                  className="products-modal__input"
                  value={rental}
                  onChange={(event) => setRental(event.target.value)}
                  placeholder="Ex.: R$ 250,00"
                />
              </label>

              <label className="products-modal__field">
                <span>Atributos</span>
                <input
                  type="text"
                  className="products-modal__input"
                  value={attributes}
                  onChange={(event) => setAttributes(event.target.value)}
                  placeholder="Ex.: 50, Preto"
                />
              </label>

              <label className="products-modal__field">
                <span>Status</span>
                <select
                  className="products-modal__input"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProductStatus)}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>
            </div>

            <footer className="products-modal__footer">
              <button type="button" className="products-modal__cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="products-modal__save" onClick={saveProduct}>
                {editing ? 'Salvar' : 'Cadastrar'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}
