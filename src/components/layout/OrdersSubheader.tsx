import { useLocation, useNavigate } from 'react-router-dom'
import './ClientsSubheader.css'

export function OrdersSubheader() {
  const location = useLocation()
  const navigate = useNavigate()
  const isNew = location.pathname === '/pedidos/novo'
  const isView = /^\/pedidos\/[^/]+$/.test(location.pathname)
  const title = isNew ? 'Novo pedido' : isView ? 'Todos pedidos' : 'Pedidos'

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">
          {isView ? (
            <button type="button" className="clients-subheader__back" onClick={() => navigate('/pedidos')}>
              {title}
            </button>
          ) : (
            title
          )}
        </h1>
      </div>
    </header>
  )
}
