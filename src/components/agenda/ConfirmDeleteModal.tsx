import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ConfirmDeleteModal.css'

type ConfirmDeleteModalProps = {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  open,
  title = 'Atenção',
  message = 'O apontamento será excluído e não será possível reverter essa ação.',
  confirmLabel = 'Confirmar exclusão',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className="apt-confirm" role="presentation">
      <button
        type="button"
        className="apt-confirm__overlay"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div
        className="apt-confirm__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="apt-confirm-title"
        aria-describedby="apt-confirm-message"
      >
        <div className="apt-confirm__icon" aria-hidden="true">
          <span>!</span>
        </div>
        <h2 id="apt-confirm-title" className="apt-confirm__title">
          {title}
        </h2>
        <p id="apt-confirm-message" className="apt-confirm__message">
          {message}
        </p>
        <div className="apt-confirm__actions">
          <button
            type="button"
            className="apt-confirm__btn apt-confirm__btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="apt-confirm__btn apt-confirm__btn--confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
