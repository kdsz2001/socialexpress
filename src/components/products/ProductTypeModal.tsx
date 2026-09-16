import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import '../../pages/Products.css'

type ProductTypeModalProps = {
  title: string
  tip?: ReactNode
  name: string
  description: string
  saveLabel?: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}

export function ProductTypeModal({
  title,
  tip,
  name,
  description,
  saveLabel = 'Salvar',
  onNameChange,
  onDescriptionChange,
  onClose,
  onSave,
}: ProductTypeModalProps) {
  useEffect(() => {
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
  }, [onClose])

  return createPortal(
    <div className="products-modal" role="presentation">
      <button
        type="button"
        className="products-modal__overlay"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className="products-modal__dialog products-modal__dialog--sm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="products-modal__header">
          <h2>{title}</h2>
          <button type="button" className="products-modal__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} strokeWidth={2.25} />
          </button>
        </header>
        <div className="products-modal__body">
          {tip ? <p className="products-modal__tip">{tip}</p> : null}
          <label className="products-modal__field">
            <span>
              Nome <span className="products-modal__req">*</span>
            </span>
            <input
              type="text"
              className="products-modal__input"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              autoFocus
            />
          </label>
          <label className="products-modal__field">
            <span>Descrição</span>
            <textarea
              className="products-modal__input products-modal__textarea"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              rows={3}
            />
          </label>
        </div>
        <footer className="products-modal__footer">
          <button type="button" className="products-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="products-modal__save"
            onClick={onSave}
            disabled={!name.trim()}
          >
            <Check size={15} strokeWidth={2.5} />
            {saveLabel}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
