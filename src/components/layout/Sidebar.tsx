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
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { TieIcon } from '../icons/TieIcon'
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
        {collapsed ? (
          <img
            className="sidebar__mark sidebar__mark--solo"
            src="/brand-mark-white.png"
            alt="Social Express"
          />
        ) : (
          <span className="sidebar__logo" aria-label="Social Express">
            <span className="sidebar__logo-text">Social</span>
            <img
              className="sidebar__mark"
              src="/brand-mark-white.png"
              alt=""
              aria-hidden="true"
            />
            <span className="sidebar__logo-text">Express</span>
          </span>
        )}
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
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
                  className={({ isActive }) => {
                    if (isDashboard || !isActive) return 'sidebar__link'
                    return 'sidebar__link is-active'
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
