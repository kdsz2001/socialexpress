import { CalendarDays } from 'lucide-react'
import './AgendaCard.css'

export function AgendaCard() {
  return (
    <section className="agenda-card">
      <div className="agenda-card__header">
        <h2 className="agenda-card__title">Agenda do dia</h2>
        <span className="agenda-card__icon">
          <CalendarDays size={20} strokeWidth={2} />
        </span>
      </div>
      <p className="agenda-card__empty">
        Nenhum compromisso marcado pra hoje...
      </p>
    </section>
  )
}
