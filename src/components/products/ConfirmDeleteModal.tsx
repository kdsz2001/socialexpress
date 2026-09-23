import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import './ConfirmDeleteModal.css'

type ConfirmDeleteModalProps = {
  open: boolean
  title: string
  message: ReactNode
  question?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  className?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  open,
  title,
  message,
  question,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  className,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div className={className ? `p-confirm ${className}` : 'p-confirm'} role="presentation">
      <button
        type="button"
        className="p-confirm__overlay"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div
        className="p-confirm__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="p-confirm__icon" aria-hidden="true">
          <span>?</span>
        </div>
        <h2 id={titleId} className="p-confirm__title">
          {title}
        </h2>
        <div className="p-confirm__message">{message}</div>
        {question ? <div className="p-confirm__question">{question}</div> : null}
        <div className="p-confirm__actions">
          <button
            type="button"
            className="p-confirm__btn p-confirm__btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="p-confirm__btn p-confirm__btn--delete"
            onClick={onConfirm}
          >
            <Trash2 size={15} strokeWidth={2.25} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
