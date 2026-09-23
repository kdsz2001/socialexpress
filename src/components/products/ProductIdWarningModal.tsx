import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ProductIdWarningModal.css'

type ProductIdWarningModalProps = {
  open: boolean
  onCancel: () => void
  onContinue: () => void
}

export function ProductIdWarningModal({ open, onCancel, onContinue }: ProductIdWarningModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className="p-id-warn" role="presentation">
      <button type="button" className="p-id-warn__overlay" aria-label="Fechar" onClick={onCancel} />
      <div className="p-id-warn__dialog" role="dialog" aria-modal="true" aria-labelledby="p-id-warn-title">
        <div className="p-id-warn__icon" aria-hidden="true">
          !
        </div>
        <h2 id="p-id-warn-title" className="p-id-warn__title">
          Atenção
        </h2>
        <p className="p-id-warn__text">
          Ao informar um ID específico, o sistema permite que você cadastre apenas um produto por
          vez, de forma a garantir a integridade das informações dos demais produtos e pedidos.
        </p>
        <div className="p-id-warn__actions">
          <button type="button" className="p-id-warn__btn p-id-warn__btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="p-id-warn__btn p-id-warn__btn--continue" onClick={onContinue}>
            Continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
