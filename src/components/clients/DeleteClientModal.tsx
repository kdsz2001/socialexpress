import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, Trash2 } from 'lucide-react'
import './DeleteClientModal.css'

type DeleteClientModalProps = {
  open: boolean
  clientName: string
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteClientModal({
  open,
  clientName,
  onCancel,
  onConfirm,
}: DeleteClientModalProps) {
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
    <div className="delete-client-modal" role="presentation">
      <button
        type="button"
        className="delete-client-modal__overlay"
        aria-label="Fechar"
        onClick={onCancel}
      />

      <div
        className="delete-client-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="delete-client-modal__icon" aria-hidden="true">
          <HelpCircle size={44} strokeWidth={1.6} />
        </div>

        <h2 id={titleId} className="delete-client-modal__title">
          Excluir cliente
        </h2>

        <p className="delete-client-modal__text">
          Você está prestes excluir um cliente.{' '}
          <strong>Essa ação é irreversível.</strong>
        </p>

        <p className="delete-client-modal__question">
          Deseja realmente excluir o cliente {clientName}?
        </p>

        <div className="delete-client-modal__actions">
          <button
            type="button"
            className="delete-client-modal__btn delete-client-modal__btn--cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="delete-client-modal__btn delete-client-modal__btn--delete"
            onClick={onConfirm}
          >
            <Trash2 size={17} strokeWidth={2.25} />
            Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
