import { useState } from 'react'
import { ArrowLeft, CloudUpload, Download } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ImportClientsModal } from '../clients/ImportClientsModal'
import { useClients } from '../../hooks/useClients'
import { getClient, getClientDisplayName } from '../../lib/clientsStore'
import './ClientsSubheader.css'

function detailIdFromPath(pathname: string) {
  const match = pathname.match(/^\/clientes\/([^/]+)$/)
  if (!match) return null
  if (match[1] === 'cadastrar') return null
  return match[1]
}

export function ClientsSubheader() {
  const location = useLocation()
  const navigate = useNavigate()
  const clients = useClients()
  const [searchParams] = useSearchParams()
  const isCreate = location.pathname === '/clientes/cadastrar'
  const detailId = detailIdFromPath(location.pathname)
  const isDetail = Boolean(detailId)
  const detailClient = detailId ? getClient(detailId) : undefined
  const isBirthdays = searchParams.get('tab') === 'aniversariantes'
  const isWhatsapp = searchParams.get('tab') === 'whatsapp'
  const [importOpen, setImportOpen] = useState(false)

  const title = isCreate
    ? 'Cadastro de clientes'
    : isDetail
      ? 'Detalhes do cliente'
      : isBirthdays
        ? 'Clientes aniversariantes'
        : isWhatsapp
          ? 'WhatsApp em massa'
          : 'Clientes'

  // re-read on clients change for name updates after save
  const detailName = detailClient
    ? getClientDisplayName(
        clients.find((c) => c.id === detailId) ?? detailClient,
      )
    : ''

  const showListActions = !isCreate && !isDetail && !isBirthdays && !isWhatsapp
  const showCount =
    !isCreate && !isDetail && !isWhatsapp
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
          {showCount && (
            <>
              <span className="clients-subheader__sep" aria-hidden="true" />
              <p className="clients-subheader__subtitle">{countLabel}</p>
            </>
          )}
          {isDetail && detailName ? (
            <>
              <span className="clients-subheader__sep" aria-hidden="true" />
              <p className="clients-subheader__subtitle">{detailName}</p>
            </>
          ) : null}
        </div>

        {showListActions && (
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

        {isDetail && (
          <button
            type="button"
            className="clients-subheader__back"
            onClick={() => navigate('/clientes')}
          >
            <ArrowLeft size={16} strokeWidth={2.25} />
            Voltar
          </button>
        )}
      </header>

      <ImportClientsModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  )
}
