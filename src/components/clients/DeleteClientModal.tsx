import { useEffect, useId } from 'react'
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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
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
          <HelpCircle size={36} strokeWidth={1.75} />
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
            <Trash2 size={16} strokeWidth={2.25} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
