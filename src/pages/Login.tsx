import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import {
  attemptLogin,
  DEFAULT_LOGIN_PASSWORD,
  isAuthenticated,
  subscribeAuth,
} from '../lib/authStore'
import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => subscribeAuth(() => setAuthed(isAuthenticated())), [])

  if (authed) {
    const from = (location.state as { from?: string } | null)?.from || '/'
    return <Navigate to={from} replace />
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = attemptLogin(identifier, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const from = (location.state as { from?: string } | null)?.from || '/'
    navigate(from, { replace: true })
  }

  return (
    <div className="login">
      <div className="login__glow login__glow--a" aria-hidden="true" />
      <div className="login__glow login__glow--b" aria-hidden="true" />

      <div className="login__card">
        <section className="login__form-pane">
          <div className="login__brand">
            <img src="/brand-mark-white.png" alt="" className="login__mark" />
            <div className="login__wordmark">
              <span>Social</span>
              <span>Express</span>
            </div>
            <p className="login__tagline">Venda e aluguel de trajes finos</p>
          </div>

          <h1 className="login__title">
            Faça seu login<span className="login__title-dot" aria-hidden="true" />
          </h1>
          <p className="login__lead">Acesse o painel da Social Express</p>

          <form className="login__form" onSubmit={onSubmit} noValidate>
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

          <p className="login__hint">
            Dica: use o login do perfil. Se ainda não definiu senha, a inicial é{' '}
            <code>{DEFAULT_LOGIN_PASSWORD}</code>.
          </p>
        </section>

        <aside className="login__visual" aria-hidden="true">
          <img src="/login-hero.jpg" alt="" className="login__visual-img" />
          <div className="login__visual-shade" />
          <div className="login__visual-copy">
            <strong>Social Express</strong>
            <span>Elegância sob medida para cada ocasião</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
