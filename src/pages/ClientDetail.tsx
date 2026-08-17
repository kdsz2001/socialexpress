import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  MapPin,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import { SaveToast } from '../components/ui/SaveToast'
import { useClients } from '../hooks/useClients'
import {
  buildWhatsAppUrl,
  getClientDisplayName,
  getClientPrimaryPhone,
  updateClient,
  type Client,
  type ClientGender,
  type ClientMeasure,
  type ClientPhone,
} from '../lib/clientsStore'
import { onlyDigits } from '../lib/cpfCnpj'
import './ClientCreate.css'
import './ClientDetail.css'

const MEASURE_OPTIONS = [
  'Busto',
  'Cintura',
  'Quadril',
  'Altura',
  'Ombro',
  'Manga',
  'Outra',
]

const SAVED_TOAST_KEY = 'social-express:client-saved-toast'

type DetailSection = 'pessoais' | 'contato'

function maskPhone(value: string) {
  const digits = onlyDigits(value, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function maskBirthDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

function maskCep(value: string) {
  return onlyDigits(value, 8).replace(/^(\d{5})(\d{1,3})$/, '$1-$2')
}

function WhatsAppGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.74 1.46h.01c6.54 0 11.88-5.34 11.88-11.9 0-3.18-1.24-6.16-3.41-8.43ZM12.05 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.28C2.15 6.45 6.56 2.04 12.05 2.04c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.49-4.41 9.88-9.89 9.88Zm5.74-7.4c-.31-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.82 1.02-1 1.23-.18.21-.37.23-.68.08-.31-.16-1.32-.49-2.51-1.55-.93-.83-1.55-1.85-1.73-2.16-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.63-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.45.2 2 .12.61-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.5-.08-.13-.29-.21-.6-.37Z" />
    </svg>
  )
}

function cloneClient(client: Client): Client {
  return {
    ...client,
    phones: client.phones.map((p) => ({ ...p })),
    measures: client.measures.map((m) => ({ ...m })),
  }
}

export function ClientDetail() {
  const { clientId = '' } = useParams()
  const navigate = useNavigate()
  const clients = useClients()
  const stored = clients.find((client) => client.id === clientId)
  const [section, setSection] = useState<DetailSection>('pessoais')
  const [draft, setDraft] = useState<Client | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    if (!stored) {
      navigate('/clientes', { replace: true })
      return
    }
    setDraft((current) => {
      // keep local edits while typing; only hydrate when opening / switching client
      if (current?.id === stored.id) return current
      return cloneClient(stored)
    })
  }, [stored, navigate])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SAVED_TOAST_KEY) === '1') {
        sessionStorage.removeItem(SAVED_TOAST_KEY)
        setToastOpen(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const closeToast = useCallback(() => setToastOpen(false), [])

  if (!draft || !stored) return null

  const displayName = getClientDisplayName(draft)
  const phone = getClientPrimaryPhone(draft)
  const waUrl =
    phone?.whatsapp && phone.number ? buildWhatsAppUrl(phone.number) : null

  const patch = <K extends keyof Client>(key: K, value: Client[K]) => {
    setSaveError(false)
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  const save = () => {
    if (!draft.nome.trim()) {
      setSaveError(true)
      return
    }

    const updated = updateClient(draft.id, {
      // CPF/CNPJ não pode ser alterado após o cadastro
      rg: draft.rg,
      gender: draft.gender,
      nome: draft.nome.trim(),
      sobrenomes: draft.sobrenomes.trim(),
      chamado: draft.chamado.trim(),
      birthDate: draft.birthDate,
      email: draft.email.trim(),
      phones: draft.phones.filter((p) => p.number.trim()),
      facebook: draft.facebook.trim(),
      instagram: draft.instagram.trim(),
      cep: draft.cep,
      logradouro: draft.logradouro,
      numero: draft.numero.trim(),
      complemento: draft.complemento,
      estado: draft.estado,
      cidade: draft.cidade,
      bairro: draft.bairro,
      notifyEmail: draft.notifyEmail,
      measures: draft.measures.filter((m) => m.type || m.value),
      observacoes: draft.observacoes.trim(),
      active: draft.active,
    })

    if (!updated) {
      setSaveError(true)
      return
    }

    try {
      sessionStorage.setItem(SAVED_TOAST_KEY, '1')
    } catch {
      // ignore storage errors
    }
    // Refresh da mesma aba (como no Clarial) e mostra o toast após o reload
    window.location.assign(`/clientes/${updated.id}`)
  }

  const renderSaveButton = () => (
    <button
      type="button"
      className={`client-detail__save${saveError ? ' is-error' : ''}`}
      onClick={save}
    >
      <Check size={16} strokeWidth={2.5} />
      Salvar alterações
    </button>
  )

  return (
    <div className="client-detail">
      <SaveToast open={toastOpen} onClose={closeToast} />

      <aside className="client-detail__profile">
        <h2 className="client-detail__name">{displayName}</h2>

        {phone?.number ? (
          waUrl ? (
            <a
              className="client-detail__phone is-whatsapp"
              href={waUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>{phone.number}</span>
              <WhatsAppGlyph />
            </a>
          ) : (
            <span className="client-detail__phone">{phone.number}</span>
          )
        ) : null}

        {draft.email ? (
          <a className="client-detail__email" href={`mailto:${draft.email}`}>
            {draft.email}
          </a>
        ) : null}

        <nav className="client-detail__menu" aria-label="Seções do cliente">
          <button
            type="button"
            className={`client-detail__menu-item${section === 'pessoais' ? ' is-active' : ''}`}
            onClick={() => setSection('pessoais')}
          >
            <UserRound size={18} strokeWidth={1.75} />
            Informações pessoais
          </button>
          <button
            type="button"
            className={`client-detail__menu-item${section === 'contato' ? ' is-active' : ''}`}
            onClick={() => setSection('contato')}
          >
            <MapPin size={18} strokeWidth={1.75} />
            Informações de contato e endereço
          </button>
        </nav>
      </aside>

      <section className="client-detail__panel">
        <header className="client-detail__panel-head">
          <div>
            <h3 className="client-detail__panel-title">
              {section === 'pessoais'
                ? 'Informações essenciais'
                : 'Contato e endereço'}
            </h3>
            <p className="client-detail__panel-sub">
              {section === 'pessoais'
                ? 'Atualize as informações pessoais'
                : 'Atualize telefone e endereço'}
            </p>
          </div>
          {renderSaveButton()}
        </header>

        <div className="client-detail__panel-body">
          {section === 'pessoais' ? (
            <>
              <div className="client-create__row client-create__row--center client-detail__status-row">
                <span className="client-create__label">Status</span>
                <div className="client-detail__status-wrap">
                  <button
                    type="button"
                    className={`client-create__switch${draft.active ? ' is-on' : ''}`}
                    aria-pressed={draft.active}
                    aria-label={draft.active ? 'Ativo' : 'Inativo'}
                    onClick={() => patch('active', !draft.active)}
                  >
                    <span className="client-create__switch-knob">
                      {draft.active ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                  </button>
                  <span className={`client-detail__status-text${draft.active ? ' is-on' : ''}`}>
                    {draft.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-cpf">
                  CPF ou CNPJ <span className="req">*</span>
                </label>
                <input
                  id="detail-cpf"
                  className="client-create__input is-readonly"
                  value={draft.cpfCnpj}
                  readOnly
                  tabIndex={0}
                  aria-readonly="true"
                  title="CPF/CNPJ não pode ser alterado"
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-rg">
                  RG
                </label>
                <input
                  id="detail-rg"
                  className="client-create__input"
                  value={draft.rg}
                  onChange={(e) => patch('rg', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <span className="client-create__label">Identificação de gênero</span>
                <div className="client-create__radios" role="radiogroup">
                  {(
                    [
                      ['feminino', 'Feminino'],
                      ['masculino', 'Masculino'],
                      ['outros', 'Outros'],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="client-create__radio">
                      <input
                        type="radio"
                        name="detail-gender"
                        checked={draft.gender === value}
                        onChange={() => patch('gender', value as ClientGender)}
                      />
                      <span className="client-create__radio-ui" aria-hidden="true" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="detail-nome"
                  className="client-create__input"
                  value={draft.nome}
                  onChange={(e) => patch('nome', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-sobrenomes">
                  Sobrenomes
                </label>
                <input
                  id="detail-sobrenomes"
                  className="client-create__input"
                  value={draft.sobrenomes}
                  onChange={(e) => patch('sobrenomes', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-chamado">
                  Como quer ser chamado
                </label>
                <input
                  id="detail-chamado"
                  className="client-create__input"
                  value={draft.chamado}
                  onChange={(e) => patch('chamado', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-email">
                  Email
                </label>
                <input
                  id="detail-email"
                  type="email"
                  className="client-create__input"
                  value={draft.email}
                  onChange={(e) => patch('email', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-facebook">
                  Facebook
                </label>
                <div className="client-create__affix">
                  <span className="client-create__affix-prefix">facebook.com/</span>
                  <input
                    id="detail-facebook"
                    className="client-create__affix-input"
                    value={draft.facebook}
                    onChange={(e) => patch('facebook', e.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-instagram">
                  Instagram
                </label>
                <div className="client-create__affix">
                  <span className="client-create__affix-prefix">instagram.com/</span>
                  <input
                    id="detail-instagram"
                    className="client-create__affix-input"
                    value={draft.instagram}
                    onChange={(e) => patch('instagram', e.target.value)}
                  />
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-nascimento">
                  Data de nascimento
                </label>
                <input
                  id="detail-nascimento"
                  className="client-create__input"
                  placeholder="dd/mm/aaaa"
                  value={draft.birthDate}
                  onChange={(e) => patch('birthDate', maskBirthDate(e.target.value))}
                />
              </div>

              <h3 className="client-create__section-title">Notificações:</h3>
              <div className="client-create__row client-create__row--center">
                <span className="client-create__label">Email</span>
                <button
                  type="button"
                  className={`client-create__switch${draft.notifyEmail ? ' is-on' : ''}`}
                  aria-pressed={draft.notifyEmail}
                  onClick={() => patch('notifyEmail', !draft.notifyEmail)}
                >
                  <span className="client-create__switch-knob">
                    {draft.notifyEmail ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                </button>
              </div>

              <h3 className="client-create__section-title">Informações extras:</h3>
              <div className="client-create__row client-create__row--top">
                <span className="client-create__label">Medidas do cliente</span>
                <div className="client-create__measures">
                  {(draft.measures.length ? draft.measures : [{ type: '', value: '' }]).map(
                    (measure, index) => (
                      <div key={index} className="client-create__measure-row">
                        <select
                          className="client-create__select"
                          value={measure.type}
                          onChange={(e) => {
                            const next = [...(draft.measures.length ? draft.measures : [{ type: '', value: '' }])]
                            next[index] = { ...measure, type: e.target.value }
                            patch('measures', next)
                          }}
                        >
                          <option value="">Qual medida</option>
                          {MEASURE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          className="client-create__input client-create__input--sm"
                          value={measure.value}
                          onChange={(e) => {
                            const next = [...(draft.measures.length ? draft.measures : [{ type: '', value: '' }])]
                            next[index] = { ...measure, value: e.target.value }
                            patch('measures', next)
                          }}
                        />
                        <button
                          type="button"
                          className="client-create__trash"
                          aria-label="Remover medida"
                          onClick={() => {
                            const current = draft.measures.length
                              ? draft.measures
                              : [{ type: '', value: '' }]
                            patch(
                              'measures',
                              current.length === 1
                                ? [{ type: '', value: '' }]
                                : current.filter((_, i) => i !== index),
                            )
                          }}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    ),
                  )}
                  <button
                    type="button"
                    className="client-create__add-soft"
                    onClick={() =>
                      patch('measures', [
                        ...(draft.measures.length
                          ? draft.measures
                          : [{ type: '', value: '' }]),
                        { type: '', value: '' },
                      ] as ClientMeasure[])
                    }
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar outra medida
                  </button>
                </div>
              </div>

              <div className="client-create__row client-create__row--top">
                <label className="client-create__label" htmlFor="detail-obs">
                  Observações
                </label>
                <textarea
                  id="detail-obs"
                  className="client-create__textarea"
                  rows={5}
                  value={draft.observacoes}
                  onChange={(e) => patch('observacoes', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              {draft.phones.map((item, index) => (
                <div key={index} className="client-create__row client-create__row--top">
                  <label className="client-create__label" htmlFor={`detail-phone-${index}`}>
                    Telefone {index === 0 && <span className="req">*</span>}
                  </label>
                  <div className="client-create__phone-block">
                    <input
                      id={`detail-phone-${index}`}
                      className="client-create__input"
                      value={item.number}
                      onChange={(e) => {
                        const next = [...draft.phones]
                        next[index] = { ...item, number: maskPhone(e.target.value) }
                        patch('phones', next)
                      }}
                    />
                    <div className="client-create__checks">
                      <label className="client-create__check">
                        <input
                          type="checkbox"
                          checked={item.primary}
                          onChange={(e) => {
                            const checked = e.target.checked
                            patch(
                              'phones',
                              draft.phones.map((phoneItem, i) =>
                                i === index
                                  ? { ...phoneItem, primary: checked }
                                  : checked
                                    ? { ...phoneItem, primary: false }
                                    : phoneItem,
                              ),
                            )
                          }}
                        />
                        <span className="client-create__check-ui" aria-hidden="true" />
                        <span>Telefone principal</span>
                      </label>
                      <label className="client-create__check">
                        <input
                          type="checkbox"
                          checked={item.whatsapp}
                          onChange={(e) => {
                            const next = [...draft.phones]
                            next[index] = { ...item, whatsapp: e.target.checked }
                            patch('phones', next)
                          }}
                        />
                        <span className="client-create__check-ui" aria-hidden="true" />
                        <span>Tem WhatsApp</span>
                      </label>
                    </div>
                    {index === draft.phones.length - 1 && (
                      <button
                        type="button"
                        className="client-create__add-soft"
                        onClick={() =>
                          patch('phones', [
                            ...draft.phones,
                            { number: '', primary: false, whatsapp: false } as ClientPhone,
                          ])
                        }
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        Adicionar outro telefone
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!draft.phones.length && (
                <div className="client-create__row">
                  <span className="client-create__label">Telefone</span>
                  <button
                    type="button"
                    className="client-create__add-soft"
                    onClick={() =>
                      patch('phones', [{ number: '', primary: true, whatsapp: true }])
                    }
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar telefone
                  </button>
                </div>
              )}

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-cep">
                  CEP
                </label>
                <input
                  id="detail-cep"
                  className="client-create__input"
                  value={draft.cep}
                  onChange={(e) => patch('cep', maskCep(e.target.value))}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-logradouro">
                  Logradouro
                </label>
                <input
                  id="detail-logradouro"
                  className="client-create__input"
                  value={draft.logradouro}
                  onChange={(e) => patch('logradouro', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-numero">
                  Número
                </label>
                <input
                  id="detail-numero"
                  className="client-create__input"
                  value={draft.numero}
                  onChange={(e) => patch('numero', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-complemento">
                  Complemento
                </label>
                <input
                  id="detail-complemento"
                  className="client-create__input"
                  value={draft.complemento}
                  onChange={(e) => patch('complemento', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-estado">
                  Estado
                </label>
                <input
                  id="detail-estado"
                  className="client-create__input"
                  value={draft.estado}
                  onChange={(e) => patch('estado', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-cidade">
                  Cidade
                </label>
                <input
                  id="detail-cidade"
                  className="client-create__input"
                  value={draft.cidade}
                  onChange={(e) => patch('cidade', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="detail-bairro">
                  Bairro
                </label>
                <input
                  id="detail-bairro"
                  className="client-create__input"
                  value={draft.bairro}
                  onChange={(e) => patch('bairro', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <footer className="client-detail__panel-foot">
          {renderSaveButton()}
        </footer>
      </section>
    </div>
  )
}
