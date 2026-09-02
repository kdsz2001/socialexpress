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
}

export function StatusCard({ title, theme, items }: StatusCardProps) {
  return (
    <section className={`status-card status-card--${theme}`}>
      <h2 className="status-card__title">{title}</h2>
      <ul className="status-card__list">
        {items.map((item, index) => {
          const Icon = item.icon
          const isLast = index === items.length - 1
          return (
            <li
              key={item.label}
              className={`status-card__item${isLast ? ' is-last' : ''}`}
            >
              <span className="status-card__label">
                <span className="status-card__icon" aria-hidden="true">
                  <Icon size={30} width={30} height={30} strokeWidth={2.6} />
                </span>
                <span className="status-card__text">{item.label}</span>
              </span>
              <span className="status-card__value">{item.value}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
