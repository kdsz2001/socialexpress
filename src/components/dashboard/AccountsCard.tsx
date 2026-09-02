import { Banknote, CircleArrowUp, CircleArrowDown } from 'lucide-react'
import './AccountsCard.css'

type AccountsCardProps = {
  title: string
  total: string
  quantity: number
  theme: 'payable' | 'receivable'
}

export function AccountsCard({
  title,
  total,
  quantity,
  theme,
}: AccountsCardProps) {
  const QuantityIcon = theme === 'payable' ? CircleArrowUp : CircleArrowDown

  return (
    <section className={`accounts-card accounts-card--${theme}`}>
      <h2 className="accounts-card__title">{title}</h2>
      <div className="accounts-card__body">
        <div className="accounts-card__metric">
          <span className="accounts-card__label">
            <span className="accounts-card__metric-icon" aria-hidden="true">
              <Banknote size={30} strokeWidth={1.75} />
            </span>
            Total
          </span>
          <span className="accounts-card__value">{total}</span>
        </div>
        <div className="accounts-card__metric">
          <span className="accounts-card__label">
            <span className="accounts-card__metric-icon" aria-hidden="true">
              <QuantityIcon size={30} strokeWidth={1.75} />
            </span>
            Quantidade
          </span>
          <span className="accounts-card__value">{quantity}</span>
        </div>
      </div>
    </section>
  )
}
