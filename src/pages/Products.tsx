import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUp,
  ArrowLeft,
  Calendar,
  Check,
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
import {
  DateRangePicker,
  formatBr,
  rangeForPreset,
  type DatePreset,
} from '../components/clients/DateRangePicker'
import { ConfirmDeleteModal } from '../components/products/ConfirmDeleteModal'
import { ProductTypeModal } from '../components/products/ProductTypeModal'
import { SaveToast } from '../components/ui/SaveToast'
import { useOrders } from '../hooks/useOrders'
import { useProductAttributes } from '../hooks/useProductAttributes'
import { useProductTypes } from '../hooks/useProductTypes'
import { useProducts } from '../hooks/useProducts'
import { moneyBrToNumber } from '../lib/moneyMask'
import { type Order, type OrderLine } from '../lib/ordersStore'
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
} from '../lib/productsStore'
import { useProductsSubheaderAction } from '../lib/productsSubheaderAction'
import {
  addProductType,
  countProductsUsingType,
  deleteProductType,
  formatProductTypeCode,
  formatProductTypeLabel,
  nextProductTypeCode,
  productTypeDisplayName,
  updateProductType,
  type ProductType,
} from '../lib/productTypesStore'
import './Products.css'

type SortDir = 'asc' | 'desc'
type ProductsTab = 'consulta' | 'todos' | 'atributos' | 'tipos' | 'alteracao'
type ProductListFilter =
  | 'todos'
  | 'ativo'
  | 'inativo'
  | 'consignados'
  | 'nao_consignados'
  | 'a_venda'
  | 'vendidos'

const STATUS_OPTIONS: { id: ProductListFilter; label: string }[] = [
  { id: 'todos', label: 'Filtro por status' },
  { id: 'ativo', label: 'Ativos' },
  { id: 'inativo', label: 'Inativos' },
  { id: 'consignados', label: 'Consignados' },
  { id: 'nao_consignados', label: 'Não consignados' },
  { id: 'a_venda', label: 'À venda' },
  { id: 'vendidos', label: 'Vendidos' },
]

const REMOVED_TOAST_KEY = 'social-express:product-removed-toast'

const ATTRIBUTE_KINDS = Object.keys(ATTRIBUTE_KIND_META) as ProductAttributeKind[]
const PAGE_SIZES = [5, 10, 20, 30, 50, 100]
const LIST_PAGE_SIZES = [10, 25, 50, 100]

function splitProductTypeLabel(typeLabel: string) {
  const name = productTypeDisplayName(typeLabel)
  const match = name.match(/^(.*?)(\s*\([^)]+\))\s*$/)
  if (!match) return { title: name, code: '' }
  return { title: match[1].trim(), code: match[2].trim() }
}

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
  const [statusFilter, setStatusFilter] = useState<ProductListFilter>('todos')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const closeToast = useCallback(() => setToastOpen(false), [])
  const closeHistory = useCallback(() => setHistoryProduct(null), [])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(REMOVED_TOAST_KEY) === '1') {
        sessionStorage.removeItem(REMOVED_TOAST_KEY)
        setToastOpen(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    setPage(1)
  }, [query, typeFilter, statusFilter])

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
        if (statusFilter === 'ativo' && item.status !== 'ativo') return false
        if (statusFilter === 'inativo' && item.status !== 'inativo') return false
        if (statusFilter === 'consignados' && item.consigned !== 'Sim') return false
        if (statusFilter === 'nao_consignados' && item.consigned === 'Sim') return false
        if (statusFilter === 'a_venda') {
          const hasSalePrice = Boolean(item.salePrice.trim())
          if (!hasSalePrice || item.sold) return false
        }
        if (statusFilter === 'vendidos' && !item.sold) return false
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageFrom = (currentPage - 1) * pageSize
  const pageItems = filtered.slice(pageFrom, pageFrom + pageSize)
  const showingFrom = filtered.length === 0 ? 0 : pageFrom + 1
  const showingTo = Math.min(filtered.length, pageFrom + pageSize)

  function renderListPager() {
    return (
    <div className="products__list-pager">
      <div className="products__list-pager-left">
        <select
          className="products__list-pager-size"
          value={pageSize}
          aria-label="Itens por página"
          onChange={(event) => {
            setPageSize(Number(event.target.value))
            setPage(1)
          }}
        >
          {LIST_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="products__list-pager-info">
          {`Mostrando ${showingFrom} - ${showingTo} do total de ${filtered.length}`}
        </span>
      </div>
      <div className="products__list-pager-nav">
        <button
          type="button"
          className="products__list-pager-btn"
          aria-label="Primeira página"
          disabled={currentPage <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronsLeft size={15} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="products__list-pager-btn"
          aria-label="Página anterior"
          disabled={currentPage <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          <ChevronLeft size={15} strokeWidth={2.25} />
        </button>
        <button type="button" className="products__list-pager-btn is-active" aria-current="page">
          {currentPage}
        </button>
        <button
          type="button"
          className="products__list-pager-btn"
          aria-label="Próxima página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          <ChevronRight size={15} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="products__list-pager-btn"
          aria-label="Última página"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronsRight size={15} strokeWidth={2.25} />
        </button>
      </div>
    </div>
    )
  }

  return (
    <div className="products">
      <SaveToast
        open={toastOpen}
        message="Produto removido com sucesso."
        onClose={closeToast}
      />
      <section className="products__card products__card--list">
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
              className={`products__select${typeFilter === 'todos' ? ' is-placeholder' : ''}`}
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
            <ChevronDown size={14} strokeWidth={2} className="products__select-icon" />
          </label>

          <label className="products__select-wrap products__select-wrap--status">
            <select
              className={`products__select${statusFilter === 'todos' ? ' is-placeholder' : ''}`}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProductListFilter)}
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

        {renderListPager()}

        <div className="products__table-wrap products__table-wrap--list">
          <table className="products__table products__table--list">
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
                      size={12}
                      strokeWidth={2.5}
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
                pageItems.map((item) => {
                  const codes = formatProductCodes(item)
                  const chips = productAttributeChips(item)
                  const typeParts = splitProductTypeLabel(item.type)
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
                      <td className="products__type-cell">
                        {typeParts.title || typeParts.code ? (
                          <div className="products__type">
                            {typeParts.title ? (
                              <span className="products__type-title">{typeParts.title}</span>
                            ) : null}
                            {typeParts.code ? (
                              <span className="products__type-code">{typeParts.code}</span>
                            ) : null}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="products__rental-cell">{item.rental || '—'}</td>
                      <td>
                        {chips.length > 0 ? (
                          <div className="products__chips">
                            {chips.map((chip) => (
                              <span
                                key={`${chip.label}-${chip.value}`}
                                className="products__chip"
                              >
                                {chip.label ? (
                                  <>
                                    <span>{chip.label}:</span>
                                    <span>{chip.value}</span>
                                  </>
                                ) : (
                                  chip.value
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="products__actions-cell">
                        <IconActions>
                          <IconAction
                            kind="history"
                            tip="Histórico do produto"
                            aria-label={`Histórico de ${item.name}`}
                            onClick={() => setHistoryProduct(item)}
                          />
                          <IconAction
                            kind="view"
                            tip="Visualizar produto"
                            onClick={() => navigate(`/produtos/${item.id}`)}
                          />
                          <IconAction
                            kind="delete"
                            tip="Excluir produto"
                            aria-label={`Excluir ${item.name}`}
                            onClick={() => setDeleting(item)}
                          />
                        </IconActions>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {renderListPager()}
      </section>

      {historyProduct ? (
        <ProductHistoryModal product={historyProduct} onClose={closeHistory} />
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
          if (!deleting) {
            setDeleting(null)
            return
          }
          deleteProduct(deleting.id)
          setDeleting(null)
          try {
            sessionStorage.setItem(REMOVED_TOAST_KEY, '1')
          } catch {
            // ignore storage errors
          }
          window.location.assign(`${window.location.pathname}${window.location.search}`)
        }}
      />
    </div>
  )
}

function formatHistoryMoney(value: number) {
  const negative = value < 0
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negative ? '-' : ''}R$ ${withDots},${decPart}`
}

function formatHistoryDay(value: string) {
  const [datePart] = value.split('T')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function historyLines(order: Order): OrderLine[] {
  return Array.isArray(order.lines) ? order.lines : []
}

function lineMatchesProduct(line: OrderLine, product: Product) {
  if (line.productId && line.productId === product.id) return true
  const code = product.fullCode.trim().toLocaleLowerCase('pt-BR')
  const lineCode = String(line.fullCode || '').trim().toLocaleLowerCase('pt-BR')
  if (code && lineCode && code === lineCode) return true
  const name = product.name.trim().toLocaleLowerCase('pt-BR')
  const lineName = String(line.name || '').trim().toLocaleLowerCase('pt-BR')
  return Boolean(name && lineName && name === lineName)
}

function ProductHistoryModal({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const orders = useOrders()
  const rows = useMemo(() => {
    return orders.flatMap((order) => {
      const matched = historyLines(order).filter((line) => lineMatchesProduct(line, product))
      if (matched.length === 0) return []
      const value = matched.reduce((sum, line) => sum + (Number(line.value) || 0), 0)
      return [{ order, value }]
    })
  }, [orders, product])
  const totalOut = rows.reduce((sum, row) => sum + row.value, 0)
  const costValue = moneyBrToNumber(product.cost)
  const costLabel = product.cost.trim() && costValue > 0 ? formatHistoryMoney(costValue) : '-'
  const titleCode = product.fullCode.trim() || product.name.trim()

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
      <button type="button" className="products-modal__overlay" aria-label="Fechar" onClick={onClose} />
      <div
        className="products-modal__dialog products-modal__dialog--history"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-history-title"
      >
        <header className="products-modal__header">
          <h2 id="product-history-title">Histórico do produto {titleCode}</h2>
          <button type="button" className="products-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="products-modal__body products-history">
          <div className="products-history__head">
            <span>Pedido</span>
            <span>Datas</span>
            <span>Valor</span>
            <span>Status</span>
          </div>
          {rows.length === 0 ? (
            <p className="products-history__empty">Nenhum histórico encontrado.</p>
          ) : (
            <ul className="products-history__list">
              {rows.map(({ order, value }) => {
                const created = formatHistoryDay(order.createdAt)
                const eventDay = formatHistoryDay(order.eventDate)
                return (
                  <li key={order.id} className="products-history__row">
                    <div className="products-history__order">
                      <span className="products-history__number">{order.number}</span>
                      <span className="products-history__client">{order.clientName}</span>
                      {eventDay ? <span className="products-history__event">Evento em {eventDay}</span> : null}
                    </div>
                    <div className="products-history__dates">
                      {created ? (
                        <span className="products-history__date">
                          <Calendar size={14} strokeWidth={2} />
                          {created}
                        </span>
                      ) : null}
                      {eventDay ? (
                        <span className="products-history__date">
                          <ArrowLeft size={14} strokeWidth={2} />
                          {eventDay}
                        </span>
                      ) : null}
                    </div>
                    <span className="products-history__money">{formatHistoryMoney(value)}</span>
                    <span className="products-history__status">{order.status}</span>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="products-history__totals">
            <span>
              <strong>Total em saídas:</strong> {formatHistoryMoney(totalOut)}
            </span>
            <span>
              <strong>Custo:</strong> {costLabel}
            </span>
            <span>
              <strong>Total geral:</strong> {formatHistoryMoney(totalOut)}
            </span>
          </p>
        </div>
      </div>
    </div>,
    document.body,
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

function kindFromParam(value: string | null): ProductAttributeKind {
  if (value && value in ATTRIBUTE_KIND_META) return value as ProductAttributeKind
  return 'cor'
}

function ProductsAtributos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const kind = kindFromParam(searchParams.get('kind'))
  const setKind = (next: ProductAttributeKind) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', 'atributos')
    if (next === 'cor') nextParams.delete('kind')
    else nextParams.set('kind', next)
    setSearchParams(nextParams, { replace: true })
  }
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
  const [toastKey, setToastKey] = useState(0)

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

  const flashToast = (message: string) => {
    setToast(message)
    setToastKey((key) => key + 1)
  }

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
      flashToast(meta.toastUpdated)
    } else {
      addProductAttribute(kind, name)
      flashToast(meta.toastCreated)
    }
    setModalOpen(false)
  }

  return (
    <div className="products">
      <SaveToast
        key={toastKey}
        open={Boolean(toast)}
        message={toast ?? undefined}
        onClose={() => setToast(null)}
      />

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
                        <IconActions>
                          <IconAction
                            kind="edit"
                            tip="Editar"
                            aria-label={`Editar ${item.name}`}
                            onClick={() => openEdit(item)}
                          />
                          <IconAction
                            kind="delete"
                            tip="Excluir valor"
                            aria-label={`Excluir ${item.name}`}
                            onClick={() => setDeleting(item)}
                          />
                        </IconActions>
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
        question={
          deleting ? <>Deseja realmente excluir {deleting.name}?</> : undefined
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting
          setDeleting(null)
          if (!target) return
          deleteProductAttribute(target.id)
          flashToast('Atributo removido.')
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
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success')

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

  const nextCode = nextProductTypeCode()

  const showToast = (message: string, variant: 'success' | 'danger' = 'success') => {
    setToastVariant(variant)
    setToast(message)
  }

  const openCreate = useCallback(() => {
    setEditing(null)
    setName('')
    setDescription('')
    setModalOpen(true)
  }, [])

  useProductsSubheaderAction({ label: 'Adicionar tipo', onClick: openCreate })

  const save = () => {
    if (!name.trim()) return
    if (editing) {
      updateProductType(editing.id, name, description)
      showToast('Tipo atualizado.')
    } else {
      addProductType(name, description)
      showToast('Novo Tipo cadastrado.')
    }
    setModalOpen(false)
  }

  return (
    <div className="products">
      <SaveToast
        open={Boolean(toast)}
        message={toast ?? undefined}
        variant={toastVariant}
        onClose={() => setToast(null)}
      />

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
                <th className="products__col-id">
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
                <th className="products__col-type-name">Nome</th>
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
                    <td className="products__col-id">{formatProductTypeCode(item.code)}</td>
                    <td className="products__col-type-name">{item.name}</td>
                    <td className="products__actions-cell">
                      <IconActions>
                        <IconAction
                          kind="edit"
                          tip="Editar"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => {
                            setEditing(item)
                            setName(item.name)
                            setDescription(item.description)
                            setModalOpen(true)
                          }}
                        />
                        <IconAction
                          kind="delete"
                          tip="Excluir"
                          aria-label={`Excluir ${item.name}`}
                          onClick={() => setDeleting(item)}
                        />
                      </IconActions>
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
        <ProductTypeModal
          title={editing ? 'Atualizando tipo de produto' : 'Novo tipo de produto'}
          tip={
            editing ? undefined : (
              <>
                O código deste novo tipo será <strong>{nextCode}</strong>.
              </>
            )
          }
          name={name}
          description={description}
          saveLabel={editing ? 'Salvar' : 'Cadastrar'}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title="Excluir tipo de produto"
        message={
          <>
            Você está prestes a remover um tipo de produto. Esta ação não poderá ser desfeita.
          </>
        }
        question={
          deleting ? <>Deseja realmente excluir {deleting.name}?</> : undefined
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) {
            setDeleting(null)
            return
          }
          const linked = countProductsUsingType(deleting)
          if (linked > 0) {
            setDeleting(null)
            showToast(
              linked === 1
                ? 'Não é possível excluir: existe 1 produto vinculado a este tipo.'
                : `Não é possível excluir: existem ${linked} produtos vinculados a este tipo.`,
              'danger',
            )
            return
          }
          deleteProductType(deleting.id)
          setDeleting(null)
          showToast('Tipo de produto excluído.')
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
        item.type.toLocaleLowerCase('pt-BR').includes(q) ||
        item.fullCode.toLocaleLowerCase('pt-BR').includes(q) ||
        item.storeCode.toLocaleLowerCase('pt-BR').includes(q)
      )
    })
    setResults(list)
    setSearched(true)
  }

  return (
    <div className="products">
      <p className="products__alert products__alert--warn">
        <strong>Atenção:</strong> esta tela altera vários produtos de uma vez. Antes de salvar, o
        sistema exibirá uma confirmação com o antes/depois. A operação não possui reversão
        automática.
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
              placeholder="Nome, código ou código loja"
            />
          </label>
          <label className="products__consulta-field">
            <span>Tipos</span>
            <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value=""></option>
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
              <option value=""></option>
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
              <option value=""></option>
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
              <option value="">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </label>
          <label className="products__consulta-field">
            <span>Marcas</span>
            <select value={marca} onChange={(event) => setMarca(event.target.value)}>
              <option value=""></option>
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
              <option value=""></option>
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
            <Search size={15} strokeWidth={2} />
            Buscar produtos
          </button>
        </div>
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
