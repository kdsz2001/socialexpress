import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCrmState, subscribeCrm, formatMoneyBr, getCrmValueStats } from '../../lib/crmStore'
import './ClientsSubheader.css'
import './CrmSubheader.css'

function titleFromTab(tab: string | null) {
  if (tab === 'analise') return 'Análise'
  if (tab === 'sequencias') return 'Sequências'
  if (tab === 'trajes') return 'Trajes e valores'
  if (tab === 'novo') return 'Novo contato'
  return 'Contatos'
}

export function CrmSubheader() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const title = titleFromTab(tab)
  const [leadCount, setLeadCount] = useState(() => getCrmState().leads.length)
  const [potential, setPotential] = useState(() => getCrmValueStats().totals.all)

  useEffect(() => {
    const sync = () => {
      const state = getCrmState()
      setLeadCount(state.leads.length)
      setPotential(getCrmValueStats(state).totals.all)
    }
    sync()
    return subscribeCrm(sync)
  }, [])

  const subtitle =
    tab === 'novo'
      ? 'Cadastre nome, número, data e traje'
      : tab === 'analise'
        ? `${leadCount} contato${leadCount === 1 ? '' : 's'} · potencial ${formatMoneyBr(potential)}`
        : tab === 'sequencias'
          ? 'Rechamadas no WhatsApp para leads sem resposta'
          : tab === 'trajes'
            ? 'Catálogo e valores estimados'
            : `${leadCount} contato${leadCount === 1 ? '' : 's'} · potencial ${formatMoneyBr(potential)}`

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{subtitle}</p>
      </div>
    </header>
  )
}
