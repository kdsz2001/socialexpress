import { NavLink } from 'react-router-dom'
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

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__lockup" aria-label="Social Express">
          <span className="sidebar__word sidebar__word--social">Social</span>

          <div className="sidebar__emblem" aria-hidden="true">
            <img
              className="sidebar__collar"
              src="/brand-mark-white.png"
              alt=""
              draggable={false}
            />
          </div>

          <span className="sidebar__word sidebar__word--express">Express</span>
        </div>

        {/*
          Uma só gravata: aberta = seta à direita (horizontal);
          fechada = encaixa sob a gola (vertical).
        */}
        <button
          type="button"
          className="sidebar__tie-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
        >
          <NecktieMark className="sidebar__necktie" docked={collapsed} />
        </button>
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
