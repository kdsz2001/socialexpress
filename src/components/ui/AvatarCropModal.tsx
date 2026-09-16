import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, X, ZoomIn } from 'lucide-react'
import { cropAvatarToDataUrl, type AvatarCropArea } from '../../lib/avatarImage'
import './AvatarCropModal.css'

type AvatarCropModalProps = {
  open: boolean
  imageSrc: string
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

const DEFAULT_STAGE = 360
const MIN_ZOOM = 1
const MAX_ZOOM = 3

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCoverBaseSize(naturalW: number, naturalH: number, stage: number) {
  const scale = Math.max(stage / naturalW, stage / naturalH)
  return {
    width: naturalW * scale,
    height: naturalH * scale,
  }
}

function getCropArea(
  naturalW: number,
  naturalH: number,
  displayW: number,
  displayH: number,
  offsetX: number,
  offsetY: number,
  stage: number,
): AvatarCropArea {
  const scale = naturalW / displayW
  const left = (stage - displayW) / 2 + offsetX
  const top = (stage - displayH) / 2 + offsetY
  const x = (-left) * scale
  const y = (-top) * scale
  const size = stage * scale
  return {
    x: clamp(x, 0, Math.max(0, naturalW - size)),
    y: clamp(y, 0, Math.max(0, naturalH - size)),
    width: Math.min(size, naturalW),
    height: Math.min(size, naturalH),
  }
}

function clampOffset(
  offsetX: number,
  offsetY: number,
  displayW: number,
  displayH: number,
  stage: number,
) {
  const maxX = Math.max(0, (displayW - stage) / 2)
  const maxY = Math.max(0, (displayH - stage) / 2)
  return {
    x: clamp(offsetX, -maxX, maxX),
    y: clamp(offsetY, -maxY, maxY),
  }
}

export function AvatarCropModal({
  open,
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState(DEFAULT_STAGE)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  const measureStage = useCallback(() => {
    const node = stageRef.current
    if (!node) return
    const size = Math.round(node.getBoundingClientRect().width)
    if (size > 0) setStageSize(size)
  }, [])

  useEffect(() => {
    if (!open || !imageSrc) return
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setBusy(false)
    setError('')
    setNaturalSize({ w: 0, h: 0 })

    const image = new Image()
    image.onload = () => {
      setNaturalSize({ w: image.naturalWidth, h: image.naturalHeight })
    }
    image.src = imageSrc
  }, [open, imageSrc])

  useEffect(() => {
    if (!open) return
    measureStage()
    const node = stageRef.current
    if (!node || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureStage)
      return () => window.removeEventListener('resize', measureStage)
    }
    const observer = new ResizeObserver(() => measureStage())
    observer.observe(node)
    return () => observer.disconnect()
  }, [open, measureStage])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open, busy, onCancel])

  const display = useMemo(() => {
    if (!naturalSize.w || !naturalSize.h) {
      return { width: stageSize, height: stageSize }
    }
    const base = getCoverBaseSize(naturalSize.w, naturalSize.h, stageSize)
    return {
      width: base.width * zoom,
      height: base.height * zoom,
    }
  }, [naturalSize, zoom, stageSize])

  useEffect(() => {
    setOffset((current) =>
      clampOffset(current.x, current.y, display.width, display.height, stageSize),
    )
  }, [display.width, display.height, stageSize])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (busy) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const next = clampOffset(
      drag.originX + (event.clientX - drag.startX),
      drag.originY + (event.clientY - drag.startY),
      display.width,
      display.height,
      stageSize,
    )
    setOffset(next)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  const apply = async () => {
    if (!naturalSize.w || busy) return
    setBusy(true)
    setError('')
    try {
      const area = getCropArea(
        naturalSize.w,
        naturalSize.h,
        display.width,
        display.height,
        offset.x,
        offset.y,
        stageSize,
      )
      const dataUrl = await cropAvatarToDataUrl(imageSrc, area)
      onConfirm(dataUrl)
    } catch {
      setError('Não foi possível aplicar o recorte.')
      setBusy(false)
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="avatar-crop" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title">
      <button
        type="button"
        className="avatar-crop__backdrop"
        aria-label="Fechar editor"
        onClick={() => {
          if (!busy) onCancel()
        }}
      />
      <div className="avatar-crop__card">
        <header className="avatar-crop__header">
          <h2 id="avatar-crop-title" className="avatar-crop__title">
            Ajustar imagem
          </h2>
          <button
            type="button"
            className="avatar-crop__close"
            aria-label="Cancelar"
            disabled={busy}
            onClick={onCancel}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        <p className="avatar-crop__hint">
          Arraste a imagem e use o zoom para escolher a área que ficará visível no perfil.
        </p>

        <div
          ref={stageRef}
          className="avatar-crop__stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {naturalSize.w ? (
            <img
              className="avatar-crop__image"
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                width: display.width,
                height: display.height,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : (
            <div className="avatar-crop__loading">Carregando…</div>
          )}
          <div className="avatar-crop__frame" aria-hidden="true" />
        </div>

        <label className="avatar-crop__zoom">
          <span className="avatar-crop__zoom-label">
            <ZoomIn size={16} strokeWidth={2} />
            Zoom
          </span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!naturalSize.w || busy}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        {error ? <p className="avatar-crop__error">{error}</p> : null}

        <footer className="avatar-crop__actions">
          <button
            type="button"
            className="avatar-crop__btn avatar-crop__btn--ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="avatar-crop__btn avatar-crop__btn--primary"
            disabled={!naturalSize.w || busy}
            onClick={() => void apply()}
          >
            <Check size={16} strokeWidth={2.5} />
            {busy ? 'Aplicando…' : 'Aplicar'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
