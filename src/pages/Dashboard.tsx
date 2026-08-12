import {
  Shirt,
  PackageCheck,
  RotateCcw,
  ClipboardList,
  Banknote,
  ShoppingCart,
  CircleDollarSign,
} from 'lucide-react'
import { StatusCard } from '../components/dashboard/StatusCard'
import { ResultsCard } from '../components/dashboard/ResultsCard'
import { AccountsCard } from '../components/dashboard/AccountsCard'
import { AgendaCard } from '../components/dashboard/AgendaCard'
import './Dashboard.css'

const statusItems = [
  { label: 'Provas', value: 0, icon: Shirt },
  { label: 'Retiradas', value: 0, icon: PackageCheck },
  { label: 'Devoluções', value: 0, icon: RotateCcw },
]

const resultRows = [
  { label: 'Total de pedidos', value: 'R$ 0,00', icon: ClipboardList },
  { label: 'Total recebido', value: 'R$ 0,00', icon: Banknote },
  { label: 'Número de pedidos', value: '0', icon: ShoppingCart },
]

export function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard__grid">
        <StatusCard title="Em atraso" theme="overdue" items={statusItems} />
        <StatusCard title="Hoje" theme="today" items={statusItems} />
        <StatusCard title="Próximos 10 dias" theme="upcoming" items={statusItems} />

        <ResultsCard title="Resultados do dia" rows={resultRows} />
        <ResultsCard title="Resultados da semana" rows={resultRows} />
        <ResultsCard title="Resultados do mês" rows={resultRows} />

        <AccountsCard
          title="Contas a pagar"
          total="R$ 0,00"
          quantity={0}
          theme="payable"
          icon={CircleDollarSign}
        />
        <AccountsCard
          title="Contas a receber"
          total="R$ 0,00"
          quantity={0}
          theme="receivable"
          icon={CircleDollarSign}
        />
        <AgendaCard />
      </div>
    </div>
  )
}
