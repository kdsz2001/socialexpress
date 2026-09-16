import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  Plus,
  Search,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { ConfirmDeleteModal } from '../components/products/ConfirmDeleteModal'
import { SaveToast } from '../components/ui/SaveToast'
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
  formatProductCodes,
  productAttributeChips,
  type Product,
  type ProductStatus,
} from '../lib/productsStore'
import {
  addProductType,
  deleteProductType,
  formatProductTypeCode,
  formatProductTypeLabel,
  nextProductTypeCode,
  updateProductType,
  type ProductType,
} from '../lib/productTypesStore'
import './Products.css'

type SortDir = 'asc' | 'desc'
type ProductsTab = 'consulta' | 'todos' | 'atributos' | 'tipos' | 'alteracao'

const STATUS_OPTIONS: { id: 'todos' | ProductStatus; label: string }[] = [
  { id: 'todos', label: 'Mostrar todos' },
  { id: 'ativo', label: 'Ativos' },
  { id: 'inativo', label: 'Inativos' },
]

const ATTRIBUTE_KINDS = Object.keys(ATTRIBUTE_KIND_META) as ProductAttributeKind[]
const PAGE_SIZES = [5, 10, 20, 30, 50, 100]

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
  if (tab === 'alteracao') return <ProductsBulk />

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
  const [deleting, setDeleting] = useState<Product | null>(null)

  const typeOptions = useMemo(() => {
    const fromTypes = types.map((item) => formatProductTypeLabel(item))
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
        const codes = formatProductCodes(item).toLocaleLowerCase('pt-BR')
        return (
          item.name.toLocaleLowerCase('pt-BR').includes(q) ||
          item.type.toLocaleLowerCase('pt-BR').includes(q) ||
          item.attributes.toLocaleLowerCase('pt-BR').includes(q) ||
          codes.includes(q) ||
          item.fullCode.toLocaleLowerCase('pt-BR').includes(q) ||
          item.storeCode.toLocaleLowerCase('pt-BR').includes(q)
        )
      })
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [products, query, typeFilter, statusFilter, sortDir])

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

          <label className="products__select-wrap products__select-wrap--type">
            <select
              className="products__select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filtro por tipo de produto"
            >
              <option value="todos">Todos tipos de produto</option>
              {typeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="products__select-icon" />
          </label>

          <label className="products__select-wrap products__select-wrap--status">
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
            <ChevronDown size={14} strokeWidth={2} className="products__select-icon" />
          </label>

          <button
            type="button"
            className="products__add"
            onClick={() => navigate('/produtos/cadastrar')}
          >
            <Plus size={14} strokeWidth={2.5} />
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
                filtered.map((item) => {
                  const codes = formatProductCodes(item)
                  const chips = productAttributeChips(item)
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="products__name-cell products__name-cell--stack">
                          <div className="products__name-row">
                            <span className="products__name">{item.name}</span>
                            {item.status === 'inativo' ? (
                              <span className="products__badge">Inativo</span>
                            ) : null}
                          </div>
                          {codes ? <span className="products__codes">{codes}</span> : null}
                        </div>
                      </td>
                      <td>{item.type || '—'}</td>
                      <td>{item.rental || '—'}</td>
                      <td>
                        {chips.length > 0 ? (
                          <div className="products__chips">
                            {chips.map((chip) => (
                              <span
                                key={`${chip.label}-${chip.value}`}
                                className="products__chip"
                              >
                                {chip.label ? `${chip.label}: ${chip.value}` : chip.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="products__actions-cell">
                        <button
                          type="button"
                          className="products__icon-btn is-view"
                          aria-label="Visualizar produto"
                          onClick={() => navigate(`/produtos/${item.id}`)}
                        >
                          <SquarePen size={15} strokeWidth={2} />
                          <span className="products__action-tip" role="tooltip">
                            Visualizar produto
                          </span>
                        </button>
                        <button
                          type="button"
                          className="products__icon-btn is-danger"
                          aria-label={`Excluir ${item.name}`}
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 size={15} strokeWidth={2} />
                          <span className="products__action-tip" role="tooltip">
                            Excluir
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Excluir produto"
        message={
          <>
            Você está prestes remover um produto. Os pedidos que contêm este produto{' '}
            <strong>não</strong> serão alterados e esta ação não poderá ser desfeita.
          </>
        }
        question={
          deleting ? <>Deseja realmente excluir {deleting.name}?</> : undefined
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteProduct(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function parseRentalValue(rental: string): number | null {
  const digits = rental.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!digits) return null
  const value = Number(digits)
  return Number.isFinite(value) ? value : null
}

function DualPriceRange({
  min = 0,
  max = 500,
  valueMin,
  valueMax,
  onChange,
}: {
  min?: number
  max?: number
  valueMin: number
  valueMax: number
  onChange: (nextMin: number, nextMax: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<'min' | 'max' | null>(null)
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)

  const lo = Math.min(valueMin, valueMax)
  const hi = Math.max(valueMin, valueMax)
  const span = Math.max(1, max - min)
  const leftPct = ((lo - min) / span) * 100
  const rightPct = ((hi - min) / span) * 100

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return min
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return min
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return Math.round(min + ratio * span)
  }

  const applyDrag = (which: 'min' | 'max', clientX: number) => {
    const next = valueFromClientX(clientX)
    if (which === 'min') onChange(Math.min(next, hi), hi)
    else onChange(lo, Math.max(next, lo))
  }

  const startDrag = (which: 'min' | 'max', event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = which
    setDragging(which)
    event.currentTarget.setPointerCapture(event.pointerId)
    applyDrag(which, event.clientX)
  }

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const which = dragRef.current
    if (!which) return
    applyDrag(which, event.clientX)
  }

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(null)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget && !(event.target as HTMLElement).dataset.rail) {
      return
    }
    const next = valueFromClientX(event.clientX)
    const distLo = Math.abs(next - lo)
    const distHi = Math.abs(next - hi)
    const which = distLo <= distHi ? 'min' : 'max'
    startDrag(which, event)
  }

  const nudge = (which: 'min' | 'max', delta: number) => {
    if (which === 'min') onChange(Math.min(Math.max(min, lo + delta), hi), hi)
    else onChange(lo, Math.max(Math.min(max, hi + delta), lo))
  }

  return (
    <div className="products__dual-range">
      <div
        className="products__dual-range-track"
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="products__dual-range-rail" data-rail="1" />
        <span
          className="products__dual-range-fill"
          data-rail="1"
          style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
        />
        <button
          type="button"
          className={`products__dual-range-thumb is-min${dragging === 'min' ? ' is-active' : ''}`}
          style={{ left: `${leftPct}%` }}
          aria-label="Preço mínimo"
          role="slider"
          aria-valuemin={min}
          aria-valuemax={hi}
          aria-valuenow={lo}
          onPointerDown={(event) => startDrag('min', event)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault()
              nudge('min', -1)
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault()
              nudge('min', 1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              onChange(min, hi)
            } else if (event.key === 'End') {
              event.preventDefault()
              onChange(hi, hi)
            }
          }}
        />
        <button
          type="button"
          className={`products__dual-range-thumb is-max${dragging === 'max' ? ' is-active' : ''}`}
          style={{ left: `${rightPct}%` }}
          aria-label="Preço máximo"
          role="slider"
          aria-valuemin={lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          onPointerDown={(event) => startDrag('max', event)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault()
              nudge('max', -1)
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault()
              nudge('max', 1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              onChange(lo, lo)
            } else if (event.key === 'End') {
              event.preventDefault()
              onChange(lo, max)
            }
          }}
        />
      </div>
      <div className="products__dual-range-values">
        <span style={{ left: `${leftPct}%` }}>{lo}</span>
        <span style={{ left: `${rightPct}%` }}>{hi}</span>
      </div>
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
  const [periodOpen, setPeriodOpen] = useState(false)
  const [periodActive, setPeriodActive] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<DatePreset>('mes')
  const initialRange = rangeForPreset('mes')
  const [rangeStart, setRangeStart] = useState(initialRange.start)
  const [rangeEnd, setRangeEnd] = useState(initialRange.end)
  const periodRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!periodOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!periodRef.current?.contains(event.target as Node)) {
        setPeriodOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPeriodOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [periodOpen])

  const lo = Math.min(priceMin, priceMax)
  const hi = Math.max(priceMin, priceMax)

  const results = useMemo(() => {
    const q = termo.trim().toLocaleLowerCase('pt-BR')
    const from = new Date(rangeStart)
    from.setHours(0, 0, 0, 0)
    const to = new Date(rangeEnd)
    to.setHours(23, 59, 59, 999)

    return products.filter((item) => {
      if (onlyAvailable && item.status !== 'ativo') return false
      if (onlyUnavailable && item.status !== 'inativo') return false

      if (periodActive) {
        const created = new Date(item.createdAt).getTime()
        if (Number.isNaN(created) || created < from.getTime() || created > to.getTime()) {
          return false
        }
      }

      const price = parseRentalValue(item.rental)
      if (price != null && (price < lo || price > hi)) return false

      if (!q) return true
      return (
        item.name.toLocaleLowerCase('pt-BR').includes(q) ||
        item.type.toLocaleLowerCase('pt-BR').includes(q) ||
        item.attributes.toLocaleLowerCase('pt-BR').includes(q) ||
        item.rental.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
  }, [
    products,
    termo,
    onlyAvailable,
    onlyUnavailable,
    periodActive,
    rangeStart,
    rangeEnd,
    lo,
    hi,
  ])

  const periodLabel = periodActive
    ? `${formatBr(rangeStart)} - ${formatBr(rangeEnd)}`
    : 'Selecione um intervalo...'

  return (
    <div className="products">
      <header className="products__page-head">
        <h1>Consulta de produtos</h1>
      </header>

      <section className="products__card products__consulta">
        <div className="products__consulta-grid">
          <MultiDummy
            label="Produtos"
            placeholder="Selecione um ou mais produtos"
            options={products.map((p) => p.name)}
          />
          <MultiDummy
            label="Tipos"
            placeholder="Selecione um ou mais tipos"
            options={types.map((t) => formatProductTypeLabel(t))}
          />
          <MultiDummy
            label="Tamanhos"
            placeholder="Selecione um ou mais tamanhos"
            options={sizes.map((s) => s.name)}
          />
          <MultiDummy
            label="Cores"
            placeholder="Selecione uma ou mais cores"
            options={colors.map((c) => c.name)}
          />
          <MultiDummy
            label="Marcas"
            placeholder="Selecione uma ou mais marcas"
            options={brands.map((b) => b.name)}
          />
          <MultiDummy
            label="Modelos"
            placeholder="Selecione um ou mais modelos"
            options={models.map((m) => m.name)}
          />
          <MultiDummy
            label="Estilistas"
            placeholder="Selecione uma ou mais estilistas"
            options={stylists.map((s) => s.name)}
          />
          <MultiDummy
            label="Eventos"
            placeholder="Selecione um ou mais eventos"
            options={events.map((e) => e.name)}
          />

          <label className="products__consulta-field">
            <span>Termo</span>
            <input
              type="text"
              value={termo}
              onChange={(event) => setTermo(event.target.value)}
              placeholder="Filtrar por um termo"
            />
          </label>

          <div className="products__consulta-field">
            <span>Período</span>
            <div className="products__period" ref={periodRef}>
              <button
                type="button"
                className={`products__period-btn${periodOpen ? ' is-open' : ''}${periodActive ? ' has-value' : ''}`}
                aria-expanded={periodOpen}
                aria-haspopup="dialog"
                onClick={() => setPeriodOpen((open) => !open)}
              >
                <Calendar size={15} strokeWidth={2} className="products__period-icon" />
                <span className="products__period-text">{periodLabel}</span>
              </button>
              {periodOpen ? (
                <div
                  className="products__period-popover"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <DateRangePicker
                    start={rangeStart}
                    end={rangeEnd}
                    preset={periodPreset}
                    onCancel={() => setPeriodOpen(false)}
                    onApply={({ start, end, preset }) => {
                      setRangeStart(start)
                      setRangeEnd(end)
                      setPeriodPreset(preset)
                      setPeriodActive(true)
                      setPeriodOpen(false)
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="products__consulta-field">
            <span>Faixa de preço</span>
            <DualPriceRange
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={(nextMin, nextMax) => {
                setPriceMin(nextMin)
                setPriceMax(nextMax)
              }}
            />
          </div>

          <div className="products__consulta-field">
            <span>Mostrar apenas</span>
            <div className="products__checks">
              <label className="products__check">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                />
                <span className="products__check-mark" aria-hidden="true" />
                <span>Disponível</span>
              </label>
              <label className="products__check">
                <input
                  type="checkbox"
                  checked={onlyUnavailable}
                  onChange={(event) => setOnlyUnavailable(event.target.checked)}
                />
                <span className="products__check-mark" aria-hidden="true" />
                <span>Indisponível</span>
              </label>
            </div>
          </div>

          <div className="products__consulta-field products__consulta-field--view">
            <span>Visualização</span>
            <div className="products__radios">
              <label className="products__radio">
                <input
                  type="radio"
                  name="view-mode"
                  checked={view === 'compacta'}
                  onChange={() => setView('compacta')}
                />
                <span className="products__radio-mark" aria-hidden="true" />
                <span>Compacta</span>
              </label>
              <label className="products__radio">
                <input
                  type="radio"
                  name="view-mode"
                  checked={view === 'completa'}
                  onChange={() => setView('completa')}
                />
                <span className="products__radio-mark" aria-hidden="true" />
                <span>Completa</span>
              </label>
            </div>
          </div>
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
  const [deleting, setDeleting] = useState<ProductAttribute | null>(null)
  const [name, setName] = useState('')
  const [toast, setToast] = useState<string | null>(null)

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
    if (editing) {
      updateProductAttribute(editing.id, name)
      setToast(meta.toastUpdated)
    } else {
      addProductAttribute(kind, name)
      setToast(meta.toastCreated)
    }
    setModalOpen(false)
  }

  return (
    <div className="products">
      <SaveToast open={Boolean(toast)} message={toast ?? undefined} onClose={() => setToast(null)} />

      <header className="products__page-head">
        <h1>{meta.title}</h1>
      </header>

      <section className="products__attrs">
        <aside className="products__attrs-nav products__card" aria-label="Tipos de atributo">
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

        <div className="products__attrs-main products__card">
          <div className="products__attrs-toolbar">
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
              <Plus size={14} strokeWidth={2.5} />
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
              {PAGE_SIZES.map((size) => (
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
                          title="Editar"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => openEdit(item)}
                        >
                          <SquarePen size={15} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="products__icon-btn is-danger"
                          title="Excluir valor"
                          aria-label={`Excluir ${item.name}`}
                          onClick={() => setDeleting(item)}
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
              .slice(Math.max(0, currentPage - 3), currentPage + 2)
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
          title={editing ? meta.updateModalTitle : meta.createModalTitle}
          fieldLabel={meta.fieldLabel}
          value={name}
          onChange={setName}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={meta.deleteTitle}
        message={meta.deleteMessage}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteProductAttribute(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function ProductsTipos() {
  const types = useProductTypes()
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductType | null>(null)
  const [deleting, setDeleting] = useState<ProductType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      types.slice().sort((a, b) => {
        const cmp = a.code - b.code || a.name.localeCompare(b.name, 'pt-BR')
        return sortDir === 'asc' ? cmp : -cmp
      }),
    [types, sortDir],
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageItems = sorted.slice(start, start + pageSize)

  const statusLabel =
    types.length === 0
      ? 'Nenhum tipo cadastrado'
      : types.length === 1
        ? '1 tipo cadastrado'
        : `${types.length} tipos cadastrados`

  const nextCode = nextProductTypeCode()

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setModalOpen(true)
  }

  const save = () => {
    if (!name.trim()) return
    if (editing) {
      updateProductType(editing.id, name, description)
      setToast('Tipo atualizado.')
    } else {
      addProductType(name, description)
      setToast('Novo Tipo cadastrado.')
    }
    setModalOpen(false)
  }

  return (
    <div className="products">
      <SaveToast open={Boolean(toast)} message={toast ?? undefined} onClose={() => setToast(null)} />

      <header className="products__page-head products__page-head--actions">
        <div className="products__page-head-left">
          <h1>Tipos de produtos</h1>
          <span className="products__page-sep" aria-hidden="true" />
          <p>{statusLabel}</p>
        </div>
        <button type="button" className="products__add" onClick={openCreate}>
          <Plus size={14} strokeWidth={2.5} />
          Adicionar tipo
        </button>
      </header>

      <section className="products__card">
        <div className="products__section-head">
          <h2>Tipos cadastrados</h2>
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
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>
            {sorted.length === 0
              ? 'Mostrando 0 do total de 0'
              : `Mostrando ${start + 1} - ${Math.min(start + pageSize, sorted.length)} do total de ${sorted.length}`}
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
              {pageItems.length === 0 ? (
                <tr>
                  <td className="products__empty" colSpan={3}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>{formatProductTypeCode(item.code)}</td>
                    <td>{item.name}</td>
                    <td className="products__actions-cell">
                      <button
                        type="button"
                        className="products__icon-btn is-edit"
                        title="Editar"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => {
                          setEditing(item)
                          setName(item.name)
                          setDescription(item.description)
                          setModalOpen(true)
                        }}
                      >
                        <SquarePen size={15} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="products__icon-btn is-danger"
                        title="Excluir"
                        aria-label={`Excluir ${item.name}`}
                        onClick={() => setDeleting(item)}
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
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((num) => (
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
      </section>

      {modalOpen ? (
        <TypeModal
          title={editing ? 'Atualizando tipo de produto' : 'Novo tipo de produto'}
          tip={
            editing
              ? undefined
              : `O código deste novo tipo será ${nextCode}.`
          }
          name={name}
          description={description}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Excluir produto"
        message={
          <>
            Você está prestes remover um produto. Os pedidos que contêm este produto{' '}
            <strong>não</strong> serão alterados e esta ação não poderá ser desfeita.
          </>
        }
        question={
          deleting ? <>Deseja realmente excluir {deleting.name}?</> : undefined
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteProductType(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

function ProductsBulk() {
  const products = useProducts()
  const types = useProductTypes()
  const colors = useProductAttributes('cor')
  const sizes = useProductAttributes('tamanho')
  const brands = useProductAttributes('marca')
  const models = useProductAttributes('modelo')

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [tamanho, setTamanho] = useState('')
  const [cor, setCor] = useState('')
  const [status, setStatus] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState<typeof products>([])

  const clear = () => {
    setBusca('')
    setTipo('')
    setTamanho('')
    setCor('')
    setStatus('')
    setMarca('')
    setModelo('')
    setSearched(false)
    setResults([])
  }

  const search = () => {
    const q = busca.trim().toLocaleLowerCase('pt-BR')
    const list = products.filter((item) => {
      if (tipo && item.type !== tipo) return false
      if (status === 'ativo' && item.status !== 'ativo') return false
      if (status === 'inativo' && item.status !== 'inativo') return false
      if (cor && !item.attributes.toLocaleLowerCase('pt-BR').includes(cor.toLocaleLowerCase('pt-BR'))) {
        return false
      }
      if (
        tamanho &&
        !item.attributes.toLocaleLowerCase('pt-BR').includes(tamanho.toLocaleLowerCase('pt-BR'))
      ) {
        return false
      }
      if (
        marca &&
        !item.attributes.toLocaleLowerCase('pt-BR').includes(marca.toLocaleLowerCase('pt-BR'))
      ) {
        return false
      }
      if (
        modelo &&
        !item.attributes.toLocaleLowerCase('pt-BR').includes(modelo.toLocaleLowerCase('pt-BR'))
      ) {
        return false
      }
      if (!q) return true
      return (
        item.name.toLocaleLowerCase('pt-BR').includes(q) ||
        item.type.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
    setResults(list)
    setSearched(true)
  }

  return (
    <div className="products">
      <header className="products__page-head">
        <h1>Alteração em massa</h1>
      </header>

      <p className="products__alert products__alert--info">
        Campos em branco não alteram os produtos.
      </p>
      <p className="products__alert products__alert--warn">
        Atenção: esta tela altera vários produtos de uma vez. Antes de salvar, o sistema
        exibirá uma confirmação com o antes/depois. A operação não possui reversão automática.
      </p>

      <section className="products__card">
        <div className="products__section-head">
          <h2>1. Filtrar produtos</h2>
        </div>

        <div className="products__bulk-grid">
          <label className="products__consulta-field">
            <span>Busca</span>
            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar produtos"
            />
          </label>
          <label className="products__consulta-field">
            <span>Tipos</span>
            <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="">Selecione</option>
              {types.map((item) => (
                <option key={item.id} value={formatProductTypeLabel(item)}>
                  {formatProductTypeLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Tamanhos</span>
            <select value={tamanho} onChange={(event) => setTamanho(event.target.value)}>
              <option value="">Selecione</option>
              {sizes.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Cores</span>
            <select value={cor} onChange={(event) => setCor(event.target.value)}>
              <option value="">Selecione</option>
              {colors.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Selecione</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Marcas</span>
            <select value={marca} onChange={(event) => setMarca(event.target.value)}>
              <option value="">Selecione</option>
              {brands.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Modelos</span>
            <select value={modelo} onChange={(event) => setModelo(event.target.value)}>
              <option value="">Selecione</option>
              {models.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="products__bulk-actions">
          <button type="button" className="products__ghost" onClick={clear}>
            Limpar
          </button>
          <button type="button" className="products__add" onClick={search}>
            Buscar produtos
          </button>
        </div>

        <p className="products__bulk-note">
          Use os filtros acima e clique em Buscar produtos para carregar a lista. Nenhum
          produto será carregado automaticamente ao abrir esta tela.
        </p>
      </section>

      {searched ? (
        <section className="products__card" style={{ marginTop: '1rem' }}>
          <div className="products__section-head">
            <h2>2. Resultados</h2>
          </div>
          <p className="products__consulta-empty">
            {results.length === 0
              ? 'Nenhum resultado foi encontrado.'
              : `${results.length} produto${results.length === 1 ? '' : 's'} encontrado${results.length === 1 ? '' : 's'}.`}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function NameModal({
  title,
  fieldLabel,
  value,
  onChange,
  onClose,
  onSave,
}: {
  title: string
  fieldLabel: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="products-modal" role="presentation">
      <button
        type="button"
        className="products-modal__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className="products-modal__dialog products-modal__dialog--sm"
        role="dialog"
        aria-modal="true"
      >
        <header className="products-modal__header">
          <h2>{title}</h2>
          <button type="button" className="products-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="products-modal__body">
          <label className="products-modal__field">
            <span>
              {fieldLabel} <span className="products-modal__req">*</span>
            </span>
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
    </div>,
    document.body,
  )
}

function TypeModal({
  title,
  tip,
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onClose,
  onSave,
}: {
  title: string
  tip?: string
  name: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="products-modal" role="presentation">
      <button
        type="button"
        className="products-modal__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className="products-modal__dialog products-modal__dialog--sm"
        role="dialog"
        aria-modal="true"
      >
        <header className="products-modal__header">
          <h2>{title}</h2>
          <button type="button" className="products-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="products-modal__body">
          {tip ? <p className="products-modal__tip">{tip}</p> : null}
          <label className="products-modal__field">
            <span>
              Nome <span className="products-modal__req">*</span>
            </span>
            <input
              type="text"
              className="products-modal__input"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              autoFocus
            />
          </label>
          <label className="products-modal__field">
            <span>Descrição</span>
            <textarea
              className="products-modal__input products-modal__textarea"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
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
    </div>,
    document.body,
  )
}
