import { CloudUpload, Download } from 'lucide-react'
import './ClientsSubheader.css'

export function ClientsSubheader() {
  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Clientes</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">Nenhum cliente cadastrado</p>
      </div>

      <div className="clients-subheader__actions">
        <button
          type="button"
          className="clients-subheader__btn"
          aria-label="Importar clientes"
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
    </header>
  )
}
