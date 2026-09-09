import { CloudUpload } from 'lucide-react'
import { useSuppliers } from '../../hooks/useSuppliers'
import './ClientsSubheader.css'

export function SuppliersSubheader() {
  const suppliers = useSuppliers()
  const count = suppliers.length

  const countLabel =
    count === 0
      ? 'Nenhum fornecedor cadastrado'
      : count === 1
        ? '1 fornecedor cadastrado'
        : `${count} fornecedores cadastrados`

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Fornecedores</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{countLabel}</p>
      </div>

      <div className="clients-subheader__actions">
        <button
          type="button"
          className="clients-subheader__btn"
          aria-label="Importar fornecedores"
        >
          <CloudUpload size={18} strokeWidth={2} />
          <span className="clients-subheader__tooltip" role="tooltip">
            Importar fornecedores
          </span>
        </button>
      </div>
    </header>
  )
}
