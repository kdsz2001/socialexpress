import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { attemptLogin, isAuthenticated, subscribeAuth } from '../lib/authStore'
import { EMPLOYEE_UNITS } from '../lib/employeesStore'
import './Login.css'

const UNIT_OPTIONS: string[] = [...EMPLOYEE_UNITS]

export function Login() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [unit, setUnit] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const [unitHighlight, setUnitHighlight] = useState(0)
  const unitRef = useRef<HTMLDivElement>(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Login'
  }, [])

  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), [])

  useEffect(() => {
    if (!unitOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!unitRef.current?.contains(event.target as Node)) setUnitOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [unitOpen])

  useEffect(() => {
    if (!unitOpen) return
    const node = unitRef.current?.querySelector<HTMLButtonElement>(`[data-index="${unitHighlight}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [unitHighlight, unitOpen])

  const chooseUnit = (value: string) => {
    setUnit(value)
    setUnitOpen(false)
  }

  const onUnitKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!unitOpen) {
        const current = UNIT_OPTIONS.indexOf(unit)
        setUnitHighlight(current >= 0 ? current : 0)
        setUnitOpen(true)
        return
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setUnitHighlight((current) => {
        if (current < 0) return delta > 0 ? 0 : UNIT_OPTIONS.length - 1
        return (current + delta + UNIT_OPTIONS.length) % UNIT_OPTIONS.length
      })
      return
    }
    if (event.key === 'Enter' && unitOpen) {
      event.preventDefault()
      chooseUnit(UNIT_OPTIONS[unitHighlight] ?? '')
      return
    }
    if (event.key === 'Escape') {
      setUnitOpen(false)
    }
  }

  if (authed) {
    return <Navigate to="/" replace />
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = attemptLogin(identifier, password, unit)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="login">
      <div className="login__glow login__glow--a" aria-hidden="true" />
      <div className="login__glow login__glow--b" aria-hidden="true" />

      <div className="login__card">
        <section className="login__form-pane">
          <div className="login__form-inner">
            <div className="login__brand">
              <img src="/brand-mark-white.png" alt="Social Express" className="login__mark" />
            </div>

            <div className="login__intro">
              <h1 className="login__title">
                Faça seu login<span className="login__title-dot" aria-hidden="true" />
              </h1>
              <p className="login__lead">Acesse o painel da Social Express</p>
            </div>

            <form className="login__form" onSubmit={onSubmit} noValidate>
              <div className="login__field">
                <span id="login-unit-label">Unidade</span>
                <div className={`login__unit${unitOpen ? ' is-open' : ''}`} ref={unitRef}>
                  <button
                    type="button"
                    id="login-unit"
                    className={`login__unit-trigger${unit ? '' : ' is-placeholder'}`}
                    aria-labelledby="login-unit-label"
                    aria-haspopup="listbox"
                    aria-expanded={unitOpen}
                    aria-controls="login-unit-menu"
                    onClick={() => {
                      if (!unitOpen) setUnitHighlight(UNIT_OPTIONS.indexOf(unit))
                      setUnitOpen((open) => !open)
                    }}
                    onKeyDown={onUnitKeyDown}
                  >
                    <span>{unit || 'Selecione a loja'}</span>
                    <ChevronDown size={16} strokeWidth={2.25} className="login__unit-chevron" aria-hidden="true" />
                  </button>
                  {unitOpen ? (
                    <ul className="login__unit-menu" id="login-unit-menu" role="listbox" aria-label="Unidade">
                      {UNIT_OPTIONS.map((item, index) => {
                        const selected = item === unit
                        return (
                          <li key={item}>
                            <button
                              type="button"
                              role="option"
                              data-index={index}
                              aria-selected={selected}
                              className={[selected ? 'is-selected' : '', index === unitHighlight ? 'is-active' : '']
                                .filter(Boolean)
                                .join(' ') || undefined}
                              onMouseEnter={() => setUnitHighlight(index)}
                              onClick={() => chooseUnit(item)}
                            >
                              <span>{item}</span>
                              {selected ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </div>

              <label className="login__field">
                <span>Login ou e-mail</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="seu login ou e-mail"
                />
              </label>

              <label className="login__field">
                <span>Senha</span>
                <div className="login__password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="login__eye"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error ? <p className="login__error">{error}</p> : null}

              <button type="submit" className="login__submit" disabled={submitting}>
                {submitting ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>

        <aside className="login__visual" aria-hidden="true">
          <img src="/login-hero.jpg" alt="" className="login__visual-img" />
          <div className="login__visual-shade" />
        </aside>
      </div>
    </div>
  )
}
