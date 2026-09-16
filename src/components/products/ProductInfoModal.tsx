import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ProductInfoModal.css'

type ProductInfoModalProps = {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  continueLabel?: string
}

export function ProductInfoModal({
  open,
  title,
  children,
  onClose,
  continueLabel = 'Continuar',
}: ProductInfoModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="p-info" role="presentation">
      <button
        type="button"
        className="p-info__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="p-info__dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="p-info__icon" aria-hidden="true">
          <span>i</span>
        </div>
        <h2 className="p-info__title">{title}</h2>
        <div className="p-info__body">{children}</div>
        <button type="button" className="p-info__continue" onClick={onClose}>
          {continueLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}
