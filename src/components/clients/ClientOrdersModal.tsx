import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { IconAction } from '../ui/IconAction'
import type { Order, OrderStatus } from '../../lib/ordersStore'
import './ClientOrdersModal.css'

const PAGE_SIZE = 10

function formatDay(value: string) {
  const [datePart] = value.split('T')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function moneyToNumber(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : 0
}

function formatMoney(value: number) {
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${value < 0 ? '-' : ''}R$ ${withDots},${decPart}`
}

function orderAmount(order: Order) {
  const total = moneyToNumber(order.total)
  if (total) return total
  return (order.lines ?? []).reduce((sum, line) => sum + (Number(line.value) || 0), 0)
}

function statusClass(status: OrderStatus) {
  if (status === 'Anulado') return 'is-canceled'
  if (status === 'Concluído') return 'is-done'
  if (status === 'Confirmado') return 'is-confirmed'
  return 'is-open'
}

export function ClientOrdersModal({
  clientName,
  orders,
  onClose,
  onOpenOrder,
}: {
  clientName: string
  orders: Order[]
  onClose: () => void
  onOpenOrder: (order: Order) => void
}) {
  const [page, setPage] = useState(1)
  const sorted = useMemo(
    () => orders.slice().sort((a, b) => b.number - a.number || b.createdAt.localeCompare(a.createdAt)),
    [orders],
  )
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const total = sorted.reduce((sum, order) => sum + orderAmount(order), 0)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="client-orders" role="presentation">
      <button type="button" className="client-orders__overlay" aria-label="Fechar" onClick={onClose} />
      <div className="client-orders__dialog" role="dialog" aria-modal="true" aria-labelledby="client-orders-title">
        <header className="client-orders__header">
          <h2 id="client-orders-title">Histórico dos pedidos do {clientName}</h2>
          <button type="button" className="client-orders__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="client-orders__body">
          <table className="client-orders__table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Status</th>
                <th className="is-right">Valor</th>
                <th className="client-orders__actions" aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="client-orders__empty" colSpan={4}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                rows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="client-orders__number">
                        <strong>{order.number}</strong>
                        <span>{formatDay(order.eventDate || order.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`client-orders__status ${statusClass(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="is-right">{formatMoney(orderAmount(order))}</td>
                    <td className="client-orders__actions">
                      <IconAction kind="link" tip="Ver o pedido" onClick={() => onOpenOrder(order)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="client-orders__total">
            Total em pedidos: <strong>{formatMoney(total)}</strong>
          </p>
          <div className="client-orders__pager">
            <button type="button" aria-label="Página anterior" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{current}</span>
            <button type="button" aria-label="Próxima página" disabled={current >= pages} onClick={() => setPage(current + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
