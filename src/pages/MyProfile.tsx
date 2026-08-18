import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BookUser,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Settings,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { NeighborhoodSelect } from '../components/clients/NeighborhoodSelect'
import { AvatarCropModal } from '../components/ui/AvatarCropModal'
import { SaveToast } from '../components/ui/SaveToast'
import {
  BRAZIL_STATES,
  fetchAddressByCep,
  maskCep,
  resolveStateName,
} from '../lib/brazilAddress'
import { isValidCpf, maskCpfCnpj, onlyDigits } from '../lib/cpfCnpj'
import {
  getUserDisplayName,
  getUserProfile,
  updateUserProfile,
  type UserPhone,
  type UserProfile,
} from '../lib/userProfileStore'
import './ClientCreate.css'
import './ClientDetail.css'
import './MyProfile.css'

type ProfileSection = 'pessoais' | 'contato' | 'preferencias'
type CepStatus = 'idle' | 'loading' | 'ok' | 'error'

const SAVED_TOAST_KEY = 'social-express:my-profile-saved-toast'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/jpg'])

function parseProfileSection(value: string | null): ProfileSection {
  if (value === 'contato' || value === 'preferencias' || value === 'pessoais') {
    return value
  }
  return 'pessoais'
}

function maskBirthDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

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

function blankFieldError(label: string) {
  return `"${label}" não pode ficar em branco.`
}

export function MyProfile() {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = parseProfileSection(searchParams.get('tab'))
  const [draft, setDraft] = useState<UserProfile>(() => getUserProfile())
  const [cpfError, setCpfError] = useState('')
  const [sobrenomesError, setSobrenomesError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [logradouroError, setLogradouroError] = useState('')
  const [numeroError, setNumeroError] = useState('')
  const [estadoError, setEstadoError] = useState('')
  const [cidadeError, setCidadeError] = useState('')
  const [bairroError, setBairroError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const [bairroOptions, setBairroOptions] = useState<string[]>(() => {
    const profile = getUserProfile()
    return profile.bairro ? [profile.bairro] : []
  })
  const closeToast = useCallback(() => setToastOpen(false), [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft

  const setSection = (next: ProfileSection) => {
    setSearchParams({ tab: next }, { replace: true })
  }

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SAVED_TOAST_KEY) === '1') {
        sessionStorage.removeItem(SAVED_TOAST_KEY)
        setToastOpen(true)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const digits = onlyDigits(draft.cep)
    if (digits.length !== 8) {
      setCepStatus('idle')
      return
    }

    const controller = new AbortController()
    setCepStatus('loading')

    void (async () => {
      try {
        const { main, bairros } = await fetchAddressByCep(digits, controller.signal)
        if (controller.signal.aborted) return
        if (!main) {
          setCepStatus('error')
          setBairroOptions([])
          return
        }
        const stateName = resolveStateName(main)
        setDraft((current) => ({
          ...current,
          logradouro: main.logradouro?.trim() || current.logradouro,
          complemento: main.complemento?.trim() || current.complemento,
          estado: stateName || current.estado,
          cidade: main.localidade?.trim() || current.cidade,
          bairro: main.bairro?.trim() || bairros[0] || current.bairro,
        }))
        setBairroOptions(bairros)
        setCepStatus('ok')
      } catch (error) {
        if (controller.signal.aborted) return
        setCepStatus('error')
      }
    })()

    return () => controller.abort()
  }, [draft.cep])

  const displayName = getUserDisplayName(draft)
  const primaryPhone =
    draft.phones.find((phone) => phone.primary && phone.number.trim())?.number ||
    draft.phones.find((phone) => phone.number.trim())?.number ||
    ''

  const patch = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const setPhones = (phones: UserPhone[]) => {
    patch('phones', phones)
  }

  const panelMeta =
    section === 'pessoais'
      ? {
          title: 'Informações pessoais',
          sub: 'Atualize suas informações pessoais',
        }
      : section === 'contato'
        ? {
            title: 'Informações de contato e endereço',
            sub: 'Atualize suas informações de contato e endereço',
          }
        : {
            title: 'Preferências',
            sub: 'Atualize suas preferências',
          }

  const openFilePicker = () => {
    setAvatarError('')
    fileInputRef.current?.click()
  }

  const onAvatarSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const type = file.type.toLowerCase()
    const nameOk = /\.jpe?g$/i.test(file.name)
    if (!ACCEPTED_AVATAR_TYPES.has(type) && !nameOk) {
      setAvatarError('Somente arquivos JPG ou JPEG são aceitos.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('A imagem deve ter no máximo 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result.startsWith('data:image/')) {
        setAvatarError('Não foi possível ler a imagem.')
        return
      }
      setAvatarError('')
      setCropSource(result)
    }
    reader.onerror = () => setAvatarError('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  const cancelCrop = () => setCropSource(null)

  const confirmCrop = (dataUrl: string) => {
    patch('avatarDataUrl', dataUrl)
    setCropSource(null)
  }

  const removeAvatar = () => {
    setAvatarError('')
    patch('avatarDataUrl', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSave =
    Boolean(draft.cpf.trim()) &&
    isValidCpf(draft.cpf) &&
    Boolean(draft.nome.trim()) &&
    Boolean(draft.sobrenomes.trim()) &&
    Boolean(draft.email.trim()) &&
    Boolean(draft.login.trim())

  const save = () => {
    if (!canSave) return

    setCpfError('')
    setSobrenomesError('')
    updateUserProfile({
      ...draft,
      nome: draft.nome.trim(),
      sobrenomes: draft.sobrenomes.trim(),
      chamado: draft.chamado.trim(),
      email: draft.email.trim(),
      login: draft.login.trim(),
    })

    try {
      sessionStorage.setItem(SAVED_TOAST_KEY, '1')
    } catch {
      // ignore
    }
    window.location.assign(`/meu-perfil?tab=${section}`)
  }

  const renderSaveButton = () => (
    <button
      type="button"
      className="client-detail__save"
      onClick={save}
      disabled={!canSave}
    >
      <Check size={16} strokeWidth={2.5} />
      Salvar alterações
    </button>
  )

  return (
    <div className="client-detail my-profile">
      <SaveToast open={toastOpen} onClose={closeToast} />
      <AvatarCropModal
        open={Boolean(cropSource)}
        imageSrc={cropSource ?? ''}
        onCancel={cancelCrop}
        onConfirm={confirmCrop}
      />

      <aside className="client-detail__profile">
        <h2 className="client-detail__name">{displayName}</h2>
        {primaryPhone ? (
          <span className="my-profile__phone-pill">{primaryPhone}</span>
        ) : null}
        {draft.email ? (
          <p className="client-detail__email">{draft.email}</p>
        ) : null}

        <nav className="client-detail__menu" aria-label="Seções do perfil">
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
            <BookUser size={18} strokeWidth={1.75} />
            Informações de contato e endereço
          </button>
          <button
            type="button"
            className={`client-detail__menu-item${section === 'preferencias' ? ' is-active' : ''}`}
            onClick={() => setSection('preferencias')}
          >
            <Settings size={18} strokeWidth={1.75} />
            Preferências
          </button>
        </nav>
      </aside>

      <section className="client-detail__panel">
        <header className="client-detail__panel-head">
          <div>
            <h3 className="client-detail__panel-title">{panelMeta.title}</h3>
            <p className="client-detail__panel-sub">{panelMeta.sub}</p>
          </div>
          {renderSaveButton()}
        </header>

        <div className="client-detail__panel-body">
          {section === 'pessoais' ? (
            <>
              <div className="client-create__row client-create__row--top">
                <span className="client-create__label">Imagem de perfil</span>
                <div className="my-profile__avatar-field">
                  <div className="my-profile__avatar-box">
                    {draft.avatarDataUrl ? (
                      <img
                        className="my-profile__avatar-image"
                        src={draft.avatarDataUrl}
                        alt="Imagem de perfil"
                      />
                    ) : (
                      <span className="my-profile__avatar-placeholder" aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      className="my-profile__avatar-edit"
                      aria-label="Adicionar ou editar imagem"
                      onClick={openFilePicker}
                    >
                      <Pencil size={12} strokeWidth={2.5} />
                    </button>
                    {draft.avatarDataUrl ? (
                      <button
                        type="button"
                        className="my-profile__avatar-remove"
                        aria-label="Remover imagem"
                        onClick={removeAvatar}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="my-profile__file-input"
                    accept=".jpg,.jpeg,image/jpeg"
                    onChange={onAvatarSelected}
                  />
                  <p className="my-profile__avatar-hint">
                    Somente arquivos até 5MB e no formato JPG ou JPEG são aceitos.
                  </p>
                  {avatarError ? (
                    <p className="client-create__field-error">{avatarError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-cpf">
                  CPF <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <div className={`client-create__input-wrap${cpfError ? ' is-invalid' : ''}`}>
                    <input
                      id="profile-cpf"
                      className={`client-create__input${cpfError ? ' is-invalid' : ''}`}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      value={draft.cpf}
                      onChange={(e) => {
                        patch('cpf', maskCpfCnpj(e.target.value).slice(0, 14))
                        if (cpfError) setCpfError('')
                      }}
                      onBlur={(e) => {
                        const value = e.currentTarget.value.trim()
                        if (!value) {
                          setCpfError('"CPF" não pode ficar em branco.')
                          return
                        }
                        if (!isValidCpf(value)) {
                          setCpfError('Informe um CPF válido.')
                          return
                        }
                        setCpfError('')
                      }}
                    />
                    {cpfError ? (
                      <CircleAlert
                        className="client-create__input-error-icon"
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {cpfError ? (
                    <p className="client-create__field-error">{cpfError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-nome">
                  Nome <span className="req">*</span>
                </label>
                <input
                  id="profile-nome"
                  className="client-create__input"
                  value={draft.nome}
                  onChange={(e) => patch('nome', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-sobrenomes">
                  Sobrenomes <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <div
                    className={`client-create__input-wrap${sobrenomesError ? ' is-invalid' : ''}`}
                  >
                    <input
                      id="profile-sobrenomes"
                      className={`client-create__input${sobrenomesError ? ' is-invalid' : ''}`}
                      value={draft.sobrenomes}
                      onChange={(e) => {
                        patch('sobrenomes', e.target.value)
                        if (sobrenomesError) setSobrenomesError('')
                      }}
                      onBlur={(e) => {
                        if (!e.currentTarget.value.trim()) {
                          setSobrenomesError('"Sobrenomes" não pode ficar em branco.')
                          return
                        }
                        setSobrenomesError('')
                      }}
                    />
                    {sobrenomesError ? (
                      <CircleAlert
                        className="client-create__input-error-icon"
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {sobrenomesError ? (
                    <p className="client-create__field-error">{sobrenomesError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-chamado">
                  Como quer ser chamado
                </label>
                <input
                  id="profile-chamado"
                  className="client-create__input"
                  value={draft.chamado}
                  onChange={(e) => patch('chamado', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-email">
                  Email <span className="req">*</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="client-create__input"
                  value={draft.email}
                  onChange={(e) => patch('email', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-birth">
                  Data de nascimento
                </label>
                <input
                  id="profile-birth"
                  className="client-create__input"
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  value={draft.birthDate}
                  onChange={(e) => patch('birthDate', maskBirthDate(e.target.value))}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-login">
                  Login <span className="req">*</span>
                </label>
                <input
                  id="profile-login"
                  className="client-create__input"
                  value={draft.login}
                  onChange={(e) => patch('login', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-password">
                  Senha
                </label>
                <div className="client-create__field">
                  <div className="client-create__input-wrap client-create__input-wrap--password">
                    <input
                      id="profile-password"
                      type={showPassword ? 'text' : 'password'}
                      className="client-create__input"
                      value={draft.password}
                      onChange={(e) => patch('password', e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="client-create__password-toggle"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword((open) => !open)}
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={2} />
                      ) : (
                        <Eye size={18} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {section === 'contato' ? (
            <>
              {(draft.phones.length ? draft.phones : [{ number: '', primary: true, whatsapp: true }]).map(
                (phone, index) => (
                  <div key={index} className="client-create__row client-create__row--top">
                    <label className="client-create__label" htmlFor={`profile-phone-${index}`}>
                      Telefone
                    </label>
                    <div className="client-create__phone-block">
                      <div className="client-create__phone-line">
                        <div className="client-create__field">
                          <div
                            className={`client-create__input-wrap${
                              index === 0 && phoneError ? ' is-invalid' : ''
                            }`}
                          >
                            <input
                              id={`profile-phone-${index}`}
                              className={`client-create__input${
                                index === 0 && phoneError ? ' is-invalid' : ''
                              }`}
                              inputMode="numeric"
                              placeholder="(99) 99999-9999"
                              value={phone.number}
                              onChange={(event) => {
                                const next = [...draft.phones]
                                if (!next[index]) {
                                  next[index] = {
                                    number: '',
                                    primary: index === 0,
                                    whatsapp: false,
                                  }
                                }
                                next[index] = {
                                  ...next[index],
                                  number: maskPhone(event.target.value),
                                }
                                setPhones(next)
                                if (index === 0 && phoneError) setPhoneError('')
                              }}
                              onBlur={(event) => {
                                if (index !== 0) return
                                if (!event.currentTarget.value.trim()) {
                                  setPhoneError(blankFieldError('Telefone'))
                                } else {
                                  setPhoneError('')
                                }
                              }}
                            />
                            {index === 0 && phoneError ? (
                              <CircleAlert
                                className="client-create__input-error-icon"
                                size={18}
                                strokeWidth={2.25}
                                aria-hidden="true"
                              />
                            ) : null}
                          </div>
                          {index === 0 && phoneError ? (
                            <p className="client-create__field-error">{phoneError}</p>
                          ) : null}
                        </div>
                        {draft.phones.length > 1 ? (
                          <button
                            type="button"
                            className="client-create__trash"
                            aria-label="Remover telefone"
                            onClick={() => {
                              const next = draft.phones.filter((_, i) => i !== index)
                              if (!next.some((item) => item.primary) && next[0]) {
                                next[0] = { ...next[0], primary: true }
                              }
                              setPhones(next)
                              if (index === 0) setPhoneError('')
                            }}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        ) : null}
                      </div>
                      <div className="client-create__checks">
                        <label className="client-create__check">
                          <input
                            type="checkbox"
                            checked={phone.primary}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setPhones(
                                draft.phones.map((item, i) =>
                                  i === index
                                    ? { ...item, primary: checked }
                                    : checked
                                      ? { ...item, primary: false }
                                      : item,
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
                            checked={phone.whatsapp}
                            onChange={(event) => {
                              const next = [...draft.phones]
                              next[index] = {
                                ...next[index],
                                whatsapp: event.target.checked,
                              }
                              setPhones(next)
                            }}
                          />
                          <span className="client-create__check-ui" aria-hidden="true" />
                          <span>Tem WhatsApp</span>
                        </label>
                      </div>
                      {index === draft.phones.length - 1 ? (
                        <button
                          type="button"
                          className="client-create__add-soft"
                          onClick={() =>
                            setPhones([
                              ...draft.phones,
                              { number: '', primary: false, whatsapp: false },
                            ])
                          }
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          Adicionar outro telefone
                        </button>
                      ) : null}
                    </div>
                  </div>
                ),
              )}

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-cep">
                  CEP
                </label>
                <div className="client-create__field">
                  <input
                    id="profile-cep"
                    className="client-create__input"
                    inputMode="numeric"
                    placeholder="99999-999"
                    value={draft.cep}
                    onChange={(e) => {
                      patch('cep', maskCep(e.target.value))
                      if (onlyDigits(e.target.value).length !== 8) {
                        setBairroOptions([])
                      }
                    }}
                    aria-describedby="profile-cep-status"
                  />
                  <p
                    id="profile-cep-status"
                    className={`client-create__cep-status${
                      cepStatus === 'error' ? ' is-error' : ''
                    }${cepStatus === 'ok' ? ' is-ok' : ''}`}
                  >
                    {cepStatus === 'loading' && 'Buscando endereço...'}
                    {cepStatus === 'error' && 'CEP não encontrado'}
                    {cepStatus === 'ok' && 'Endereço preenchido'}
                  </p>
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-logradouro">
                  Logradouro <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <div
                    className={`client-create__input-wrap${logradouroError ? ' is-invalid' : ''}`}
                  >
                    <input
                      id="profile-logradouro"
                      className={`client-create__input${logradouroError ? ' is-invalid' : ''}`}
                      value={draft.logradouro}
                      onChange={(e) => {
                        patch('logradouro', e.target.value)
                        if (logradouroError) setLogradouroError('')
                      }}
                      onBlur={(e) => {
                        if (!e.currentTarget.value.trim()) {
                          setLogradouroError(blankFieldError('Logradouro'))
                        } else {
                          setLogradouroError('')
                        }
                      }}
                    />
                    {logradouroError ? (
                      <CircleAlert
                        className="client-create__input-error-icon"
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {logradouroError ? (
                    <p className="client-create__field-error">{logradouroError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-numero">
                  Número <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <div className={`client-create__input-wrap${numeroError ? ' is-invalid' : ''}`}>
                    <input
                      id="profile-numero"
                      className={`client-create__input${numeroError ? ' is-invalid' : ''}`}
                      value={draft.numero}
                      onChange={(e) => {
                        patch('numero', e.target.value)
                        if (numeroError) setNumeroError('')
                      }}
                      onBlur={(e) => {
                        if (!e.currentTarget.value.trim()) {
                          setNumeroError(blankFieldError('Número'))
                        } else {
                          setNumeroError('')
                        }
                      }}
                    />
                    {numeroError ? (
                      <CircleAlert
                        className="client-create__input-error-icon"
                        size={18}
                        strokeWidth={2.25}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  {numeroError ? (
                    <p className="client-create__field-error">{numeroError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-complemento">
                  Complemento
                </label>
                <input
                  id="profile-complemento"
                  className="client-create__input"
                  value={draft.complemento}
                  onChange={(e) => patch('complemento', e.target.value)}
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-estado">
                  Estado <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <select
                    id="profile-estado"
                    className={`client-create__select${estadoError ? ' is-invalid' : ''}`}
                    value={draft.estado}
                    onChange={(e) => {
                      setDraft((current) => ({
                        ...current,
                        estado: e.target.value,
                        cidade: '',
                        bairro: '',
                      }))
                      setBairroOptions([])
                      if (estadoError) setEstadoError('')
                      setCidadeError('')
                      setBairroError('')
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.value.trim()) {
                        setEstadoError(blankFieldError('Estado'))
                      } else {
                        setEstadoError('')
                      }
                    }}
                  >
                    <option value="">Selecione um estado</option>
                    {BRAZIL_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {estadoError ? (
                    <p className="client-create__field-error">{estadoError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-cidade">
                  Cidade <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <select
                    id="profile-cidade"
                    className={`client-create__select${cidadeError ? ' is-invalid' : ''}`}
                    value={draft.cidade}
                    onChange={(e) => {
                      setDraft((current) => ({
                        ...current,
                        cidade: e.target.value,
                        bairro: '',
                      }))
                      if (cidadeError) setCidadeError('')
                      setBairroError('')
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.value.trim()) {
                        setCidadeError(blankFieldError('Cidade'))
                      } else {
                        setCidadeError('')
                      }
                    }}
                  >
                    <option value="">Selecione uma cidade</option>
                    {draft.cidade ? (
                      <option value={draft.cidade}>{draft.cidade}</option>
                    ) : null}
                  </select>
                  {cidadeError ? (
                    <p className="client-create__field-error">{cidadeError}</p>
                  ) : null}
                </div>
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-bairro">
                  Bairro <span className="req">*</span>
                </label>
                <div className="client-create__field">
                  <NeighborhoodSelect
                    id="profile-bairro"
                    value={draft.bairro}
                    options={bairroOptions}
                    city={draft.cidade}
                    invalid={Boolean(bairroError)}
                    onChange={(value) => {
                      patch('bairro', value)
                      draftRef.current = { ...draftRef.current, bairro: value }
                      setBairroError(value.trim() ? '' : blankFieldError('Bairro'))
                    }}
                    onBlur={() => {
                      if (!draftRef.current.bairro.trim()) {
                        setBairroError(blankFieldError('Bairro'))
                      } else {
                        setBairroError('')
                      }
                    }}
                    onRegister={(name) => {
                      setBairroOptions((current) => {
                        const key = name.toLocaleLowerCase('pt-BR')
                        if (current.some((item) => item.toLocaleLowerCase('pt-BR') === key)) {
                          return current
                        }
                        return [...current, name]
                      })
                    }}
                  />
                  {bairroError ? (
                    <p className="client-create__field-error">{bairroError}</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {section === 'preferencias' ? (
            <div className="my-profile__empty">
              <p>Preferências em breve.</p>
            </div>
          ) : null}
        </div>

        <footer className="client-detail__panel-foot">
          {renderSaveButton()}
        </footer>
      </section>
    </div>
  )
}
