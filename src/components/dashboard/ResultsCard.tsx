import type { LucideIcon } from 'lucide-react'
import './ResultsCard.css'

type ResultRow = {
  label: string
  value: string
  icon: LucideIcon
}

type ResultsCardProps = {
  title: string
  rows: ResultRow[]
}

export function ResultsCard({ title, rows }: ResultsCardProps) {
  return (
    <section className="results-card">
      <h2 className="results-card__title">{title}</h2>
      <ul className="results-card__list">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <li key={row.label} className="results-card__row">
              <span className="results-card__label">
                <span className="results-card__icon" aria-hidden="true">
                  <Icon size={30} strokeWidth={1.75} />
                </span>
                <span className="results-card__text">{row.label}</span>
              </span>
              <span className="results-card__value">{row.value}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
