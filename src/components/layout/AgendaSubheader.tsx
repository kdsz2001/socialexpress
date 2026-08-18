import { Plus } from 'lucide-react'
import './ClientsSubheader.css'

type AgendaSubheaderProps = {
  onNewAppointment?: () => void
}

export function AgendaSubheader({ onNewAppointment }: AgendaSubheaderProps) {
  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Agenda</h1>
      </div>
      <div className="clients-subheader__actions">
        <button
          type="button"
          className="clients-subheader__primary"
          onClick={onNewAppointment}
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo agendamento
        </button>
      </div>
    </header>
  )
}
