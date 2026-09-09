import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  ClipboardList,
  Coins,
  FolderKanban,
  Handshake,
  HandCoins,
  RefreshCcw,
} from 'lucide-react'
import './Reports.css'

type ReportCard = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const REPORTS: ReportCard[] = [
  {
    id: 'separacao',
    title: 'Separação',
    description:
      'Separe os produtos que estão com datas marcadas para provas, retiradas, eventos e devoluções.',
    icon: ClipboardList,
  },
  {
    id: 'pedidos',
    title: 'Pedidos',
    description:
      'Consulte todos os pedidos da loja, constando os valores pagos e os em aberto, incluindo gráficos para comparações e análises dos meses anteriores.',
    icon: BarChart3,
  },
  {
    id: 'indisponibilidade',
    title: 'Indisponibilidade de produtos',
    description:
      'Consulte os produtos por um determinado período que não estarão na sua loja, podendo usar este relatório como consulta de produtos que não deverão ser mostrados para novos clientes naquele período.',
    icon: FolderKanban,
  },
  {
    id: 'rotatividade',
    title: 'Rotatividade de produtos',
    description:
      'Analise a rotatividade dos produtos em sua loja, identificando quantas vezes foram locados e o quanto rendeu financeiramente.',
    icon: RefreshCcw,
  },
  {
    id: 'creditos',
    title: 'Créditos',
    description: 'Consulte o crédito de clientes e as transferências de crédito entre eles.',
    icon: Coins,
  },
  {
    id: 'consignados',
    title: 'Consignados',
    description: 'Tenha acesso a todos os produtos que estão reservados.',
    icon: Handshake,
  },
  {
    id: 'comissoes',
    title: 'Comissões',
    description: 'Acesse o histórico completo de comissões de vendedores.',
    icon: HandCoins,
  },
]

export function Reports() {
  return (
    <div className="reports">
      <div className="reports__grid">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <article key={report.id} className="reports__card">
              <div className="reports__icon" aria-hidden="true">
                <Icon size={48} strokeWidth={1.5} />
              </div>
              <div className="reports__body">
                <h2 className="reports__title">{report.title}</h2>
                <p className="reports__desc">{report.description}</p>
                <button type="button" className="reports__btn">
                  Clique para ver
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
