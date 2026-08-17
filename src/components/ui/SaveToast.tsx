import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './SaveToast.css'

type SaveToastProps = {
  open: boolean
  message?: string
  onClose: () => void
  durationMs?: number
}

export function SaveToast({
  open,
  message = 'Informações salvas.',
  onClose,
  durationMs = 4000,
}: SaveToastProps) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timer)
  }, [open, durationMs, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="save-toast" role="status" aria-live="polite">
      <span className="save-toast__text">{message}</span>
      <button
        type="button"
        className="save-toast__close"
        aria-label="Fechar"
        onClick={onClose}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>,
    document.body,
  )
}
