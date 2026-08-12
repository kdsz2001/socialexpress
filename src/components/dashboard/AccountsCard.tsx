import type { LucideIcon } from 'lucide-react'
import './AccountsCard.css'

type AccountsCardProps = {
  title: string
  total: string
  quantity: number
  theme: 'payable' | 'receivable'
  icon: LucideIcon
}

export function AccountsCard({
  title,
  total,
  quantity,
  theme,
  icon: Icon,
}: AccountsCardProps) {
  return (
    <section className={`accounts-card accounts-card--${theme}`}>
      <div className="accounts-card__header">
        <h2 className="accounts-card__title">{title}</h2>
        <span className="accounts-card__icon">
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>
      <div className="accounts-card__body">
        <div className="accounts-card__metric">
          <span className="accounts-card__label">Total</span>
          <span className="accounts-card__value">{total}</span>
        </div>
        <div className="accounts-card__metric">
          <span className="accounts-card__label">Quantidade</span>
          <span className="accounts-card__value">{quantity}</span>
        </div>
      </div>
    </section>
  )
}
