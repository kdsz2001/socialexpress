import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUp,
  Check,
  ChevronDown,
  Plus,
  Search,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProductAttributes } from '../hooks/useProductAttributes'
import { useProductTypes } from '../hooks/useProductTypes'
import { useProducts } from '../hooks/useProducts'
import {
  addProductAttribute,
  ATTRIBUTE_KIND_META,
  deleteProductAttribute,
  updateProductAttribute,
  type ProductAttribute,
  type ProductAttributeKind,
} from '../lib/productAttributesStore'
import {
  deleteProduct,
  updateProduct,
  type Product,
  type ProductStatus,
} from '../lib/productsStore'
import {
  addProductType,
  deleteProductType,
  updateProductType,
  type ProductType,
} from '../lib/productTypesStore'
import './Products.css'

type SortDir = 'asc' | 'desc'
type ProductsTab = 'consulta' | 'todos' | 'atributos' | 'tipos' | 'alteracao'

const STATUS_OPTIONS: { id: 'todos' | ProductStatus; label: string }[] = [
  { id: 'todos', label: 'Filtro por status' },
  { id: 'ativo', label: 'Ativo' },
  { id: 'inativo', label: 'Inativo' },
]

const ATTRIBUTE_KINDS = Object.keys(ATTRIBUTE_KIND_META) as ProductAttributeKind[]

function tabFromParam(value: string | null): ProductsTab {
  if (value === 'consulta') return 'consulta'
  if (value === 'atributos') return 'atributos'
  if (value === 'tipos') return 'tipos'
  if (value === 'alteracao') return 'alteracao'
  return 'todos'
}

export function Products() {
  const [searchParams] = useSearchParams()
  const tab = tabFromParam(searchParams.get('tab'))

  if (tab === 'consulta') return <ProductsConsulta />
  if (tab === 'atributos') return <ProductsAtributos />
  if (tab === 'tipos') return <ProductsTipos />
  if (tab === 'alteracao') {
    return (
      <div className="products">
        <header className="products__page-head">
          <h1>Alteração em massa</h1>
        </header>
        <section className="products__card products__card--placeholder">
          <h2>Alteração em massa</h2>
          <p>Nenhum resultado encontrado</p>
        </section>
      </div>
    )
  }

  return <ProductsList />
}

function ProductsList() {
  const products = useProducts()
  const types = useProductTypes()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | ProductStatus>('todos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [rental, setRental] = useState('')
  const [attributes, setAttributes] = useState('')
  const [status, setStatus] = useState<ProductStatus>('ativo')
  const [touched, setTouched] = useState(false)

  const typeOptions = useMemo(() => {
    const fromTypes = types.map((item) => item.name)
    const fromProducts = products.map((item) => item.type).filter(Boolean)
    return Array.from(new Set([...fromTypes, ...fromProducts])).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    )
  }, [types, products])

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

  const openEdit = (item: Product) => {
    setEditing(item)
    setName(item.name)
    setType(item.type)
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
    if (missingName || !editing) return
    updateProduct(editing.id, { name, type, rental, attributes, status })
    closeModal()
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
              {typeOptions.map((item) => (
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

          <button
            type="button"
            className="products__add"
            onClick={() => navigate('/produtos/cadastrar')}
          >
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
                        className="products__icon-btn is-edit"
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
              <h2 id="products-modal-title">Editar produto</h2>
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
                  <option value="">Selecione um tipo de produto</option>
                  {typeOptions.map((item) => (
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
                  placeholder="R$ 0,00"
                />
              </label>

              <label className="products-modal__field">
                <span>Atributos</span>
                <input
                  type="text"
                  className="products-modal__input"
                  value={attributes}
                  onChange={(event) => setAttributes(event.target.value)}
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
                Salvar
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ProductsConsulta() {
  const products = useProducts()
  const types = useProductTypes()
  const colors = useProductAttributes('cor')
  const sizes = useProductAttributes('tamanho')
  const brands = useProductAttributes('marca')
  const models = useProductAttributes('modelo')
  const stylists = useProductAttributes('estilista')
  const events = useProductAttributes('evento')

  const [termo, setTermo] = useState('')
  const [view, setView] = useState<'compacta' | 'completa'>('completa')
  const [priceMin, setPriceMin] = useState(100)
  const [priceMax, setPriceMax] = useState(300)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [onlyUnavailable, setOnlyUnavailable] = useState(false)

  const results = useMemo(() => {
    const q = termo.trim().toLocaleLowerCase('pt-BR')
    return products.filter((item) => {
      if (onlyAvailable && item.status !== 'ativo') return false
      if (onlyUnavailable && item.status !== 'inativo') return false
      if (!q) return true
      return (
        item.name.toLocaleLowerCase('pt-BR').includes(q) ||
        item.type.toLocaleLowerCase('pt-BR').includes(q) ||
        item.attributes.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
  }, [products, termo, onlyAvailable, onlyUnavailable])

  return (
    <div className="products">
      <header className="products__page-head">
        <h1>Consulta de produtos</h1>
      </header>

      <section className="products__card products__consulta">
        <div className="products__consulta-grid">
          <MultiDummy label="Produtos" placeholder="Selecione um ou mais produtos" options={products.map((p) => p.name)} />
          <MultiDummy label="Tipos" placeholder="Selecione um ou mais tipos" options={types.map((t) => t.name)} />
          <MultiDummy label="Tamanhos" placeholder="Selecione um ou mais tamanhos" options={sizes.map((s) => s.name)} />
          <MultiDummy label="Cores" placeholder="Selecione uma ou mais cores" options={colors.map((c) => c.name)} />
          <MultiDummy label="Marcas" placeholder="Selecione uma ou mais marcas" options={brands.map((b) => b.name)} />
          <MultiDummy label="Modelos" placeholder="Selecione um ou mais modelos" options={models.map((m) => m.name)} />
          <MultiDummy label="Estilistas" placeholder="Selecione uma ou mais estilistas" options={stylists.map((s) => s.name)} />
          <MultiDummy label="Eventos" placeholder="Selecione um ou mais eventos" options={events.map((e) => e.name)} />

          <label className="products__consulta-field">
            <span>Termo</span>
            <input
              type="text"
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Filtrar por um termo"
            />
          </label>

          <label className="products__consulta-field">
            <span>Período</span>
            <input type="text" readOnly placeholder="Selecione um intervalo de datas" />
          </label>

          <div className="products__consulta-field">
            <span>Faixa de preço</span>
            <div className="products__price-range">
              <input
                type="range"
                min={0}
                max={500}
                value={priceMin}
                onChange={(event) => setPriceMin(Number(event.target.value))}
              />
              <input
                type="range"
                min={0}
                max={500}
                value={priceMax}
                onChange={(event) => setPriceMax(Number(event.target.value))}
              />
              <div className="products__price-values">
                <em>{Math.min(priceMin, priceMax)}</em>
                <em>{Math.max(priceMin, priceMax)}</em>
              </div>
            </div>
          </div>

          <div className="products__consulta-field">
            <span>Mostrar apenas</span>
            <div className="products__toggles">
              <label className={`products__toggle${onlyAvailable ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                />
                <span>Disponível</span>
              </label>
              <label className={`products__toggle${onlyUnavailable ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={onlyUnavailable}
                  onChange={(event) => setOnlyUnavailable(event.target.checked)}
                />
                <span>Indisponível</span>
              </label>
            </div>
          </div>
        </div>

        <div className="products__view-mode">
          <span>Visualização</span>
          <label>
            <input
              type="radio"
              name="view-mode"
              checked={view === 'compacta'}
              onChange={() => setView('compacta')}
            />
            Compacta
          </label>
          <label>
            <input
              type="radio"
              name="view-mode"
              checked={view === 'completa'}
              onChange={() => setView('completa')}
            />
            Completa
          </label>
        </div>
      </section>

      <p className="products__consulta-empty">
        {results.length === 0
          ? 'Nenhum resultado foi encontrado.'
          : `${results.length} resultado${results.length === 1 ? '' : 's'} encontrado${results.length === 1 ? '' : 's'}.`}
      </p>
    </div>
  )
}

function MultiDummy({
  label,
  placeholder,
  options,
}: {
  label: string
  placeholder: string
  options: string[]
}) {
  return (
    <label className="products__consulta-field">
      <span>{label}</span>
      <select defaultValue="">
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  )
}

function ProductsAtributos() {
  const [kind, setKind] = useState<ProductAttributeKind>('cor')
  const items = useProductAttributes(kind)
  const meta = ATTRIBUTE_KIND_META[kind]
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductAttribute | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    setPage(1)
    setQuery('')
  }, [kind])

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return items
      .filter((item) => !q || item.name.toLocaleLowerCase('pt-BR').includes(q))
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [items, query, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setModalOpen(true)
  }

  const openEdit = (item: ProductAttribute) => {
    setEditing(item)
    setName(item.name)
    setModalOpen(true)
  }

  const save = () => {
    if (!name.trim()) return
    if (editing) updateProductAttribute(editing.id, name)
    else addProductAttribute(kind, name)
    setModalOpen(false)
  }

  return (
    <div className="products">
      <section className="products__card products__attrs">
        <aside className="products__attrs-nav" aria-label="Tipos de atributo">
          {ATTRIBUTE_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              className={`products__attrs-nav-btn${kind === item ? ' is-active' : ''}`}
              onClick={() => setKind(item)}
            >
              {ATTRIBUTE_KIND_META[item].nav}
            </button>
          ))}
        </aside>

        <div className="products__attrs-main">
          <div className="products__attrs-toolbar">
            <h2>{meta.title}</h2>
            <label className="products__search">
              <Search size={16} strokeWidth={2} className="products__search-icon" />
              <input
                type="search"
                className="products__search-input"
                placeholder="Busca rápida..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </label>
            <button type="button" className="products__add" onClick={openCreate}>
              <Plus size={16} strokeWidth={2.5} />
              {meta.createLabel}
            </button>
          </div>

          <div className="products__pager">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              aria-label="Itens por página"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              {filtered.length === 0
                ? 'Mostrando 0 do total de 0'
                : `Mostrando ${start + 1} - ${Math.min(start + pageSize, filtered.length)} do total de ${filtered.length}`}
            </span>
          </div>

          <div className="products__table-wrap">
            <table className="products__table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className="products__th-sort"
                      onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                    >
                      {meta.nav}
                      <ArrowUp
                        size={14}
                        strokeWidth={2.25}
                        className={sortDir === 'desc' ? 'is-desc' : undefined}
                      />
                    </button>
                  </th>
                  <th className="products__col-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td className="products__empty" colSpan={2}>
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="products__actions-cell">
                        <button
                          type="button"
                          className="products__icon-btn is-edit"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => openEdit(item)}
                        >
                          <SquarePen size={15} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="products__icon-btn is-danger"
                          aria-label={`Excluir ${item.name}`}
                          onClick={() => deleteProductAttribute(item.id)}
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

          <div className="products__pagination">
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(0, 5)
              .map((num) => (
                <button
                  key={num}
                  type="button"
                  className={num === currentPage ? 'is-active' : undefined}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
          </div>
        </div>
      </section>

      {modalOpen ? (
        <NameModal
          title={editing ? `Editar ${meta.singular}` : meta.createLabel}
          value={name}
          onChange={setName}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}
    </div>
  )
}

function ProductsTipos() {
  const types = useProductTypes()
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductType | null>(null)
  const [name, setName] = useState('')

  const sorted = useMemo(
    () =>
      types.slice().sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      }),
    [types, sortDir],
  )

  const statusLabel =
    types.length === 0
      ? 'Nenhum tipo de produto cadastrado'
      : types.length === 1
        ? '1 tipo de produto cadastrado'
        : `${types.length} tipos de produtos cadastrados`

  const save = () => {
    if (!name.trim()) return
    if (editing) updateProductType(editing.id, name)
    else addProductType(name)
    setModalOpen(false)
  }

  return (
    <div className="products">
      <header className="products__page-head">
        <h1>Tipos de produtos</h1>
        <span className="products__page-sep" aria-hidden="true" />
        <p>{statusLabel}</p>
      </header>

      <section className="products__card">
        <div className="products__section-head">
          <h2>Tipos cadastrados</h2>
          <button
            type="button"
            className="products__add"
            onClick={() => {
              setEditing(null)
              setName('')
              setModalOpen(true)
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Adicionar tipo
          </button>
        </div>

        <div className="products__table-wrap">
          <table className="products__table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="products__th-sort"
                    onClick={() => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))}
                  >
                    ID
                    <ArrowUp
                      size={14}
                      strokeWidth={2.25}
                      className={sortDir === 'desc' ? 'is-desc' : undefined}
                    />
                  </button>
                </th>
                <th>Nome</th>
                <th className="products__col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="products__empty" colSpan={3}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                sorted.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td className="products__actions-cell">
                      <button
                        type="button"
                        className="products__icon-btn is-edit"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => {
                          setEditing(item)
                          setName(item.name)
                          setModalOpen(true)
                        }}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="products__icon-btn is-danger"
                        aria-label={`Excluir ${item.name}`}
                        onClick={() => deleteProductType(item.id)}
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
        <NameModal
          title={editing ? 'Editar tipo' : 'Adicionar tipo'}
          value={name}
          onChange={setName}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}
    </div>
  )
}

function NameModal({
  title,
  value,
  onChange,
  onClose,
  onSave,
}: {
  title: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="products-modal" role="presentation" onMouseDown={onClose}>
      <div
        className="products-modal__dialog products-modal__dialog--sm"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="products-modal__header">
          <h2>{title}</h2>
          <button type="button" className="products-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="products-modal__body">
          <label className="products-modal__field">
            <span>Nome</span>
            <input
              type="text"
              className="products-modal__input"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              autoFocus
            />
          </label>
        </div>
        <footer className="products-modal__footer">
          <button type="button" className="products-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="products-modal__save" onClick={onSave}>
            <Check size={15} strokeWidth={2.5} />
            Salvar
          </button>
        </footer>
      </div>
    </div>
  )
}
