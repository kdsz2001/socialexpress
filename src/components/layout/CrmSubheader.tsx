import { useEffect, useState } from 'react'
import { getCrmState, subscribeCrm, formatMoneyBr, getCrmValueStats } from '../../lib/crmStore'
import './ClientsSubheader.css'
import './CrmSubheader.css'

export function CrmSubheader() {
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

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">CRM Comercial</h1>
        <span className="crm-subheader__meta">
          {leadCount} contato{leadCount === 1 ? '' : 's'}
          <span className="crm-subheader__dot" aria-hidden>
            ·
          </span>
          Potencial {formatMoneyBr(potential)}
        </span>
      </div>
    </header>
  )
}
