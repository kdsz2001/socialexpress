import { ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './ClientsSubheader.css'

const SECTION_LABELS: Record<string, string> = {
  loja: 'Informações da loja',
  documentos: 'Documentos e contratos',
  operacoes: 'Operações',
  pagamentos: 'Métodos de pagamento',
  metas: 'Metas',
  avisos: 'Avisos e mensagens',
  'nota-fiscal': 'Nota fiscal',
  permissoes: 'Permissões',
}

export function SettingsSubheader() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section') ?? 'loja'
  const subtitle = SECTION_LABELS[section] ?? SECTION_LABELS.loja

  return (
    <header className="clients-subheader">
      <div className="clients-subheader__heading">
        <h1 className="clients-subheader__title">Configurações</h1>
        <span className="clients-subheader__sep" aria-hidden="true" />
        <p className="clients-subheader__subtitle">{subtitle}</p>
      </div>

      <div className="clients-subheader__actions">
        <button
          type="button"
          className="clients-subheader__back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} strokeWidth={2.25} />
          Voltar
        </button>
      </div>
    </header>
  )
}
