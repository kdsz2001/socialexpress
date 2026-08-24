import {
  ClipboardList,
  CloudUpload,
  Download,
  Tag,
} from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { countActiveProducts } from '../../lib/productsStore'
import './ClientsSubheader.css'

export function ProductsSubheader() {
  const products = useProducts()
  const activeCount = countActiveProducts()
  // re-read when products list identity changes
  void products

  const statusLabel =
    activeCount === 0
      ? 'Nenhum produto ativo'
      : activeCount === 1
        ? '1 produto ativo'
        : `${activeCount} produtos ativos`

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Produtos</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{statusLabel}</p>
      </div>

      <div className="clients-subheader__actions">
        <button
          type="button"
          className="clients-subheader__btn"
          aria-label="Importar produtos"
        >
          <CloudUpload size={18} strokeWidth={2} />
          <span className="clients-subheader__tooltip" role="tooltip">
            Importar produtos
          </span>
        </button>
        <button
          type="button"
          className="clients-subheader__btn clients-subheader__btn--export"
          aria-label="Exportar produtos"
        >
          <Download size={18} strokeWidth={2} />
          <span className="clients-subheader__tooltip" role="tooltip">
            Exportar produtos
          </span>
        </button>
        <button
          type="button"
          className="clients-subheader__btn"
          aria-label="Lista de produtos"
        >
          <ClipboardList size={18} strokeWidth={2} />
          <span className="clients-subheader__tooltip" role="tooltip">
            Lista de produtos
          </span>
        </button>
        <button
          type="button"
          className="clients-subheader__btn clients-subheader__btn--export"
          aria-label="Preços"
        >
          <Tag size={18} strokeWidth={2} />
          <span className="clients-subheader__tooltip" role="tooltip">
            Preços
          </span>
        </button>
      </div>
    </header>
  )
}
