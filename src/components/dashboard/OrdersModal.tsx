import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'
import type { Order, OrderLine } from '../../lib/ordersStore'
import './OrdersModal.css'

export type DashboardKind = 'Provas' | 'Retiradas' | 'Devoluções'
export type DashboardWindow = 'overdue' | 'today' | 'upcoming'

const ACTION_LABEL: Record<DashboardKind, string> = {
  Provas: 'Atualizar status',
  Retiradas: 'Marcar como retirados',
  Devoluções: 'Marcar como devolvidos',
}

function formatDay(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

function formatMoney(value: number) {
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${value < 0 ? '-' : ''}R$ ${withDots},${decPart}`
}

function linesOf(order: Order): OrderLine[] {
  return Array.isArray(order.lines) ? order.lines : []
}

export function OrdersModal({
  title,
  kind,
  orders,
  onClose,
}: {
  title: string
  kind: DashboardKind
  orders: Order[]
  onClose: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const showBalance = kind !== 'Provas'
  const columns = showBalance ? 6 : 5

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
    <div className="dash-orders" role="presentation">
      <button type="button" className="dash-orders__overlay" aria-label="Fechar" onClick={onClose} />
      <div className="dash-orders__dialog" role="dialog" aria-modal="true" aria-labelledby="dash-orders-title">
        <header className="dash-orders__header">
          <h2 id="dash-orders-title">{title}</h2>
          <button type="button" className="dash-orders__close" aria-label="Fechar" onClick={onClose}>
            <X size={13} strokeWidth={2.4} />
          </button>
        </header>
        <div className="dash-orders__body">
          <table className={`dash-orders__table${showBalance ? ' is-balance' : ''}`}>
            <thead>
              <tr>
                <th className="dash-orders__gap" aria-hidden="true" />
                <th className="dash-orders__gap dash-orders__gap--check" aria-hidden="true" />
                <th>Cliente / Pedido</th>
                <th className="dash-orders__date">Data</th>
                {showBalance ? <th className="dash-orders__balance is-right">Saldo</th> : null}
                <th className="dash-orders__actions"><span>Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td className="dash-orders__empty" colSpan={columns}>
                    Nenhum resultado encontrado
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const open = openId === order.id
                  const lines = linesOf(order)
                  return (
                    <OrderRows
                      key={order.id}
                      order={order}
                      open={open}
                      lines={lines}
                      showBalance={showBalance}
                      columns={columns}
                      onToggle={() => setOpenId(open ? null : order.id)}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <footer className="dash-orders__footer">
          <button type="button" className="dash-orders__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="dash-orders__save" onClick={onClose}>
            <Check size={16} strokeWidth={2.5} />
            {ACTION_LABEL[kind]}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function OrderRows({
  order,
  open,
  lines,
  showBalance,
  columns,
  onToggle,
}: {
  order: Order
  open: boolean
  lines: OrderLine[]
  showBalance: boolean
  columns: number
  onToggle: () => void
}) {
  return (
    <>
      <tr className={open ? 'is-open' : undefined}>
        <td className="dash-orders__gap">
          <button
            type="button"
            className={`dash-orders__expand${open ? ' is-open' : ''}`}
            aria-expanded={open}
            aria-label={open ? `Ocultar itens do pedido ${order.number}` : `Ver itens do pedido ${order.number}`}
            onClick={onToggle}
          >
            <ChevronDown size={16} strokeWidth={2.25} />
          </button>
        </td>
        <td className="dash-orders__gap dash-orders__gap--check" />
        <td>
          <button type="button" className="dash-orders__who" onClick={onToggle}>
            <strong>{order.clientName || 'Cliente'}</strong>
            <span>Pedido {order.number}</span>
          </button>
        </td>
        <td>{formatDay(order.eventDate)}</td>
        {showBalance ? <td className="is-right">{order.total.trim() || 'R$ 0,00'}</td> : null}
        <td className="dash-orders__actions" />
      </tr>
      {open ? (
        <tr className="dash-orders__detail">
          <td colSpan={columns}>
            <table className="dash-orders__items">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th className="is-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td className="dash-orders__empty" colSpan={3}>
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={`${line.productId}-${line.fullCode}-${index}`}>
                      <td>{line.fullCode || '—'}</td>
                      <td>{line.name || 'Produto'}</td>
                      <td className="is-right">{formatMoney(Number(line.value) || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </td>
        </tr>
      ) : null}
    </>
  )
}
