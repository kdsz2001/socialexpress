import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { getCrmState, subscribeCrm } from '../../lib/crmStore'
import './ClientsSubheader.css'
import './CrmSubheader.css'

export function CrmSubheader() {
  const [leadCount, setLeadCount] = useState(() => getCrmState().leads.length)

  useEffect(() => {
    setLeadCount(getCrmState().leads.length)
    return subscribeCrm(() => setLeadCount(getCrmState().leads.length))
  }, [])

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">CRM</h1>
        <span className="crm-subheader__status is-on">
          <Sparkles size={14} strokeWidth={2.25} />
          {leadCount} lead{leadCount === 1 ? '' : 's'} · automático
        </span>
      </div>
    </header>
  )
}
