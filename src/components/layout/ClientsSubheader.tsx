import { useState } from 'react'
import { CloudUpload, Download } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ImportClientsModal } from '../clients/ImportClientsModal'
import { useClients } from '../../hooks/useClients'
import './ClientsSubheader.css'

export function ClientsSubheader() {
  const location = useLocation()
  const clients = useClients()
  const [searchParams] = useSearchParams()
  const isCreate = location.pathname === '/clientes/cadastrar'
  const isBirthdays = searchParams.get('tab') === 'aniversariantes'
  const isWhatsapp = searchParams.get('tab') === 'whatsapp'
  const [importOpen, setImportOpen] = useState(false)

  const title = isCreate
    ? 'Cadastro de clientes'
    : isBirthdays
      ? 'Clientes aniversariantes'
      : isWhatsapp
        ? 'WhatsApp em massa'
        : 'Clientes'

  const showListChrome = !isCreate && !isBirthdays && !isWhatsapp
  const countLabel =
    clients.length === 0
      ? 'Nenhum cliente cadastrado'
      : clients.length === 1
        ? '1 cliente cadastrado'
        : `${clients.length} clientes cadastrados`

  return (
    <>
      <header className="clients-subheader">
        <div className="clients-subheader__heading">
          <h1 className="clients-subheader__title">{title}</h1>
          {showListChrome && (
            <>
              <span className="clients-subheader__sep" aria-hidden="true" />
              <p className="clients-subheader__subtitle">{countLabel}</p>
            </>
          )}
        </div>

        {showListChrome && (
          <div className="clients-subheader__actions">
            <button
              type="button"
              className="clients-subheader__btn"
              aria-label="Importar clientes"
              onClick={() => setImportOpen(true)}
            >
              <CloudUpload size={18} strokeWidth={2} />
              <span className="clients-subheader__tooltip" role="tooltip">
                Importar clientes
              </span>
            </button>
            <button
              type="button"
              className="clients-subheader__btn clients-subheader__btn--export"
              aria-label="Exportar clientes"
            >
              <Download size={18} strokeWidth={2} />
              <span className="clients-subheader__tooltip" role="tooltip">
                Exportar clientes
              </span>
            </button>
          </div>
        )}
      </header>

      <ImportClientsModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
