import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  FileText,
  ImageIcon,
  KeyRound,
  ListChecks,
  Pencil,
  Plus,
  Receipt,
  Settings2,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useShopSettings } from '../hooks/useShopSettings'
import {
  saveShopSettings,
  type ShopPhone,
  type ShopSettings,
} from '../lib/shopSettingsStore'
import './Settings.css'
import './ClientCreate.css'

type SettingsSection =
  | 'loja'
  | 'documentos'
  | 'operacoes'
  | 'pagamentos'
  | 'metas'
  | 'avisos'
  | 'nota-fiscal'
  | 'permissoes'

const SECTIONS: {
  id: SettingsSection
  label: string
  icon: typeof Building2
}[] = [
  { id: 'loja', label: 'Informações da loja', icon: Building2 },
  { id: 'documentos', label: 'Documentos e contratos', icon: FileText },
  { id: 'operacoes', label: 'Operações', icon: Settings2 },
  { id: 'pagamentos', label: 'Métodos de pagamento', icon: CreditCard },
  { id: 'metas', label: 'Metas', icon: ListChecks },
  { id: 'avisos', label: 'Avisos e mensagens', icon: Bell },
  { id: 'nota-fiscal', label: 'Nota fiscal', icon: Receipt },
  { id: 'permissoes', label: 'Permissões', icon: KeyRound },
]

const ESTADOS = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'São Paulo',
  'Sergipe',
  'Tocantins',
]

function sectionFromParam(value: string | null): SettingsSection {
  const match = SECTIONS.find((item) => item.id === value)
  return match?.id ?? 'loja'
}

function cloneSettings(settings: ShopSettings): ShopSettings {
  return {
    ...settings,
    phones: settings.phones.map((phone) => ({ ...phone })),
  }
}

export function Settings() {
  const saved = useShopSettings()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const section = sectionFromParam(searchParams.get('section'))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [draft, setDraft] = useState<ShopSettings>(() => cloneSettings(saved))
  const [touched, setTouched] = useState(false)
  const [logoError, setLogoError] = useState('')

  useEffect(() => {
    setDraft(cloneSettings(saved))
  }, [saved])

  const setSection = (next: SettingsSection) => {
    navigate(next === 'loja' ? '/configuracoes' : `/configuracoes?section=${next}`)
  }

  const patch = <K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updatePhone = (id: string, patchPhone: Partial<ShopPhone>) => {
    setDraft((current) => ({
      ...current,
      phones: current.phones.map((phone) => {
        if (phone.id !== id) {
          if (patchPhone.isPrimary) return { ...phone, isPrimary: false }
          return phone
        }
        return { ...phone, ...patchPhone }
      }),
    }))
  }

  const addPhone = () => {
    setDraft((current) => ({
      ...current,
      phones: [
        ...current.phones,
        {
          id: crypto.randomUUID(),
          number: '',
          isPrimary: current.phones.length === 0,
          hasWhatsapp: false,
        },
      ],
    }))
  }

  const removePhone = (id: string) => {
    setDraft((current) => {
      const next = current.phones.filter((phone) => phone.id !== id)
      if (next.length === 0) {
        return {
          ...current,
          phones: [{ id: crypto.randomUUID(), number: '', isPrimary: true, hasWhatsapp: false }],
        }
      }
      if (!next.some((phone) => phone.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return { ...current, phones: next }
    })
  }

  const openLogoPicker = () => fileInputRef.current?.click()

  const onLogoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const okType = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
    if (!okType) {
      setLogoError('Arquivos aceitos: png, jpg, jpeg.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('O arquivo deve ter no máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      patch('logoDataUrl', result)
      setLogoError('')
    }
    reader.readAsDataURL(file)
  }

  const missingRazao = !draft.razaoSocial.trim()
  const missingFantasia = !draft.nomeFantasia.trim()
  const missingCnpj = !draft.cnpj.trim()
  const missingEmail = !draft.email.trim()
  const missingPhone = !draft.phones.some((phone) => phone.number.trim())
  const missingLogradouro = !draft.logradouro.trim()
  const missingEstado = !draft.estado.trim()
  const missingCidade = !draft.cidade.trim()
  const missingBairro = !draft.bairro.trim()

  const save = () => {
    setTouched(true)
    if (
      missingRazao ||
      missingFantasia ||
      missingCnpj ||
      missingEmail ||
      missingPhone ||
      missingLogradouro ||
      missingEstado ||
      missingCidade ||
      missingBairro
    ) {
      return
    }
    saveShopSettings(draft)
  }

  const currentSection = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0]

  return (
    <div className="settings">
      <aside className="settings__nav" aria-label="Seções de configurações">
        {SECTIONS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={`settings__nav-item${section === item.id ? ' is-active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </aside>

      <section className="settings__panel">
        {section === 'loja' ? (
          <>
            <header className="settings__panel-head">
              <h2 className="settings__panel-title">Informações da loja</h2>
              <button type="button" className="settings__save" onClick={save}>
                <Check size={16} strokeWidth={2.5} />
                Salvar alterações
              </button>
            </header>

            <div className="settings__panel-body">
              <div className="client-create__row client-create__row--top">
                <span className="client-create__label">Logotipo</span>
                <div className="settings__logo-field">
                  <div className="settings__logo-box">
                    {draft.logoDataUrl ? (
                      <img className="settings__logo-image" src={draft.logoDataUrl} alt="Logotipo" />
                    ) : (
                      <span className="settings__logo-placeholder" aria-hidden="true">
                        <ImageIcon size={28} strokeWidth={1.5} />
                      </span>
                    )}
                    <button
                      type="button"
                      className="settings__logo-edit"
                      aria-label="Editar logotipo"
                      onClick={openLogoPicker}
                    >
                      <Pencil size={12} strokeWidth={2.5} />
                    </button>
                    {draft.logoDataUrl ? (
                      <button
                        type="button"
                        className="settings__logo-remove"
                        aria-label="Remover logotipo"
                        onClick={() => patch('logoDataUrl', '')}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="settings__file-input"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={onLogoSelected}
                  />
                  <p className="settings__logo-hint">Arquivos aceitos: png, jpg, jpeg.</p>
                  {logoError ? <p className="client-create__field-error">{logoError}</p> : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-razao">
                  Razão social <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-razao"
                    className={`client-create__input${touched && missingRazao ? ' is-invalid' : ''}`}
                    value={draft.razaoSocial}
                    onChange={(event) => patch('razaoSocial', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-fantasia">
                  Nome fantasia <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-fantasia"
                    className={`client-create__input${touched && missingFantasia ? ' is-invalid' : ''}`}
                    value={draft.nomeFantasia}
                    onChange={(event) => patch('nomeFantasia', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-cnpj">
                  CNPJ <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-cnpj"
                    className={`client-create__input${touched && missingCnpj ? ' is-invalid' : ''}`}
                    value={draft.cnpj}
                    onChange={(event) => patch('cnpj', event.target.value)}
                  />
                </div>
              </div>

              <h3 className="settings__section-title">Informações de contato:</h3>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-email">
                  Email <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-email"
                    type="email"
                    className={`client-create__input${touched && missingEmail ? ' is-invalid' : ''}`}
                    value={draft.email}
                    onChange={(event) => patch('email', event.target.value)}
                  />
                </div>
              </div>

              {draft.phones.map((phone, index) => (
                <div key={phone.id} className="settings__phone-block">
                  <div className="client-create__row">
                    <label className="client-create__label" htmlFor={`shop-phone-${phone.id}`}>
                      Telefone {index === 0 ? <span className="req">*</span> : null}
                    </label>
                    <div className="client-create__field">
                      <input
                        id={`shop-phone-${phone.id}`}
                        className={`client-create__input${touched && missingPhone && index === 0 ? ' is-invalid' : ''}`}
                        value={phone.number}
                        onChange={(event) => updatePhone(phone.id, { number: event.target.value })}
                      />
                      <div className="settings__phone-options">
                        <label className="settings__switch">
                          <input
                            type="checkbox"
                            checked={phone.isPrimary}
                            onChange={(event) =>
                              updatePhone(phone.id, { isPrimary: event.target.checked })
                            }
                          />
                          <span className="settings__switch-ui" aria-hidden="true" />
                          <span>Telefone principal</span>
                        </label>
                        <label className="settings__check">
                          <input
                            type="checkbox"
                            checked={phone.hasWhatsapp}
                            onChange={(event) =>
                              updatePhone(phone.id, { hasWhatsapp: event.target.checked })
                            }
                          />
                          <span>Tem WhatsApp</span>
                        </label>
                        {draft.phones.length > 1 ? (
                          <button
                            type="button"
                            className="settings__phone-remove"
                            onClick={() => removePhone(phone.id)}
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="settings__add-phone-row">
                <button type="button" className="settings__add-phone" onClick={addPhone}>
                  <Plus size={16} strokeWidth={2.5} />
                  Adicionar outro telefone
                </button>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-cep">
                  CEP
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-cep"
                    className="client-create__input"
                    value={draft.cep}
                    onChange={(event) => patch('cep', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-logradouro">
                  Logradouro <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-logradouro"
                    className={`client-create__input${touched && missingLogradouro ? ' is-invalid' : ''}`}
                    value={draft.logradouro}
                    onChange={(event) => patch('logradouro', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-numero">
                  Número
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-numero"
                    className="client-create__input"
                    value={draft.numero}
                    onChange={(event) => patch('numero', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-complemento">
                  Complemento
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-complemento"
                    className="client-create__input"
                    value={draft.complemento}
                    onChange={(event) => patch('complemento', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-estado">
                  Estado <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <select
                    id="shop-estado"
                    className={`client-create__input${touched && missingEstado ? ' is-invalid' : ''}`}
                    value={draft.estado}
                    onChange={(event) => patch('estado', event.target.value)}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-cidade">
                  Cidade <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-cidade"
                    className={`client-create__input${touched && missingCidade ? ' is-invalid' : ''}`}
                    value={draft.cidade}
                    onChange={(event) => patch('cidade', event.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="shop-bairro">
                  Bairro <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <input
                    id="shop-bairro"
                    className={`client-create__input${touched && missingBairro ? ' is-invalid' : ''}`}
                    value={draft.bairro}
                    onChange={(event) => patch('bairro', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <footer className="settings__panel-foot">
              <button type="button" className="settings__save" onClick={save}>
                <Check size={16} strokeWidth={2.5} />
                Salvar alterações
              </button>
            </footer>
          </>
        ) : (
          <div className="settings__placeholder">
            <h2>{currentSection.label}</h2>
            <p>Em desenvolvimento.</p>
          </div>
        )}
      </section>
    </div>
  )
}
