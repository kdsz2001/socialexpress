import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  PartyPopper,
  Package,
  UserCog,
  ShoppingCart,
  Wallet,
  Truck,
  BarChart3,
  Settings,
  History,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/eventos', label: 'Eventos', icon: PartyPopper },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/funcionarios', label: 'Funcionários', icon: UserCog },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/historicos', label: 'Históricos', icon: History },
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
                    // Dashboard nunca fica marcada; outras opções usam seleção bem sutil
                    if (isDashboard || !isActive) return 'sidebar__link'
                    return 'sidebar__link is-active'
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} strokeWidth={1.75} />
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
