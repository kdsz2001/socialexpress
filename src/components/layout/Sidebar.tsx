import { type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Monitor,
  User,
  Calendar,
  Wine,
  Users,
  Receipt,
  Banknote,
  Shirt,
  Activity,
  Settings,
  BookOpen,
} from 'lucide-react'
import { TieIcon } from '../icons/TieIcon'
import { NecktieMark } from '../icons/NecktieMark'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Monitor },
  { to: '/clientes', label: 'Clientes', icon: User },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/eventos', label: 'Eventos', icon: Wine },
  { to: '/produtos', label: 'Produtos', icon: TieIcon },
  { to: '/funcionarios', label: 'Funcionários', icon: Users },
  { to: '/pedidos', label: 'Pedidos', icon: Receipt },
  { to: '/financeiro', label: 'Financeiro', icon: Banknote },
  { to: '/fornecedores', label: 'Fornecedores', icon: Shirt },
  { to: '/relatorios', label: 'Relatórios', icon: Activity },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/historicos', label: 'Históricos', icon: BookOpen },
] as const

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

function BrandMark() {
  return (
    <>
      <span className="sidebar__word sidebar__word--social">Social</span>
      <div className="sidebar__emblem" aria-hidden="true">
        <span className="sidebar__collar" />
      </div>
      <span className="sidebar__word sidebar__word--express">Express</span>
    </>
  )
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  const handleBrandClick = (e: MouseEvent) => {
    e.preventDefault()
    // Como no Clarial: clicar na logo atualiza / vai para o início
    if (location.pathname === '/') {
      window.location.reload()
    } else {
      window.location.assign('/')
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__brand">
        {collapsed ? (
          <button
            type="button"
            className="sidebar__dock"
            onClick={onToggle}
            aria-label="Expandir menu"
            aria-expanded={false}
          >
            <span className="sidebar__dock-stack">
              <span className="sidebar__emblem" aria-hidden="true">
                <span className="sidebar__collar" />
              </span>
              <NecktieMark
                className="sidebar__necktie sidebar__necktie--docked"
                docked
              />
            </span>
          </button>
        ) : (
          <>
            <a
              href="/"
              className="sidebar__lockup sidebar__lockup--home"
              aria-label="Social Express — atualizar página"
              onClick={handleBrandClick}
            >
              <BrandMark />
            </a>

            <button
              type="button"
              className="sidebar__tie-toggle"
              onClick={onToggle}
              aria-label="Recolher menu"
              aria-expanded
            >
              <NecktieMark className="sidebar__necktie" docked={false} />
            </button>
          </>
        )}
      </div>

      <nav className="sidebar__nav" aria-label="Menu principal">
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon
            const isDashboard = item.to === '/'
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={isDashboard}
                  className={({ isActive }) =>
                    [
                      'sidebar__link',
                      isDashboard ? 'sidebar__link--dashboard' : '',
                      !isDashboard && isActive ? 'is-active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  <Icon className="sidebar__icon" size={18} strokeWidth={1.5} />
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
