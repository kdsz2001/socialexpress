import { ArrowDown, ArrowUp, FileSpreadsheet, Printer } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { requestCashMovement } from '../../lib/financialUi'
import './ClientsSubheader.css'
import './FinanceiroSubheader.css'

const TITLES: Record<string, string> = {
  caixa: 'Movimentações do caixa',
  pagar: 'Contas a pagar',
  receber: 'Contas a receber',
  dre: 'DRE',
}

export function FinanceiroSubheader() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const key =
    tab === 'pagar' || tab === 'receber' || tab === 'dre' ? tab : 'caixa'
  const title = TITLES[key]
  const showActions = key === 'caixa'

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
      </div>

      {showActions ? (
        <div className="clients-subheader__actions">
          <button
            type="button"
            className="clients-subheader__btn financeiro-subheader__btn--income"
            aria-label="Nova entrada"
            onClick={() => requestCashMovement('entrada')}
          >
            <ArrowDown size={18} strokeWidth={2.25} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Nova entrada
            </span>
          </button>
          <button
            type="button"
            className="clients-subheader__btn financeiro-subheader__btn--expense"
            aria-label="Nova saída"
            onClick={() => requestCashMovement('saida')}
          >
            <ArrowUp size={18} strokeWidth={2.25} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Nova saída
            </span>
          </button>
          <button type="button" className="clients-subheader__btn" aria-label="Imprimir">
            <Printer size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Imprimir
            </span>
          </button>
          <button
            type="button"
            className="clients-subheader__btn clients-subheader__btn--export"
            aria-label="Exportar"
          >
            <FileSpreadsheet size={18} strokeWidth={2} />
            <span className="clients-subheader__tooltip" role="tooltip">
              Exportar
            </span>
          </button>
        </div>
      ) : null}
    </header>
  )
}
