import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Check, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppConfig } from '../hooks/useAppConfig'
import { maskCpfCnpj, onlyDigits } from '../lib/cpfCnpj'
import {
  addEmployee,
  EMPLOYEE_UNITS,
  getEmployee,
  updateEmployee,
  type EmployeeGender,
  type EmployeePhone,
} from '../lib/employeesStore'
import './EmployeeForm.css'

const TOAST_KEY = 'social-express:employee-toast'

const GENDERS: { id: EmployeeGender; label: string }[] = [
  { id: 'feminino', label: 'Feminino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'outros', label: 'Outros' },
]

function blank(label: string) {
  return `"${label}" não pode ficar em branco.`
}

function maskPhone(value: string) {
  const digits = onlyDigits(value, 11)
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function maskDate(value: string) {
  return onlyDigits(value, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
}

function emptyPhone(): EmployeePhone {
  return { number: '', principal: false, whatsapp: false }
}

export function EmployeeForm() {
  const { employeeId = '' } = useParams()
  const editing = Boolean(employeeId)
  const navigate = useNavigate()
  const config = useAppConfig()
  const fileRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [cpf, setCpf] = useState('')
  const [gender, setGender] = useState<EmployeeGender>('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [phones, setPhones] = useState<EmployeePhone[]>([emptyPhone()])
  const [level, setLevel] = useState('')
  const [unit, setUnit] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [active, setActive] = useState(true)
  const [shown, setShown] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!editing) return
    const item = getEmployee(employeeId)
    if (!item) {
      navigate('/funcionarios', { replace: true })
      return
    }
    setFirstName(item.firstName)
    setLastName(item.lastName)
    setNickname(item.nickname)
    setCpf(item.cpf)
    setGender(item.gender)
    setBirthDate(item.birthDate)
    setEmail(item.email)
    setPhones(item.phones.length ? item.phones : [emptyPhone()])
    setLevel(item.level)
    setUnit(item.unit)
    setUsername(item.username)
    setPassword(item.password)
    setAvatar(item.avatarDataUrl)
    setActive(item.active)
  }, [editing, employeeId, navigate])

  const errors = {
    cpf: !cpf.trim(),
    gender: !gender,
    firstName: !firstName.trim(),
    lastName: !lastName.trim(),
    email: !email.trim(),
    level: !level,
    unit: !unit,
    username: !username.trim(),
    password: !password,
  }

  const reveal = (key: string) => setShown((current) => ({ ...current, [key]: true }))
  const show = (key: keyof typeof errors) => Boolean(shown[key] && errors[key])

  const onFile = (file: File | null) => {
    if (!file) return
    const ok = /image\/(png|jpeg|jpg)/.test(file.type) || /\.(png|jpe?g)$/i.test(file.name)
    if (!ok) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(typeof reader.result === 'string' ? reader.result : '')
    reader.readAsDataURL(file)
  }

  const patchPhone = (index: number, patch: Partial<EmployeePhone>) => {
    setPhones((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const save = (event?: FormEvent) => {
    event?.preventDefault()
    const nextShown = {
      cpf: true,
      gender: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      unit: true,
      username: true,
      password: true,
    }
    setShown(nextShown)
    if (Object.values(errors).some(Boolean)) return
    const payload = {
      firstName,
      lastName,
      nickname,
      cpf,
      gender,
      birthDate,
      email,
      phones,
      level,
      unit,
      username,
      password,
      active,
      avatarDataUrl: avatar,
    }
    if (editing) updateEmployee(employeeId, payload)
    else addEmployee(payload)
    try {
      sessionStorage.setItem(
        TOAST_KEY,
        editing ? 'Funcionário atualizado.' : 'Funcionário cadastrado.',
      )
    } catch {
      // ignore
    }
    navigate('/funcionarios')
  }

  const actions = (
    <div className="emp-form__actions">
      <button type="button" className="emp-form__back" onClick={() => navigate('/funcionarios')}>
        <ArrowLeft size={15} strokeWidth={2.25} />
        Voltar
      </button>
      <button type="button" className="emp-form__save" onClick={() => save()}>
        <Check size={15} strokeWidth={2.5} />
        {editing ? 'Atualizar' : 'Cadastrar'}
      </button>
    </div>
  )

  return (
    <form className="emp-form" onSubmit={save} noValidate>
      <section className="emp-form__card">
        <header className="emp-form__head">
          <h2>{editing ? 'Informações do funcionário' : 'Informações do novo funcionário'}</h2>
          {actions}
        </header>

        <div className="emp-form__body">
          <p className="emp-form__section">Informações básicas:</p>

          <div className="emp-form__row emp-form__row--avatar">
            <span className="emp-form__label">Avatar</span>
            <div className="emp-form__avatar">
              <div className="emp-form__avatar-wrap">
                <div className="emp-form__avatar-box">
                  {avatar ? <img src={avatar} alt="" /> : null}
                </div>
                <button
                  type="button"
                  className="emp-form__avatar-edit"
                  aria-label="Alterar avatar"
                  onClick={() => fileRef.current?.click()}
                >
                  <Pencil size={13} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="emp-form__avatar-remove"
                  aria-label="Remover avatar"
                  onClick={() => setAvatar('')}
                >
                  ×
                </button>
              </div>
              <p className="emp-form__hint">Arquivos aceitos: png, jpg, jpeg.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                hidden
                onChange={(event) => {
                  onFile(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
            </div>
          </div>

          <Field
            label="CPF"
            required
            error={show('cpf') ? blank('CPF') : ''}
            onBlur={() => reveal('cpf')}
          >
            <input
              value={cpf}
              placeholder=""
              onChange={(event) => setCpf(maskCpfCnpj(event.target.value).slice(0, 14))}
              onBlur={() => reveal('cpf')}
            />
          </Field>

          <div className={`emp-form__row${show('gender') ? ' is-invalid' : ''}`}>
            <span className="emp-form__label">
              Identificação de gênero <span>*</span>
            </span>
            <div className="emp-form__control" onBlur={() => reveal('gender')}>
              <div className="emp-form__radios">
                {GENDERS.map((item) => (
                  <label key={item.id} className="emp-form__radio">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === item.id}
                      onChange={() => setGender(item.id)}
                    />
                    <span />
                    {item.label}
                  </label>
                ))}
              </div>
              {show('gender') ? <p className="emp-form__error">{blank('Identificação de gênero')}</p> : null}
            </div>
          </div>

          <Field
            label="Nome"
            required
            error={show('firstName') ? blank('Nome') : ''}
            onBlur={() => reveal('firstName')}
          >
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              onBlur={() => reveal('firstName')}
            />
          </Field>

          <Field
            label="Sobrenomes"
            required
            error={show('lastName') ? blank('Sobrenomes') : ''}
            onBlur={() => reveal('lastName')}
          >
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              onBlur={() => reveal('lastName')}
            />
          </Field>

          <Field label="Como quer ser chamado">
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </Field>

          <Field label="Data de nascimento">
            <input
              value={birthDate}
              placeholder="dd/mm/aaaa"
              inputMode="numeric"
              onChange={(event) => setBirthDate(maskDate(event.target.value))}
            />
          </Field>

          <Field
            label="Email"
            required
            error={show('email') ? blank('Email') : ''}
            onBlur={() => reveal('email')}
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => reveal('email')}
            />
          </Field>

          <div className="emp-form__row emp-form__row--top">
            <span className="emp-form__label">Telefone</span>
            <div className="emp-form__control">
              {phones.map((phone, index) => (
                <div key={index} className="emp-form__phone">
                  <div className="emp-form__phone-line">
                    <input
                      value={phone.number}
                      placeholder="(99) 99999-9999"
                      inputMode="numeric"
                      onChange={(event) => patchPhone(index, { number: maskPhone(event.target.value) })}
                    />
                    {index > 0 ? (
                      <button
                        type="button"
                        className="emp-form__phone-remove"
                        aria-label="Remover telefone"
                        onClick={() => setPhones((current) => current.filter((_, i) => i !== index))}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    ) : null}
                  </div>
                  <div className="emp-form__checks">
                    <label className="phone-flag">
                      <input
                        type="checkbox"
                        checked={phone.principal}
                        onChange={(event) => patchPhone(index, { principal: event.target.checked })}
                      />
                      Telefone principal
                    </label>
                    <label className="phone-flag">
                      <input
                        type="checkbox"
                        checked={phone.whatsapp}
                        onChange={(event) => patchPhone(index, { whatsapp: event.target.checked })}
                      />
                      Tem WhatsApp
                    </label>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="emp-form__add-phone"
                onClick={() => setPhones((current) => [...current, emptyPhone()])}
              >
                <Plus size={14} strokeWidth={2.5} />
                Adicionar outro telefone
              </button>
            </div>
          </div>

          <Field
            label="Nível de permissão"
            required
            select
            error={show('level') ? blank('Nível de permissão') : ''}
            onBlur={() => reveal('level')}
          >
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              onBlur={() => reveal('level')}
            >
              <option value="">Selecione</option>
              {config.permissions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
              {level && !config.permissions.some((item) => item.name === level) ? (
                <option value={level}>{level}</option>
              ) : null}
            </select>
          </Field>

          <Field
            label="Unidade"
            required
            select
            error={show('unit') ? blank('Unidade') : ''}
            onBlur={() => reveal('unit')}
          >
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              onBlur={() => reveal('unit')}
            >
              <option value="">Selecione</option>
              {EMPLOYEE_UNITS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Login"
            required
            error={show('username') ? blank('Login') : ''}
            onBlur={() => reveal('username')}
          >
            <input
              value={username}
              autoComplete="off"
              onChange={(event) => setUsername(event.target.value)}
              onBlur={() => reveal('username')}
            />
          </Field>

          <Field
            label="Senha"
            required
            error={show('password') ? blank('Senha') : ''}
            onBlur={() => reveal('password')}
          >
            <div className="emp-form__password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => reveal('password')}
              />
              <button
                type="button"
                className="emp-form__eye"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((open) => !open)}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </div>
          </Field>
        </div>

        <footer className="emp-form__foot">{actions}</footer>
      </section>
    </form>
  )
}

function Field({
  label,
  required,
  error,
  select,
  onBlur,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  select?: boolean
  onBlur?: () => void
  children: ReactNode
}) {
  return (
    <div className={`emp-form__row${error ? ' is-invalid' : ''}${select ? ' is-select' : ''}`}>
      <label className="emp-form__label">
        {label}
        {required ? <span> *</span> : null}
      </label>
      <div className="emp-form__control" onBlur={onBlur}>
        <div className="emp-form__input">{children}</div>
        {error ? (
          <>
            <span className="emp-form__bang" aria-hidden="true">
              !
            </span>
            <p className="emp-form__error">{error}</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
