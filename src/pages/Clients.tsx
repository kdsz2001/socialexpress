import { useState } from 'react'
import { Search, CloudUpload, Download, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import './Clients.css'

export function Clients() {
  const [searchParams] = useSearchParams()
  const tab =
    searchParams.get('tab') === 'aniversariantes' ? 'aniversariantes' : 'todos'
  const [query, setQuery] = useState('')

  return (
    <div className="clients">
      <header className="clients__header">
        <div className="clients__heading">
          <h1 className="clients__title">Clientes</h1>
          <p className="clients__subtitle">Nenhum cliente cadastrado</p>
        </div>
        <div className="clients__header-actions">
          <button type="button" className="clients__icon-btn" aria-label="Importar">
            <CloudUpload size={18} strokeWidth={2} />
          </button>
          <button type="button" className="clients__icon-btn" aria-label="Exportar">
            <Download size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <section className="clients__card">
        <div className="clients__toolbar">
          <label className="clients__search">
            <Search size={16} strokeWidth={2} className="clients__search-icon" />
            <input
              type="search"
              className="clients__search-input"
              placeholder="Busca rápida..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="clients__add">
            <Plus size={16} strokeWidth={2.5} />
            Cadastrar cliente
          </button>
        </div>

        <div className="clients__table-wrap">
          <table className="clients__table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th className="clients__th-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="clients__empty">
                  {tab === 'aniversariantes'
                    ? 'Nenhum aniversariante encontrado'
                    : 'Nenhum resultado encontrado'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
