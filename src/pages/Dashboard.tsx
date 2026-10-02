import { useMemo, useState } from 'react'
import { ClipboardList, Banknote, ShoppingCart } from 'lucide-react'
import { HangerIcon } from '../components/icons/HangerIcon'
import { CurveRightIcon } from '../components/icons/CurveRightIcon'
import { CurveLeftIcon } from '../components/icons/CurveLeftIcon'
import { StatusCard } from '../components/dashboard/StatusCard'
import { OrdersModal, type DashboardKind, type DashboardWindow } from '../components/dashboard/OrdersModal'
import { ResultsCard } from '../components/dashboard/ResultsCard'
import { AccountsCard } from '../components/dashboard/AccountsCard'
import { AgendaCard } from '../components/dashboard/AgendaCard'
import { useOrders } from '../hooks/useOrders'
import type { Order } from '../lib/ordersStore'
import './Dashboard.css'

const KINDS: DashboardKind[] = ['Provas', 'Retiradas', 'Devoluções']

const ICONS = {
  Provas: HangerIcon,
  Retiradas: CurveRightIcon,
  Devoluções: CurveLeftIcon,
} as const

const resultRows = [
  { label: 'Total de pedidos', value: 'R$ 0,00', icon: ClipboardList },
  { label: 'Total recebido', value: 'R$ 0,00', icon: Banknote },
  { label: 'Número de pedidos', value: '0', icon: ShoppingCart },
]

const WINDOW_TITLE: Record<DashboardWindow, string> = {
  overdue: 'em atraso',
  today: 'de hoje',
  upcoming: 'nos próximos 10 dias',
}

function parseDay(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function todayStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function windowOf(order: Order, today: Date): DashboardWindow | null {
  if (order.status === 'Anulado' || order.status === 'Cancelado' || !order.eventDate) return null
  const day = parseDay(order.eventDate)
  if (!day) return null
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 10) return 'upcoming'
  return null
}

function titleFor(kind: DashboardKind, frame: DashboardWindow) {
  if (frame === 'today') return `${kind} de hoje`
  if (frame === 'overdue') return `${kind} em atraso`
  return `${kind} ${WINDOW_TITLE.upcoming}`
}

export function Dashboard() {
  const orders = useOrders()
  const today = useMemo(() => todayStart(), [])
  const [opened, setOpened] = useState<{ kind: DashboardKind; frame: DashboardWindow } | null>(null)

  const grouped = useMemo(() => {
    const buckets: Record<DashboardWindow, Order[]> = { overdue: [], today: [], upcoming: [] }
    for (const order of orders) {
      const frame = windowOf(order, today)
      if (frame) buckets[frame].push(order)
    }
    for (const frame of Object.keys(buckets) as DashboardWindow[]) {
      buckets[frame].sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.number - b.number)
    }
    return buckets
  }, [orders, today])

  const itemsFor = (frame: DashboardWindow) =>
    KINDS.map((kind) => ({
      label: kind,
      value: grouped[frame].length,
      icon: ICONS[kind],
    }))

  return (
    <div className="dashboard">
      <div className="dashboard__grid">
        <StatusCard
          title="Em atraso"
          theme="overdue"
          items={itemsFor('overdue')}
          onOpen={(label) => setOpened({ kind: label as DashboardKind, frame: 'overdue' })}
        />
        <StatusCard
          title="Hoje"
          theme="today"
          items={itemsFor('today')}
          onOpen={(label) => setOpened({ kind: label as DashboardKind, frame: 'today' })}
        />
        <StatusCard
          title="Próximos 10 dias"
          theme="upcoming"
          items={itemsFor('upcoming')}
          onOpen={(label) => setOpened({ kind: label as DashboardKind, frame: 'upcoming' })}
        />

        <ResultsCard title="Resultados do dia" rows={resultRows} />
        <ResultsCard title="Resultados da semana" rows={resultRows} />
        <ResultsCard title="Resultados do mês" rows={resultRows} />

        <AccountsCard title="Contas a pagar" total="R$ 0,00" quantity={0} theme="payable" />
        <AccountsCard title="Contas a receber" total="R$ 0,00" quantity={0} theme="receivable" />
        <AgendaCard />
      </div>
      {opened ? (
        <OrdersModal
          title={titleFor(opened.kind, opened.frame)}
          kind={opened.kind}
          orders={grouped[opened.frame]}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </div>
  )
}
