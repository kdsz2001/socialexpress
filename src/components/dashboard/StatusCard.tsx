import type { LucideIcon } from 'lucide-react'
import './StatusCard.css'

type StatusItem = {
  label: string
  value: number
  icon: LucideIcon
}

type StatusCardProps = {
  title: string
  theme: 'overdue' | 'today' | 'upcoming'
  items: StatusItem[]
}

export function StatusCard({ title, theme, items }: StatusCardProps) {
  return (
    <section className={`status-card status-card--${theme}`}>
      <h2 className="status-card__title">{title}</h2>
      <ul className="status-card__list">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.label} className="status-card__item">
              <span className="status-card__label">
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </span>
              <span className="status-card__value">{item.value}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
