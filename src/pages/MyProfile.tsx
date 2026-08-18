import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  BookUser,
  Check,
  Pencil,
  Settings,
  UserRound,
  X,
} from 'lucide-react'
import { SaveToast } from '../components/ui/SaveToast'
import { isValidCpf, maskCpfCnpj, onlyDigits } from '../lib/cpfCnpj'
import {
  getUserDisplayName,
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from '../lib/userProfileStore'
import './ClientCreate.css'
import './ClientDetail.css'
import './MyProfile.css'

type ProfileSection = 'pessoais' | 'contato' | 'preferencias'

const SAVED_TOAST_KEY = 'social-express:my-profile-saved-toast'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/jpg'])

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

function maskCep(value: string) {
  return onlyDigits(value, 8).replace(/^(\d{5})(\d{1,3})$/, '$1-$2')
}

export function MyProfile() {
  const [section, setSection] = useState<ProfileSection>('pessoais')
  const [draft, setDraft] = useState<UserProfile>(() => getUserProfile())
  const [cpfError, setCpfError] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const closeToast = useCallback(() => setToastOpen(false), [])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const displayName = getUserDisplayName(draft)

  const patch = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
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
      if (!result.startsWith('data:image/jpeg') && !result.startsWith('data:image/jpg')) {
        // Alguns browsers usam image/jpeg mesmo para .jpg
        if (!result.startsWith('data:image/')) {
          setAvatarError('Não foi possível ler a imagem.')
          return
        }
      }
      setAvatarError('')
      patch('avatarDataUrl', result)
    }
    reader.onerror = () => setAvatarError('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  const removeAvatar = () => {
    setAvatarError('')
    patch('avatarDataUrl', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const save = () => {
    if (!draft.nome.trim()) return
    if (!draft.email.trim()) return
    if (!draft.login.trim()) return

    if (draft.cpf.trim()) {
      if (!isValidCpf(draft.cpf)) {
        setCpfError('Informe um CPF válido.')
        setSection('pessoais')
        return
      }
      setCpfError('')
    }

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
    window.location.assign('/meu-perfil')
  }

  const renderSaveButton = () => (
    <button type="button" className="client-detail__save" onClick={save}>
      <Check size={16} strokeWidth={2.5} />
      Salvar alterações
    </button>
  )

  return (
    <div className="client-detail my-profile">
      <SaveToast open={toastOpen} onClose={closeToast} />

      <aside className="client-detail__profile">
        <h2 className="client-detail__name">{displayName}</h2>
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
            <h3 className="client-detail__panel-title">Informações essenciais</h3>
            <p className="client-detail__panel-sub">
              {section === 'pessoais'
                ? 'Atualize suas informações pessoais'
                : section === 'contato'
                  ? 'Atualize telefone e endereço'
                  : 'Atualize suas preferências'}
            </p>
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
                    onBlur={() => {
                      if (!draft.cpf.trim()) return
                      if (!isValidCpf(draft.cpf)) {
                        setCpfError('Informe um CPF válido.')
                      }
                    }}
                  />
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
                  required
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-sobrenomes">
                  Sobrenomes <span className="req">*</span>
                </label>
                <input
                  id="profile-sobrenomes"
                  className="client-create__input"
                  value={draft.sobrenomes}
                  onChange={(e) => patch('sobrenomes', e.target.value)}
                />
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
                  required
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
                  required
                />
              </div>

              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-password">
                  Senha
                </label>
                <input
                  id="profile-password"
                  type="password"
                  className="client-create__input"
                  value={draft.password}
                  onChange={(e) => patch('password', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : null}

          {section === 'contato' ? (
            <>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-phone">
                  Telefone
                </label>
                <input
                  id="profile-phone"
                  className="client-create__input"
                  inputMode="numeric"
                  value={draft.phone}
                  onChange={(e) => patch('phone', maskPhone(e.target.value))}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-cep">
                  CEP
                </label>
                <input
                  id="profile-cep"
                  className="client-create__input"
                  inputMode="numeric"
                  value={draft.cep}
                  onChange={(e) => patch('cep', maskCep(e.target.value))}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-logradouro">
                  Logradouro
                </label>
                <input
                  id="profile-logradouro"
                  className="client-create__input"
                  value={draft.logradouro}
                  onChange={(e) => patch('logradouro', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-numero">
                  Número
                </label>
                <input
                  id="profile-numero"
                  className="client-create__input"
                  value={draft.numero}
                  onChange={(e) => patch('numero', e.target.value)}
                />
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
                <label className="client-create__label" htmlFor="profile-bairro">
                  Bairro
                </label>
                <input
                  id="profile-bairro"
                  className="client-create__input"
                  value={draft.bairro}
                  onChange={(e) => patch('bairro', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-cidade">
                  Cidade
                </label>
                <input
                  id="profile-cidade"
                  className="client-create__input"
                  value={draft.cidade}
                  onChange={(e) => patch('cidade', e.target.value)}
                />
              </div>
              <div className="client-create__row">
                <label className="client-create__label" htmlFor="profile-estado">
                  Estado
                </label>
                <input
                  id="profile-estado"
                  className="client-create__input"
                  value={draft.estado}
                  onChange={(e) => patch('estado', e.target.value)}
                />
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
