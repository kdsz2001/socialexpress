import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, Menu, UserRound, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'
import { getClientDisplayName } from '../../lib/clientsStore'
import {
  getUserDisplayName,
  getUserProfile,
  subscribeUserProfile,
  type UserProfile,
} from '../../lib/userProfileStore'
import { ProfileDrawer } from './ProfileDrawer'
import './Topbar.css'

type TopbarProps = {
  onMenuClick?: () => void
}

type ClientsTab = 'todos' | 'aniversariantes' | 'whatsapp'

const SEARCH_LIMIT = 8
const PANEL_WIDTH = 420

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clients = useClients()
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getUserProfile())
  const [query, setQuery] = useState('')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: PANEL_WIDTH })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchId = useId()

  const isClientsSection = location.pathname.startsWith('/clientes')
  const isClientCreate = location.pathname === '/clientes/cadastrar'
  const isClientDetail =
    isClientsSection &&
    location.pathname !== '/clientes' &&
    location.pathname !== '/clientes/cadastrar'
  const paramTab = searchParams.get('tab')
  const clientsTab: ClientsTab | null =
    isClientCreate || isClientDetail
      ? null
      : paramTab === 'aniversariantes'
        ? 'aniversariantes'
        : paramTab === 'whatsapp'
          ? 'whatsapp'
          : 'todos'

  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length > 0

  const clientResults = useMemo(() => {
    if (!hasQuery) return []
    const q = trimmedQuery.toLocaleLowerCase('pt-BR')
    return clients
      .filter((client) => {
        const name = getClientDisplayName(client).toLocaleLowerCase('pt-BR')
        const full = `${client.nome} ${client.sobrenomes} ${client.chamado}`
          .toLocaleLowerCase('pt-BR')
          .trim()
        const cpf = client.cpfCnpj.replace(/\D/g, '')
        const qDigits = q.replace(/\D/g, '')
        return (
          name.includes(q) ||
          full.includes(q) ||
          (qDigits.length >= 3 && cpf.includes(qDigits))
        )
      })
      .slice(0, SEARCH_LIMIT)
  }, [clients, hasQuery, trimmedQuery])

  const showResults = hasQuery && clientResults.length > 0
  const showEmptyState = hasQuery && clientResults.length === 0
  const panelExpanded = showResults || showEmptyState

  const updatePanelPosition = () => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 24)
    let left = rect.right - width
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
    setPanelPos({
      top: rect.bottom + 10,
      left,
      width,
    })
  }

  useLayoutEffect(() => {
    if (!searchOpen) return
    updatePanelPosition()
  }, [searchOpen, panelExpanded])

  useEffect(() => {
    if (!searchOpen) return

    inputRef.current?.focus()

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setSearchOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false)
    }

    const onReposition = () => updatePanelPosition()

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [searchOpen])

  useEffect(() => {
    setSearchOpen(false)
    setQuery('')
  }, [location.pathname])

  useEffect(() => {
    setUserProfile(getUserProfile())
    return subscribeUserProfile(() => setUserProfile(getUserProfile()))
  }, [])

  const displayName = getUserDisplayName(userProfile)

  const openProfile = () => {
    setSearchOpen(false)
    setProfileOpen(true)
  }

  const openClient = (clientId: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(`/clientes/${clientId}`)
  }

  const setClientsTab = (tab: ClientsTab) => {
    if (tab === 'todos') {
      navigate('/clientes')
      return
    }
    if (tab === 'aniversariantes') {
      navigate('/clientes?tab=aniversariantes')
      return
    }
    navigate('/clientes?tab=whatsapp')
  }

  const showWhatsappTab = isClientCreate || paramTab === 'whatsapp'

  const searchPanel =
    searchOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            className={`topbar__search-panel${panelExpanded ? ' has-result' : ''}`}
            id={searchId}
            role="search"
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
            }}
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
              {hasQuery ? (
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
              ) : null}
            </div>

            {showResults ? (
              <div className="topbar__search-results">
                <p className="topbar__search-group">Clientes</p>
                <ul className="topbar__search-list" role="listbox">
                  {clientResults.map((client) => (
                    <li key={client.id}>
                      <button
                        type="button"
                        className="topbar__search-item"
                        role="option"
                        onClick={() => openClient(client.id)}
                      >
                        <span className="topbar__search-avatar" aria-hidden="true">
                          <UserRound size={18} strokeWidth={2} />
                        </span>
                        <span className="topbar__search-name">
                          {getClientDisplayName(client)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {showEmptyState ? (
              <div className="topbar__search-empty">
                Nenhum resultado encontrado
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null

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

      {isClientsSection && (
        <div className="topbar__tabs" role="tablist" aria-label="Clientes">
          <button
            type="button"
            role="tab"
            aria-selected={clientsTab === 'todos'}
            className={`topbar__tab${clientsTab === 'todos' ? ' is-active' : ''}`}
            onClick={() => setClientsTab('todos')}
          >
            Todos clientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={clientsTab === 'aniversariantes'}
            className={`topbar__tab${clientsTab === 'aniversariantes' ? ' is-active' : ''}`}
            onClick={() => setClientsTab('aniversariantes')}
          >
            Aniversariantes
          </button>
          {showWhatsappTab ? (
            <button
              type="button"
              role="tab"
              aria-selected={clientsTab === 'whatsapp'}
              className={`topbar__tab${clientsTab === 'whatsapp' ? ' is-active' : ''}`}
              onClick={() => setClientsTab('whatsapp')}
            >
              WhatsApp em massa
            </button>
          ) : null}
        </div>
      )}

      <div className="topbar__spacer" />

      <div className="topbar__actions">
        <div className="topbar__search-wrap">
          <button
            ref={buttonRef}
            type="button"
            className={`topbar__search ${searchOpen ? 'is-open' : ''}`}
            aria-label="Buscar"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search size={18} strokeWidth={2} />
          </button>
          {searchPanel}
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
            <span className="topbar__greeting-name">{displayName}</span>
          </span>
          <span className="topbar__avatar" aria-hidden="true">
            {userProfile.avatarDataUrl ? (
              <img
                className="topbar__avatar-image"
                src={userProfile.avatarDataUrl}
                alt=""
              />
            ) : null}
          </span>
        </button>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
