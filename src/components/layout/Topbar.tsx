import { useEffect, useId, useRef, useState } from 'react'
import { Search, Menu, X } from 'lucide-react'
import { ProfileDrawer } from './ProfileDrawer'
import './Topbar.css'

type TopbarProps = {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchId = useId()

  const hasQuery = query.trim().length > 0
  // Futuro: substituir por resultados reais de pedido/produto/cliente
  const results: unknown[] = []
  const showEmptyState = hasQuery && results.length === 0

  useEffect(() => {
    if (!searchOpen) return

    inputRef.current?.focus()

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [searchOpen])

  const openProfile = () => {
    setSearchOpen(false)
    setProfileOpen(true)
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu"
        onClick={onMenuClick}
        aria-label="Abrir menu"
      >
        <Menu size={22} strokeWidth={2} />
      </button>
      <div className="topbar__spacer" />
      <div className="topbar__actions">
        <div className="topbar__search-wrap" ref={panelRef}>
          <button
            type="button"
            className={`topbar__search ${searchOpen ? 'is-open' : ''}`}
            aria-label="Buscar"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search size={18} strokeWidth={2} />
          </button>

          {searchOpen && (
            <div
              className={`topbar__search-panel ${showEmptyState ? 'has-result' : ''}`}
              id={searchId}
              role="search"
            >
              <div className="topbar__search-form">
                <Search
                  size={16}
                  strokeWidth={2}
                  className="topbar__search-panel-icon"
                />
                <input
                  ref={inputRef}
                  type="text"
                  className="topbar__search-input"
                  placeholder="Busque por pedido, produto ou cliente..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                {hasQuery && (
                  <button
                    type="button"
                    className="topbar__search-clear"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                  >
                    <X size={16} strokeWidth={1.75} />
                  </button>
                )}
              </div>

              {showEmptyState && (
                <div className="topbar__search-empty">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`topbar__user${profileOpen ? ' is-open' : ''}`}
          aria-label="Abrir perfil"
          aria-expanded={profileOpen}
          onClick={openProfile}
        >
          <span className="topbar__greeting">
            <span className="topbar__greeting-hi">Olá,</span>{' '}
            <span className="topbar__greeting-name">Kelton Djames Schulze</span>
          </span>
          <span className="topbar__avatar" aria-hidden="true" />
        </button>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
