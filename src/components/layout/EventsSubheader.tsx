import { useLocation } from 'react-router-dom'
import './ClientsSubheader.css'

export function EventsSubheader() {
  const { pathname } = useLocation()
  const title =
    pathname === '/eventos/novo'
      ? 'Novo evento'
      : pathname.startsWith('/eventos/')
        ? 'Editar evento'
        : 'Eventos'

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
      </div>
    </header>
  )
}
