import type { ComponentType, SVGProps } from 'react'
import './StatusCard.css'

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }
>

type StatusItem = {
  label: string
  value: number
  icon: IconComponent
}

type StatusCardProps = {
  title: string
  theme: 'overdue' | 'today' | 'upcoming'
  items: StatusItem[]
  onOpen: (label: string) => void
}

export function StatusCard({ title, theme, items, onOpen }: StatusCardProps) {
  return (
    <section className={`status-card status-card--${theme}`}>
      <h2 className="status-card__title">{title}</h2>
      <ul className="status-card__list">
        {items.map((item, index) => {
          const Icon = item.icon
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className={isLast ? 'is-last' : undefined}>
              <button type="button" className="status-card__item" onClick={() => onOpen(item.label)}>
                <span className="status-card__label">
                  <span className="status-card__icon" aria-hidden="true">
                    <Icon size={28} width={28} height={28} strokeWidth={2} />
                  </span>
                  <span className="status-card__text">{item.label}</span>
                </span>
                <span className="status-card__value">{item.value}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
