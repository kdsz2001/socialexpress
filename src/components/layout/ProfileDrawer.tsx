import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { User, Wallet, X } from 'lucide-react'
import './ProfileDrawer.css'

type ProfileDrawerProps = {
  open: boolean
  onClose: () => void
}

const menuItems = [
  {
    label: 'Meu perfil',
    description: 'Informações da sua conta',
    icon: User,
  },
  {
    label: 'Assinatura',
    description: 'Informações da sua assinatura',
    icon: Wallet,
  },
] as const

export function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      {open ? (
        <button
          type="button"
          className="profile-drawer__overlay"
          aria-label="Fechar perfil"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`profile-drawer${open ? ' is-open' : ''}`}
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <header className="profile-drawer__header">
          <h2 id={titleId} className="profile-drawer__title">
            Perfil
          </h2>
          <button
            type="button"
            className="profile-drawer__close"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        <div className="profile-drawer__user">
          <div className="profile-drawer__avatar" aria-hidden="true" />
          <div className="profile-drawer__meta">
            <p className="profile-drawer__name">Kelton Djames Schulze</p>
            <p className="profile-drawer__role">Master</p>
            <button type="button" className="profile-drawer__logout">
              Sair
            </button>
          </div>
        </div>

        <nav className="profile-drawer__nav" aria-label="Opções do perfil">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} type="button" className="profile-drawer__item">
                <span className="profile-drawer__item-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="profile-drawer__item-text">
                  <span className="profile-drawer__item-label">{item.label}</span>
                  <span className="profile-drawer__item-desc">{item.description}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>,
    document.body,
  )
}
