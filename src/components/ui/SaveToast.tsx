import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './SaveToast.css'

type SaveToastProps = {
  open: boolean
  message?: string
  /** success (green) | danger (red) — Clarial-style alerts */
  variant?: 'success' | 'danger'
  onClose: () => void
  durationMs?: number
}

export function SaveToast({
  open,
  message = 'Informações salvas.',
  variant = 'success',
  onClose,
  durationMs = 4500,
}: SaveToastProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => onCloseRef.current(), durationMs)
    return () => window.clearTimeout(timer)
  }, [open, durationMs, message])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`save-toast${variant === 'danger' ? ' save-toast--danger' : ''}`}
      role="status"
      aria-live="polite"
    >
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
