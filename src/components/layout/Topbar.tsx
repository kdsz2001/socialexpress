import { Search, Menu } from 'lucide-react'
import './Topbar.css'

type TopbarProps = {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
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
        <button type="button" className="topbar__search" aria-label="Buscar">
          <Search size={20} strokeWidth={2} />
        </button>
        <div className="topbar__user">
          <span className="topbar__greeting">Olá, Kelton Djames Schulze</span>
          <div className="topbar__avatar" aria-hidden="true" />
        </div>
      </div>
    </header>
  )
}
