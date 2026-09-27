import { useLocation } from 'react-router-dom'
import './ClientsSubheader.css'

export function OrdersSubheader() {
  const location = useLocation()
  const title = location.pathname === '/pedidos/novo' ? 'Novo pedido' : 'Pedidos'

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
      </div>
    </header>
  )
}
