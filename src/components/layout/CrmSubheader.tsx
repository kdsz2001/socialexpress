import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { getCrmState, subscribeCrm } from '../../lib/crmStore'
import './ClientsSubheader.css'
import './CrmSubheader.css'

export function CrmSubheader() {
  const [connected, setConnected] = useState(() => getCrmState().status === 'connected')

  useEffect(() => {
    setConnected(getCrmState().status === 'connected')
    return subscribeCrm(() => setConnected(getCrmState().status === 'connected'))
  }, [])

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">CRM</h1>
        <span className={`crm-subheader__status${connected ? ' is-on' : ''}`}>
          {connected ? <Wifi size={14} strokeWidth={2.25} /> : <WifiOff size={14} strokeWidth={2.25} />}
          {connected ? 'WhatsApp conectado' : 'WhatsApp desconectado'}
        </span>
      </div>
    </header>
  )
}
