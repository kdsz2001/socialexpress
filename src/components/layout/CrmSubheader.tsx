import { useSearchParams } from 'react-router-dom'
import './ClientsSubheader.css'
import './CrmSubheader.css'

function titleFromTab(tab: string | null) {
  if (tab === 'analise') return 'Análise'
  if (tab === 'sequencias') return 'Sequências'
  if (tab === 'trajes') return 'Trajes e valores'
  if (tab === 'novo') return 'Novo contato'
  return 'Contatos'
}

function subtitleFromTab(tab: string | null) {
  if (tab === 'novo') return 'Cadastre nome, número, data e traje'
  if (tab === 'analise') return 'Visão de ganhos, perdas e potencial'
  if (tab === 'sequencias') return 'Rechamadas no WhatsApp para leads sem resposta'
  if (tab === 'trajes') return 'Catálogo e valores estimados'
  return 'Lista e acompanhamento dos leads'
}

export function CrmSubheader() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const title = titleFromTab(tab)
  const subtitle = subtitleFromTab(tab)

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">{title}</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{subtitle}</p>
      </div>
    </header>
  )
}
